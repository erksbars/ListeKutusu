export type DuelVote = {
  roundNumber: number;
  matchupNumber: number;
  selectedEntryId: string;
};

export function calculateDuelCompatibility(left: DuelVote[], right: DuelVote[]) {
  const rightByMatchup = new Map(
    right.map((vote) => [`${vote.roundNumber}:${vote.matchupNumber}`, vote.selectedEntryId])
  );
  let compared = 0;
  let matching = 0;
  for (const vote of left) {
    const otherChoice = rightByMatchup.get(`${vote.roundNumber}:${vote.matchupNumber}`);
    if (!otherChoice) continue;
    compared += 1;
    if (otherChoice === vote.selectedEntryId) matching += 1;
  }
  return {
    compared,
    matching,
    percentage: compared ? Math.round((matching / compared) * 100) : 0,
  };
}
