# İzole HTTP ve bildirim işçisi provası

```powershell
npm run pilot:rehearse-http
```

Komut argüman, hedef URL veya DB adresi kabul etmez. `.env` okumaz; mevcut
uygulama/işçiyi durdurmaz veya yeniden başlatmaz. Node 24 ve kurulmuş proje
bağımlılıkları gerekir. İlk derleme nedeniyle kısa servis ölçümünden pahalıdır;
her küçük değişiklikte değil, ilgili operasyon paketi sonunda çalıştırılır.

## İzolasyon

- Repo `tmp/http-rehearsal-*` altında yeni, sahipli bir dizin açılır. Önce
  kök/tmp symlink veya Windows junction olmadığı doğrulanır.
- Yalnız app/lib/types ve açık listelenmiş kaynak ayarları kopyalanır. `.env*`,
  gerçek DB, yedek, günlük, oturum veya mevcut `.next` kopyalanmaz. Kaynak
  symlink'leri reddedilir. Bağımlılıklar üst repo node_modules'ünden çözülür.
- Güncel migration SQL'leriyle tamamen yeni sentetik SQLite oluşturulur;
  var olan dosya açılmaz. Gerçek veri veya migration history kopyalanmaz.
- Ayrı Next development süreci yalnız 127.0.0.1 üzerinde işletim sisteminin
  ayırdığı boş portu kullanır; 3000 portuna yönelmez. Kendi `.next` alanı vardır.
- Uygulama/worker ortamı sistem çalışma alanlarının dar izin listesinden
  kurulur. Gerçek DATABASE_URL/APP_URL, Node enjeksiyon seçenekleri, proxy ve
  sağlayıcı sırları devralınmaz. Oturum/yönetici sırları her provada üretilir;
  katalog kapalıdır. Spotify/kitap/video sağlayıcı akışları çağrılmaz.
- İşçi gerçek event-notification-worker döngüsüdür; heartbeat kendi
  workspace+DB alanındadır. Üretim Secure çerez politikası değiştirilmez;
  bu özellikle development HTTP provasıdır.

## Akış ve kabul koşulları

1. 13 sentetik, parola hash'li hesap oluşturulur; gerçek HTTP login üzerinden
   ayrı oturumlar alınır. Parola veya çerez rapora yazılmaz.
2. HTTP ile topluluk oluşturulur; 12 hesap üye olur. Anonim yazma 401 ve
   yanlış origin 403 vermek zorundadır. Hız sınırları kapatılmaz.
3. 1/4/8 eşzamanlı görev aşamalarının her birinde ayrı 8 kapasiteli etkinlik
   oluşturulur. 12 katılım isteği ve 12 detay okuması karışık yürür. Gerçek
   HTTP/oturum/API/SQLite yolu kullanılır. Tam 8 kabul, 4 kapasite 409 ve
   DB'de tam 8 attending kaydı zorunludur. 429/500 başarılı ret sayılmaz.
4. HTTP PATCH ile mekân güncellenir. Paralel çalışan işçi, değişikliğin
   outbox snapshot'ını tüketir. 20 saniyelik sınırlı bekleme sonunda tam
   8 bildirim gerekir. Tüm 13 hesabın HTTP bildirim listesi incelenir:
   alıcılara birer, kapasite nedeniyle reddedilenlere/düzenleyene sıfır.
   Kişisel okumaların no-store başlığı da doğrulanır.
5. SQLite quick_check/FK, 12 topluluk bütünlük kontrolü, boş/failed olmayan
   kuyruk ve sağlıklı gerçek worker heartbeat'i zorunludur.

JSON raporu yalnız sabit kapsam/kodlar, sayılar ve gecikmeleri içerir.
İlerleme stderr'e gider. Kod 0 bütün koşullar geçti, kod 1 hata veya başarısız
ölçüm demektir. JSON'u tek başına almak için npm yerine package.json'daki
Node komutunu doğrudan kullan; npm kendi başlangıç başlığını da yazar.

Kapanışta yalnız başlatılan çocuklara IPC stop gönderilir; graceful kapanış
beklenir. Süre aşılırsa yalnız sahip olunan çocuk sonlandırılır ve geçici
dizin korunarak kod 1 verilir; süreç adı/port/ağaç üzerinden öldürme yoktur.
Normal kapanışta yalnız kesin yolu doğrulanan kendi geçici dizini silinir.
Gerçek DB veya önceki yedekler hiçbir durumda temizlenmez.

## Ölçümün sınırı

Rotalar ilk derleme için önceden ısıtılır; login, oluşturma ve başlangıç
süreleri istek gecikmelerine katılmaz. Okuma/kabul/409 gecikmeleri ayrı
p50/p95/max olarak raporlanır. Bunlar aktif fetch+yanıtı okuma süresidir;
görev kuyruğunda beklemeyi içermez. Teslim süresi HTTP PATCH, worker tick
beklemesi ve 200 ms aralıklı gözlemi birlikte kapsar; saf worker CPU süresi
veya bir teslim SLA'sı değildir. Küçük örneklemde p95 çoğu kez maksimumdur.

17 Ekim 2026 yerel development ölçümü: tüm aşamalar geçti; 36 katılım
isteği, 36 ölçülen detay okuması, 24 bildirim; kapasite taşması veya beklenmeyen
HTTP hatası yok. Son ölçümde sekiz eşzamanlı görevde kabul p95 yaklaşık
358 ms, okuma p95 218 ms, kapasite reddi p95 754 ms; teslim 278–1514 ms.
Bu değerler tekrarda ve makine yüküyle değişir; performans eşiği değildir.

Bu gerçek hedefte production build/TLS/proxy/çok instance/uzun süreli yük,
tarayıcı/SSR görsel doğrulaması, sağlayıcı kotası, crash/replay veya kurtarma
testi değildir. `STAGING_HTTP_WORKER_LOAD` manuel kapısı açık kalır;
`pilot:check` bu sonucu otomatik yayın onayına dönüştürmez. Sonraki adım
aynı akışların onaylı staging hedefinde beklenen hacimle ve kurtarma
senaryosuyla ölçülmesidir; hedef/harcama/yayın için ayrı kullanıcı kararı gerekir.
