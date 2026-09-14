import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTrailStage, LESSON_STAGE, TRAIL_STAGES } from '../trail/stages';
import { useServices } from '../../services/ServicesProvider';
import type { Activity, Lesson, Option } from '../../services/content/types';
import { getLessonProgress, recordAttempt, saveLessonProgress } from '../../services/db/repo';
import { BigButton } from '../../shared/components/BigButton';
import { ComposeArea } from '../../shared/components/ComposeArea';
import { OptionGrid } from '../../shared/components/OptionGrid';
import { ScreenShell } from '../../shared/components/ScreenShell';
import { SpeechBalloon } from '../../shared/components/SpeechBalloon';
import { colors, font, MIN_TOUCH, shadows, spacing } from '../../shared/theme';
import { computeHelpUsed, computeIndependentRead, evaluateCompose, evaluateSelection, isComposePrefix } from './evaluate';
import { advance, resumeIndex, statusFor, type SessionState } from './session';
import { PREF_KEYS } from '../../services/ServicesProvider';
import { getRandomPhrase, getPraisePhrase, getGentleErrorPhrase } from '../phrases/phraseBank';
import { randomizeActivity, shuffleArray, getRandomPraise, getRandomErrorEncouragement } from './randomizer';

type Phase = 'intro' | 'activity' | 'done';

interface Props {
  lesson: Lesson;
  /** Modo revisão: não carrega nem salva posição — sempre começa do início. */
  review?: boolean;
  /** Ação ao sair da lição */
  onExit?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Executa uma lição: intro falada → atividades → encerramento.
 * Cada resposta vira uma Attempt persistida; progresso salvo por posição real.
 */
export function LessonPlayer({ lesson, review = false, onExit }: Props) {
  const { audio, db, fontScale, prefs, colors: themeColors, isDark } = useServices();
  const currentColors = themeColors ?? colors;
  /** Cores do momento desta lição com suporte a modo escuro */
  const stage = getTrailStage(LESSON_STAGE[lesson.id] ?? 0, isDark);
  const [phase, setPhase] = useState<Phase>('intro');
  const [session, setSession] = useState<SessionState>({ index: 0, done: false });
  const [initDone, setInitDone] = useState(false);

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedCorrect, setSelectedCorrect] = useState<boolean | undefined>();
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [streakInLesson, setStreakInLesson] = useState(0);
  const [errorStreak, setErrorStreak] = useState(0);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string>('Você completou esta lição!');
  const advancing = useRef(false);
  /** Próximo passo após acerto — só é aplicado ao tocar em Continuar. */
  const [pendingNext, setPendingNext] = useState<SessionState | null>(null);

  // Estado de compose-word: ordem embaralhada das peças + índices encaixados.
  const [piecesOrder, setPiecesOrder] = useState<string[]>([]);
  const [assembledIdx, setAssembledIdx] = useState<number[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | undefined>();
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contadores de ajuda da atividade corrente — entram na Attempt.
  const help = useRef({ promptReplays: 0, optionListens: 0, hintsUsed: 0, targetNarrated: false });

  const [currentActivity, setCurrentActivity] = useState<Activity | undefined>();
  const activity: Activity | undefined = phase === 'activity' ? (currentActivity ?? lesson.activities[session.index]) : undefined;
  const count = lesson.activities.length;

  const speakKey = useCallback(
    (key?: string) => audio.speakKey(key),
    [audio],
  );

  // Abertura: fala a intro e restaura a posição salva (revisão sempre do zero).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = review ? null : await getLessonProgress(db, lesson.id);
        if (mounted) setSession({ index: resumeIndex(p, count), done: false });
      } catch {
        // sem progresso salvo — começa do zero
      } finally {
        if (mounted) setInitDone(true);
      }
    })();
    speakKey(lesson.intro.key);
    return () => {
      mounted = false;
      audio.stop();
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startActivity = useCallback(
    (index: number) => {
      help.current = { promptReplays: 0, optionListens: 0, hintsUsed: 0, targetNarrated: false };
      setSelectedId(undefined);
      setSelectedCorrect(undefined);
      setEliminated([]);
      setHintLevel(0);
      setSaveError(false);
      setFeedbackText(null);
      advancing.current = false;
      setAssembledIdx([]);
      setWrongIdx(undefined);
      setPendingNext(null);
      setSession({ index, done: false });
      setPhase('activity');
      const raw = lesson.activities[index];
      if (raw) {
        const prepared = randomizeActivity(raw);
        setCurrentActivity(prepared);
        if (prepared.type === 'compose-word') {
          setPiecesOrder(shuffleArray([...(prepared.pieces ?? []), ...(prepared.distractors ?? [])]));
        }
        if (prepared.narratesTarget) help.current.targetNarrated = true;
        speakKey(prepared.prompt.key);
      }
    },
    [lesson, speakKey],
  );

  const replayPrompt = () => {
    if (!activity) return;
    help.current.promptReplays += 1;
    speakKey(activity.prompt.key);
  };

  const useHint = () => {
    if (!activity || hintLevel >= activity.hints.length) return;
    const hint = activity.hints[hintLevel];
    setHintLevel(hintLevel + 1);
    help.current.hintsUsed += 1;
    if (hint.eliminateOptions?.length) {
      // Em atividades de escolha elimina ids de opção; em compose elimina textos de distratores.
      setEliminated((e) => [...new Set([...e, ...hint.eliminateOptions!])]);
    }
    speakKey(hint.audio.key);
  };

  /** Persiste a tentativa e avança quando correta. Retorna false se o save falhou. */
  const persistResult = async (correct: boolean, selected: string | null): Promise<boolean> => {
    if (!activity) return false;
    try {
      await recordAttempt(db, {
        activityId: activity.id,
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        selectedOption: selected,
        correct,
        helpUsed: computeHelpUsed({
          promptReplays: help.current.promptReplays,
          optionListens: help.current.optionListens,
          hintsUsed: help.current.hintsUsed,
        }),
        hintLevel,
        independentRead: computeIndependentRead(correct, help.current.targetNarrated, help.current.hintsUsed),
      });
      if (correct) {
        const next = advance(session, count);
        if (!review) {
          await saveLessonProgress(db, lesson.id, lesson.contentVersion, statusFor(next), next.done ? count - 1 : next.index);
        }
        // NÃO avança session.index aqui: a atividade atual continua na tela
        // até a pessoa tocar em Continuar — trocar antes parece travar o app.
        setPendingNext(next);
        advancing.current = true;
      }
      return true;
    } catch {
      // Falha de storage: nunca fingir sucesso — avisar e permitir tentar de novo.
      setSaveError(true);
      speakKey('ui/erro-generico');
      return false;
    }
  };

  const onSelect = async (opt: Option) => {
    if (!activity || advancing.current || selectedCorrect === true) return;
    const ev = evaluateSelection(activity, opt.id, help.current.targetNarrated);
    setSelectedId(opt.id);
    setSelectedCorrect(ev.correct);
    const ok = await persistResult(ev.correct, opt.id);
    if (!ok) {
      setSelectedCorrect(undefined);
      return;
    }

    if (ev.correct) {
      const nextStreak = streakInLesson + 1;
      setStreakInLesson(nextStreak);
      setErrorStreak(0);
      const phrase = getRandomPraise();
      setFeedbackText(phrase);
      if (activity.feedbackCorrect?.key) {
        speakKey(activity.feedbackCorrect.key);
      } else {
        audio.speakPhrase(phrase);
      }
    } else {
      setStreakInLesson(0);
      const nextErr = errorStreak + 1;
      setErrorStreak(nextErr);
      const gentle = getRandomErrorEncouragement();
      setFeedbackText(gentle);
      audio.speakPhrase(gentle);
    }
  };

  /** compose-word: tocar numa peça encaixa; peça errada devolve feedback e volta. */
  const onTapPiece = async (pieceIndex: number) => {
    if (!activity || advancing.current || activity.type !== 'compose-word') return;
    const piece = piecesOrder[pieceIndex];
    const next = [...assembledIdx, pieceIndex];
    const assembledText = next.map((i) => piecesOrder[i]);

    if (!isComposePrefix(activity, assembledText)) {
      // Peça não inicia a palavra: feedback sem punição, peça volta sozinha.
      setWrongIdx(pieceIndex);
      void persistResult(false, piece);
      const nextErr = errorStreak + 1;
      setErrorStreak(nextErr);
      const gentle = getGentleErrorPhrase(nextErr);
      setFeedbackText(gentle);
      audio.speakPhrase(gentle);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongIdx(undefined), 900);
      return;
    }

    setAssembledIdx(next);
    const ev = evaluateCompose(activity, assembledText, help.current.targetNarrated);
    if (ev.correct) {
      const ok = await persistResult(true, assembledText.join(''));
      if (!ok) {
        setAssembledIdx(assembledIdx);
        return;
      }
      setSelectedCorrect(true);
      const nextStreak = streakInLesson + 1;
      setStreakInLesson(nextStreak);
      setErrorStreak(0);
      const phrase = getPraisePhrase(nextStreak);
      setFeedbackText(phrase);
      if (activity.feedbackCorrect?.key) {
        speakKey(activity.feedbackCorrect.key);
      } else {
        audio.speakPhrase(phrase);
      }
    }
  };

  const undoPiece = () => setAssembledIdx((a) => a.slice(0, -1));

  const finishLesson = async () => {
    if (!review) {
      try {
        await saveLessonProgress(db, lesson.id, lesson.contentVersion, 'completed', count - 1);
      } catch {
        setSaveError(true);
      }
    }
    const celebration = getRandomPhrase('conclusaoLicao');
    setDoneMessage(celebration);
    setPhase('done');
    audio.speakPhrase(celebration);
  };

  // Preferência "repetir instrução": quando o prompt termina, repete uma vez.
  const autoRepeat = prefs[PREF_KEYS.autoRepeat] === '1';
  useEffect(() => {
    if (!autoRepeat || !activity || phase !== 'activity') return;
    return audio.onFinish((tag) => {
      if (tag === activity.prompt.key && help.current.promptReplays === 0 && !advancing.current) {
        replayPrompt();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, activity, phase, autoRepeat]);

  if (!initDone) return <ScreenShell title={lesson.title} showBack onBack={onExit} bgColor={stage.fundo}>{null}</ScreenShell>;

  const eliminatedComposeIdx =
    activity?.type === 'compose-word'
      ? piecesOrder.map((p, i) => (eliminated.includes(p) ? i : -1)).filter((i) => i >= 0)
      : [];

  return (
    <ScreenShell
      title={lesson.title}
      onBack={onExit}
      speakKey={phase === 'activity' ? activity?.prompt.key : lesson.intro.key}
      bgColor={isDark ? currentColors.bg : stage.fundo}
    >
      {phase === 'intro' && (
        <View style={styles.center}>
          <View
            style={[
              styles.introCard,
              {
                backgroundColor: isDark ? currentColors.surface : '#FFFFFF',
                borderColor: isDark ? currentColors.borderStrong : currentColors.border,
              },
            ]}
          >
            <View
              style={[
                styles.introIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(6, 182, 212, 0.1)',
                  borderColor: isDark ? '#06B6D4' : '#0891B2',
                },
              ]}
            >
              <Text style={styles.hero}>🎧</Text>
            </View>
            <Text
              style={[
                styles.introTitle,
                { color: currentColors.text, fontSize: font.title * 0.85 * fontScale },
              ]}
            >
              {lesson.title}
            </Text>
            <Text
              style={[
                styles.heroText,
                { fontSize: font.base * fontScale, color: currentColors.textMuted },
              ]}
            >
              Ouça com atenção a instrução da lição e toque em começar quando estiver pronto.
            </Text>
          </View>

          <View style={styles.col}>
            <BigButton
              label="Ouvir a explicação"
              icon="🔊"
              variant="secondary"
              onPress={() => speakKey(lesson.intro.key)}
            />
            <BigButton
              label="Começar a lição"
              icon="▶"
              variant="primary"
              onPress={() => startActivity(session.index)}
            />
          </View>
        </View>
      )}

      {phase === 'activity' && activity && (
        <View style={styles.activity}>
          {/* Banner Visual Principal da Pergunta / Áudio */}
          <Pressable
            onPress={replayPrompt}
            accessibilityRole="button"
            accessibilityLabel="Ouvir a pergunta de novo"
            style={({ pressed }) => [
              styles.promptCard,
              {
                backgroundColor: isDark ? currentColors.surface : '#FFFFFF',
                borderColor: isDark ? currentColors.borderStrong : stage.borda,
                borderBottomColor: isDark ? '#0F172A' : stage.borda,
                borderBottomWidth: pressed ? 1.5 : 4,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}
          >
            <View style={[styles.promptIconWrap, { backgroundColor: stage.balao }]}>
              <Text style={styles.promptIcon}>🔊</Text>
            </View>
            <View style={styles.promptTextWrap}>
              <Text style={[styles.promptTag, { color: stage.borda }]}>TOQUE PARA OUVIR</Text>
              <Text style={[styles.promptText, { fontSize: font.base * fontScale, color: currentColors.text }]} numberOfLines={2}>
                {activity.prompt.text}
              </Text>
            </View>
            <View style={[styles.soundWavePill, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
              <Text style={styles.soundWaveIcon}>📢</Text>
            </View>
          </Pressable>

          {/* Barra de Ferramentas Visual-First */}
          <View style={styles.toolbar}>
            <Pressable
              onPress={replayPrompt}
              accessibilityRole="button"
              accessibilityLabel="Ouvir a instrução de novo"
              style={({ pressed }) => [
                styles.toolBtn,
                {
                  backgroundColor: isDark ? currentColors.surface : '#FFFFFF',
                  borderColor: currentColors.border,
                  borderBottomColor: isDark ? '#0F172A' : '#CBD5E1',
                  borderBottomWidth: pressed ? 1.5 : 3.5,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: stage.balao }]}>
                <Text style={styles.toolIcon}>🔊</Text>
              </View>
              <Text style={[styles.toolLabel, { fontSize: font.sm * fontScale, color: currentColors.text }]}>Ouvir som</Text>
            </Pressable>

            <Pressable
              onPress={useHint}
              disabled={hintLevel >= activity.hints.length}
              accessibilityRole="button"
              accessibilityLabel="Dica"
              accessibilityHint="Dá uma pista visual sem mostrar a resposta"
              style={({ pressed }) => [
                styles.toolBtn,
                {
                  backgroundColor: isDark ? currentColors.surface : '#FFFFFF',
                  borderColor: currentColors.border,
                  borderBottomColor: isDark ? '#0F172A' : '#CBD5E1',
                  borderBottomWidth: pressed ? 1.5 : 3.5,
                  opacity: hintLevel >= activity.hints.length ? 0.35 : 1,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={[styles.toolIconCircle, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.toolIcon}>💡</Text>
              </View>
              <View style={styles.hintInfo}>
                <Text style={[styles.toolLabel, { fontSize: font.sm * fontScale, color: currentColors.text }]}>Dica</Text>
                <View style={styles.hintDots}>
                  {activity.hints.map((_, hIdx) => (
                    <View
                      key={hIdx}
                      style={[
                        styles.hintDot,
                        {
                          backgroundColor: hIdx < hintLevel ? currentColors.borderStrong : '#F59E0B',
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Pressable>
          </View>

          {/* Palavra-alvo escrita (word-to-meaning): ouvi-la conta como ajuda */}
          {activity.type === 'word-to-meaning' && (
            <View style={styles.targetWrap}>
              <SpeechBalloon fill={stage.balao} border={stage.borda} width={220} height={96} accessibilityLabel={`Palavra: ${activity.target}`}>
                <Text style={[styles.targetWord, { fontSize: font.xl * fontScale, color: currentColors.text }]}>{activity.target}</Text>
              </SpeechBalloon>
              {activity.targetAudio && (
                <Pressable
                  onPress={() => {
                    help.current.optionListens += 1;
                    help.current.targetNarrated = true;
                    speakKey(activity.targetAudio?.key);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Ouvir a palavra"
                  accessibilityHint="Narra a palavra — conta como ajuda"
                  style={styles.targetListen}
                >
                  <Text style={styles.toolIcon}>🔉</Text>
                </Pressable>
              )}
            </View>
          )}

          {(activity.type === 'listen-and-select' || activity.type === 'word-to-meaning') && (
            <OptionGrid
              options={activity.options ?? []}
              eliminated={eliminated}
              selectedId={selectedId}
              selectedCorrect={selectedCorrect}
              disabled={advancing.current}
              fontScale={fontScale}
              fill={stage.balao}
              border={stage.borda}
              onSelect={(o) => void onSelect(o)}
              onListenOption={(o) => {
                help.current.optionListens += 1;
                if (o.id === activity.correctOptionId) help.current.targetNarrated = true;
                speakKey(o.audio?.key);
              }}
            />
          )}

          {activity.type === 'compose-word' && (
            <ComposeArea
              pieces={piecesOrder}
              assembledIdx={assembledIdx}
              wrongIdx={wrongIdx}
              eliminatedIdx={eliminatedComposeIdx}
              disabled={advancing.current}
              fontScale={fontScale}
              fill={stage.balao}
              border={stage.borda}
              onTapPiece={(i) => void onTapPiece(i)}
              onUndo={undoPiece}
            />
          )}

          {saveError && (
            <Text style={[styles.saveError, { fontSize: font.base * fontScale * 0.9 }]}>
              Não consegui salvar sua resposta. Ela não foi contada — tente de novo.
            </Text>
          )}

          {selectedCorrect === true && (
            <View style={styles.feedbackBar}>
              <View style={[styles.feedbackPill, { backgroundColor: currentColors.successBg, borderColor: currentColors.success }]}>
                <Text style={styles.feedbackCheck}>✓</Text>
                <Text style={[styles.feedbackText, { color: currentColors.success, fontSize: font.lg * fontScale }]}>
                  {feedbackText ?? 'Muito bem!'}
                </Text>
              </View>
              {pendingNext?.done ? (
                <BigButton label="Terminar a lição" icon="🏆" onPress={() => void finishLesson()} />
              ) : (
                <BigButton label="Continuar" icon="➔" onPress={() => pendingNext && startActivity(pendingNext.index)} />
              )}
            </View>
          )}
          {selectedCorrect === false && (
            <Pressable
              onPress={replayPrompt}
              style={({ pressed }) => [
                styles.errorPill,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>👂</Text>
              <Text style={[styles.feedbackText, { color: currentColors.text, fontSize: font.base * fontScale, flex: 1 }]}>
                {feedbackText ?? 'Ainda não é essa. Toque para ouvir de novo.'}
              </Text>
              <Text style={{ fontSize: 20 }}>🔊</Text>
            </Pressable>
          )}
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.center}>
          <Text style={styles.hero}>🎉</Text>
          <View style={[styles.doneCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
            <Text style={[styles.heroText, { fontSize: font.lg * fontScale, color: currentColors.text }]}>
              {doneMessage}
            </Text>
            <View style={styles.starsBadge}>
              <Text style={styles.starsBadgeText}>+3 ⭐ Estrelas conquistadas!</Text>
            </View>
          </View>
          <View style={styles.col}>
            <BigButton
              label="Ouvir mensagem de parabéns"
              icon="🔊"
              variant="secondary"
              onPress={() => audio.speakPhrase(doneMessage)}
            />
            <BigButton
              label="Voltar para a Trilha"
              onPress={() => router.replace('/(tabs)')}
              accessibilityHint="Retorna à trilha principal de lições"
            />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  hero: { fontSize: 44 },
  introCard: {
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    gap: spacing.sm,
    ...shadows.card,
  },
  introIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: spacing.xs,
  },
  introTitle: {
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  doneCard: {
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.card,
  },
  starsBadge: {
    backgroundColor: colors.starsBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  starsBadgeText: {
    color: colors.stars,
    fontWeight: '800',
    fontSize: font.sm,
  },
  heroText: { textAlign: 'center', fontWeight: '600', maxWidth: 360, lineHeight: 22 },
  col: { gap: spacing.md, alignSelf: 'stretch' },
  activity: { flex: 1, gap: spacing.md },

  // Banner Principal de Áudio
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: spacing.sm,
    ...shadows.subtle,
  },
  promptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  promptIcon: {
    fontSize: 22,
  },
  promptTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  promptTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  promptText: {
    fontWeight: '700',
    lineHeight: 20,
  },
  soundWavePill: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  soundWaveIcon: {
    fontSize: 16,
  },

  // Barra de Ações Visuais
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs },
  toolBtn: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.subtle,
  },
  toolIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: { fontSize: 16 },
  toolLabel: { fontWeight: '800' },
  hintInfo: {
    alignItems: 'center',
    gap: 3,
  },
  hintDots: {
    flexDirection: 'row',
    gap: 4,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  targetWrap: { alignItems: 'center' },
  targetWord: { fontWeight: '900', letterSpacing: 2 },
  targetListen: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBar: { gap: spacing.sm, marginTop: spacing.xs },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  feedbackCheck: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.success,
  },
  feedbackText: { fontWeight: '800' },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: spacing.xs,
  },
  saveError: { textAlign: 'center', color: colors.error, fontWeight: '600' },
});
