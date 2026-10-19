import Link from "next/link";
import { Button, buttonClassName } from "./ui/Button";
import { ContentState } from "./ui/ContentState";

export function CommunityReadFeedback({ loading, error, status, loadingLabel, errorTitle, loginHref, onRetry }: {
  loading: boolean; error: string; status: number | null; loadingLabel: string; errorTitle: string; loginHref: string; onRetry: () => void;
}) {
  if (loading) return <ContentState kind="loading" title={loadingLabel} />;
  if (!error) return null;
  const login = status === 401, restricted = status === 403, missing = status === 404;
  const title = login ? "Giriş yaparak devam et" : restricted ? "Bu alana erişimin yok" : missing ? "İçerik görüntülenemiyor" : status === 503 ? "Bu alan şu anda kullanılamıyor" : errorTitle;
  return <ContentState kind={login ? "login" : restricted || missing || status === 503 ? "unavailable" : "error"} title={title} actions={login ? <Link className={buttonClassName({ variant: "primary" })} href={loginHref}>Giriş yap</Link> : !restricted && !missing ? <Button type="button" onClick={onRetry}>Yeniden dene</Button> : undefined}><p>{error}</p></ContentState>;
}
