export type TargetDecisionStatus = 'pending' | 'correct' | 'incorrect';

export type TargetIdentity = {
  character: string;
  occurrence: number;
  zhuyin: string;
};

export type SubmittedTargetDecision = TargetIdentity & {
  status: Exclude<TargetDecisionStatus, 'pending'>;
};

export function targetDecisionKey(target: TargetIdentity): string {
  return `${target.character}\u0000${target.occurrence}\u0000${target.zhuyin}`;
}

export function pendingTargetStatuses(
  targets: TargetIdentity[],
): Record<string, TargetDecisionStatus> {
  return Object.fromEntries(targets.map((target) => [targetDecisionKey(target), 'pending']));
}

export function summarizeTargetStatuses(
  targets: TargetIdentity[],
  statuses: Record<string, TargetDecisionStatus>,
): TargetDecisionStatus {
  if (!targets.length) return 'pending';
  const values = targets.map((target) => statuses[targetDecisionKey(target)] ?? 'pending');
  if (values.some((status) => status === 'pending')) return 'pending';
  return values.some((status) => status === 'incorrect') ? 'incorrect' : 'correct';
}

export function submittedTargetDecisions(
  targets: TargetIdentity[],
  statuses: Record<string, TargetDecisionStatus>,
): SubmittedTargetDecision[] | null {
  if (summarizeTargetStatuses(targets, statuses) === 'pending') return null;
  return targets.map((target) => ({
    ...target,
    status: statuses[targetDecisionKey(target)] as Exclude<TargetDecisionStatus, 'pending'>,
  }));
}

export function decisionForTarget(
  target: TargetIdentity,
  decisions: SubmittedTargetDecision[] | undefined,
): Exclude<TargetDecisionStatus, 'pending'> | null {
  return (
    decisions?.find(
      (decision) =>
        decision.character === target.character &&
        decision.occurrence === target.occurrence &&
        decision.zhuyin === target.zhuyin,
    )?.status ?? null
  );
}

export function formatPronunciationCue(target: TargetIdentity & {
  homophoneCue: string;
  usage: string;
  cueMode: 'known_usage' | 'unresolved_target';
}): string {
  return target.cueMode === 'unresolved_target'
    ? `${target.character}，這裡念作${target.homophoneCue}（${target.zhuyin}）。`
    : `${target.character}，當作「${target.usage}」時，念作${target.homophoneCue}（${target.zhuyin}）。`;
}
