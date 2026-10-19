# Etkinlik bildirim işçisi

Etkinlik düzenleme/iptal/kaldırma artık bildirimleri istek içinde tek tek
yazmaz. Etkinlik ve alıcı snapshot'ı aynı SQLite transaction'ında kuyruğa
kaydedilir. Ayrı Node işçisi yalnız uygulama içi bildirimleri oluşturur;
e-posta, push veya dış sağlayıcı yoktur. Müzik/forum bildirimleri değişmez.

## Yerel çalıştırma

Repo kökünde iki süreç gerekir:

```powershell
npm run dev
```

Ayrı terminal:

```powershell
npm run worker:events
```

İşçi çalışmıyorsa etkinlik değişikliği kaydedilir, bildirimler kalıcı kuyrukta
bekler. Uygulama sunucusunun açılması işçiyi otomatik başlatmaz. İşçi veya
sunucu yeniden açıldığında veritabanı sıfırlanmaz. Bildirim merkezinin mevcut
yenileme aralığı da ekranda görünme süresini etkiler; anlık teslim garantisi yoktur.

İşçi 2 saniyede bir, en fazla 20 batch ve batch başına 50 alıcı işler.
Node'a ulaşan Ctrl+C/SIGTERM yeni tick'i durdurur, devam eden işi bitirip
bağlantıyı kapatır. Windows'ta programatik SIGTERM ve zorla süreç sonlandırma
bu handler'ı atlayabilir; graceful stop garantisi olarak kullanılmaz.
Süreç ani kapanırsa açık batch rollback olur; önceki batch'ler korunur.

## Yerel gözetmen ve sağlık kontrolü

Doğrudan işçi **yerine**, ayrı terminalde isteğe bağlı gözetmen:

```powershell
npm run worker:events:supervise
```

Yalnız kendi başlattığı Node çocuğunu izler; başka süreçleri/portları taramaz.
Beklenmedik kapanışta (çıkış kodu 0 dahil) 1/2/4/8 saniyelik beklemeyle
yeniden başlatır. Bir dakika içinde beşinci kapanışta kod 1 ile durur;
bir dakika kararlı çalışma bütçeyi sıfırlar. Başlatma hatası da sayılır.
Ctrl+C/SIGTERM gözetmende tekrar başlatmayı kesip yalnız kendi çocuğuna
SIGTERM gönderir. Windows'ta bu ani kapanış olabilir; batch atomikliği korunur.
Gözetmen kalıcı OS servisi değildir. Gözetmenin kendisi kapanırsa onu
yeniden açmaz; takılı ama kapanmayan çocuğu zorla öldürmez. Üretim süreç
yöneticisi, stop timeout ve dış alarm bağlantısı ayrıca kurulmalıdır.

Başka terminalde salt okunur denetim:

```powershell
npm run worker:events:health
```

Kod 0 sağlıklı, kod 1 inceleme gerekli. JSON yalnız sorun kodlarını,
işçi sayılarını ve kuyruk sayı/yaşını verir; PID, DB adresi, kullanıcı,
etkinlik veya hata/SQL metni içermez. Kamu `/api/health` değişmez.
Kuyruk boşken bile canlı ve ilk başarılı tick'ini tamamlamış işçi gerekir.

- `WORKER_MISSING_OR_STALE`: hiçbir işçinin son kalp atışı 35 saniye içinde
  değil. Önce doğru çalışma klasörü/DB ile işçinin açık olduğunu kontrol et.
- `WORKER_NOT_READY`: işçi başlangıçta, hatada veya ilerlemesi takılmış;
  başlangıçtan hemen sonra birkaç saniye bekleyip yeniden kontrol et.
- `WORKER_TICK_ERROR`: son tick hata/retry/failed verdi. Veritabanı/şema ve
  kuyruk durumunu incele; sağlık komutu otomatik replay yapmaz.
- `WORKER_PROGRESS_STALLED`: kalp atsa bile son başarılı tick beş dakikadan
  eski veya başlangıç 35 saniyeyi aşmış. Sadece süreç varlığı yeterli değil.
- `FAILED_JOBS`: manuel inceleme gerektiren iş var. Önce nedeni gider,
  gerekiyorsa bilinçli olarak aşağıdaki `--retry-failed` komutunu kullan.
- `QUEUE_DELAYED`: en eski pending iş beş dakikayı aşmış (backoff dahil).
- `INVALID_HEARTBEAT`: bozuk/uyumsuz ya da gelecek zamanlı yerel kayıt;
  sistem saatini ve işçi sürümünü kontrol et. Okuma hataları da kod 1 verir.

Yerel kayıtlar git-ignored `tmp/event-worker-health/` altında çalışma
klasörü ve DATABASE_URL özetiyle ayrılır. İçerik yalnız başlangıç/kalp atışı/
son başarı zamanı, son durum ve ardışık hata sayısıdır. İsimler rastgele;
aynı hedefte birden çok işçi birbirinin dosyasını ezmez. Aynı hedefe farklı
URL yazımı farklı sağlık alanı oluşturabilir; komutları aynı repo/env ile
çalıştır. Container/ayrı host kullanımında bu yerel dosyalar ortak sağlık
deposu değildir; her instance aynı yerel volume üzerinden ayrıca izlenmelidir.

Kalp atışı on saniyede bir ve tick sonunda atomik dosya değişimiyle yazılır.
Düzgün kapanış yalnız kendi kaydını siler. Ani kapanış eski kayıt bırakabilir;
sağlıklı yeni işçi varken sırf eski kayıt bulunması alarm üretmez. Sağlık
komutu hiçbir kaydı silmez. 1000 dosya sınırında fail-closed olur. Birikimde
önce o hedefin tüm işçilerini durdur, yalnız ilgili özete ait klasörü doğrula,
ardından o klasördeki eski JSON/tmp kayıtlarını elle temizle ve işçiyi aç.
Çalışan işçinin kaydını veya tüm repo `tmp` ağacını topluca silme.
`--once`, `--status`, `--health` ve replay komutları kalıcı işçiymiş gibi
kalp atışı oluşturmaz. DB/heartbeat okunamıyorsa sağlıklı sonuç verilmez.

## Durum ve kurtarma

```powershell
npm run worker:events -- --status
npm run worker:events -- --once
npm run worker:events -- --retry-failed
```

- `--status` salt okunur: pending, ready, failed ve oldestPendingAt. Pending,
  backoff'ta bekleyen işleri de içerir. Sıfır kuyruk işçinin canlı olduğunu kanıtlamaz.
- `--once` yalnız o anda hazır en fazla 20 batch'i işler; tüm kuyruğu boşaltmayı
  veya backoff'un bitmesini beklemeyi garanti etmez. Ardından durumu yazıp çıkar.
- Hatalı batch bütünüyle rollback olur. 1/2/4/8 saniye artan bekleme sonrası
  beşinci başarısızlıkta failed ayrılır; kalan alıcı kayıtları silinmez.
  Önce veritabanı/şema/işçi sorununu gider, sonra `--retry-failed` ile failed
  işleri tekrar hazırla. Bu komut geçmiş tamamlanmış işi yeniden açmaz.
- Tek seferlik komutlar failed varsa çıkış kodu 1 döndürür; `--once` geçici
  retry'da da kod 1 verir. Döngü kuyruk
  aktivitesinde yalnız sayıları yazar; hata metni, SQL, kişi veya etkinlik
  başlığı loglanmaz. İç iş kaydında yalnız sınırlı hata kodu tutulur.
- Bildirim kimliği event/version/type/user ile sabittir; tekrar teslim mevcut
  bildirimin readAt değerini veya tarihini sıfırlamaz. Batch'in teslimi ve
  alıcı kuyruğundan çıkarma aynı transaction'dadır. SQLite writer lock + iş
  revision CAS birden fazla işçinin aynı batch'i iki kez uygulamasını önler.

## Alıcı ve veri sınırı

Snapshot yalnız işlem anındaki uygun attending/interested üyeleri ve
moderatör işlemlerinde düzenleyeni kapsar; aktör hariçtir. İptal/kaldırma
RSVP'yi çekmeden önce tek parametreli INSERT SELECT ile alınır. İstek
uygulama belleğine tüm alıcıları yüklemez ve alıcı başına bildirim sorgusu
çalıştırmaz. Snapshot yazması yine kitle büyüklüğüyle artan bir veritabanı
işidir; bu SQLite için sınırsız ölçek garantisi değildir.

Teslimde aktif hesap/üyelik ve iki yönlü aktör+düzenleyen engel sınırları
yeniden daraltılır. Geçersiz alıcı atlanıp kuyruktan çıkar; ileride tekrar
katılmak eski bildirimi diriltmez. İptalin snapshot'ını kaybetmemek için RSVP
teslim sırasında tekrar aranmaz. Olaydan sonra katılanlar snapshot'a eklenmez.
Kamuya kuyruk/alıcı listesi API'si açılmaz, bildirim okuma yetkileri değişmez.

Hesap silme kendi bekleyen alıcısını ve aktör/düzenleyen olduğu işleri
temizler. Fiziksel kullanıcı/etkinlik silmede foreign key cascade vardır.
Başarılı alıcı kayıtları anında silinir; completed iş metadata'sı mevcut
`maintenance:cleanup` çalıştırıldığında 30 günden sonra silinir. Pending veya
failed işler bu zaman temizliğine dahil değildir; müdahale bekler.

## Yayın öncesi

Üretimde uygulamadan ayrı, yeniden başlatma ve SIGTERM destekleyen bir süreç
yöneticisine işçi tanımlanmalı. Pending yaşına, failed sayısına ve süreç
canlılığına alarm kurulmalı; yerel health/gözetmen hazırdır, dış alarm veya
OS servis kurulumu bu pakette yapılmadı. Geçişte önce
migration, ardından uyumlu uygulama ve işçi kullanılmalı. Yeni tablolar
gelmeden eski bir işçiyi başlatma. SQLite kilit/yoğunluk ve PostgreSQL geçişi
gerçek yük provasıyla ayrıca değerlendirilmelidir.
