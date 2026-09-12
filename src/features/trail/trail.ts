import { LESSON_STAGE } from './stages';

/** Estado visual de um balão da trilha. */
export type NodeState = 'completed' | 'current' | 'locked';

export interface TrailNode {
  lessonId: string;
  stageIndex: number;
  state: NodeState;
}

/**
 * Monta os nós da trilha a partir do progresso.
 * Regra: caminho linear — a primeira lição não concluída é a "atual";
 * tudo antes fica concluído (rever não apaga conquista), tudo depois fica fechado.
 */
export function buildTrail(lessonIds: string[], isCompleted: (id: string) => boolean): TrailNode[] {
  const firstOpen = lessonIds.findIndex((id) => !isCompleted(id));
  return lessonIds.map((id, i) => ({
    lessonId: id,
    stageIndex: LESSON_STAGE[id] ?? 0,
    state: firstOpen === -1 || i < firstOpen ? 'completed' : i === firstOpen ? 'current' : 'locked',
  }));
}

/** Trilha toda concluída — o fundo permanece lilás (manual, pág. 4). */
export function trailComplete(nodes: TrailNode[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.state === 'completed');
}

/** Momento que pinta o fundo da tela: o da lição atual, ou o último ao concluir. */
export function currentStageIndex(nodes: TrailNode[]): number {
  const cur = nodes.find((n) => n.state === 'current');
  if (cur) return cur.stageIndex;
  return nodes.length ? nodes[nodes.length - 1].stageIndex : 0;
}

/**
 * Zigue-zague do caminho (estilo trilha do Duolingo):
 * deslocamento horizontal de cada nó em fração da largura útil (-1 esq, 0 centro, 1 dir).
 */
const ZIGZAG = [0, -1, -0.35, 1, 0.35, -1, 0, 1, -0.35, 1];

export function zigzagOffset(nodeIndex: number): number {
  return ZIGZAG[nodeIndex % ZIGZAG.length];
}
