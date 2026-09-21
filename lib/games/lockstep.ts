export type MatchupDecision =
  | { ready: false; receivedVotes: number; remainingVotes: number; leaders: string[] }
  | { ready: true; receivedVotes: number; remainingVotes: 0; leaders: string[] };

export function getMatchupDecision(selectedEntryIds: string[], requiredVotes: number): MatchupDecision {
  const receivedVotes = selectedEntryIds.length;
  if (requiredVotes < 2 || receivedVotes < requiredVotes) {
    return {
      ready: false,
      receivedVotes,
      remainingVotes: Math.max(0, requiredVotes - receivedVotes),
      leaders: [],
    };
  }
  const counts = new Map<string, number>();
  for (const entryId of selectedEntryIds) counts.set(entryId, (counts.get(entryId) ?? 0) + 1);
  const highest = Math.max(...counts.values());
  return {
    ready: true,
    receivedVotes,
    remainingVotes: 0,
    leaders: [...counts.entries()].filter(([, count]) => count === highest).map(([entryId]) => entryId),
  };
}
