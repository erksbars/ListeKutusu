# Tasarım öncesi teknik kapanış ve yayın devri

17 Ekim 2026. Bu paket arayüzü değiştirmez; mobil/açık tema/forum askısı
korunur. Yerel doğrulama, gerçek hosta yayın izni değildir.

## Hazır olan araçlar

| Araç | Kanıtladığı sınır |
| --- | --- |
| `pilot:check` | Salt okunur ortam/migration/bütünlük/topluluk/worker raporu; manuel kapılar açık. |
| `pilot:rehearse-http` | Yeni sentetik DB ve ayrı Next portunda gerçek HTTP + çalışan bildirim işçisi; 1/4/8 görev. |
| `pilot:rehearse-recovery` | Sentetik veriden şifreli yedek, tamamen yeni DB/uygulama ve bekleyen işin gerçek worker ile teslimi. |
| `pilot:build-isolated` | Ayrı kaynak kopyasında production derlemesi; mevcut .next ve sunucu korunur. |
| `db:backup-encrypted` | Mevcut DB'den read-only tutarlı snapshot; şifreleme + yeniden açıp tam içerik kontrolü; eski yedekleri budamaz. |
| `db:verify-encrypted -- --backup <dosya>` | Açıkça seçilen şifreli yedeğin doğrulanması; yalnız geçici dosyada SQLite/FK ve mevcut Prisma şemasına uyum. |
| `runtime:check` | Production ortamı + DB/topluluk/worker ve gerçek `/api/health`; salt okunur, dış alarm yok. |
| `runtime:check -- --development` | Yerel geliştirme ortamında aynı sağlık kontrolü; alarm gönderilemez. |
| `runtime:check -- --notify` | Operatörün yapılandırdığı HTTPS hedefine sabit alanlı JSON alarmı; açık tercihli ağ yazması. |

## 1. Şifreli yedekleme

`BACKUP_PASSPHRASE` ayrı, rastgele, en az 24 karakterli bir sırdır. Örnek,
tek karakter tekrarları ve boş değer reddedilir; parola eksikse DB okunmadan
işlem durur. Parolayı sohbet, komut satırı argümanı, log veya repoya koyma.
Üretimde uygulama sırlarından ayrı korunan secret/env dosyasında tutulur.

```powershell
npm run db:backup-encrypted
npm run db:verify-encrypted -- --backup <açıkça-seçilen.lkbackup>
```

- Kaynak DB native readOnly bağlantıyla `VACUUM INTO` snapshot'ı alınır;
  mevcut DB dosyası taşınmaz, ezilmez veya migrate edilmez.
- Format `LKBACK01`: 8 bayt sürüm, 16 bayt salt, 12 bayt IV, ciphertext ve
  16 bayt GCM tag. AES-256-GCM, scrypt N=32768/r=8/p=1; her dosyada yeni
  salt/IV. Başlık AAD olarak doğrulanır. Hedef yalnız işlem tam bitince
  exclusive hard-link ile yayımlanır; var olan dosya asla ezilmez.
- Yanlış parola, başlık/veri/tag değişikliği veya kesik dosya plaintext
  hedef yayımlamaz. Yalnız bu çağrının `.partial` dosyası temizlenir.
- Doğrulama sonrasında bile mevcut şemaya uymayan eski yedek kod 1 verir;
  kendiliğinden migrate edilmez. Otomatik en yeni dosya seçimi yoktur.
- Başarı raporu dosya adı ve sabit sayısal/boolean durumları verir; anahtar,
  kayıt, SQL veya hash yazdırmaz. Yerel başarılı yedek `offHost:false` kalır.
- Geçici snapshot/decrypt dosyaları plaintext'tir. Sahipli 0700 dizin ve
  0600 dosya izinleri kullanılır; Windows'ta ayrıca ACL incelenmelidir.
  Normal kapanışta silinir; crash/artık dosya ve disk şifrelemesi operatörün
  sorumluluğudur. Bu güvenli disk silme veya HSM entegrasyonu değildir.
- Yeni komut eski yedekleri silmez. Eski `db:backup` düz SQLite ve son 20
  dosyayı tutan eski davranışını korur; şifreli komut onu çağırmaz.

Off-host adımı ayrıca gerekir: operatör yalnız `.lkbackup` dosyasını onaylı,
erişim kontrollü sunucu dışı depoya aktarır; anahtarı aynı yere koymaz.
Geri alınmış bağımsız dosya `db:verify-encrypted` ile sınanır. Aktarım hedefi,
erişim, saklama ve budama süresi seçilmedi; aktarım/budama yapılmadı.

## 2. Uygulamayla kurtarma provası

`pilot:rehearse-recovery` hiçbir .env, URL veya DB parametresi almaz.
Yeni sentetik kaynakta üç hesap, HTTP giriş/üyelik, kitap incelemesi, etkinlik
ve katılım yaratır. Etkinlik düzenlenir fakat işçi henüz başlatılmaz; bekleyen
outbox işiyle snapshot alınır. Yalnız kendi sunucusu kapatılır.

Şifreli yedek ayrı bir dizine açılır; tam satır/şema fingerprint'i ve yazma
rollback kontrolünden sonra yeni Next/Prisma bağlantılarıyla çalıştırılır:

- Yedekteki eski oturum ve yeni parolalı giriş çalışır; inceleme, mekân ve
  katılım korunur. Anonim ve üye olmayan hesap için yetki sınırları korunur.
- Bekleyen iş yeni gerçek worker ile tam bir bildirim teslim eder.
- Bildirim okundu yapılır; worker yeniden başlatıldığında çoğalmaz ve
  readAt sıfırlanmaz. Katılımı geri çekme gibi yeni yazma da çalışır.
- Topluluk bütünlüğü/kuyruk kontrol edilir; kaynak snapshot baytları ve
  kaynak DB tam içerik fingerprint'i değişmemiş olmalıdır.

Yerel sentetik akış geçti. Son provada yaklaşık 9,5 saniyelik gözlem, yedeğin açılması,
yeni kaynak/uygulamanın başlaması ve HTTP akışlarını birlikte kapsar; RTO
taahhüdü değildir. Gerçek host, hacim, disk, proxy/TLS ve off-host gecikmesi
ölçülmedi. RPO/RTO sayısı kullanıcı adına seçilmedi.

Üretimde yedekten dönüş, yedekten sonra silinen hesapları veya iptal edilen
oturumları yeniden getirebilir. Bu test snapshot sadakatini doğrular; tüm
eski oturumların üretimde açık tutulmasını önermez. Gerçek kurtarma ağdan
izole yapılmalı; sonradan gelen silme/iptaller, opaque AccountSession
kayıtlarının iptali ve sağlayıcı token'ları ayrıca ele alınmalıdır.
SESSION_SECRET rotasyonu tek başına DB'deki hesap oturumlarını iptal etmez.
Canlı DB değiştirme/oturum iptal etme işlemi bu araçlarda otomatik değildir.

## 3. Sağlık ve operatör alarmı

`runtime:check` beş saniyelik sınırlı HTTP health isteğini, özel DB/worker
kontrolüyle birleştirir. Yalnız HTTP 200 yeterli değildir; body'de status=ok
ve database=available gerekir. Başarısız DB, tutarsız topluluk veya durmuş
bildirim işçisi kod 1 verir. Production yerel HTTP adresi kabul etmez;
NODE_ENV açıkça development ise production kontrolü de hata verir.

Alarm için operatör `OPERATIONS_ALERT_WEBHOOK` HTTPS adresini, gerekiyorsa
`OPERATIONS_ALERT_TOKEN` Bearer sırrını ayarlar. Redirect izlenmez; payload
yalnız service/state/sabit issue kodlarıdır. Kişi, DB/URL, ortam, başlık,
ham exception veya health response gövdesi karşı tarafa gönderilmez.

İlk arızada, düzelmede ve devam eden arızada 30 dakika sonra mesaj gönderilir.
Gönderim başarısızsa state ilerlemez; sonraki çalıştırma yeniden deneyebilir.
Bozuk veya gelecek zamanlı state fail-closed'dur; kendiliğinden silinmez.
Hedef değişince hash'li state alanı ayrıdır. State kaybı/başarılı HTTP'den
hemen sonraki crash mesaj tekrarına neden olabilir; exactly-once garantisi yoktur.
Birden çok eşzamanlı notifier başlatılmamalıdır; timer tek oneshot'ı tetikler.

Gerçek webhook hedefi oluşturulmadı veya aranmadı. Generic JSON alabilen
operatör endpoint'i gerekir; bu Slack/Discord özel payload adaptörü değildir.
Host tamamen kapalıyken host içindeki checker alarm gönderemez. Bağımsız
uptime/dead-man kontrolü, oyun bakım sürecinin OS durumu, yedek yaşı/disk ve
off-host aktarım hatası ayrıca izlenmelidir. Bu kontroller kurulmuş sayılmaz.

## 4. İsteğe bağlı Linux/systemd örnekleri

`deploy/systemd/*.example` yedi kaynak şablonudur; kurulmadı/enable edilmedi.
Linux seçimi yapılmış değildir. Mevcut Windows geliştirme süreci değişmedi.
Web, event worker ve oyun bakımı ayrı kullanıcı süreçleridir; runtime
kontrolü ile şifreli yedek ayrı oneshot/timer'lardır. Sürekli servislerde
sınırlı restart ve SIGTERM/stop timeout tanımlanır; mevcut yerel supervisor
ile aynı işi ikinci kez yönetme.
[systemd service kaynağı](https://github.com/systemd/systemd/blob/main/man/systemd.service.xml),
[timer kaynağı](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml).

Hedefte uyarlama ve kabul koşulları:

1. Node 24 yolu, ayrı `listekutusu` hesabı ve gerçek checkout/data yollarını
   doğrula. Şablon yolları `/srv/listekutusu/app` ve `/srv/listekutusu/data`dır;
   canlı veri kod ağacının dışında olmalıdır. Host kullanıcı adına yaratılmadı.
2. app.env içindeki NODE_ENV production, DATABASE_URL mutlak yerel dosya,
   gerçek HTTPS origin/callback ve rastgele sırlar olmalıdır. backup.env
   yalnız yedek sürecine anahtar verir. ACL/okuma yetkilerini incele.
3. Sahipli tmp/backups/.next/cache/data alanlarını hazırlayıp sistemd'nin
   ReadWritePaths kısıtlarını hedefte doğrula. Şablonlar otomatik mkdir yapmaz.
4. Yedeği doğrula; staging migration/build ve rollback kanıtını al.
   Servis başlangıcı otomatik migration/restore/temizlik yapmaz.
5. Kopyalanmış, `.example` eki çıkarılmış unit'leri hedefin
   `systemd-analyze verify` aracıyla doğrula. Bu Windows oturumunda gerçek
   systemd parser'ı veya hedef kernel/filesystem üzerinde doğrulanmadı.
6. Yetkili operatör kurduktan sonra stop/restart/devre kesicisi, gerçek
   reverse proxy TLS, worker backlog ve alarm alımı kontrollü olarak sınanır.
   Yalnız `systemctl active` uygulamanın hazır olduğunu kanıtlamaz.
7. Off-host kopyalama ve hata/yaş alarmı ayrıca bağlanır. Yedek timer'ı yalnız
   yerel dosya üretir; saklama politikası veya dış depolama değildir.

## 5. Saklama ve sorumluluk — mevcut teknik davranış

Bu tablo hukuki politika veya yeni silme talimatı değildir; mevcut kodun
envanteridir. Yeni süre belirlenmedi ve gerçek veriye bakım çalıştırılmadı.

| Kayıt | Mevcut davranış | Açık karar |
| --- | --- | --- |
| AccountSession | Süresi dolan/iptal edilenler maintenance:cleanup ile silinir. | Gerçek ortam zamanlaması ve kurtarma sonrası iptal prosedürü. |
| Okunmuş bildirim | Mevcut temizlikte 180 gün; okunmamışlar bu kurala dahil değil. | Onaylı saklama/erişim politikası. |
| Event outbox | Teslim edilen alıcı satırı anında; completed işler bakımda 30 gün sonra. Pending/failed otomatik budanmaz. | Failed inceleme sorumlusu ve alarm müdahalesi. |
| Sahiplik teklifi | Süresi dolan teklif bakımda silinir; kabul yetki kontrolüne tabidir. | İşletim zamanlaması. |
| Hesap/kişisel alanlar | Hesap kapatma, export ve aktif sahiplik için devir/açık arşiv tercihi hazır. | Topluluk içeriği/audit/raporların nihai saklama ve anonimleştirme politikası. |
| Yedek/log/alarm state | Şifreli komut otomatik budamaz; log erişimi OS düzeyinde sınırlandırılmalı. | Off-host saklama, erişim sorumlusu, anahtar kaybı/rotasyon ve silme taleplerinin yedeklere etkisi. |

## Kapanış sınırı

Yerel işlevsel paket, şifreli kurtarma ve izole production derlemesi hazırdır.
Tasarım/kozmetik çalışmaları bundan sonra ayrı paket olarak ele alınabilir.
Öneri sıralaması, kalıcı taslaklar, tam edit geçmişi, SSE/PostgreSQL veya
e-posta sağlayıcısı seçimi bu kapanışta sessizce yeni kapsama alınmadı.

Yayın için kullanıcı/operatör kararı gerekenler: hedef host+alan adı/TLS,
gerçek sırlar, webhook alıcısı+dış izleme, off-host depo+saklama, beklenen
yük+RPO/RTO, veri/moderasyon sorumluları ve ticari sağlayıcı incelemesi.
Yedi manuel kapı hâlâ unverified'dır. Bunlar yalnız kod yazarak bitmiş
sayılamaz; uygulama yayımlanmadı, harcama veya gerçek veri taşıma yapılmadı.
