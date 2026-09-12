import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LESSON_STAGE, TRAIL_STAGES } from '../trail/stages';
import { useServices } from '../../services/ServicesProvider';
import type { Activity, Lesson, Option } from '../../services/content/types';
import { getLessonProgress, recordAttempt, saveLessonProgress } from '../../services/db/repo';
import { BigButton } from '../../shared/components/BigButton';
import { ComposeArea } from '../../shared/components/ComposeArea';
import { OptionGrid } from '../../shared/components/OptionGrid';
import { ScreenShell } from '../../shared/components/ScreenShell';
import { SpeechBalloon } from '../../shared/components/SpeechBalloon';
import { colors, font, MIN_TOUCH, spacing } from '../../shared/theme';
import { computeHelpUsed, computeIndependentRead, evaluateCompose, evaluateSelection, isComposePrefix } from './evaluate';
import { advance, resumeIndex, statusFor, type SessionState } from './session';
import { PREF_KEYS } from '../../services/ServicesProvider';

type Phase = 'intro' | 'activity' | 'done';

interface Props {
  lesson: Lesson;
  /** Modo revisão: não carrega nem salva posição — sempre começa do início. */
  review?: boolean;
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
export function LessonPlayer({ lesson, review = false }: Props) {
  const { audio, db, fontScale, prefs } = useServices();
  /** Cores do momento desta lição — a paleta acompanha a etapa (manual pág. 3). */
  const stage = TRAIL_STAGES[LESSON_STAGE[lesson.id] ?? 0];
  const [phase, setPhase] = useState<Phase>('intro');
  const [session, setSession] = useState<SessionState>({ index: 0, done: false });
  const [initDone, setInitDone] = useState(false);

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedCorrect, setSelectedCorrect] = useState<boolean | undefined>();
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [saveError, setSaveError] = useState(false);
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

  const activity: Activity | undefined = phase === 'activity' ? lesson.activities[session.index] : undefined;
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
      advancing.current = false;
      setAssembledIdx([]);
      setWrongIdx(undefined);
      setPendingNext(null);
      setSession({ index, done: false });
      setPhase('activity');
      const a = lesson.activities[index];
      if (a?.type === 'compose-word') {
        setPiecesOrder(shuffle([...(a.pieces ?? []), ...(a.distractors ?? [])]));
      }
      if (a?.narratesTarget) help.current.targetNarrated = true;
      speakKey(a?.prompt.key);
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
    speakKey(ev.correct ? activity.feedbackCorrect?.key ?? 'ui/correto' : activity.feedbackIncorrect?.key ?? 'ui/incorreto');
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
      speakKey('ui/incorreto');
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
      speakKey(activity.feedbackCorrect?.key ?? 'ui/correto');
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
    setPhase('done');
    speakKey(lesson.outro.key);
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

  if (!initDone) return <ScreenShell title={lesson.title} showBack bgColor={stage.fundo}>{null}</ScreenShell>;

  const eliminatedComposeIdx =
    activity?.type === 'compose-word'
      ? piecesOrder.map((p, i) => (eliminated.includes(p) ? i : -1)).filter((i) => i >= 0)
      : [];

  return (
    <ScreenShell title={lesson.title} speakKey={phase === 'activity' ? activity?.prompt.key : lesson.intro.key} bgColor={stage.fundo}>
      {phase === 'intro' && (
        <View style={styles.center}>
          <Text style={styles.hero}>🎧</Text>
          <Text style={[styles.heroText, { fontSize: font.lg * fontScale }]}>Ouça e depois toque em começar.</Text>
          <View style={styles.col}>
            <BigButton label="Ouvir a explicação" icon="🔊" variant="secondary" onPress={() => speakKey(lesson.intro.key)} />
            <BigButton label="Começar a lição" onPress={() => startActivity(session.index)} />
          </View>
        </View>
      )}

      {phase === 'activity' && activity && (
        <View style={styles.activity}>
          <View style={styles.toolbar}>
            <Pressable onPress={replayPrompt} accessibilityRole="button" accessibilityLabel="Ouvir a instrução de novo" style={styles.toolBtn}>
              <Text style={styles.toolIcon}>🔊</Text>
              <Text style={[styles.toolLabel, { fontSize: font.base * fontScale * 0.8 }]}>Ouvir de novo</Text>
            </Pressable>
            <Pressable
              onPress={useHint}
              disabled={hintLevel >= activity.hints.length}
              accessibilityRole="button"
              accessibilityLabel="Dica"
              accessibilityHint="Dá uma pista sem mostrar a resposta"
              style={[styles.toolBtn, hintLevel >= activity.hints.length && { opacity: 0.4 }]}
            >
              <Text style={styles.toolIcon}>💡</Text>
              <Text style={[styles.toolLabel, { fontSize: font.base * fontScale * 0.8 }]}>Dica</Text>
            </Pressable>
          </View>

          {/* Palavra-alvo escrita (word-to-meaning): ouvi-la conta como ajuda */}
          {activity.type === 'word-to-meaning' && (
            <View style={styles.targetWrap}>
              <SpeechBalloon fill={stage.balao} border={stage.borda} width={220} height={96} accessibilityLabel={`Palavra: ${activity.target}`}>
                <Text style={[styles.targetWord, { fontSize: font.xl * fontScale, color: colors.text }]}>{activity.target}</Text>
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
              <Text style={[styles.feedbackText, { color: colors.success, fontSize: font.lg * fontScale }]}>
                ✓ Muito bem!
              </Text>
              {pendingNext?.done ? (
                <BigButton label="Terminar a lição" onPress={() => void finishLesson()} />
              ) : (
                <BigButton label="Continuar" onPress={() => pendingNext && startActivity(pendingNext.index)} />
              )}
            </View>
          )}
          {selectedCorrect === false && (
            <Text style={[styles.feedbackText, { color: colors.textMuted, fontSize: font.base * fontScale }]}>
              🔉 Ainda não é essa. Escute de novo.
            </Text>
          )}
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.center}>
          <Text style={styles.hero}>🎉</Text>
          <Text style={[styles.heroText, { fontSize: font.lg * fontScale }]}>
            Você completou esta lição. Bom trabalho hoje!
          </Text>
          <View style={styles.col}>
            <BigButton label="Ouvir mensagem final" icon="🔊" variant="secondary" onPress={() => speakKey(lesson.outro.key)} />
            <BigButton label="Voltar ao início" onPress={() => router.replace('/home')} />
          </View>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  hero: { fontSize: 72 },
  heroText: { textAlign: 'center', color: colors.text, fontWeight: '600', maxWidth: 420 },
  col: { gap: spacing.md, alignSelf: 'stretch' },
  activity: { flex: 1, gap: spacing.md },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between' },
  toolBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolIcon: { fontSize: 26 },
  toolLabel: { color: colors.text, fontWeight: '700' },
  targetWrap: { alignItems: 'center' },
  targetWord: { fontWeight: '900', letterSpacing: 3 },
  targetListen: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBar: { gap: spacing.md, marginTop: spacing.sm },
  feedbackText: { textAlign: 'center', fontWeight: '800' },
  saveError: { textAlign: 'center', color: colors.error, fontWeight: '600' },
});
