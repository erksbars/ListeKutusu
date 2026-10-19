export function commentReplyTransition(currentId: string | null, nextId: string | null, body: string, busy: boolean) {
  if (busy) return "blocked";
  if (currentId === nextId) return "unchanged";
  return body ? "confirm" : "apply";
}

export function removeCommentFromList<T extends { id: string; replies: Array<{ id: string }> }>(items: T[], id: string) {
  const root = items.find(item => item.id === id);
  const removedCount = root ? 1 + root.replies.length : items.some(item => item.replies.some(reply => reply.id === id)) ? 1 : 0;
  return { removedCount, comments: items.filter(item => item.id !== id).map(item => ({ ...item, replies: item.replies.filter(reply => reply.id !== id) })) };
}
