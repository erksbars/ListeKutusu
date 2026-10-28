# ListeKutusu Doğrulama Politikası

28 Ekim geçmiş taslak koruması:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/draft-history.test.mjs tests/draft-navigation.test.mjs tests/community-navigation.test.mjs`
ile 15 test geçti. TypeScript, odaklı ESLint, UI/a11y statik kapıları ve diff
kontrolü geçti. CLI / Edge 1280 koyu masaüstünde sentetik üyelik/API ile
geri/ileri iptal/onay, history key/state/uzunluğu, aynı sayfada oluşturma
taslağı, silinen yorumun geri gelmemesi, sayfalar arası geçiş, güvenli hash,
çoklu kayıt atlama ve hızlı çift geri geçti. Bekleyen kayıt sırasında geri
basma taslağı korudu; istek sentetik 503 ile tamamlandı. 0 gerçek API yazması,
0 pageerror; görüntü incelendi. CLI dosyaları/output Git dışında kalır.
Native gerçek belge çıkışı, eski tarayıcı fallback'i ve kaydet-ve-devam ile
geçmişin birleşik kabulü browser matrisinde doğrulanmadı. Gerçek hesap/DB/
seed/baseline/CSS değişmedi; tam build çalıştırılmadı.

27 Ekim topluluk yerel taslak çıkışları:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/draft-navigation.test.mjs tests/community-navigation.test.mjs`
ile 8 test geçti. TypeScript, değişen kaynak ESLint, UI/a11y statik kapıları
ve diff kontrolü geçti. CLI / Edge 1280 koyu masaüstünde sentetik üyelik/API
ile oluşturma formlarının filtre/bölüm/detayda korunması, yorum sayfalaması,
yorum/inceleme/etkinlik düzenleme/bildirim çıkışında iptal/onay, inceleme
listesine tek onayla çıkış ve iç linkten global çıkış doğrulandı. Etkinlik
kaydının sentetik PATCH 503 yanıtından sonra kapat/yenile işleminin iptal ve
onayı geçti; ilgisiz oluşturma taslağı korunur. 0 gerçek API yazması,
0 pageerror; ekran görüntüsü incelendi. Geçici CLI dosyaları Git dışındadır.
Genel browser geri/ileri koruması, gerçek oturumla yazma ve tam matris/build
bu kabulün kapsamında değildir. DB/seed/baseline/CSS değişmedi.

27 Ekim müzik yorum yazma/giriş taslağı dilimi:
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/comment-payload.test.mjs tests/comment-draft.test.mjs tests/feed-comments.test.mjs`
ile 9 test geçti. TypeScript, odaklı ESLint, UI/a11y statik kapıları ve diff
kontrolü geçti. CLI / Edge 1280 koyu masaüstünde mevcut public paylaşımın RSC
viewer alanı ve yorum API'leri istemcide sentetik yanıtlarla karşılandı;
gerçek oturum oluşturulmadı. Ana/alt yorum gönderme, hedef iptal/onay,
alt/ana yorum silme sayımları, geçersiz başarı/500 ile taslak ve liste
koruması, 401 açık giriş aktarımı/kaynak URL, browser Geri ile tek tüketimli
taslak dönüşü, kayıp hedefte gönderim engeli ve iç linkten çıkış iptali geçti.
0 gerçek API yazması ve 0 pageerror; hata durumlarının beklenen console HTTP
hataları vardır. Geçici CLI dosyaları/görüntüler Git dışındaki output altındadır.
Gerçek giriş+sunucu yazma kabulü veya genel geçmiş koruması tamamlanmış sayılmaz.
DB/seed/oturum/baseline/CSS değişmedi; tam build/matris çalıştırılmadı.

27 Ekim çok sayfalı kaynak dönüşü: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/feed-restoration.test.mjs tests/feed-navigation.test.mjs tests/community-navigation.test.mjs`
ile 14 saf test geçti. TypeScript, odaklı ESLint, UI/a11y statik kapıları
ve diff kontrolü geçti. Playwright CLI / Edge 1280 koyu masaüstünde sentetik
yanıtlarla derin kaynak, 3 ek sayfa sınırı/manuel devam, liste sonu,
yinelenen/geçersiz cursor, 500 sonrası tekrar, vazgeçince 40 kartın korunması,
geciken sayfada filtre değişimi ve üçüncü sayfadaki müzik kaynağı doğrulandı.
Son kontrollerde 0 istemci API yazması ve 0 pageerror vardı. Geçici fixture
ve incelenen görüntüler `output/playwright/` altında Git dışında kalır.
Gerçek oturumlu yorum yazması, tam build/browser matrisi yapılmadı;
DB/seed/oturum/baseline ve CSS değişmedi.

27 Ekim kaynak dönüş dilimi: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/feed-navigation.test.mjs tests/community-navigation.test.mjs`
ile 10 saf test geçti. TypeScript, değişen kaynak ESLint, UI/a11y statik
kapıları ve diff kontrolü geçti. Playwright CLI / Edge 1280 koyu masaüstünde
sentetik istemci API cevaplarıyla inceleme bağlantısı/browser Geri ve etkinlik
bağlantısından filtreli, görünür/odaklı karta dönüş; yorum sayfasında kaynak ve
giriş hedefi; etkinlik yenilemesi; yerel listede kaynak temizliği ve popstate;
3 dış/başka yol/yanlış kart kaynağının reddi kontrol edildi. İstemci API
yazmaları engellendi, kontrol sonunda 0 yazma ve 0 pageerror vardı.
CLI geçici fixture/kontrol dosyaları ve incelenen görüntü `output/playwright/`
altında Git dışında tutulur. Bu bir Playwright test-runner matrisi değildir.
DB/seed/oturum/baseline yazılmadı; CSS/tasarım değişmedi. Çok sayfalı kaynağın
ilk listede olmaması, oturumlu yorum yazmaları ve tam build/regresyon açık.

17 Ekim yedinci tasarım dilimi: `npx playwright test tests/browser/feed-return.spec.ts tests/browser/feed-card-interactions.spec.ts tests/browser/post-comment-states.spec.ts --project=desktop --reporter=line`
ile 5 senaryo geçti. URL kapsam/tür/konu, yenileme, uyuşmayan filtre temizliği,
giriş hedefi; mevcut public müzik detayından geri linki/browser back ile
kaynak kartın görünür/odaklı olması ve dış dönüş reddi; önceki kart/yorum
okuma kontrolleri kapsanır. Public fixture yoksa ilgili testler seed yerine
skip olur; bu çalışmada hepsi geçti. Yazma yok; istemci API yanıtları mock.
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/feed-navigation.test.mjs`
ile 3 saf test geçti. TypeScript, kaynak ESLint, UI/a11y geçti. Topluluk/
etkinlik dönüşü, derin sayfalı konum, oturumlu yorum kabulü, geniş build ve
mobil/açık tema matrisi tamamlanmış değildir.

17 Ekim altıncı tasarım dilimi: `npx playwright test tests/browser/feed-card-interactions.spec.ts tests/browser/post-comment-states.spec.ts --project=desktop --reporter=line`
ile 3 senaryo geçti: karma kart/spoiler/iptal/sınırsız kapasite/taşma/dar Axe,
müzik menüsü klavye; mevcut public paylaşımda yorum okuma 503/500/geçersiz
başarı/yükleme/boş ve bilinmeyen sayı. Public fixture yoksa test açıkça skip
olur; bu çalışmada bulundu ve geçti. Seed/oturum açma yok; API yanıtı mock.
`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/comment-draft.test.mjs`
ile 2 test geçti: yanıt hedefi geçiş kararı ve mutasyonsuz silme/yanıt sayımı.
TypeScript, kaynak ESLint, UI/a11y geçti. Görüntü incelendi; baseline aynı.
Oturumlu yorum gönderme/silme/hedef değişiminin tam browser kabulü, geniş
build ve mobil/açık tema matrisi açık kalır.

17 Ekim beşinci tasarım dilimi: `notification-states.spec.ts`,
`feed-card-interactions.spec.ts` ve `quality.spec.ts` içindeki mevcut
`bildirimler: aynı…` senaryosundan seçilen 6 koyu masaüstü testi geçti.
Komut: `npx playwright test tests/browser/notification-states.spec.ts tests/browser/feed-card-interactions.spec.ts tests/browser/quality.spec.ts --project=desktop --reporter=line --grep 'notifications distinguish|notification mutations|notification history|notification read request|feed card menu|bildirimler: aynı'`.
Kapsam: 500/503/401/403/geçersiz başarı/boş/yükleme; geciken poll karşısında
mutation, okundu hatasında sayaç ve tercih rollback'i; gezinmede PATCH'in
tamamlanması, geçmiş sayfasında yetki kaybı, eski gruplama; kart menü klavyesi
ve not disclosure ilişkisi. Panel ve kartta dar Axe WCAG 2 A/AA geçti.
TypeScript, değişen kaynaklarda ESLint ve UI/a11y statik kapıları geçti.
Yazmalar mock; DB/seed/baseline/sunucu ve mobil/açık tema matrisi değişmedi.
Bu çalışma geniş build veya bütünleşik görsel kabul değildir.

17 Ekim dördüncü tasarım dilimi: `npx playwright test tests/browser/discover-states.spec.ts tests/browser/personal-center-states.spec.ts --project=desktop --reporter=line`
ile 10 senaryo geçti. Başvuruda tür/rapor iptal, 503, kaldırılmış rapor ve
itiraz hakkı, bekleyen doğrulama kilidi, yazma hatası/duplicate/başarı;
Keşfet kullanıcı/liste kapsamında 503/500/401/403/geçersiz 200/gerçek boş,
giriş dönüşü, bilinmeyen sayaç ve retry yüklemesi doğrulanır. Keşfet boş
kartında dar Axe WCAG 2 A/AA ve yatay taşma kontrolü var. TypeScript,
değişen kaynaklarda ESLint ve UI/a11y statik kapıları geçti. Mutasyonlar
mock; gerçek kullanıcıya yazma, DB/seed/baseline değişimi veya tam matris yok.

17 Ekim üçüncü tasarım dilimi: `npx playwright test tests/browser/profile-editor.spec.ts tests/browser/personal-center-states.spec.ts --project=desktop --reporter=line`
ile 8 senaryo geçti. Profil çıkışında 401/ağ hatası sonrası metin/hedef,
tekrar kayıt kilidi, başarıda hedefe devam, hesap yerel bölüm/geri ve yetkili
kuyruk filtre/yenileme iptal/onayı kapsanır. Yazmalar mock; gerçek hesap/DB
değişmez. Soğuk geliştirme rota derlemesi için hedef geçişinde 20 saniye
bekleme sınırı var; başarısız isteğe otomatik tekrar yok. TypeScript,
değişen kaynaklarda ESLint ve UI/a11y statik kapıları geçti. Tam matris,
build, mobil/açık tema ve gerçek native geçmiş/çıkış kabulü çalıştırılmadı.

Amaç, hatayı erken yakalarken her küçük değişiklikte pahalı test matrisini
çalıştırmamaktır.

## Değişiklik türüne göre kontrol

Tasarım öncesi operasyon kapanışı için:

- `tests/encrypted-backup*.test.mjs`: GCM roundtrip, salt/IV, yanlış parola,
  kesik/bozuk başlık/veri/tag, overwrite koruması; gerçek CLI ile güncel/eski
  Prisma şeması ve kaynak baytları. Tamamen geçici sentetik dosyalardır.
- `tests/runtime-check.test.mjs`: HTTP/body/DB/topluluk/worker arızası,
  webhook mock'u, geçiş/hatırlatma, başarısız teslimde retry, bozuk state,
  redirect/HTTPS/sır projeksiyonu. Gerçek webhook göndermez.
- `tests/deployment-templates.test.mjs`: kaynak unit/timer sözleşmesi ve
  sır taşımama. Gerçek systemd parser/host testi değildir.
- `pilot:rehearse-recovery`: opt-in gerçek iki izole Next ortamı; şifreli
  yedekten oturum/inceleme/etkinlik/RSVP ve pending işin teslimi, worker
  restart/readAt koruması, kurtarma sonrası yeni yazma. Canlıya restore yoktur.
- `pilot:build-isolated`: büyük paket sonunda bir kez, ayrı kaynak/DB/.next
  ile production build. Başarısızlıkta kendi tmp tanı dizini korunur.

Kapsam/operatör devri docs/TEKNIK_KAPANIS_VE_YAYIN.md içindedir.

HTTP/işçi operasyon paketi için opt-in `npm run pilot:rehearse-http`:
ayrı Next development portu, yeni SQLite, 13 sentetik hesap; gerçek login/
üyelik/etkinlik RSVP/PATCH ve worker bildirimi. 1/4/8 görevde kapasite,
alıcı/alıcı olmayan HTTP görünürlüğü, no-store ve SQLite/worker sağlığı.
Mevcut .env/DB/sunucuya yük vermez; tam browser/build veya üretim/staging
yük matrisi değildir. Normal birim testlerine bu pahalı prova eklenmez.
`tests/http-rehearsal-isolation.test.mjs` env izin listesi, kopya whitelist'i,
sınır/junction ve CLI hedef reddini sınar. Kılavuz docs/HTTP_ISCI_PROVASI.md.

### Metin veya küçük CSS değişikliği

- Yalnız ilgili dosyayı incele.
- Gerekliyse `npm run typecheck` çalıştır.
- Görsel kontrol yalnız yerleşim gerçekten değiştiyse yapılır.

### Dar bileşen değişikliği

- İlgili birim veya Playwright testini çalıştır.
- İlgili rotada masaüstü koyu tema kontrolü yap.

17 Ekim ortak masaüstü kabuk paketi:

- `tests/primary-navigation.test.mjs`: rota sınırları, eski kitaplık girişi ve
  kişisel topluluk bağlamlarının aktif bölümü; DB kullanmaz.
- `tests/browser/desktop-shell.spec.ts`, `social-shell.spec.ts`,
  `profile-editor.spec.ts`, `library-hub.spec.ts` yalnız `--project=desktop`
  ile dar kabul içindir. İlk dosya seçilmiş gezinmeyi 1280/1440/1728 px'te
  denetler; mobil/açık tema matrisi açılmaz. Kayıt mutasyonları mock'tur.
- `UI_DEMO_PROFILE=1` yalnız yerel 127.0.0.1 üzerindeki mevcut
  `/u/demo-topluluk-1` profilini salt okur; bağlantı listesi mock. Fixture
  yoksa senaryo atlanır; DB seed/reset veya hesap oluşturma yapılmaz.
- Son toplu koşuda 8 browser senaryosu geçti. Yeni tasarım snapshot
  baseline'ları otomatik yenilenmedi; çıktı resimleri `test-results` içindir.
- Hesapta ortak menüden kirli çıkış iptali/onayı ve pending kayıt kilidi,
  modal Tab/Escape/inert/scroll/geri odak kabul edilir. Bu, U-03'ün bütün
  formlar ve tarayıcı geçmişi için tamamlandığı anlamına gelmez.

### API veya iş mantığı değişikliği

17 Ekim ortak taslak/kişisel merkez dilimi:

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/community-request.test.mjs tests/community-read-state.test.mjs tests/navigation.test.mjs tests/draft-navigation.test.mjs`: 13 kontrol; fetch mock, DB yok.
- `npx playwright test tests/browser/personal-center-states.spec.ts tests/browser/profile-editor.spec.ts --project=desktop --reporter=line`: 7 odaklı koyu masaüstü senaryosu. Kişisel merkez okuma/yazma ve yetki yanıtları mock; hesap/DB oluşturulmaz.
- 401/500/gerçek boş, filtreli giriş dönüşü; geciken özel kuyruk ve 403/401;
  başvuru hedefinde iptal/ağ hatası/bulunamayan hedef/onay/yazma hatası;
  iki eşzamanlı taslakta tek onay ve hesap pending kilidi doğrulanır.
- beforeunload dinleyicisi sentetik iptal edilebilir olayla kontrol edilir;
  gerçek native prompt veya aynı belge tarayıcı geçmişi kabulü değildir.
- Ajanda giriş kartına dar Axe ve görüntü kontrolü eklenir. Bu tüm rota
  erişilebilirlik matrisi değildir; baseline güncellenmez.

- İlgili birim testini ve `npm run typecheck` komutunu çalıştır.
- Oturum veya veri akışı değiştiyse ilgili E2E senaryosunu çalıştır.

### Dört ila altı birikmiş geliştirme adımı

- `npm run lint`
- `npm run typecheck`
- Etkilenen birim ve browser testleri

### Büyük aşama sonu

- `npm run build`
- `npm test`
- `npm run ui:check`
- `npm run a11y:check`
- Masaüstü koyu tema Axe ve görsel baseline kontrolleri

## Masaüstü performans bütçesi

`npm run test:browser:performance` ana akış, forum ve oyunlar rotalarını koyu
tema masaüstü projesinde ölçer. Yatay taşma, CLS, DOM düğümü, kaynak sayısı ve
boyutu, uzun ana iş parçacığı görevleri ile ısınmış gezinme süresi sınırlandırılır.
Geliştirme derlemesi sonucu etkilemesin diye rota önce bir kez ısıtılır.

`npm run test:browser:games` iki oturumlu Tavla ile dört oturumlu Şarkı Düellosu
senaryolarını birlikte çalıştırır.

Production sunucusu yerel HTTP üzerinde test edilirken güvenli oturum çerezi
tarayıcı tarafından otomatik saklanmaz. Oyun browser testleri kayıt yanıtındaki
çerezi yalnız test bağlamına yükler; ürünün `Secure` çerez politikası değiştirilmez.

## Şimdilik çalıştırılmayacak matrisler

### Sahiplik, arşiv ve hesap kapatma

`tests/community-lifecycle.test.mjs` geçici iki Prisma istemcili SQLite'ta
teklif/kabul/iptal/süre/eski ID, yetki/engel/üyelik, atomik rol ve audit,
set-based iptal snapshot'ı, read-only/keşif sınırı, restore'da RSVP diriltmeme,
onaysız sahip hesabı kapatmayı reddetme ve onaylı kapanışı sınar. Silme/kabul/
join ve arşiv/RSVP yarışları, audit arızasında tüm transaction rollback'i var.

17 Ekim: lifecycle + communities + distribution + discovery + event-reports +
event-updates + health paketinde 55 kontrol geçti; outbox'ın 8 kontrolü de
ayrıca geçti. Genel test matrisi değildir.

`tests/browser/community-lifecycle.spec.ts` COMMUNITY_E2E=1, yerel 127.0.0.1,
desktop koyu iki gerçek kayıt oturumu kullanır. Teklif hatasında hedef
taslağı, gelen teklif bağlantısı, kabul/rol kaybı, arşiv/restore/geçmiş,
korunan üye içeriği, wrong-origin ret ve arşiv checkbox'ıyla gerçek hesap
kapatmayı sınar. Finally e-posta silinse bile önceden kaydettiği kesin test
ID'lerini ve topluluklarını temizler. Mobil/açık tema yoktur.

### Sayfalı yönetim ve karar geçmişi

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/community-management.test.mjs tests/communities.test.mjs tests/community-event-reports.test.mjs tests/community-event-updates.test.mjs`
17 Ekim: 36 kontrol geçti. 41 rapor/67 üye sayfalaması, deterministik sıra,
filtre/yetki/gizlilik, karar notu sınırı, inceleyen/tarih, no-op, silinmiş
aktör ve log hatasında içerik/RSVP/outbox rollback sınanır.

`tests/browser/community-management.spec.ts`, COMMUNITY_E2E=1 ile yerel
127.0.0.1 desktop koyu tek senaryodur. İki gerçek kayıt oturumu, 31 rapor,
24 üye; sayfalama, hatada not taslağı, incelendi, geçmiş, arama, ban/unban
onayı ve rol kaldırma sonrası erişim kontrolü. Sentetik üyeler yalnız bu
fixture'a aittir; finally sadece benzersiz e-posta/ID'lerini temizler.

`tests/community-health.test.mjs` geçici DB'ye bozuk durum ekleyip salt okunur
kontrolün ayrımını doğrular. `npm run check:communities` yerelde 12 kontrolü
veri değiştirmeden çalıştırır; --json makine çıktısıdır. CLI 0 temiz,
1 hata, 2 yalnız operatör uyarısı. Production sağlık/yük testi değildir.

### Dar etkinlik bildirim outbox kontrolü

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/community-event-outbox.test.mjs tests/community-event-updates.test.mjs tests/community-event-reports.test.mjs tests/community-events.test.mjs`
geçici SQLite üzerinde 123 alıcı, 50'lik batch, atomik rollback, yeniden
bağlantıyla devam, iki işçi, readAt/dedup, gizlilik, failed/backoff/manuel
kurtarma ve mevcut etkinlik kurallarını sınar. 15 Ekim: 30 kontrol geçti.

`tests/browser/community-event-updates.spec.ts` yalnız COMMUNITY_E2E=1,
yerel 127.0.0.1 ve desktop ile çalışır. Ayrı sürekli işçi kapalı olmalıdır:
test işçi çalışmadan job/0 bildirim durumunu doğrular, gerçek CLI --once
çağırır ve iki kayıt oturumuyla bildirim merkezi/detay/iptali kontrol eder.
`community-event-reports.spec.ts` de teslim öncesi aynı CLI'yi çağırır.
Test sonunda yalnız kendi hesap/toplulukları, ilişkili işleriyle temizlenir.
İşçi komutları ve üretim sınırları: docs/ETKINLIK_BILDIRIM_ISCISI.md.

### Dar etkinlik raporu/moderasyon kontrolü

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/community-event-reports.test.mjs tests/community-events.test.mjs tests/community-event-updates.test.mjs`
geçici SQLite üzerinde rapor/rol/engel/hedef sınırları, tekrar ve reviewed,
gizli gerekçe, iptal/kaldırma, RSVP ve bildirim atomikliğini kontrol eder.
15 Ekim: 22 kontrol geçti.

`COMMUNITY_E2E=1`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` ile
`node --env-file=.env node_modules/@playwright/test/cli.js test tests/browser/community-event-reports.spec.ts --project=desktop`
iki gerçek kayıt oturumu, origin/anonim ret, hata halinde taslak, özel kuyruk,
detay bağlantısı, incelendi ve kaldırma/RSVP/katılımcı bildirimini sınar.
Koyu masaüstü, tek senaryo; mobil/açık tema ve genel matris çalıştırılmaz.
Finally yalnız benzersiz e-postalı test hesaplarını/topluluklarını temizler.

### İsteğe bağlı gerçek topluluk kontrolü

`node --experimental-strip-types --test tests/communities.test.mjs` topluluk
iş kurallarını benzersiz geçici SQLite veritabanında sınar.
`tests/browser/communities.spec.ts` yalnız `COMMUNITY_E2E=1` ile çalışır.
Yerel 127.0.0.1 geliştirme sunucusu ve `node --env-file=.env` gerekir;
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` ile yalnız desktop projesini çalıştır.
Gerçek kayıt API'sinden iki oturum alır; topluluk oluşturma, katılım,
sohbet/yorum, rapor, kaldırma ve uzaklaştırmayı doğrular. Finally yalnız
rastgele test e-postalarıyla oluşturduğu topluluk ve hesapları temizler.
Normal matris içinde atlanır, dış sağlayıcı isteği göndermez.

`tests/browser/community-reviews.spec.ts` aynı opt-in ve desktop koşullarını
kullanır. Tek gerçek hesapla inceleme oluşturur; hatalı kaynakta taslak
koruma, kaydın kalıcılığı, özel kitaplığa otomatik eklenmeme ve anonim
okuyucuda spoiler metni/yorumların açılıp gizlenmesini doğrular. Kaynak
linklerine tıklamaz/dış istek göndermez; kendi test verisini temizler.

`tests/community-references.test.mjs` geçici SQLite üzerinde seçim sahipliği,
tür/onay/metadata doğrulama, özel veri sınırı ve kaynak silindikten sonra
snapshot'ın kalıcılığını kontrol eder. `tests/browser/review-library-link.spec.ts`
aynı COMMUNITY_E2E opt-in koşullarıyla tek gerçek oturum kullanır. Kitaplık
metadata'sı yerel fixture'dır (canlı sağlayıcı testi değildir); arayüzde
seçim/yayın, anonim API sınırı ve kaynak silinince incelemenin korunmasını
doğrular, yalnız kendi geçici hesabını/topluluğunu temizler.

`tests/community-events.test.mjs` geçici SQLite üzerinde takvim/timezone,
kapasite/onay, üyelik/yasak, hedef topluluk, engelleme, iptal/kaldırma ve
sayfalamayı sınar. `tests/browser/community-events.spec.ts` aynı COMMUNITY_E2E
opt-in ve desktop koşullarında gerçek oturumla duyuru oluşturma, yeniden
yükleme, herkese açık okuma, iptal ve kaldırmayı doğrular. Gerçek etkinlik
duyurusu değildir; kendi geçici hesap/topluluğunu temizler, mevcut veriye dokunmaz.

`tests/community-attendance.test.mjs` iki ayrı Prisma istemcisiyle aynı SQLite
üzerinde son koltuk yarışı, tekillik, durum geçişi, ayrılma/yasak/reaktivasyon,
iptal/geçmiş ve kişisel veri sınırlarını kontrol eder. `tests/browser/community-attendance.spec.ts`
aynı opt-in/desktop koşullarıyla üç gerçek oturumda doluluk, ilgileniyorum,
vazgeçme, yeniden katılım, yönetici listesi ve iptal akışını doğrular.
Yalnız geçici hesap/topluluk/etkinlik kayıtları temizlenir.

`tests/community-event-updates.test.mjs` edit yetkisi/sürüm/no-op, kapasite
azaltma–RSVP yarışı, alıcı/görünürlük ve bildirim tekilliğini sınar.
`tests/browser/community-event-updates.spec.ts` aynı COMMUNITY_E2E opt-in
desktop koşullarıyla iki gerçek oturum kullanır: eski formda taslak koruma,
güncel veriden başarılı edit, bildirim gruplama, bildirime tıklayıp doğru
etkinliği açma ve iptal bildirimi. Test verisi finally içinde temizlenir.
Paylaşılan sunum için `tests/notifications.test.mjs` de dar kontrol paketindedir.

`tests/community-distribution.test.mjs` geçici SQLite üzerinde eski/varsayılan
dağıtım, yetki, sürüm koruma, spoiler/engelleme/deaktif hesap/kaldırma ve eşit
zamanlı post+event cursor sayfalamasını sınar. `tests/browser/community-distribution.spec.ts`
aynı COMMUNITY_E2E opt-in desktop koşullarında gerçek hesap ve anonim ziyaretçi
kullanır: formdan inceleme/etkinlik yayınlama, ana sayfada görünme, spoiler,
doğru detay bağlantıları ve genel dağıtımdan geri çekme. Yalnız test hesabı/
topluluğu temizlenir; mevcut demo/müzik/forum verisi değiştirilmez.

`tests/mixed-feed.test.mjs` geçici SQLite üzerinde üç kaynaklı sıralama/cursor,
aynı kimlik/tarih, türler, Follow/üyelik farkı, müzik etkileşim bayrakları,
gizleme/engel/deaktif hesap ve kaynak kaldırma sınırlarını doğrular.
`tests/browser/mixed-feed.spec.ts` aynı opt-in/desktop koşullarında iki gerçek
oturum kullanır. Karma sıra, beğeni/kaydetme kalıcılığı, tür değiştirme, geciken
yanıtın yeni filtreyi ezmemesi, Takip ve müziğe özel Kaydedilen kontrol edilir.
Müzik metadata'sı yalnız kendi geçici hesaplarına ait DB fixture'ıdır;
Spotify çağrısı yapılmaz. Eski quality mock'ları yeni GET sözleşmesini tanır;
genel görsel baseline matrisi otomatik yenilenmez.

`tests/profile-university.test.mjs` ad/görünürlük doğrulama, eski istemci,
üniversite değişmeden kayıt davranışı, kamu projeksiyonu ve varsayılan migration'ı
geçici SQLite üzerinde sınar. `tests/browser/profile-university.spec.ts` aynı
COMMUNITY_E2E opt-in desktop koşuluyla iki gerçek hesap ve anonim okumada
gizli/açık DTO+HTML, form/taslak, engelleme, dışa aktarım ve hesap silme sınar.
Kendi test hesaplarını ID ile temizler (silme e-postayı kaldırdığı için).
`tests/browser/profile-editor.spec.ts` kayıt hatası/kilit kontrolü de aynı dar
pakettedir; genel profil görsel matrisi veya mobil/açık tema değildir.

`tests/community-discovery.test.mjs` açık etiket doğrulama/Türkçe anahtar,
migration şehir backfill'i, rol/üyelik, özel profil sınırı, genel dağıtım,
iptal/geçmiş/engel, etkinlik şehri güncellemesi ve sayfalama öncesi filtreyi
geçici SQLite üzerinde sınar. `tests/browser/community-discovery.spec.ts`
COMMUNITY_E2E opt-in desktop ile iki gerçek hesap kullanır: UI metadata
oluşturma/düzenleme, üniversite/şehir/ilgi alanı, URL/reload/geri, dağıtım,
özel üniversiteyle eşleşmeme, engel ve okuma hatasında taslak/yeniden dene.
Yalnız kendi geçici hesap/topluluk/etkinlikleri temizler; dış sağlayıcı yoktur.

### İsteğe bağlı canlı medya kontrolü

`tests/browser/media-live.spec.ts` yalnız `MEDIA_LIVE_E2E=1` ile çalışır.
Yerel 127.0.0.1 sunucusunda medya açık ve Open Library iletişimi tanımlı olmalı;
Playwright süreci `node --env-file=.env` ile aynı veritabanını kullanmalıdır.
Normal test koşusunda atlanır. Her sağlayıcıya bir arama yapar, gerçek kayıt
API'siyle geçici hesap oluşturur ve finally içinde yalnız o hesabı temizler.
Sağlayıcı kesintisi/hız sınırı test hatasıdır; otomatik tekrar yapılmamalıdır.

### Ertelenen görsel matrisler

- Mobil Playwright projeleri.
- Açık tema görsel baseline ve kapsamlı kontrast matrisi.

## Çalışma ilkeleri

`tests/environment-check.test.mjs`: saf doğrulama, zayıf/aynı/örnek sır,
URL protokol/credentials/path/query/hash ve production yerel/özel origin,
SQLite/limit/bakım, katalog flag/contact ve çıktıda değer sızmaması (7).
`tests/pilot-preflight.test.mjs`: native readOnly/hash eşitliği, gerçek
migration checksum/history/eksik/yarım/yinelenen kayıt, FK ihlali, eksik
DB yaratmama, boş/sağlıklı heartbeat, local vs production ve manuel onayı
ayırma, gerçek kuyruk timestamp ve eski iş, CLI flag güvenliği (8, üst test dahil).
İlgili worker-operations ile toplam 26 kontrol geçti. CLI development geçti;
aynı yerel env'de production HTTP adresleri nedeniyle beklenen kod 1 verdi.
Bu arayüz değişikliği değildir; geniş browser/build matrisi tekrar edilmez.

`tests/community-agenda.test.mjs`: aktif oturum/strict filtre ve URL,
25 kayıt/iki kaynak/tekillik/sayfalama öncesi rol, yalnız kendi minimal DTO/
bounded sorgu, geçmişte withdrawn, iki yönlü engel/removed/deaktif organizer,
mevcut servisten geri alma/organizer etkinliğini koruma, leave/arşiv/iptal (8,
üst test dahil). Agenda+attendance+lifecycle+read-state toplam 32 kontrol.
`tests/browser/community-agenda.spec.ts`: iki oturum/anonim/forged-user ve
no-store, dizin bağlantısı, rol/zaman/URL/geri/reload, 21 tercih/son sayfa,
geri alma onayı/Escape/hata/başarı, kaynak RSVP detayına geçiş, engel/boş durum.
İlgili attendance browser'ı kapasite/koltuk açma/iptal davranışını korur.
İki ilgili koyu desktop senaryo geçti; yeni ekranın 1280px görüntüsü incelendi.
Detaya geçiş testinde URL commit'i beklenip assertion kaynak paneline daraltıldı;
aynı tercih metni taşıyan liste kartlarına yanlışlıkla eşleşme kaldırıldı.
Yeni rotalarda Next route typegen sonrası typecheck temizdir. Genel/mobil/
açık tema veya üretim yük matrisi değildir; yeni migration uygulanmadı.

`tests/community-read-state.test.mjs`: URL/nesil/filtre/sayfa değişimi,
pasif okuma, eski hata ve anahtar çakışmalarında yalnız güncel projeksiyon (5).
`tests/browser/community-read-safety.spec.ts`: gerçek oturum/DB'de geciken
etkinlik listesi ve detay, hızlı filtre/hedef değişimi, eski paylaşım detayı,
eski iptal onayını kapatma, hata/yeniden dene, oluşum taslağını koruma ve
review değişikliği bırakma/iptal/Escape/değişmeyen formu sınar. Bilerek
geciktirilen yalnız okuma istekleridir; kaynaklara yaptırım uygulanmadığı
DB'den doğrulanır. Fixture'lar yalnız kesin test ID'leriyle temizlenir.
Read-state+navigation+review-editing+event-updates+attendance toplam 34
odaklı kontrol geçti. Yeni browser ile navigation/review-edit/attendance/
event-update toplam 5 ilgili koyu desktop senaryosu geçti. Event-update
testinin işçinin henüz teslim etmediği varsayımı kaldırıldı: kalıcı iş sayısı,
kesin eventual teslim, boş kuyruk ve tekrar çalıştırmada çoğalmama doğrulanır;
işçi durdurulmaz ve ürün garantileri gevşetilmez. Yeni onay ekranı incelendi.
Genel/mobil/açık tema veya üretim yük matrisi çalıştırılmadı.

`tests/community-catalog-references.test.mjs`: kendi/süreli imza, değiştirme,
iki yöntem/sohbet/tür/sağlayıcı reddi, canonical snapshot ve DTO, kitaplığa
yazmama, yayın sırasında dış istek olmaması, özellik kapalı/manual/eskiler,
üyelik/ban/arşiv/aktif hesap ve düzenlemede eser koruması (8, üst test dahil).
Catalog-reference+library-reference+media-catalog+media-library+catalog-cache+
review-editing+communities toplam 56 odaklı kontrol geçti.
`tests/browser/community-catalog-reference.spec.ts` gerçek oturum ve yayın
API'si, imzalı sentetik arama yanıtları kullanır; dış sağlayıcıya istek yoktur.
Otomatik arama yapmama, süre hatasında taslak/seçim koruma, aynı eser için yeni
token seçme, arama kesintisi/boş sonuç/Enter, spoiler/no-library-write/public
DTO, iptal edilen eski tür sorgusu, TVmaze atfı ve müzik/oyun kısıtı sınanır.
Eski manuel review ve edit browser'ları ayrıca korunur. Koyu masaüstü görüntü
incelenir; genel/mobil/açık tema, canlı sağlayıcı veya lisans doğrulaması değildir.

`tests/community-saved-posts.test.mjs`: aktif oturum/katı filtre, karma kart
yazma yanıtı, müzik ayrımı, iki topluluk/25 kayıt/tarih eşitliği ve filtreli
sayfalama, kaynak bazlı üyelik sayısı ve bounded sorgular, dağıtımı geri
çekilmiş eski kart, iki yönlü engel/kaldırma/pasif yazar, arşiv/ayrılma ve
kendi geri alması (8, üst test dahil). Saved+reactions+mixed+distribution+
communities+lifecycle toplam 55 kontrol geçti.
`tests/browser/community-saved-center.spec.ts`: iki gerçek oturumla karma
kart hatası/başarı, merkeze geçiş, özel/forged-user/anonim erişim ve no-store,
spoiler, filtre/URL/reload/geri, 21 kayıt/son sayfadan geri düşme, iki yönlü
engel ve eski kartın dağıtım sonrası metinsiz geri alma durumunu sınar.
Yeni senaryo ve önceki mixed-feed/source-reactions toplam 3 ilgili desktop
senaryo geçti. URL commit'i ve oturum refetch'i beklenerek test zamanlama
yarışları düzeltildi; kör bekleme veya baseline yenileme eklenmedi.
Yeni merkezin koyu masaüstü görüntüsü incelendi. Genel/mobil/açık tema
matrisi ve üretim yük testi değildir; yalnız kesin fixture kimlikleri silinir.

`tests/community-post-reactions.test.mjs`: strict bool/yetki/kendi beğenisi,
iki bağlantılı tekillik, DTO/özel kayıt, sayfalama/URL/spoiler, ban/ayrılma,
engel/removed geri alma, ban yarışı, arşiv ve hesap kapatma/cascade (10,
üst test dahil). Reaction+lifecycle+communities+edit+navigation toplam 43.
Legacy communities fixture'ı 53. migration'ı da açıkça uygular.
`tests/browser/community-post-reactions.spec.ts` COMMUNITY_E2E=1 desktop
iki gerçek oturumda hata sonrası sayı/tercih, tekrar, yalnız kendi kayıt
filtresi, URL/reload/geri, export, yazar/anonim/forged-user sınırı, 21 kayıt
sayfalama ve son sayfadan geri düşme, arşivde geri almayı sınar. Yeni senaryo
ile önceki navigation/edit toplam 3 browser geçti; kendi ID'leri temizlenir.
Typecheck/ilgili lint/statik UI-a11y ve build; genel/mobil matris değildir.

`tests/community-review-editing.test.mjs`: filtre/URL doğrulama ve pagination
öncesi 25 kitap incelemesi, yetki/ban/arşiv/removed, no-op/girdi, snapshot
koruma, audit rollback, iki bağlantılı edit yarışı ve şikâyeti koruma (8,
üst test dahil). Eski `communities` fixture'ının açık migration listesine
52. migration eklendi; eski sohbet revision=0/editedAt=null da doğrulanır.
Review-edit+navigation+references+distribution+communities toplam 35 geçti.
`tests/browser/community-review-editing.spec.ts` COMMUNITY_E2E=1 desktop
iki gerçek oturumla filtre/sayfa/geri-ileri/reload, geçici hata ve stale edit
taslağı, yeniden yükle/kaydet, spoiler, sabit kaynak, yöneticiye kapatma,
arşiv, filtreyi temizleme ve farklı tür yeni paylaşımı görünür tutmayı sınar.
Yeni senaryo + navigation + reviews toplam 3 ilgili browser geçti. Fixture'lar
yalnız kendi ID'leriyle temizlenir; dış sağlayıcı yoktur.

`tests/community-navigation.test.mjs`: eski URL'ler, kimlik/sayfa sınırı,
detay-liste dönüşü, filtre, çakışan hedef/tekrarlı sorgu normalizasyonu (4).
`tests/browser/community-navigation.spec.ts` COMMUNITY_E2E=1 desktop koyu
gerçek oturum/21 paylaşım/41 yorum/21 etkinlik fixture'ında: sayfa2/detail,
geri/ileri/reload, aynı rota Link geçişi, spoiler yeniden gizleme, etkinlik
filtre+sayfa dönüşü, okuma hatası/yeniden dene ve oluşturma taslaklarını
sınar. Sadece kendi fixture ID'leri temizlenir; harici sağlayıcı yoktur.
Yeni test ve mevcut etkinlik/inceleme browser'ları (3 senaryo) geçti;
navigation+RSVP birimleri toplam 13. Mobil/açık tema/genel matris değildir.

`tests/sqlite-rehearsal.test.mjs` kaynak baytları/read-only snapshot, Unicode/
BLOB/büyük integer, mevcut hedefi koruma, tam içerik/şema farkı, foreign key/
bozuk dosya, WAL commit ve eski şemanın CLI'da kod 1 vermesini sınar.
`tests/sqlite-load-probe.test.mjs` yüzdelik hesabı, görev sınırı ve mevcut
DB dosyasını reddetmeyi sınar. İkisi 11; RSVP paketiyle toplam 20 kontrol.
`db:rehearse-restore` yalnız geçici kopyada yazma/rollback; `db:probe-load`
yalnız sentetik DB'de 1/4/8 görevli ölçüm yapar. Gerçek veriye yük verilmez.
Kapsam/yerel ölçüm: `docs/SQLITE_KURTARMA_VE_YUK_PROVASI.md`.

`tests/event-worker-operations.test.mjs` yerel kayıt başlangıç/başarı/hata,
35 saniye canlılık ve beş dakika ilerleme/kuyruk sınırları, bozuk/gelecek
kayıt, atomik seri yazma, instance/DB ayrımı, kapanış ve gözetmen devre
kesicisini sınar. Geçici migration'lı SQLite ile gerçek worker CLI çalışır;
gerçek çocuk kapanışı/yeniden başlama da ayrıca doğrulanır. Gerçek kullanıcı
verisine yazmaz. Outbox paketiyle toplam 19 kontrol; ilgili lint/typecheck.
UI değişmediğinden bu paket browser/full build/mobil matrisini gerektirmez.

`tests/platform-community-cases.test.mjs` geçici SQLite üzerinde başvuru/
itiraz sahipliği, özel DTO, global/yerel yetki ve çıkar çatışması, tekrar,
atomik audit rollback, eski sürüm ve iki ayrı bağlantıda eşzamanlı karar,
sayfalama ve hesap silmeyi sınar. 9 kontrol (üst test dahil).
`tests/browser/platform-community-cases.spec.ts`, COMMUNITY_E2E=1 desktop
opt-in ile gerçek iki oturumda başvuru, hatada taslak, bağımsız yanıt,
yetki geri alımı, origin/anonim sınırı ve export'u sınar. Yalnız kendi
geçici fixture ID'lerini temizler; dış sağlayıcı çağırmaz.

- Çalışan geliştirme sunucusunu gereksiz yere yeniden başlatma.
- Production build'i küçük CSS veya metin değişikliklerinde çalıştırma.
- Tam repo taramasını yalnız mimari veya güvenlik incelemesinde yap.
- Ekran görüntüsünü yalnız tasarım kararı vermek gerektiğinde üret.
- Hata görülürse toplu doğrulama zamanını beklemeden ilgili dar testi çalıştır.
