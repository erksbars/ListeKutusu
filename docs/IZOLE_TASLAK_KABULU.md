# İzole gerçek oturum kabulü

Bu çalışma giriş, yorum, profil kaydet-ve-devam ve topluluk yönetimi için
dar yerel kabuldür. Production derlemesi, staging yük veya yayın onayı değildir.

## Ortamı başlatma

`npm run test:drafts:serve` komutu Node'un `node:sqlite` destekli proje
çalıştırıcısıyla yürütülür. CLI hedef URL/DB veya ek argüman almaz.
Normal `.env`, DB, `.next`, oturum ve yedekler kopyalanmaz. Yalnız kaynaklar
`tmp/http-rehearsal-*` içine alınır; migration'lar yepyeni SQLite dosyasına
uygulanır. Yeni session anahtarı ve rastgele 127.0.0.1 portu kullanılır.
3000 hedeflenmez. İkinci eşzamanlı başlatma runtime kilidiyle reddedilir.

`ready:true` çıktısını bekle. `output/playwright/draft-acceptance-runtime.json`
baseURL, postId ve yalnız bu geçici çalışmanın kontrol yolunu içerir; Git dışıdır.
Örnek PowerShell okuması:

```powershell
$draftRun = Get-Content output/playwright/draft-acceptance-runtime.json -Raw | ConvertFrom-Json
$draftRun.baseURL + '/p/' + $draftRun.postId
```

Yalnız ayrı test tarayıcı oturumu kullan. İki hazır sentetik hesabın e-postası
`acceptance-owner@example.test` ve `acceptance-author@example.test`;
ikisine ait yalnız test parolası `Local-Draft-Acceptance-2026!` şeklindedir.
Hesaplar gerçek kayıt API'siyle oluşturulur. Tek müzik paylaşımı, dış sağlayıcı
çağırmadan yalnız geçici DB'ye fixture olarak eklenir. Gerçek kullanıcı/parola
veya normal veritabanı bu akışa katılmaz.

## Dar tarayıcı kontrolü

1. Owner ile gerçek giriş yap; hazır paylaşımda ana yorum ve yanıt yaz,
   yenileyip tekrar oku, alt ve ana yorumu sil. Sayaçları kontrol et.
2. `İzole oturum taslağı` metnini yaz. Yalnız test tarayıcısının oturum çerezini
   kaldırarak gönderimde gerçek 401 al. Açık taslakla giriş düğmesiyle aynı
   hesaba dön; kaynak yol ve metin korunmalı, otomatik yayın olmamalı.
   Sonra bu metni kendin yayınla; sonda tek yayınlanmış yorum kalmalı.
3. Profil durumunu `İzole kaydedilen profil` yap. Geri geçişini iptal edip
   taslağı, sonra kaydet-ve-devam ile özgün geçmiş hedefini kontrol et.
   İleri ile dönünce sunucunun kırptığı metin ve temiz baseline görünmeli.
4. Owner ile `İzole Kabul Topluluğu` oluştur; şehir bilgisini `İstanbul`
   kaydet. İki sohbet paylaşımı oluştur. Ayrı oturumdaki author topluluğa
   katılıp ikisini bildirsin.
5. Owner yönetiminde iki karar notu yaz; panelden çıkışı iptal edip metinleri
   kontrol et. Birini `İzole karar notu` ile incelendi yap; karar geçmişinde
   kayıt bulunmalı, diğer not yenilemede korunmalı ve tek bekleyen rapor kalmalı.

Bu kontrol sırasında API yanıtı taklit edilmez. 28 Ekim CLI/Edge kabulünde bu
akışlar gerçek HTTP-only oturum ve sunucu mutation'larıyla geçti; 0 pageerror.

## Sonlandırma

Ayrı terminalde `npm run test:drafts:finish` çalıştır. Komut yalnız mevcut
izole çalışmanın kontrol dosyasına yazar; başlatıcı profil/yorum/topluluk/
karar son koşullarını DB'den doğrular, sunucuyu ve geliştirme bağlantılarını
kapatır, geçici klasörü siler. Son çıktıda `ok:true`, `isolatedServerStopped:true`
ve `temporaryRemoved:true` aranır. Finish tarayıcı kontrolünü otomatik yapmaz.

Vazgeçmek için `npm run test:drafts:abort` kullan; kaynaklar temizlenir ama
kabul başarılı sayılmaz (çıkış 1). 20 dakika zaman aşımı da kabulü başarısız
sonlandırır. Kapanış doğrulanmazsa geçici klasör ve runtime korunur; normal DB'ye dönme
veya rastgele süreç/port kapatma fallback'i yoktur.
