# Tasarım sürüm yedekleri — 23 Ekim 2026

Kullanıcı tercihi: yeni düzen korunacak; önceki tasarımın cyan/yeşil kimliği
geri getirilecek. Önceki kaynak sürümleri değişimden önce korundu.

| Sürüm | Commit | Git etiketi |
| --- | --- | --- |
| Taste öncesi renkli tasarım | acbfb53 | design/colorful-before-taste-2026-10-23 |
| Renkler geri gelmeden önceki nötr tasarım | e8ca339 | design/neutral-before-color-restore-2026-10-23 |

Etiketler mevcut dosyaları değiştirmez; reset/stash/checkout yapılmadı.
Commit dışındaki 11 baseline PNG dosyası yerinde korunur ve Git'e eklenmez.

## Bağımsız yerel yedek

Dizin: `C:/Users/barto/Documents/Codex/2026-07-02/bu/work/design-backups/2026-10-23-before-color-restore/`.

- `ListeKutusu-design-history.bundle`: iki etiketi ve mevcut commit geçmişini
  içeren Git yedeği. `git bundle verify` tam geçmişi doğruladı.
- SHA256: `3E6E37A2C205A08931109C0909B76E6F292A29FE2297BB6684344AFB52F64B6B`.
- `uncommitted-screenshots/tests/browser/__screenshots__/quality.spec.ts/wide/`:
  mevcut 11 değiştirilmiş PNG, her kopyanın SHA256 değeri kaynakla karşılaştırıldı.
- `before-home`, `before-library`: ilk tasarım öncesi görsel kayıtlar.
- `final-home-1440`, `final-library-1440`: nötr sürümün mevcut görsel kayıtları.

Bu bir **kaynak ve tasarım görseli yedeğidir**. SQLite/veritabanı, `.env`,
anahtarlar, oturumlar, node_modules ve çalışma zamanı cache'leri kapsanmaz.
Git geçmişinde zaten izlenen dosyalar bundle'a dahildir; bu bir kaynak
temizleme veya yeni kapsamlı sır taraması değildir. Yedek klasörü depoya
eklenmez ve GitHub'a gönderilmez.

Kaynak kurtarma, bundle'dan **yeni boş bir dizine** clone edilerek veya
mevcut depodaki etiketlerden ayrı checkout oluşturularak yapılmalıdır.
Kirli mevcut çalışma alanına reset/checkout ile doğrudan geri dönüş yapılmaz.
Görsel kopyalar ancak hedef ve mevcut dosyalar incelendikten sonra geri konur.

## Kontrollü renk düzeltmesi

`tokens.css`: düz, hafif mavi koyu yüzeyler ve cyan işlem tokenları.
`primitives.css`: aktif sol menü/sekme, avatar ve eser satırında sınırlı cyan;
keşif/konuda yeşil. Yeni akış yerleşimi, sağ keşif alanı, yazı ölçeği ve
kitaplık davranışı değişmedi. Yoğun gradient/parlama geri getirilmedi.

Taste'in nötr zemin/renksiz navigasyon önerisi kullanıcı talebiyle bilinçli
olarak uygulanmaz. Aynı direction tekrar çekilmedi; mevcut ürünün rengi
düzeltildi. Görsel inceleme yalnız koyu masaüstü kapsamındadır.

## Doğrulama ve son görsel değerlendirme

1440 px ana akışta 0 FAIL / 2 WARN, kitaplıkta 0 FAIL / 0 WARN. Akıştaki
icon-chips uyarısı renkli kimlik/etkileşim yüzeylerini de sayar; kullanıcının
açık marka tercihi nedeniyle avatar ve aktif seçim tint'leri korunur. Bunlar
dekoratif KPI ikonları değildir. Below-fold uyarısı uzun sosyal akışın tüm
kartlarının ilk ekrana sığmamasıdır; kayıtlar sıkıştırılmadı. --allow ile
denetim kapatılmadı. Beklenmedik mevcut pulse gradient'i düz yüzeye çevrildi.

Son fold ve sayfa görselleri açıldı: ana soru ve kayıtlar önde kalıyor,
yerleşim kenarları aynı, cyan seçimler tekrar kolayca seçiliyor; yeşil
keşif vurgusu korunuyor. Yeni sayı/örnek veri/legend yok; bilinmeyen/boş
durum mantığı değişmedi. Uzun başlıklar ve gerçek oturumlu durumlar önceki
geniş kabul listesinin parçası olmaya devam eder.

Kontrast, UI/a11y statik ve git diff kontrolü geçti. CSS-only paket olduğu
için production build ve geniş regresyon çalıştırılmadı. Mobil/açık tema
ekran matrisi yok; genel koyu tokenları bu temanın ortak tüketicilerine yansır.
Görseller `.taste-skill/color-restored-home` ve `color-restored-library`
altındadır, Git dışında tutulur.
