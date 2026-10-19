# Pilot öncesi kalanlar — 17 Ekim 2026

Bu liste yayın onayı veya uygulamanın tamamına verilmiş bir test sonucu
değildir. Mevcut yol haritası ve bu oturumda kontrol edilen sınırları açık
işlere dönüştürür. Masaüstü koyu tema aktiftir; mobil/açık tema ve bağımsız
forum geliştirmesi askıdadır.

## Son tamamlananlar

- Tasarım öncesi yerel teknik kapanış eklendi: şifreli yedek/doğrulama,
  gerçekten yeni uygulamada HTTP kurtarma ve pending iş teslimi, worker
  restart/readAt koruması, izole production build ve özel runtime alarm
  adaptörü. [Teknik kapanış ve onay bekleyen dış işler](TEKNIK_KAPANIS_VE_YAYIN.md).
  Servis örnekleri kurulmadı; gerçek host/uzun staging yük/off-host/TLS/
  saklama/moderasyon/lisans kapıları kullanıcı/operatör kanıtı bekler.

- Topluluk yönetimi ayrı yetkili endpoint, sayfalı şikâyet/üye/geçmiş,
  arama/durum/tür filtreleri; normal üyeye veya kamuya açılmaz.
- İnceleme aktörü ve tarihi; değişiklikle aynı transaction'da karar günlüğü.
  Eski kayıtlara hayalî karar tarihi/aktör backfill yapılmaz.
- Etkinlik outbox, yeniden başlama/tekrar/backoff, operatör durum ve kurtarma
  komutları. Süreç gözetimi ve gerçek kapasite testi henüz tamamlanmış sayılmaz.
- `npm run check:communities`: 12 salt okunur sahiplik/rol/RSVP/rapor/kuyruk
  kontrolü. Sorun varsa raporlar, hiçbir üyeyi kurucu yapmaz veya veri silmez.

## 1. Sahiplik ve hesap yaşam döngüsü — yerel çekirdek hazır

17 Ekim: yedi günlük sahiplik teklifi ve hedefin ayrı kabulü hazır. Kabulden
sonra eski sahip normal üye kalır. Arşiv içerikleri koruyan read-only durumdur;
yaklaşan etkinlikleri iptal eder, restore katılımları diriltmez. Hesap
silme owned aktif toplulukta devir veya ayrı açık arşiv bool'u gerektirir.
Tek üyeli topluluk da arşivlenebilir; süresiz silme engeli veya otomatik
sahip atama yoktur. Eski onaysız istemci 409 ile veriyi korur.

Silme/kabul/katılım ve arşiv/RSVP yarışları SQLite üzerinde dar test edildi.
Silinen sahipli arşiv yeniden açılmaz; aktif sahip yokken bunu sıradan üyeye
açan bir yetki eklenmedi. İleride platforma kurtarma/itiraz ve topluluk
kişisel veri saklama/anonimleştirme politikası ayrıca ele alınmalıdır.
Silinen aktör/düzenleyenden iptal bildirimi teslimi yoktur; kaynak gizlilik
filtresi kapanır. Sistem kaynaklı güvenli iptal bildirimi ayrı iyileştirmedir.

## 2. Platforma bildirim/itiraz — ilk paket hazır

Kaynak şikâyetler topluluk yönetimine gitmeye devam eder. Ayrı platform
kanalı genel başvuru, kendi incelenmiş şikâyetine ve güncel uzaklaştırmasına
itiraz alır. Başvuran ve uygun global admin/root dışında okunmaz; kaynak
topluluk yönetimine iletilmez. Arşiv ve uzaklaştırma başvuruyu engellemez.
Gerekçeli yanıt, durum takibi, sürümlü tek karar ve atomik audit hazırdır.

Bu paket yaptırım, ban kaldırma, içerik geri getirme, sahiplik kurtarma,
yeniden açma veya yanıt süresi garantisi vermez. Operasyonel inceleme
sorumlusu, hedef süre ve ileri yaptırım/itiraz politikası hâlâ açık iştir.
Hesaba bağlı admin için çıkar çatışması sunucuda süzülür; hesapsız root
oturumu güvenilen operatördür, gerçek kişi çatışmasını teknik olarak çözmez.

## 3. Operasyon ve yük

Salt okunur `npm run pilot:check` ortam, migration history/checksum,
SQLite bütünlüğü, 12 topluluk denetimi ve yerel worker sağlığını toplar.
[Ön kontrol ve manuel kanıt sırası](PILOT_ON_KONTROL.md) hazırdır. Kod 0
yayın onayı değildir; yedi dış/operatör kapısı doğrulanmamış kalır.
Yerel development kontrolü geçti; production kontrolü yerel HTTP origin/
callback nedeniyle beklenen şekilde başarısızdır. Gerçek hedef ayarlanmadı.

Yerel işçi health, sınırlı yeniden başlatmalı gözetmen ve güvenli operatör
çalıştırma dokümanı hazır: [İşçi kılavuzu](ETKINLIK_BILDIRIM_ISCISI.md).
Gerçek geçici DB işçisi ve gerçek çocuk yeniden başlatma testi geçti.
Bu OS servisi veya dış alarm kurulumu değildir. Geçici kopyada yedekten dönüş
ve 1/4/8 görevli sentetik SQLite ölçümü de geçti:
[Kurtarma ve yük provası](SQLITE_KURTARMA_VE_YUK_PROVASI.md).
Tüm aşamalarda kapasite korundu; eşzamanlı yazıcı gecikmesi belirgin arttı.
Bu kısa yerel örneklem gerçek HTTP/worker yükü veya üretim kapasitesi değildir.
Üretim sağlayıcısı veya ücretli servis kullanıcı adına seçilmez.

Ek olarak `pilot:rehearse-http`, gerçek veriden ayrı Next development +
worker süreçlerinde 13 sentetik hesapla login/üyelik/kapasite/etkinlik
değişikliği/bildirim görünürlüğünü geçti: [HTTP ve işçi provası](HTTP_ISCI_PROVASI.md).
Bu yerel kısa örneklem staging yük/kurtarma veya yayın kapısını kapatmaz.

- Üretimde uygulama + ayrı event worker süreç yöneticisi; yeniden başlatma,
  graceful stop, job yaşı/failed sayısı ve süreç canlılığı alarmı.
- Beklenen kullanıcı/etkinlik hacmiyle SQLite writer lock/batch/okuma
  gecikmesi staging'de uzun/tekrarlı HTTP+worker ölçümü. 123 kişilik doğrulama
  veya 81 hesaplı kısa servis provası gerçek üretim yük testi değildir.
- PostgreSQL geçişinde snapshot SQL'i, concurrency ve taşıma/yedekten
  dönüş provası. Yerel SQLite'ı kontrolsüz değiştirme.
- Şikâyet/member/history şu an 20 kayıt ve en fazla 100 sayfadır. 2000 üzeri
  kayıt ve yoğun eşzamanlı yönetimde cursor/filtre genişlemesi ayrıca gerekir.
- Karar günlüğü yönetim UI'sında düzenlenemez/silinemez ama kriptografik
  değiştirilemez kayıt değildir. Erişim ve saklama/silme politikası belirlenmeli.

## 4. Yayın koşulları ve ürün sınırları

- Sağlayıcıların ticari kullanım/atıf kapsamını yayın modeliyle doğrula
  (özellikle Open Library ve TVmaze); yerel entegrasyon testini lisans onayı sayma.
- Gerçek üretim yapılandırması, sır yönetimi, yedek/geri dönüş ve sınırlı
  masaüstü performans/güvenlik kontrolü. Harici servis hesabını veya yayını
  kullanıcı adına kendiliğinden açma.
- Yerel SQL geri dönüşü geçti; off-host şifreli yedek, saklama/RPO/RTO,
  uygulama akışlarıyla staging kurtarma ve canlı değişim/geri dönüş planı açık.
- Masaüstü URL/geri-ileri/reload, sayfa içi oluşturma taslakları, sürümlü
  yazar inceleme düzenlemesi ve içerik türü/inceleme alanı filtresi hazır.
  Paylaşım/etkinlik okumaları URL/yenileme nesliyle güncel hedefe bağlıdır;
  eski içerik/yetki/onay yeni hedefe taşınmaz. Review sayfa içi geri dön/
  vazgeç komutları değişen taslak için onay alır; global kurtarma değildir.
  Kaynak topluluk ve karma kartlarda beğeni/özel kayıt, topluluklar arası
  özel kayıt merkezi hazırdır. Kalıcı taslak kurtarma ve
  tam edit geçmişi/geri alma ayrı ürün işleridir. Üretim engelleri açık kalır.
  Film/dizi/kitap incelemesinde doğrudan katalog seçimi de hazırdır; mevcut
  süreli imza ve sağlayıcıları kullanır, kitaplığa otomatik eklemez.
  Etkinliklerim özel ajandası mevcut RSVP/düzenleyen ilişkilerini toplar;
  geçmiş niyet fiziksel katılım değildir, harici takvim/hatırlatma eklenmez.
- Profil V4 kalan kozmetik/vitrin işleri ve topluluk öneri sıralaması ayrı
  ürün paketleridir. Yükselen/Sana özel/Kaydedilen müziğe özeldir.
- Mobil, açık tema ve forumun yeniden açılması ayrı kullanıcı kararıdır.

## Oturum çalışma biçimi

Birbirine bağlı işleri daha uzun paketlerde uygula; rutin seçimlerde
yeniden onay isteme. Alınan inisiyatifleri teslimde belirt, kanıtlanan
kontrolleri ve denenmeyen sınırları ayır. Ücretli işlem, yayınlama, veri
sıfırlama veya anlamlı kapsam genişlemesini bu çalışma biçiminden türetme.
