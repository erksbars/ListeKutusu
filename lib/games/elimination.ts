export type EliminationMatchup = {
  number: number;
  entryAId: string;
  entryBId: string;
  winnerEntryId: string | null;
};

export type EliminationRound = {
  number: number;
  matchups: EliminationMatchup[];
};

export type EliminationState = {
  format: "single-elimination";
  rounds: EliminationRound[];
  currentRound: number;
  completed: boolean;
  winnerEntryId: string | null;
};

function createRound(entryIds: string[], number: number): EliminationRound {
  if (entryIds.length < 2 || entryIds.length % 2 !== 0) {
    throw new Error("Tur için çift sayıda şarkı gerekir.");
  }
  return {
    number,
    matchups: Array.from({ length: entryIds.length / 2 }, (_, index) => ({
      number: index + 1,
      entryAId: entryIds[index * 2],
      entryBId: entryIds[index * 2 + 1],
      winnerEntryId: null,
    })),
  };
}

export function createEliminationState(entryIds: string[]): EliminationState {
  if (![4, 8, 16].includes(entryIds.length) || new Set(entryIds).size !== entryIds.length) {
    throw new Error("Şarkı Elemesi 4, 8 veya 16 benzersiz şarkıyla başlatılabilir.");
  }
  return {
    format: "single-elimination",
    rounds: [createRound(entryIds, 1)],
    currentRound: 1,
    completed: false,
    winnerEntryId: null,
  };
}

export function parseEliminationState(value: string): EliminationState {
  const parsed = JSON.parse(value) as EliminationState;
  if (parsed?.format !== "single-elimination" || !Array.isArray(parsed.rounds)) {
    throw new Error("Oyun durumu geçersiz.");
  }
  return parsed;
}

export function chooseEliminationWinner(
  state: EliminationState,
  matchupNumber: number,
  selectedEntryId: string
): EliminationState {
  if (state.completed) throw new Error("Bu oyun tamamlandı.");
  const rounds = state.rounds.map((round) => ({
    ...round,
    matchups: round.matchups.map((matchup) => ({ ...matchup })),
  }));
  const current = rounds.find((round) => round.number === state.currentRound);
  const matchup = current?.matchups.find((item) => item.number === matchupNumber);
  if (!current || !matchup) throw new Error("Eşleşme bulunamadı.");
  if (matchup.winnerEntryId) throw new Error("Bu eşleşme daha önce tamamlandı.");
  if (selectedEntryId !== matchup.entryAId && selectedEntryId !== matchup.entryBId) {
    throw new Error("Seçilen şarkı bu eşleşmede yer almıyor.");
  }
  matchup.winnerEntryId = selectedEntryId;
  if (current.matchups.some((item) => !item.winnerEntryId)) {
    return { ...state, rounds };
  }
  const winners = current.matchups.map((item) => item.winnerEntryId!);
  if (winners.length === 1) {
    return { ...state, rounds, completed: true, winnerEntryId: winners[0] };
  }
  const nextRound = createRound(winners, current.number + 1);
  return {
    ...state,
    rounds: [...rounds, nextRound],
    currentRound: nextRound.number,
  };
}
