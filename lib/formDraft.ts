/** Compare raw values, so whitespace and a changed default choice still count as edits. */
export function formDraftChanged(fields: Pick<FormData, "get">, baseline: Record<string, string>) {
  return Object.entries(baseline).some(([name, value]) => String(fields.get(name) ?? "") !== value);
}
