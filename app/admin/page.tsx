"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ListChecks,
  LogOut,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Toast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageTopbar } from "../components/PageTopbar";
import { AdminLoginView } from "../components/admin/AdminLoginView";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminActivityReport } from "../components/admin/AdminActivityReport";
import { AdminReportsPanel } from "../components/admin/AdminReportsPanel";
import { AdminSuggestionQueue } from "../components/admin/AdminSuggestionQueue";
import { AdminUserListsPanel } from "../components/admin/AdminUserListsPanel";
import {
  defaultActivityRange,
  emptyActivitySummary,
  reportDateRange,
  type ActivityKind,
  type AdminActivitySummary,
  type AdminAuditLog,
  type AdminListFilter,
  type AdminPostReport,
  type AdminReportFilter,
  type AdminSettings,
  type AdminSuggestion,
  type AdminUserList,
} from "../components/admin/adminTypes";

type PendingRoleChange = {
  id: string;
  ownerName: string;
  role: "member" | "moderator";
};

type AdminView = "overview" | "moderation" | "users" | "queue";

const adminViews = [
  { value: "overview", label: "Genel bakış", icon: BarChart3 },
  { value: "moderation", label: "Moderasyon", icon: ShieldAlert },
  { value: "users", label: "Kullanıcılar", icon: UsersRound },
  { value: "queue", label: "Öneri kuyruğu", icon: ListChecks },
] as const;

function isAdminView(value: string | null): value is AdminView {
  return adminViews.some((item) => item.value === value);
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pending, setPending] = useState<AdminSuggestion[]>([]);
  const [recent, setRecent] = useState<AdminSuggestion[]>([]);
  const [lists, setLists] = useState<AdminUserList[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loginKey, setLoginKey] = useState("");
  const [showLoginKey, setShowLoginKey] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [listFilter, setListFilter] = useState<AdminListFilter>("all");
  const [reports, setReports] = useState<AdminPostReport[]>([]);
  const [reportFilter, setReportFilter] = useState<AdminReportFilter>("pending");
  const [reportStats, setReportStats] = useState({ pending: 0, resolved: 0, dismissed: 0 });
  const [removeReportId, setRemoveReportId] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [activityFrom, setActivityFrom] = useState(defaultActivityRange.from);
  const [activityTo, setActivityTo] = useState(defaultActivityRange.to);
  const [activityKind, setActivityKind] = useState<ActivityKind>("all");
  const [activitySummary, setActivitySummary] = useState<AdminActivitySummary>(emptyActivitySummary);
  const [activityLogs, setActivityLogs] = useState<AdminAuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [adminView, setAdminView] = useState<AdminView>("overview");

  async function loadPending() {
    try {
      const res = await fetch("/api/admin/pending");
      if (res.status === 401) {
        setAuthed(false);
        return false;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Yönetim verileri alınamadı.");
      const nextPending = data.pending ?? [];
      setPending(nextPending);
      setPendingTotal(data.queue?.total ?? nextPending.length);
      setSelectedPendingIds((current) => current.filter((id) => nextPending.some((item: AdminSuggestion) => item.id === id)));
      setRecent(data.recent ?? []);
      setAuthed(true);
      return true;
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Yönetim verileri alınamadı.");
      setAuthed(false);
      return false;
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Spotify ayarları alınamadı.");
      const nextSettings = data.settings ?? null;
      setSettings(nextSettings);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Spotify ayarları alınamadı.");
    }
  }

  const loadLists = useCallback(async (page: number, search: string, filter: AdminListFilter) => {
    setListsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20", q: search.trim(), filter });
      const res = await fetch(`/api/admin/lists?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Kullanıcı listeleri alınamadı.");
      setLists(data.lists ?? []);
      setListPage(data.pagination?.page ?? 1);
      setListTotal(data.pagination?.total ?? 0);
      setListTotalPages(data.pagination?.totalPages ?? 1);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Kullanıcı listeleri alınamadı.");
    } finally {
      setListsLoading(false);
    }
  }, []);

  const loadReports = useCallback(async (status: AdminReportFilter) => {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Şikâyet kayıtları alınamadı.");
      setReports(data.reports ?? []);
      setReportStats(data.stats ?? { pending: 0, resolved: 0, dismissed: 0 });
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Şikâyet kayıtları alınamadı.");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (from: string, to: string, kind: ActivityKind, page = 1) => {
    if (!from || !to || from > to) {
      setActionMessage("Geçerli bir başlangıç ve bitiş tarihi seç.");
      return;
    }
    setActivityLoading(true);
    try {
      const params = new URLSearchParams({ from, to, kind, page: String(page), pageSize: "20" });
      const res = await fetch(`/api/admin/activity?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Yönetim raporu alınamadı.");
      setActivitySummary(data.summary ?? emptyActivitySummary);
      setActivityLogs(data.logs ?? []);
      setActivityPage(data.pagination?.page ?? 1);
      setActivityTotalPages(data.pagination?.totalPages ?? 1);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Yönetim raporu alınamadı.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  function applyActivityPreset(days: number) {
    const range = reportDateRange(days);
    setActivityFrom(range.from);
    setActivityTo(range.to);
    void loadActivity(range.from, range.to, activityKind, 1);
  }

  async function exportActivityCsv() {
    if (busyAction || !activityFrom || !activityTo || activityFrom > activityTo) return;
    setBusyAction("activity-export");
    try {
      const params = new URLSearchParams({ from: activityFrom, to: activityTo, kind: activityKind, format: "csv" });
      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "CSV dosyası hazırlanamadı.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yonetim-islemleri-${activityFrom}-${activityTo}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage("Yönetim raporu CSV olarak indirildi.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "CSV dosyası hazırlanamadı.");
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const requestedView = params.get("view");
    if (isAdminView(requestedView)) setAdminView(requestedView);
    if (error === "spotify_callback_failed") {
      setPageError(
        "Spotify bağlantısı tamamlanamadı. Redirect URI, Client Secret veya uygulama kullanıcı izinlerini kontrol et."
      );
    }
    void loadPending().then((authorized) => {
      if (!authorized) return;
      void Promise.all([
        loadSettings(),
        loadLists(1, "", "all"),
        loadReports("pending"),
        loadActivity(defaultActivityRange.from, defaultActivityRange.to, "all"),
      ]);
    });
  }, [loadActivity, loadLists, loadReports]);

  function changeAdminView(view: AdminView) {
    setAdminView(view);
    const url = new URL(window.location.href);
    if (view === "overview") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  async function login() {
    if (!loginKey.trim() || busyAction) return;
    setLoginError(null);
    setBusyAction("login");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: loginKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Giriş başlatılamadı.");
      window.location.href = data.url;
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Giriş başlatılamadı.");
      setBusyAction(null);
    }
  }

  async function reconnectSpotify() {
    if (busyAction) return;
    setActionMessage(null);
    setBusyAction("spotify");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: loginKey || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Spotify bağlantısı başlatılamadı.");
      window.location.href = data.url;
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Spotify bağlantısı başlatılamadı.");
      setBusyAction(null);
    }
  }

  async function decide(id: string, action: "approve" | "reject") {
    if (busyAction) return;
    const operationId = `decision:${id}`;
    setActionMessage(null);
    setBusyAction(operationId);
    try {
      const res = await fetch("/api/admin/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
      setActionMessage(action === "approve" ? "Şarkı onaylandı." : "Şarkı reddedildi.");
      await Promise.all([loadPending(), loadLists(listPage, listSearch, listFilter)]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
    } finally {
      setBusyAction(null);
    }
  }

  async function bulkDecide(action: "approve" | "reject") {
    if (busyAction || selectedPendingIds.length === 0) return;
    const ids = selectedPendingIds.filter((id) => pending.some((item) => item.id === id));
    if (ids.length === 0) return;
    setBusyAction(`bulk:${action}`);
    setActionMessage(null);
    let completed = 0;
    let failed = 0;
    try {
      for (const id of ids) {
        try {
          const res = await fetch("/api/admin/decide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action }),
          });
          if (res.ok) completed += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      setSelectedPendingIds([]);
      setActionMessage(`${completed} öneri ${action === "approve" ? "onaylandı" : "reddedildi"}${failed ? `, ${failed} işlem tamamlanamadı` : ""}.`);
      await Promise.all([loadPending(), loadLists(listPage, listSearch, listFilter)]);
    } finally {
      setBusyAction(null);
    }
  }

  async function moderateReport(id: string, action: "dismiss" | "resolve" | "remove") {
    if (busyAction) return;
    const operationId = `report:${id}`;
    setBusyAction(operationId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Moderasyon işlemi tamamlanamadı.");
      setActionMessage(action === "remove" ? "Bildirilen içerik kaldırıldı." : "Şikâyet kapatıldı.");
      await loadReports(reportFilter);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Moderasyon işlemi tamamlanamadı.");
    } finally {
      setBusyAction(null);
    }
  }

  async function updateUserRole(change: PendingRoleChange) {
    if (busyAction) return;
    setBusyAction(`role:${change.id}`);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: change.id, role: change.role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Kullanıcı rolü güncellenemedi.");
      setLists((current) =>
        current.map((list) =>
          list.id === change.id ? { ...list, role: change.role } : list
        )
      );
      setActionMessage(
        change.role === "moderator"
          ? `${change.ownerName} forum moderatörü yapıldı.`
          : `${change.ownerName} moderatörlüğü kaldırıldı.`
      );
      void loadActivity(activityFrom, activityTo, activityKind, 1);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Kullanıcı rolü güncellenemedi.");
    } finally {
      setBusyAction(null);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthed(false);
      setLoginKey("");
      setPending([]);
      setRecent([]);
      setLists([]);
      setSettings(null);
      setReports([]);
      setActivityLogs([]);
      setActivitySummary(emptyActivitySummary);
      setPendingTotal(0);
      setListTotal(0);
      setListPage(1);
      setListTotalPages(1);
      setActivityPage(1);
      setActivityTotalPages(1);
    } catch {
      setActionMessage("Çıkış işlemi tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
    }
  }

  if (authed === null) {
    return (
      <main id="main-content" tabIndex={-1} role="status" aria-live="polite" className="stage-shell flex min-h-screen items-center justify-center bg-app px-6 text-sm font-semibold text-cyan-50/70">
        Panel hazırlanıyor...
      </main>
    );
  }

  if (authed === false) {
    return (
      <AdminLoginView
        loginKey={loginKey}
        showLoginKey={showLoginKey}
        loginError={loginError}
        pageError={pageError}
        busy={busyAction === "login"}
        onLoginKeyChange={(value) => {
          setLoginKey(value);
          setLoginError(null);
        }}
        onToggleVisibility={() => setShowLoginKey((current) => !current)}
        onClearPageError={() => {
          setPageError(null);
        }}
        onLogin={() => void login()}
      />
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-slate-950 sm:px-6">
      <Toast
        message={actionMessage}
        onClose={() => {
          setActionMessage(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(removeReportId)}
        title="Bildirilen içeriği kaldır"
        body="Bildirilen paylaşım veya yorum yayından kaldırılacak ve aynı içeriğe ait bekleyen raporlar çözüldü olarak işaretlenecek. Bu kararı uygulamak istiyor musun?"
        confirmLabel="İçeriği kaldır"
        tone="danger"
        onCancel={() => setRemoveReportId(null)}
        onConfirm={() => {
          const id = removeReportId;
          setRemoveReportId(null);
          if (id) void moderateReport(id, "remove");
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingRoleChange)}
        title={pendingRoleChange?.role === "moderator" ? "Moderatör yetkisi ver" : "Moderatör yetkisini kaldır"}
        body={pendingRoleChange?.role === "moderator"
          ? `${pendingRoleChange?.ownerName || "Bu kullanıcı"} forum konularını ve yanıtlarını denetleyebilecek. Tam yönetici ve Spotify ayarlarına erişemeyecek.`
          : `${pendingRoleChange?.ownerName || "Bu kullanıcı"} forum moderasyon paneline artık erişemeyecek.`}
        confirmLabel={pendingRoleChange?.role === "moderator" ? "Moderatör yap" : "Yetkiyi kaldır"}
        tone={pendingRoleChange?.role === "moderator" ? "default" : "danger"}
        busy={Boolean(pendingRoleChange && busyAction === `role:${pendingRoleChange.id}`)}
        onCancel={() => setPendingRoleChange(null)}
        onConfirm={() => {
          const change = pendingRoleChange;
          if (!change) return;
          void updateUserRole(change).finally(() => setPendingRoleChange(null));
        }}
      />
      <div className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Yönetim merkezi"
          subtitle="Listeler, senkron ve moderasyon"
          icon={<ShieldCheck size={18} />}
          backLabel="Ana sayfaya dön"
          className="mb-6"
          actions={
            <>
            <Link href="/admin/forum" className="topbar-text-button" aria-label="Forum moderasyonu">
              <MessageSquareText size={16} /> <span className="hidden sm:inline">Forum</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="topbar-text-button text-rose-100"
            >
              <LogOut size={16} /> <span>Çıkış yap</span>
            </button>
            </>
          }
        />

        <nav className="admin-section-tabs" aria-label="Yönetim bölümleri">
          {adminViews.map(({ value, label, icon: Icon }) => {
            const count =
              value === "moderation"
                ? reportStats.pending
                : value === "users"
                  ? listTotal
                  : value === "queue"
                    ? pendingTotal
                    : null;
            return (
              <button
                key={value}
                type="button"
                className="admin-section-tab"
                aria-current={adminView === value ? "page" : undefined}
                onClick={() => changeAdminView(value)}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{label}</span>
                {typeof count === "number" && count > 0 && <strong>{count}</strong>}
              </button>
            );
          })}
        </nav>

        <div className="admin-section-content" key={adminView}>
          {adminView === "overview" && (
            <>
              <AdminOverview
                pendingTotal={pendingTotal}
                listTotal={listTotal}
                pendingReports={reportStats.pending}
                settings={settings}
                exportedListCount={lists.filter((list) => list.spotifyExternalUrl).length}
                reconnecting={busyAction === "spotify"}
                onReconnect={() => void reconnectSpotify()}
              />
              <AdminActivityReport
                from={activityFrom}
                to={activityTo}
                kind={activityKind}
                summary={activitySummary}
                logs={activityLogs}
                loading={activityLoading}
                exporting={busyAction === "activity-export"}
                page={activityPage}
                totalPages={activityTotalPages}
                onFromChange={setActivityFrom}
                onToChange={setActivityTo}
                onKindChange={setActivityKind}
                onPreset={applyActivityPreset}
                onApply={(page = 1) => void loadActivity(activityFrom, activityTo, activityKind, page)}
                onExport={() => void exportActivityCsv()}
              />
            </>
          )}

          {adminView === "moderation" && (
            <AdminReportsPanel
              reports={reports}
              filter={reportFilter}
              stats={reportStats}
              loading={reportsLoading}
              busyAction={busyAction}
              onFilterChange={(next) => {
                setReportFilter(next);
                void loadReports(next);
              }}
              onRefresh={() => void loadReports(reportFilter)}
              onModerate={(id, action) => void moderateReport(id, action)}
              onRequestRemove={setRemoveReportId}
            />
          )}

          {adminView === "users" && (
            <AdminUserListsPanel
              lists={lists}
              total={listTotal}
              search={listSearch}
              filter={listFilter}
              loading={listsLoading}
              busy={Boolean(busyAction)}
              page={listPage}
              totalPages={listTotalPages}
              onSearchChange={setListSearch}
              onFilterChange={(next) => {
                setListFilter(next);
                void loadLists(1, listSearch, next);
              }}
              onLoad={(page) => void loadLists(page, listSearch, listFilter)}
              onClearFilters={() => {
                setListSearch("");
                setListFilter("all");
                void loadLists(1, "", "all");
              }}
              onRequestRoleChange={setPendingRoleChange}
            />
          )}

          {adminView === "queue" && (
            <AdminSuggestionQueue
              pending={pending}
              pendingTotal={pendingTotal}
              recent={recent}
              selectedIds={selectedPendingIds}
              busyAction={busyAction}
              onSelectionChange={setSelectedPendingIds}
              onDecision={(id, action) => void decide(id, action)}
              onBulkDecision={(action) => void bulkDecide(action)}
            />
          )}
        </div>
      </div>
    </main>
  );
}

