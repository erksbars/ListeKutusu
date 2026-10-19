# Masaüstü pilot ön kontrolü

Bu komut yayın yapmaz ve yayın onayı vermez. Yerel doğrulamayı, operatörün
ayrıca kanıtlaması gereken koşullardan ayırır. Mobil/açık tema ve bağımsız
forum kapsamı açılmaz. Node 24 ile doğrulanmıştır.

## Komutlar

Repo kökünde, mevcut `.env` ile:

```powershell
npm run pilot:check
npm run pilot:check -- --json
npm run pilot:check -- --production --json
```

Son komut yalnız yapılandırmayı üretim kurallarıyla değerlendirir;
NODE_ENV değiştirmez, sunucuyu üretim moduna geçirmez ve sır döndürmez.
Yerel HTTP adresleriyle üretim kontrolünün hata vermesi beklenir. Bunu
gidermek için geliştirme `.env` dosyasını uydurma bir HTTPS adresine çevirme.
Gerçek hedefin yapılandırması ayrı, onaylı ortamda hazırlanmalıdır.

Makine tarafından yalnız JSON tüketilecekse npm başlığını atlamak için:

```powershell
node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --env-file=.env --experimental-strip-types scripts/check-pilot.mjs --json
```

Çıkış kodları otomatik kontroller içindir:

- `0`: otomatik kontroller geçti. **Yayın onayı değildir.**
- `1`: başarısız/okunamayan kontrol; bilinmeyen sonuç da başarısızdır.
- `2`: otomatik kontrollerde uyarı var; örneğin üretimde SQLite operasyon gereği.

`releaseApproved` daima `false`; manuel kapılar daima `unverified` kalır.
Komut yerel test veya operatör beyanını otomatik yayın iznine dönüştürmez.

## Neyi kontrol eder?

- Ortam: sırların uzunluk/örnek/basit tekrar kontrolü, ayrı yönetici/oturum
  sırları, Spotify yapılandırması, güvenli URL biçimi ve production origin
  eşleşmesi, yerel/özel adres denetimleri, SQLite adresi, limit/bakım aralığı,
  açık katalog için iletişim alanı. Bu sır entropisi ölçümü, DNS çözümlemesi,
  sertifika veya sağlayıcı hesabının çalıştığına dair test değildir.
- Veritabanı: SQLite **readOnly** bağlantı, `quick_check`, FK kontrolü;
  `_prisma_migrations` ile dosyaların ad/checksum/tamamlanma karşılaştırması.
  Eksik/fazla/değişmiş/yarım/yinelenen migration başarısızdır. Eksik DB
  yaratılmaz. Checksum farkında dosya veya migration kaydını otomatik düzeltme;
  satır sonu değişikliği dahil farkı incele. Bu tam fiziksel Prisma schema-diff
  yerine geçmez; onaylı staging'de ayrıca şema uyumu doğrulanmalıdır.
- Topluluk: mevcut 12 salt okunur sahiplik/rol/etkinlik/RSVP/rapor/kuyruk
  kontrolü aynı read snapshot üzerinde kullanılır. Kimseye rol verilmez.
- İşçi: kuyruk sayıları/yaşı ve mevcut yerel heartbeat/ilerleme denetimi.
  Boş kuyruk tek başına sağlıklı sayılmaz. Container/başka host işçisinin
  sağlığını bu makinedeki dosya kanıtlayamaz; her instance ayrıca izlenir.

Veritabanı veya migration okunamazsa bağımlı kontroller `null`/kontrol
edilemedi olur; sıfır hata gibi sunulmaz. Rapor sır, e-posta, DB/URL değeri,
kullanıcı/etkinlik kimliği, SQL veya ham exception içermez. Özel operatör
raporudur; herkese açık health endpoint'ine eklenmez.

Komut dış sağlayıcı isteği, migration, snapshot/yedek budama, restore,
bildirim replay, veri temizliği, OS servisi veya süreç başlatma/durdurma yapmaz.

## Manuel kapılar ve beklenen kanıt

Şifreli yedek, sentetik gerçek HTTP kurtarma, izole production derlemesi,
runtime alarm adaptörü ve kurulmamış süreç örnekleri hazırdır:
[Teknik kapanış kılavuzu](TEKNIK_KAPANIS_VE_YAYIN.md). Bu yerel kanıtlar
aşağıdaki gerçek hedef/operatör onaylarının yerine geçmez.

| Rapor kapısı | Ayrı doğrulanması gereken kanıt |
| --- | --- |
| `PRODUCTION_PROCESS_AND_EXTERNAL_ALERTS` | Onaylı hedefte uygulama ve ayrı event worker süreç yönetimi, restart/stop provası, iş yaşı/failed/canlılık için uygulama dışı alarm; oyun bakım sürecinin sorumlusu. |
| `OFF_HOST_ENCRYPTED_BACKUP_AND_RETENTION` | Sunucu dışı şifreli yedek, erişim yetkileri, saklama süresi ve son bağımsız geri dönüş kanıtı. |
| `STAGING_HTTP_WORKER_LOAD` | İzole staging'de gerçek HTTP+worker akışları, beklenen hacim, süre, kapasite tutarlılığı ve gecikme ölçümleri. |
| `STAGING_RESTORE_AND_RPO_RTO` | Gerçek uygulama akışlarıyla staging kurtarma; veri kaybı ve dönüş süresi hedefleri, şema uyumu ve geri dönüş planı. |
| `PROVIDER_COMMERCIAL_LICENSE_REVIEW` | Ürünün ticari kullanım modeliyle sağlayıcı koşulları, atıf ve lisans gerekliliklerinin yetkili incelemesi. |
| `PRIVACY_RETENTION_AND_MODERATION_RESPONSIBILITY` | Saklama/silme politikası, başvuru inceleme sorumlusu, itiraz/yaptırım ve operasyon süreci. |
| `PRODUCTION_TLS_SECRETS_AND_RELEASE_APPROVAL` | Gerçek alan adı/HTTPS/callback, onaylı sır yönetimi ve uygun oturum ayarları, yetkili yayın kararı. |

Kanıtlara sır veya kişisel veri koyma. Kapıları bu komutta otomatik geçiren
bir `--approve` ya da config bayrağı yoktur. Uygun kanıt ayrı operatör/yayın
kaydında tutulmalı; bu belge tamamlanmış onay kaydı değildir.

## Güvenli ilerleme sırası

Yerel ilk HTTP kanıtı için `npm run pilot:rehearse-http` ayrı sentetik
Next+worker ortamını çalıştırır; [.env/DB izolasyonu ve kapsamı](HTTP_ISCI_PROVASI.md).
Bu development ölçümü yukarıdaki staging/üretim kapılarını onaylamaz.

1. Hedef sunucu/alan adı ve operasyon sorumlusu kullanıcıyla netleştirilir;
   kullanıcı adına ücretli servis açılmaz veya gerçek yayın yapılmaz.
2. Canlı geliştirme DB'sini değiştirmeden izole staging hazırlanır. Gerçek
   veriyi başka hosta kopyalamak ayrıca yetki ve gizlilik değerlendirmesi ister.
3. Gerçek hedefin sırları ve HTTPS/callback'i ayrı ortamda hazırlanır.
   `.env.example` örnektir; sır veya gerçek iletişim bilgisi commit edilmez.
4. Hedefte mevcut yedek/rollback doğrulanmadan migration uygulanmaz. Ön
   kontrol migration çalıştırmaz; dağıtım migration adımı ayrı yetkili işlemdir.
5. Uygulama ve worker süreçleri hedef OS/host tasarımına göre yönetilir;
   yerel gözetmen tek başına kalıcı servis veya dış alarm değildir.
6. İzole hedefte odaklı masaüstü akışları, yük ve kurtarma provası yapılır.
   Yerel HTTP'de testi geçirmek için production Secure çerezi zayıflatılmaz.
7. Manuel kapıların kanıtları ve kalan riskler incelenir; ancak sonra gerçek
   pilot için ayrı yayın kararı verilir. Mobil/açık tema kendiliğinden açılmaz.

İlgili belgeler: [Pilot eksikleri](PILOT_EKSIKLERI.md),
[İşçi operasyonu](ETKINLIK_BILDIRIM_ISCISI.md),
[SQLite kurtarma/yük provası](SQLITE_KURTARMA_VE_YUK_PROVASI.md).
