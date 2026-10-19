export const AGENDA_VIEWS = { upcoming: "Yaklaşan", past: "Başlangıcı geçmiş", cancelled: "İptal edilen" } as const;
export const AGENDA_ROLES = { all: "Tümü", responded: "Tercih verdiklerim", organizing: "Düzenlediklerim" } as const;
export type AgendaView = keyof typeof AGENDA_VIEWS;
export type AgendaRole = keyof typeof AGENDA_ROLES;
export function agendaFilters(params: URLSearchParams) {
  const view = params.get("view"), role = params.get("role"), page = params.get("page") ?? "1";
  return { view: view && Object.hasOwn(AGENDA_VIEWS, view) ? view as AgendaView : "upcoming", role: role && Object.hasOwn(AGENDA_ROLES, role) ? role as AgendaRole : "all", page: /^[1-9]\d{0,2}$/.test(page) && Number(page) <= 100 ? Number(page) : 1 };
}
