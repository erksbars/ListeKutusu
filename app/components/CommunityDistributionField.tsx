import { SelectField } from "./ui/Field";

export function CommunityDistributionField({ value, defaultValue, onChange, disabled }: { value?: string; defaultValue?: string; onChange?: (value: string) => void; disabled?: boolean }) {
  return <SelectField label="Akışta gösterim" name="distribution" value={value} defaultValue={value === undefined ? defaultValue ?? "community" : undefined} onChange={onChange ? event => onChange(event.target.value) : undefined} disabled={disabled}
    hint="Bu bir gizlilik ayarı değildir; içerik bağlantıyla herkese açık okunur. Genel akış seçilirse ana sayfadaki Topluluklardan bölümünde de gösterilir.">
    <option value="community">Yalnız topluluk akışında</option><option value="general">Genel akışta da göster</option>
  </SelectField>;
}
