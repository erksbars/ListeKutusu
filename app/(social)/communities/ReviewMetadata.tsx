import { REVIEW_KINDS, type CommunityPostAttributes } from "@/lib/communityTypes";
import { TVmazeAttribution } from "@/app/components/TVmazeAttribution";

export function ReviewMetadata({ post }: { post: CommunityPostAttributes }) {
  if (post.type !== "review") return null;
  return <div className="community-stack community-review-meta">
    <div className="community-actions"><span className="community-review-tag">{REVIEW_KINDS[post.reviewKind as keyof typeof REVIEW_KINDS]} incelemesi</span><strong aria-label={`Puan: ${post.rating}/10`}>{post.rating}/10</strong>{post.spoiler && <span>Spoiler içeriyor</span>}</div>
    <p><strong>{post.subjectTitle}</strong> · {post.referenceProvider ? `Kaynaklı eser seçimi · ${post.referenceProvider}` : "Kullanıcının eser seçimi"}</p>
    {post.editedAt && <p>Düzenlendi · <time dateTime={post.editedAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(post.editedAt))}</time></p>}
    {post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Eser bağlantısı ↗ · {new URL(post.sourceUrl).hostname}</a>}
    {post.referenceProvider === "tvmaze" && <p><TVmazeAttribution /></p>}
  </div>;
}
