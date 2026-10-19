import { COMMUNITY_INTERESTS, type CommunityDiscoveryLabels } from "@/lib/communityDiscoveryTypes";
import { SelectField, TextField } from "@/app/components/ui/Field";

export function CommunityDiscoveryFields({ values = {} }: { values?: CommunityDiscoveryLabels }) {
  return <>
    <TextField label="Topluluk üniversitesi (isteğe bağlı)" name="universityName" defaultValue={values.universityName ?? ""} minLength={2} maxLength={120} />
    <TextField label="Topluluk şehri (isteğe bağlı)" name="city" defaultValue={values.city ?? ""} minLength={2} maxLength={80} />
    <SelectField label="Topluluğun ilgi alanı" name="interest" defaultValue={values.interest ?? ""}><option value="">Belirtilmedi</option>{Object.entries(COMMUNITY_INTERESTS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>
    <p>Bu etiketler herkese açık keşifte görünür. Resmî kurum bağlantısı veya öğrencilik doğrulaması değildir; üyelerin özel profil bilgilerinden alınmaz.</p>
  </>;
}
export function CommunityDiscoveryLabelsView({ values }: { values: CommunityDiscoveryLabels }) {
  return <div className="community-stack">{values.universityName && <p>Üniversite: {values.universityName} · Topluluk beyanı</p>}{values.city && <p>Şehir: {values.city}</p>}{values.interest && <p>İlgi alanı: {COMMUNITY_INTERESTS[values.interest as keyof typeof COMMUNITY_INTERESTS] ?? values.interest}</p>}</div>;
}
