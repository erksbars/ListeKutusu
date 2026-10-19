"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { PageTopbar } from "../PageTopbar";
import { Button } from "../ui/Button";
import { SelectField, TextAreaField, TextField } from "../ui/Field";
import { ConfirmDialog } from "../ConfirmDialog";
import { communityError, communityFetch } from "@/app/(social)/communities/communityFetch";
import { PLATFORM_CASE_KINDS, PLATFORM_CASE_STATUSES, type OwnPlatformCases, type PlatformCaseList, type PlatformCaseRow } from "@/lib/platformCommunityCaseTypes";
import { useCommunityRead } from "@/app/(social)/communities/useCommunityRead";
import { CommunityReadFeedback } from "../CommunityReadFeedback";
import { ContentState } from "../ui/ContentState";
import { useDraftNavigationGuard } from "../DraftNavigationProvider";
import { accountLoginPath } from "@/lib/navigation";
import { communityRequestStatus } from "@/lib/communityRequest";

const when = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value));
type CaseSubject = { kind: string; sourceReportId: string };
function CaseResponse({ item, disabled, save }: { item: PlatformCaseRow; disabled: boolean; save: (body: Record<string, unknown>, done: () => void) => Promise<void> }) {
  const [response, setResponse] = useState(""), [status, setStatus] = useState("resolved"), [confirm, setConfirm] = useState(false);
  useDraftNavigationGuard({ dirty: Boolean(response), busy: disabled && Boolean(response) });
  async function submit() { await save({ id: item.id, status, response, expectedVersion: item.version }, () => setResponse("")); setConfirm(false); }
  return <form className="community-stack" aria-label="Platform kararı" onSubmit={event => { event.preventDefault(); setConfirm(true); }}>
    <SelectField label="Başvuru sonucu" disabled={disabled} value={status} onChange={event => setStatus(event.target.value)}><option value="resolved">Sonuçlandırıldı</option><option value="dismissed">İşleme alınmadı</option></SelectField>
    <TextAreaField label="Başvurana yanıt" value={response} onChange={event => setResponse(event.target.value)} required minLength={10} maxLength={1000} rows={4} disabled={disabled} hint="Bu metni başvuran görecek. Özel üçüncü kişi bilgisi ekleme." />
    <Button type="submit" disabled={disabled}>Kararı kaydet</Button>
    <ConfirmDialog open={confirm} title="Platform kararını kaydet?" body="Yanıt başvurana açılacak ve başvuru kapanacak. Bu işlem banı kaldırmaz, içerik veya topluluk kararını değiştirmez." busy={disabled} onCancel={() => setConfirm(false)} onConfirm={() => void submit()} />
  </form>;
}
export function CommunityCaseClient({ staff = false, initialCommunity = "" }: { staff?: boolean; initialCommunity?: string }) {
  const api = staff ? "/api/admin/community-cases" : "/api/community-cases";
  const [page, setPage] = useState(1), [status, setStatus] = useState("pending"), [community, setCommunity] = useState(initialCommunity), [draftCommunity, setDraftCommunity] = useState(initialCommunity);
  const [kind, setKind] = useState("community"), [sourceReportId, setSourceReportId] = useState(""), [reason, setReason] = useState("");
  const [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [switching, setSwitching] = useState(false);
  const [writeError, setWriteError] = useState(""), [message, setMessage] = useState(""), [switchError, setSwitchError] = useState("");
  const [targetChange, setTargetChange] = useState<string | null>(null);
  const [subjectChange, setSubjectChange] = useState<CaseSubject | null>(null), [subjectError, setSubjectError] = useState("");
  const busyRef = useRef(false);
  const targetRequest = useRef<AbortController | null>(null);
  useEffect(() => () => targetRequest.current?.abort(), []);
  const params = new URLSearchParams({ page: String(page), ...(staff ? { status } : { community }) });
  const readUrl = `${api}?${params}`;
  const { data, error, loading, status: readStatus } = useCommunityRead<PlatformCaseList & Partial<OwnPlatformCases>>(readUrl, revision);
  const activeTarget = useRef(readUrl); activeTarget.current = readUrl;
  const requestExit = useDraftNavigationGuard({ dirty: !staff && Boolean(reason || sourceReportId || kind !== "community" || draftCommunity !== community), busy: busy || switching });
  function changeQueue(proceed: () => void) { if (staff) requestExit(proceed); else proceed(); }
  async function selectSubject(next: CaseSubject) {
    if (busyRef.current || switching) return;
    const controller = new AbortController(); targetRequest.current?.abort(); targetRequest.current = controller;
    setSwitching(true); setSubjectError("");
    try {
      const candidate = await communityFetch<OwnPlatformCases>(`${api}?${new URLSearchParams({ page: "1", community })}`, undefined, controller.signal);
      const context = candidate.context;
      const allowed = context?.slug === community && (
        next.kind === "community" ||
        (next.kind === "ban_appeal" && context.canAppealBan) ||
        (next.kind === "report_appeal" && context.reports.length > 0 && (!next.sourceReportId || context.reports.some(report => report.id === next.sourceReportId)))
      );
      if (!allowed) throw new Error("Seçtiğin başvuru konusu artık kullanılamıyor. Önceki seçim ve açıklaman korundu; başvuruları yenileyebilirsin.");
      if (controller.signal.aborted) return;
      setKind(next.kind); setSourceReportId(next.kind === "report_appeal" ? next.sourceReportId : "");
      setReason(""); setSubjectChange(null); setWriteError(""); setMessage("");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setSubjectError(communityError(cause));
        if ([401, 403].includes(communityRequestStatus(cause) ?? 0)) setRevision(value => value + 1);
      }
    } finally { if (!controller.signal.aborted) setSwitching(false); }
  }
  function requestSubject(next: CaseSubject) {
    if (busyRef.current || switching || (next.kind === kind && next.sourceReportId === sourceReportId)) return;
    setSubjectError("");
    if (reason || sourceReportId) setSubjectChange(next);
    else void selectSubject(next);
  }
  async function selectTarget(next: string) {
    if (busyRef.current || switching) return;
    if (next === community) { setPage(1); return; }
    const controller = new AbortController(); targetRequest.current?.abort(); targetRequest.current = controller;
    setSwitching(true); setSwitchError("");
    try {
      if (next) {
        const candidate = await communityFetch<OwnPlatformCases>(`${api}?${new URLSearchParams({ page: "1", community: next })}`, undefined, controller.signal);
        if (!candidate.context || candidate.context.slug !== next) throw new Error("Topluluk doğrulanamadı. Mevcut hedef ve açıklaman korundu.");
      }
      if (controller.signal.aborted) return;
      setCommunity(next); setDraftCommunity(next); setPage(1); setKind("community"); setSourceReportId(""); setReason(""); setTargetChange(null); setWriteError(""); setMessage("");
    } catch (cause) {
      if (!controller.signal.aborted) {
        setSwitchError(communityError(cause));
        if ([401, 403].includes(communityRequestStatus(cause) ?? 0)) setRevision(value => value + 1);
      }
    } finally { if (!controller.signal.aborted) setSwitching(false); }
  }
  async function save(body: Record<string, unknown>, done: () => void) {
    if (busyRef.current || switching) return;
    const requestTarget = readUrl;
    busyRef.current = true; setBusy(true); setWriteError(""); setMessage("");
    try {
      const result = await communityFetch<{ duplicate?: boolean }>(api, body, undefined, staff ? "PATCH" : "POST");
      if (activeTarget.current !== requestTarget) return;
      if (!result.duplicate) done(); setPage(1); setRevision(value => value + 1); setMessage(result.duplicate ? "Bu konuda daha önce açtığın başvuru zaten listende; yeni kayıt oluşturulmadı ve açıklama değiştirilmedi." : staff ? "Platform kararı kaydedildi." : "Başvurun platform ekibine gönderildi.");
    } catch (error) { if (activeTarget.current === requestTarget) { setWriteError(communityError(error)); if ([401, 403].includes(communityRequestStatus(error) ?? 0)) setRevision(value => value + 1); } }
    finally { busyRef.current = false; setBusy(false); }
  }
  const blocked = loading || busy || switching;
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title={staff ? "Platform topluluk başvuruları" : "Platform başvurularım"} subtitle="Topluluk yönetiminden ayrı, özel inceleme kanalı." icon={<ShieldAlert size={22} />} backHref={staff ? "/admin" : "/communities"} />
    <ConfirmDialog open={targetChange !== null} title="Başvuru hedefini değiştir?" body={`Doğrulanan yeni hedefe geçersen gönderilmemiş açıklama ve itiraz seçimin temizlenecek. Geçmiş başvuruların silinmez.${switchError ? ` ${switchError}` : ""}`} confirmLabel="Yeni hedefe geç" busy={switching} onCancel={() => { setTargetChange(null); setDraftCommunity(community); setSwitchError(""); }} onConfirm={() => targetChange !== null && void selectTarget(targetChange)} />
    <ConfirmDialog open={subjectChange !== null} title="Başvuru konusunu değiştir?" body={`Türü veya itiraz edilen şikâyeti değiştirirsen mevcut açıklaman temizlenecek. Yeni seçim doğrulanamazsa eski seçimin ve metnin korunur. Geçmiş başvuruların değişmez.${subjectError ? ` ${subjectError}` : ""}`} confirmLabel="Konuyu değiştir" busy={switching} onCancel={() => { setSubjectChange(null); setSubjectError(""); }} onConfirm={() => subjectChange && void selectSubject(subjectChange)} />
    {subjectError && subjectChange === null && <p role="alert" className="community-error">{subjectError}</p>}
    {switchError && targetChange === null && <p role="alert" className="community-error">{switchError}</p>}
    <div className="community-intro"><p>Başvuru ve yanıtı yalnız başvuran ile yetkili platform ekibi görür. Kaynak topluluk yöneticilerine gönderilmez. Bu bir acil yardım kanalı değildir; inceleme veya yanıt süresi garantisi yoktur.</p>
      {staff && <p>Bu ekran yalnız inceleme ve gerekçeli yanıt kaydeder. Sonuçlandırmak banı kaldırmaz, içerik geri getirmez veya ceza uygulamaz. Hesaba bağlı yöneticinin kendi başvurusu ve yönettiği topluluğun başvuruları kuyruktan çıkarılır.</p>}
    </div>
    <div className="community-columns"><section className="community-stack" aria-label="Başvuru listesi">
      <Button type="button" disabled={blocked} onClick={() => changeQueue(() => setRevision(value => value + 1))}>Başvuruları yenile</Button>
      {staff ? <SelectField label="Başvuru durumu" value={status} disabled={busy} onChange={event => { const next = event.target.value; if (next !== status) changeQueue(() => { setStatus(next); setPage(1); }); }}><option value="pending">İnceleme bekliyor</option><option value="resolved">Sonuçlandırıldı</option><option value="dismissed">İşleme alınmadı</option><option value="all">Tümü</option></SelectField> : <form className="ui-panel community-stack" onSubmit={event => { event.preventDefault(); const next = draftCommunity.trim(); if (next !== community && (reason || sourceReportId || kind !== "community")) setTargetChange(next); else void selectTarget(next); }}><TextField label="Topluluk kullanıcı adı" value={draftCommunity} onChange={event => setDraftCommunity(event.target.value)} maxLength={100} disabled={busy || switching} hint="Topluluk bağlantısında /communities/ sonrasındaki ad. Boş bırakırsan bütün başvuruların listelenir." /><Button type="submit" disabled={busy || switching}>Topluluğu seç / listele</Button></form>}
      <CommunityReadFeedback loading={loading} error={error} status={readStatus} loadingLabel="Başvurular yükleniyor…" errorTitle="Başvurular yüklenemedi" loginHref={accountLoginPath(staff ? "/admin/community-cases" : `/community-cases?${new URLSearchParams({ community })}`)} onRetry={() => setRevision(value => value + 1)} />
      {writeError && <p role="alert" className="community-error">{writeError}</p>}{message && <p role="status">{message}</p>}
      {data && <><p>{data.total} başvuru · Sayfa {data.page}</p>{!data.cases.length && <ContentState kind="empty" title="Bu görünümde başvuru yok"><p>Mevcut filtrede görüntülenebilir başvuru bulunmuyor.</p></ContentState>}
        {data.cases.map(item => <article key={item.id} className="ui-card community-stack"><h2 className="ui-section-title">{PLATFORM_CASE_KINDS[item.kind as keyof typeof PLATFORM_CASE_KINDS]}</h2><Link href={`/communities/${item.community.slug}`}>{item.community.name}</Link><p>{when(item.createdAt)} · {PLATFORM_CASE_STATUSES[item.status as keyof typeof PLATFORM_CASE_STATUSES]}</p><p>Başvuru: {item.id}</p><p className="community-body">{item.reason}</p>
          {item.response && <><h3>Platform yanıtı</h3><p className="community-body">{item.response}</p>{item.reviewedAt && <p>{when(item.reviewedAt)}</p>}</>}
          {staff && item.status === "pending" && <CaseResponse item={item} disabled={blocked} save={save} />}
        </article>)}
        <div className="community-actions"><Button type="button" disabled={blocked || page === 1} onClick={() => changeQueue(() => setPage(value => value - 1))}>Önceki başvurular</Button><Button type="button" disabled={blocked || !data.hasMore || page >= 100} onClick={() => changeQueue(() => setPage(value => value + 1))}>Sonraki başvurular</Button></div>
      </>}
    </section><aside className="community-stack">{!staff && data?.context ? <form className="ui-panel community-stack" aria-label="Platforma başvuru" onSubmit={event => { event.preventDefault(); void save({ communitySlug: community, kind, sourceReportId: kind === "report_appeal" ? sourceReportId : "", reason }, () => { setReason(""); setSourceReportId(""); setKind("community"); }); }}>
      <h2 className="ui-section-title">{data.context.name} için başvur</h2>
      <SelectField label="Başvuru türü" value={kind} disabled={blocked} onChange={event => requestSubject({ kind: event.target.value, sourceReportId: "" })}><option value="community">{PLATFORM_CASE_KINDS.community}</option>{data.context.reports.length > 0 && <option value="report_appeal">{PLATFORM_CASE_KINDS.report_appeal}</option>}{data.context.canAppealBan && <option value="ban_appeal">{PLATFORM_CASE_KINDS.ban_appeal}</option>}</SelectField>
      {kind === "report_appeal" && <SelectField label="İtiraz edeceğin incelenmiş şikâyet" value={sourceReportId} disabled={blocked} onChange={event => requestSubject({ kind, sourceReportId: event.target.value })} required><option value="">Şikâyet seç</option>{data.context.reports.map(report => <option key={report.id} value={report.id}>{report.targetType} · {report.id}</option>)}</SelectField>}
      <TextAreaField label="Başvuru açıklaması" value={reason} onChange={event => setReason(event.target.value)} minLength={10} maxLength={1500} rows={6} required disabled={blocked} hint="Ne olduğunu ve itirazını açıkla. Parola, ev adresi veya hassas kişisel bilgi paylaşma. Metin topluluk yönetimine açılmaz." />
      <Button type="submit" variant="primary" loading={busy} disabled={blocked}>Platforma gönder</Button><p>Aynı açık konu tekrar kayıt oluşturmaz. İncelenen şikâyete ve aynı uzaklaştırma kararına tek itiraz kaydı tutulur. Durumu buradan yenileyerek takip edebilirsin.</p>
    </form> : <section className="ui-panel community-stack"><h2>{staff ? "İnceleme sınırları" : "Yeni başvuru"}</h2><p>{staff ? "Yalnız platform kurucu oturumu veya aktif global admin hesabı erişir. Global moderatör veya topluluk yönetimi yetkisi yeterli değildir. Eski başvuruyu yeniden açma bu pakette yoktur." : "Topluluk kullanıcı adını seçerek başvuru açabilirsin. Uzaklaştırılmış olman veya topluluğun arşivlenmesi başvuruya engel değildir."}</p></section>}</aside></div>
  </section></main>;
}
