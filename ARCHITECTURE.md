# ListeKutusu Mimari Özeti

## Uygulama katmanları

- `scripts/serve-draft-acceptance.mjs` gerçek oturumlu dar kabulü yalnız
  kaynak whitelist kopyası ve yeni geçici DB üzerinde çalıştırır. Kalıtılan
  uygulama sırları/hedef URL yoktur; rastgele loopback portu ve tek çalışma
  kilidi vardır. Kontrol dosyası finish/abort alır; son koşullar doğrulanır,
  test sunucusunun upgrade soketleri dahil bağlantıları kapatılır ve sınırı
  doğrulanan geçici klasör temizlenir. Normal DB/.next hedeflenmez.
- `app/`: Next.js App Router sayfaları, route handler'lar ve rota kapsamlı stiller.
- `app/(social)/`: ana akış, Keşfet, forum, profil, paylaşım ve oyun rotaları;
  URL'leri değiştirmeyen ortak layout masaüstü bölüm navigasyonunu kalıcı tutar.
  Sayfaya özel başlıklar ve işlemler sayfa içinde kalır.
- `app/components/`: ortak arayüz bileşenleri.
- `app/hooks/`: istemci etkileşimi ve veri yükleme kancaları.
- `lib/`: iş kuralları, oturum, moderasyon, liste, Spotify ve oyun servisleri.
- `prisma/`: veri modeli ve migration'lar.
- `scripts/`: bakım, doğrulama, yedek ve içerik araçları.
- `tests/`: birim, API E2E ve Playwright masaüstü kontrolleri.

## Veri çekirdeği

Uygulamanın çekirdeği kendi veritabanıdır. Kullanıcı, profil, kişisel liste,
öneri, sosyal paylaşım, yorum, takip, bildirim, forum, moderasyon ve oyun durumu
Prisma modellerinde tutulur. Spotify kimlik doğrulaması uygulamanın ana hesap
sistemi değildir.

## Kimlik ve yetki

- Profil kaydetme yanıtı istemcide hesap ID'si ve profil alanlarıyla
  doğrulanır. Yalnız bu alanlar baseline'a alınır; başarıda editör kabul
  edilen sunucu değerleriyle eşitlenir. Kaydet-ve-devam yalnız doğrulanan
  başarıda seçili yerel/geçmiş hedefine gider; hata taslağı/hedefi korur.
- Kullanıcı hesabı e-posta ve parola ile açılır.
- Oturumlar sunucu tarafında saklanan, özetlenmiş token'larla yönetilir.
- Üye, moderatör ve yönetici yetkileri sunucu rotalarında kontrol edilir.
- Mutation rotaları aynı kaynak ve oturum denetiminden geçer.

## Sosyal ve liste akışları

- Müzik paylaşımı yorumları, GET'in bir seviyelik Prisma reply kayıtlarını
  istemcide normalize eder; okuma ve mutation yanıtları görünüm/sayaç/taslak
  değiştirilmeden doğrulanır. 401'de yalnız açık kullanıcı işlemiyle tek
  yorum taslağı sessionStorage'a aktarılır: aynı hesap/paylaşım, 15 dakika
  geçerlilik, tek tüketim. Sekme kapanınca temizlenen bu alan kalıcı taslak
  arşivi değildir; süre dolumu okurken denetlenir. Giriş dönüşü otomatik
  göndermez, kayıp yanıt hedefini ana yoruma dönüştürmez.
- Akış, forum ve keşfet sorguları sunucu tarafı servis fonksiyonları üzerinden çalışır.
- Her kullanıcının tek kişisel listesi bulunur.
- Kitaplık müzik/dizi/film/kitap bölümlerinin ortak yönetim yüzeyidir. Müzik
  mevcut UserList/Suggestion ve kontrol API'lerini kullanır; diğer türler ayrı
  MediaLibraryEntry kayıtlarıdır. Eski `/control` müzik kitaplığına yönlenir.
- Spotify yalnız arama, dış bağlantı ve liste sahibi onaylı senkron için kullanılır.
- Toplu içe aktarmada track kimlikleri ayrıştırılır ve tekrarlar temizlenir.
- Müzik dışı özel kitaplık `MediaLibraryEntry` tablosunda ayrıdır; müzik
  önerileri veya Spotify senkronuna katılmaz. Arama sağlayıcı verisini normalize
  eder ve kullanıcıya bağlı süreli seçim imzalar; kitaplık API'si yalnız bu
  doğrulanmış seçimi kaydeder. `showcasedAt` açık tercihidir; kamuya açık profil
  yalnız son 6 seçimin metadata'sını döndürür, okuma/izleme durumlarını taşımaz.
  Özellik anahtarı ve karşılıklı engelleme medya vitrini sorgusunu da sınırlar.
- Yeni katalog sağlayıcıları film için Wikidata, dizi için TVmaze, kitap için
  Open Library'dir. Eski TMDB snapshot kayıtları korunur, yeni TMDB isteği yoktur.
  Süreç içi sınırlı metadata cache/istek birleştirme kullanıcı imzalarından ayrıdır;
  çok sunuculu yayında ortak cache ve sağlayıcı limit deposuna taşınmalıdır.

## Üniversite profil alanı

- UserList.universityName nullable, universityPublic varsayılan false'dur.
  Ad 2–120 karakter, NFC/boşluk normalizasyonlu tek satır kullanıcı beyanıdır.
  Resmi kurum kaydı, doğrulanmış öğrencilik veya e-posta alan adı denetimi değildir.
- PATCH /api/accounts/settings update-profile, isteğe bağlı university
  {name, public} grubunu doğrular. Grup yoksa mevcut değer korunur; boş ad
  null/false yapar. Kimlik session'dan gelir, payload hedef kullanıcı seçmez.
  Yeni istemci yalnız bu grup gerçekten değişmişse gönderir. Mevcut profil
  düzenleme last-write-wins kalır; eşzamanlı açık değişiklikler için CAS yoktur.
- /api/accounts/me (tam/summary), settings yanıtı ve özel hesap dışa aktarımı
  sahibine alanları verir. getPublicProfile yalnız açık ve engellenmemiş adı
  döndürür; gizli ad null, universityPublic kamu DTO'sunda yoktur. RSC de aynı
  projeksiyondadır. API private/no-store; önceden görülmüş kopyaları geri alma
  veya diğer açık sekmelerde push ile anlık güncelleme vaadi yoktur.
- Hesap silme alanları temizler. Arama/keşif/akış/topluluk author DTO'ları bu
  alanları henüz almaz. Üniversite profil tamamlanma puanına dahil değildir.

## Topluluk sınırı

- `/communities` keşif/oluşturma, `/communities/[slug]` üyelik, sohbet ve
  yönetim ekranıdır. Ana navigasyon buraya gider; eski `/forum` korunur.
- `Community`, `CommunityMember`, `CommunityPost`, `CommunityComment` ve
  `CommunityReport` mevcut müzik akışı ve forum modellerinden ayrıdır.
  Herkese açık okuma, yalnız aktif üyeye yazma vardır. CommunityPost artık
  discussion/review türlerini ayırır; incelemeler eser türü/başlığı, 1–10
  tam sayı puan, spoiler ve isteğe bağlı kaynak bağlantısı taşır. Eski
  sohbetler migration varsayılanıyla discussion olarak korunur. Özel
  topluluklar henüz yoktur. Etkinlikler ayrı CommunityEvent
  modelindedir; müzik/sohbet alanlarını zorunlu tutmaz.
- Elle girilen inceleme bağlantısı izin verilen sağlayıcıların HTTPS adresidir;
  sunucu bu URL'yi çağırmaz, manuel başlık katalog doğrulaması değildir.
  Özel kitaplık ve müzik senkronuna otomatik kayıt yoktur.
- `/api/communities/references` oturum sahibinin ilk 20 eşleşen kitaplık
  kaydını listeler; music için yalnız kendi approved Suggestion kayıtları.
  Kimlikler seçim DTO'sunda yalnız sahibine gider; özel durum/sahip alanı yoktur.
  Yayın sırasında `reference.id` tekrar aynı transaction'da sahiplik/tür
  kontrolünden geçer. Başlık ve canonical HTTPS kaynak URL sunucudan alınır;
  istemcinin metadata'sı veya provider iddiası kullanılmaz.
- Doğrudan katalog seçimi film/dizi/kitap için mevcut /api/catalog/search
  sonuçlarının kullanıcıya bağlı 30 dakikalık selectionToken'ını kullanır.
  create-post catalogSelection alır; reference ile birlikte veya sohbet/
  müzik/oyunda reddedilir. Aynı yazma transaction'ında üyelik/aktif hesap/
  arşiv kontrolünden sonra imza, süre, kullanıcı, tür ve güncel sağlayıcı
  doğrulanır; URL provider/externalId'den yeniden kurulur. İstemci title/URL/
  provider'ı güven kaynağı değildir. MEDIA_CATALOG_ENABLED kapalıysa yeni
  katalog seçimi 503; manuel/kitaplık/eski yayın okumaları korunur.
  Yayın sırasında dış istek, private library satırı veya yeni provider yoktur.
- CatalogReferencePicker açık Ara/Enter ile en fazla 20 sonuç ister; yazarken
  istek atmaz. Query/tür değişince eski istek iptal edilir; yeni tür eski
  seçimi kullanmaz. Başarılı yeniden arama aynı ID'de bile seçimi boşaltır,
  böylece yeni token açık seçimle alınır; hata mevcut seçim ve taslağı korur.
  Süre hatası metni silmez. Token/query kalıcı taslak, DB veya public DTO'ya
  yazılmaz; mevcut public snapshot yalnız eser adı/kaynak/provider'dır.
  Kaynak etiketi artık kitaplık kökeni iddia etmez; TVmaze atfı korunur.
  Katalog endpoint'inin hata yanıtları da private/no-store'dur.
- CommunityPost.referenceProvider, eser adı ve kaynak URL kalıcı metadata
  snapshot'ıdır; private library FK/kimliği tutulmaz. Kitaplıktan kaldırma
  yayımlanmış incelemeyi silmez. Bu bağlama dış istek/Spotify senkronu
  üretmez; oyunlar manuel kalır. TVmaze snapshot'ında mevcut atıf kullanılır.
- Spoiler'ın akış önizlemesi sunucuda boşaltılır. Detay metni/yorumları
  kullanıcı açana kadar DOM'a konmaz. Detay API'si kamuya açıktır: spoiler
  gizleme bir erişim/gizlilik kontrolü değildir. Başlık/eser adı görünürdür.
- `lib/communities.ts` transaction içinde üyelik/rol/yasak ve hedef topluluk
  kontrolünü yapar. Kurucu topluluğundan ayrılamaz; yalnız kurucu moderatör
  atayabilir. Global hesap rolü otomatik topluluk yöneticiliği vermez.
- `lib/communityHttp.ts` gerçek oturum, aynı origin, JSON/24 KB gövde sınırı
  ve hız sınırını uygular. Yanıtlar kişiselleştirilmiş olduğundan no-store'dur.
- Kamuya açık içerik yalnız aktif yazarlardan gelir; iki yönlü engelleme
  yazarı ve yorumlarını gizler. Rapor/üye yönetim DTO'ları yalnız yetkiliye
  gider. İçerik kaldırma soft-delete'dir; uzaklaştırma kaydı yeniden katılımı
  engeller. Raporlar uygulama katmanında hedef topluluğa doğrulanır.
- Keşif/paylaşım sayfaları 20, yorumlar 40 kayıtla sınırlıdır. İlk yönetim
  eski detay DTO'su uyumluluk için son 50 üye/ilk 30 bekleyen raporu korur.
  Aktif yönetim UI'sı artık aşağıdaki ayrı sayfalı endpoint'i kullanır.
- Topluluk stilleri yalnız ilgili rota layout'unda yüklenir.

### Topluluk paylaşımı beğenisi ve özel kayıt

- CommunityPostLike/Save, UserList+CommunityPost'a cascade ve userId/postId
  composite primary key kullanır; müzik FeedLike/Save'e bağlanmaz. set-like/
  set-save strict boolean active alır, toggle yapmaz. Tekrar createdAt'ı,
  içerik/revision/dağıtımı değiştirmez. Aktif hesap ilk-write kilidi altında
  ekleme mevcut üyelik/arşiv/engel/yazar/status sınırını tekrar denetler.
- Kendi paylaşımına beğeni yok; kendi kaydı serbest. Geri alma üyelik/arşiv/
  görünürlükten bağımsız yalnız aktör+post+source ile deleteMany yapar;
  yok/engelli/kaldırılmış hedefin varlığını açıklamaz. Ayrılma/ban beğenileri
  transaction içinde temizler; kayıtlar kişiye özel kalır. Hesap kapanışı
  yalnız kendi iki tercih tablosunu temizler; fiziksel post/user silme cascade.
- Sayfa başına bounded groupBy ve kendi postId seçimleri; liker/saver listesi
  veya saveCount DTO'ya girmez. likeCount aktif kaynak üyeleri/aktif hesap ve
  görüntüleyenin iki yönlü engel filtresine bağlıdır; viewerLiked/viewerSaved
  yalnız kendi bitleridir. Push/canlı sayı, bildirim/puan/öneri sıralaması yok.
- GET saved=1 yalnız aktif oturumun kendi kayıtlarına where filtresidir;
  20 kayıt/100 sayfa ve içerik tipiyle birleşir, sıra paylaşım tarihidir.
  Kaydetme snapshot değildir; kaldırılan/deaktif yazarlı/engelli içerik
  görünmez. Görünmeyen kaynak tercihi bilinen ID ile geri alınabilir; toplu
  gizli kayıt toplu temizleme yok.
- Özel account export yalnız kendi tercih zamanını/source id+slug verir;
  başkasının tercihini veya kaynak metnini kopyalamaz. UI ilk olarak kaynak
  topluluk liste/detayında ve Yeni/Takip karma kartlarında aynı tercihlerdir.
- communityBatchReactionMetrics kaynak başına sorgu çalıştırmaz: bounded
  kaynak OR koşulu, tek groupBy ve kendi bit sorguları kullanır. Her beğeni
  kendi kaynak üyeliğine göre sayılır; diğer topluluk üyeliği yeterli değildir.
- /community-saved ve GET /api/communities/saved yalnız aktif oturumun kendi
  görünür kayıtlarını gösterir; payload/query hedef kullanıcı seçmez. 20 kayıt,
  100 sayfa; tür/alan filtreleri sayfalamadan önce, sıra savedAt+postId desc.
  Count/sayfa/metrikler aynı read transaction'dadır. DTO body/özel kimlikler
  veya başkalarının kayıtlarını taşımaz; spoiler excerpt boş, TVmaze atfı korunur.
  Arşiv ve community dağıtım görünür kaynak okumayı kapatmadığından listede
  kalır; yeni tercih kaynak üyeliği/aktif topluluk gerektirir. Kaynak topluluk
  içi kayıt filtresinin içerik tarihine sırası değişmez. Müzik Kaydedilen ayrıdır.
- Karma/merkez butonları mevcut source-scoped POST'u surface=feed/saved ile
  kullanır. Feed eklemesi kilit altında general dağıtımı tekrar doğrular.
  Bu isteğe bağlı bağlam ek yetki vermez; normal kaynak yazma kuralları kalır.
  Yazma yanıtı aynı transaction'da güncel minimal reactionState döndürür;
  görünmeyen/eksik geri alma hedefinde aynı null gelir, kaynak metni dönmez.
  Başarısız istek sahte tercih/sayı üretmez, eski yanıt değişmiş kartı ezmez.
  Feed'den çekilen hedefin başarılı geri alması eski kartı metinsiz duruma
  geçirir. Push ile anında geri çekme veya sekmeler arası senkron vaadi yoktur.

### İnceleme düzenleme ve içerik filtreleri

- CommunityPost revision=0, editedAt=null migration varsayılanları eski
  sohbetleri korur. `edit-review` yalnız aktif kaynak üyesi yazar; yerel
  yönetim/global rol başkasının metnini değiştiremez. Arşiv/ban/silinmiş
  içerik mevcut yazma sınırında kapalıdır. Başlık/metin/puan/spoiler değişir;
  eser/kaynak/provider/yazar/tür/dağıtım payload'dan alınmaz.
- expectedRevision safe integer ve mevcut sürümle eşleşmelidir. Aktif hesap
  ilk-write kilidinden sonra revision CAS, editedAt ve veri-minimum audit
  aynı transaction'dadır. No-op revision/tarih/audit üretmez. Edit mevcut
  raporu kapatmaz, eski metni audit'e kopyalamaz; tam değişiklik geçmişi yoktur.
- GET community detail postType=all/discussion/review, reviewKind=all veya
  altı izinli alan; alan yalnız review türünde geçerlidir. API hatalı değeri
  reddeder, URL parser güvenli varsayılana döner. Filtre where içinde count/
  pagination öncesidir; yazar/engel/üyelik projeksiyonu değişmez.
- URL filtreyi taşır. Eski isteğin kartları yeni filtrede gösterilmez.
  Başarısız/stale edit formu tutulur; açık kapatıp yeniden yükleme seçeneği
  taslağı siler. Otomatik merge/kalıcı taslak veya geri alma yoktur.

### Masaüstü topluluk gezinmesi

- `communityNavigation` saf parser/serializer; section, post/event, paylaşım/
  yorum/etkinlik sayfası ve etkinlik filtresi URL'dedir. Kimlik 1–100 izinli
  karakter, sayfa 1–100; geçersiz değer güvenli varsayılan olur. Eski post,
  event ve section=events bağlantıları korunur. Etkinlik hedefi önceliklidir.
- `useCommunityNavigation` history push/replace ve popstate'i aynı parser'la
  eşler; server query geçişinde de senkronlar. Page key yalnız slug'dır;
  aynı toplulukta query değişimi tüm istemciyi yeniden kurmaz. Liste konumu
  detay açılıp kapatılırken korunur. Mutation sonrası reset replace kullanır.
- Composer detayda gizlenir; etkinlik paneli ilk açılıştan sonra sekmeler
  arasında mount kalır, gizliyken fetch başlatmaz. Oluşturma formları detayda
  gizlenir, yazılanlar aynı sayfa içi gezinmede korunur. Kalıcı taslak deposu,
  reload/başka sayfadan dönüş veya yetki/okuma hatası sonrası taslak kurtarma
  garantisi değildir. Spoiler açma tercihi URL'ye/kalıcı depoya yazılmaz.
- Yerel topluluk komutları ortak taslak kaydından çıkış onayı ister.
  `preserveOnLocalNavigation` mount kalacağı bilinen oluşturma formları,
  keşif bilgileri ve sahiplik hedefi içindir; yerel onayda kaydet/sil kapsamına girmez,
  global çıkışta girer. Busy kayıtlar kapsamdan bağımsız geçişi kilitler.
  Yorum sayfası değişimi aynı editörü korur; mutation sonrası replace ve
  zaten onaylanmış liste çıkışı ikinci onay açmaz. Native popstate hâlâ
  URL'yi eşler. Navigation API destekli aynı belge geçmişinde ortak guard,
  capture popstate ile taslağı tüketicilere geçmeden mevcut entry'ye döner,
  onaylanmış hedefi özgün index/key ile tekrar oynatır. History state veya
  metotlarını patch etmez; hash/yorum sayfası güvenli geçiştir. Hızlı tekrar
  dönüşü geçersiz kılarsa delta yeniden hesaplanır. API yoksa kurulum atlanır;
  gerçek belge çıkışında mevcut beforeunload uyarısı kullanılır.
- Yönetim karar notları geçici yükleme/okuma hatasında mount kalır; görünüm
  gizlenir ve mevcut istek tamamlanınca aynı kayıt anahtarlarıyla devam eder.
  Başka kararın kaydı ilgisiz notları silmez. Panel kapatma/filtre/sayfa ve
  üye iptali ortak çıkış kaydını kullanır. 401/403/404 özel data'yı kaldırır;
  yetki kaybından taslak kurtarma vaadi yoktur. Disabled/readOnly ile gerçek
  busy ayrıdır; salt okunur panel gezinmeyi kalıcı kilitlemez.
- useCommunityRead paylaşım detayı ve etkinlik liste/detayında sonucu URL+
  yenileme nesliyle damgalar. Render yalnız mevcut anahtarın data/error'ını
  kullanır; filtre/sayfa/hedef değişimindeki ilk render bile eski başlık,
  katılımcı veya yetki düğmesini kullanmaz. Önceki istek abort ve signal
  denetimiyle iptal edilir. Pasif panel veri göstermez/istek başlatmaz;
  etkinlik detayındayken liste ayrıca okunmaz. Hata güncel hedefte retry alır.
- Kaldırma/iptal onayı yalnız güncel kaynak detayıyla görünür; hedef değişimi
  eski onayı kapatır. Kaydetme, üyelik ve rol kontrolleri yine sunucudadır.
- İnceleme editöründe başlık/metin/puan/spoiler farkı izlenir. Değişiklik
  varsa Akışa dön ve Düzenlemeden vazgeç, ortak modal ile taslak silme onayı
  alır; iptal/Escape formu korur. Değişmeyen form veya başarılı save onay
  istemez. Bu yalnız bu iki sayfa içi komut içindir: tarayıcı geri/yenileme,
  dış linkler, sekme kapatma ve okuma/yetki hatası kurtarması değildir.
  Kalıcı depolama/beforeunload/global navigasyon engeli eklenmez.

### Topluluk yönetimi ve karar günlüğü

- GET /api/communities/[slug]/management private/no-store ve mevcut okuma
  hız sınırındadır. Aktif hesap + aktif kaynak topluluk kurucu/moderatörü
  gerekir. reports/members/history görünümleri 20 kayıt, page 1–100 ile
  sınırlıdır. Şikâyette pending/reviewed/all ve hedef türü, üyede aktif/
  uzaklaştırılmış/tümü ve ad/slug araması vardır. Sıralama createdAt+id veya
  joinedAt+userId ile deterministiktir; count ve sayfa aynı read transaction'dadır.
- CommunityManagementPanel yalnız açıldığında yüklenir; eski istekleri iptal
  eder. Görünüm/filtre değişimi sayfayı sıfırlar. İnceleme ve üye işleminde
  not taslağı başarısız yazmada korunur. Üye kararları açık onay alır.
- CommunityReport reviewedAt/reviewedById sadece yeni kararlar için yazılır;
  eski reviewed kayıtların null metadata'sı bilinmeyen olarak gösterilir.
  CommunityModerationLog, hedef türü/ID, action, actorId, zaman ve opsiyonel
  not tutar. Yeni işlemle aynı transaction'dadır. Üye ban/unban/promote/demote,
  inceleme/kaldırma, etkinlik iptal/kaldırma, yönetimin etkinlik düzenlemesi
  ve değişen keşif etiketleri kaydedilir. İçerik metni/reporter kopyalanmaz.
- Actor/reviewer FK onDelete SetNull; hesap pasifse DTO'da adı/slug'ı null
  gösterilir. Log hedefi generic ID'dir; hedef içerik silinse de iz kalır.
  Topluluk fiziksel silinirse log cascade olur. UI'dan log güncelleme/silme
  yoktur; saklama/hesap yaşam döngüsü politikası pilot öncesi açık iştir.
- communityHealth / check:communities, 12 salt okunur bütünlük/operasyon
  kontrolü sunar; CLI exit 0 temiz, 1 veri hatası veya çalıştırma hatası,
  2 yalnız uyarı. Kullanıcı/şikâyet/konum detayları loglanmaz; public health
  DTO'suna eklenmez. Otomatik veri onarımı yapmaz.

## Topluluk ve etkinlik keşfi

### Sahiplik ve yaşam döngüsü

- Community.status active/archived, archivedAt ve lifecycleRevision içerir.
  Eski kayıtlar active kalır; otomatik arşiv/devir yapılmaz. OwnershipOffer,
  communityId primary key ve benzersiz teklif ID'si ile tek bekleyen teklifi
  tutar. Kaynak/hedef hesap ve topluluk FK cascade'dir; expiry yedi gündür.
- /api/communities/[slug]/ownership GET/POST mevcut communityRequest sınırını
  paylaşır. GET yalnız oturum sahibinin kendi sahiplik/hedef teklif bilgisini
  döndürür; diğer üye offer=null alır. /api/communities/ownership kişiye gelen
  ilk 20 geçerli teklif ve hasMore döndürür; daha fazlası kaynak toplulukta
  açılabilir. Kamuya veya üçüncü kişiye hedef listesi açılmaz.
- offer/accept/decline/cancel işlemleri aktif hesap/üyelik, kaynak sahip,
  hedef, iki yönlü engel, durum/süre ve teklif ID'sini sunucuda doğrular.
  Teklif/kabul ayrı açık onaydır; kabul ownerId + roller + audit + teklif
  silmesini atomik yapar. Eski sahip member kalır. Ayrılma/ban/silme teklif
  kaydını temizler; maintenance:cleanup süresi geçmiş teklifleri temizler.
- archive/restore yalnız aktif sahip ve açık onayla mümkündür. Arşiv read-only
  olup public içerik yetkilerini değiştirmez; membership yazma yardımcısı,
  join ve etkinlik servisleri sunucuda engeller. Ayrılma/own withdrawal kalır.
  Yönetim okuması arşivde açık, mutation kapalıdır. Genel keşif ve karma
  akış active kaynakları süzer; Topluluklarım arşivleri işaretleyip gösterir.
- archiveCommunity yaklaşan scheduled etkinlikler için iki parametreli
  set-based INSERT SELECT ile outbox snapshot'ı oluşturur; event başına
  uygulama döngüsüyle fan-out yapmaz. Sonra RSVP çekimi, event iptali,
  offer temizliği, status ve audit aynı transaction'da uygulanır. Restore
  iptal/RSVP'yi diriltmez; geçmiş etkinlikler yeniden sınıflandırılmaz.
- lockActiveAccount, UserList.id=id parametreli UPDATE ile SQLite writer
  lock alır; profil updatedAt'ına dokunmaz. Topluluk create/mutate ve yaşam
  döngüsü işlemleri okumadan önce bunu yapar. Etkinlik/RSVP mevcut ilk-write
  kilidi de SQLite'da aynı yazıcıyı paylaşır. Bu PostgreSQL lock tasarımı değildir.
- accountDeletion servisi önceden doğrulanmış server-read parola hash'ini
  kilit altında tekrar karşılaştırır. Aktif owned varsa açık arşiv bool'u
  yokken 409; onay varsa 20 toplulukluk okuma batch'leriyle tek transaction'da
  arşivler. Üyelik tekliflerini, RSVP'yi ve kendi yaklaşan etkinliklerini
  kapatır; başka toplulukta iptal edilen kendi etkinliğinin audit'ini ekler.
  Sonra mevcut profil/müzik silme ve oturum iptali yürür. Aktör/düzenleyen
  hesap silinince onun eski/bekleyen bildirimleri kaldırılır; bu kaynaktan
  iptal bildirimi teslimi garantisi yoktur. Başkalarının topluluk metni silinmez.
- DELETE accounts/delete origin, JSON/16KB, açık confirmation, strict bool,
  gerçek parola ve rate limit denetimi kullanır; hata/no-store JSON döner.
  UI şifre/onayı hata halinde korur, ayrı varsayılan kapalı archiveOwned
  checkbox'ı gönderir. Eski istemci owned=0 iken çalışır; owned>0 iken güvenli
  409 verir. Spotify temizliği commit sonrası best-effort mevcut davranıştır.

### Etiket bazlı keşif

- Community'nin nullable universityName/universityKey/city/cityKey/interest
  alanları açık topluluk etiketidir; UserList üniversitesinden ayrıdır.
  Oluşturma ve aktif kurucu/moderatör update-discovery mutation'ı 2–120/2–80
  karakter tek satır etiketleri ve ilgi alanı allowlist'ini doğrular. Bu işlem
  yalnız üç etiketi değiştirir; kurucu/kategori/rol istemciden güncellenmez.
- GET /api/communities, view=events ile yalnız genel dağıtımlı scheduled ve
  gelecek etkinlikleri listeler; aksi halde topluluk dizinidir. Kategori/metin/
  üniversite/şehir/ilgi alanı/aktif üyelik filtreleri sorguda, sayfalama öncesinde
  uygulanır. Etkinlik şehri kendi cityKey alanıdır; üniversite/ilgi alanı kaynağı
  topluluktur. Özel/açık kişisel üniversiteye join veya otomatik eşleştirme yoktur.
- Arama anahtarları NFC, Türkçe harf/ASCII case ve boşluk katlaması kullanır.
  SQL migration mevcut etkinliklerin Türkçe şehirlerini backfill eder; normal
  yazmalar aynı anahtarı hesaplar. Etkinlik sırası startsAt/id artan, topluluk
  createdAt/id azalandır. 20 kayıt, 1–100 sayfa; büyük ölçek sorgu/yük ölçümü
  pilot işidir. Bu kurum kataloğu/alias, konum doğrulama veya GPS değildir.
- Public DTO yalnız açık etiketleri alır, normalleştirilmiş key/özel profil/
  katılımcı listesi almaz. Etkinlikte aktif organizer ve iki yönlü engel filtresi
  vardır; iptal/geçmiş/kaldırma/topluluk-only keşfe çıkmaz. RSVP yetkisi değişmez.
- İstemci filtreleri URL'ye yazar, yenileme/popstate ve detaydan dönüşte okur;
  bekleyen eski istekleri iptal eder. Okuma hatası topluluk yaratma taslağını
  unmount etmez. Ortak communityRequest no-store/origin/session/hız sınırları
  korunur. Eski topluluklar null etiketli kalır; otomatik üniversite türetilmez.

## Özel etkinlik ajandası

- /community-events ve GET /api/communities/agenda yalnız aktif oturumun
  mevcut RSVP'leri veya organizerId'siyle ilişkili görünür kaynakları verir.
  Query/payload userId hedef seçmez. Okuma activeUser, count ve 20 kayıtlık
  sayfayı aynı read transaction'da yapar; page 1–100, strict view/role allowlist.
- upcoming: active topluluk + scheduled/gelecek + kendi attending/interested
  veya düzenleyen. past: scheduled/başlangıcı geçmiş; cancelled: cancelled.
  Son ikisinde kendi withdrawn kaydı da ilişki sayılır. Bu fiziksel katılım
  geçmişi değildir; yok olmuş eski RSVP bilgisi türetilmez. Rol all/responded/
  organizing filtresi pagination öncesindedir. Sıra startsAt (upcoming asc,
  diğerleri desc) + id asc; düzenleyen+RSVP çakışması tek event satırıdır.
- Yalnız aktif ve iki yönlü engellenmemiş organizer, removed olmayan event
  seçilir. Arşivlenmiş kaynakların görünür geçmiş/iptal içerikleri korunur;
  community dağıtımı özel okuma olmadığı için genel dağıtım koşulu aranmaz.
  DTO kaynak özetini, yalnız kendi viewerStatus/isOrganizer/canWithdraw'ını
  verir; description, raw responses/katılımcı listesi, özel ID'ler ve sayılar yok.
- Ajanda katılım eklemez, etkinlik düzenlemez/iptal etmez. Kendi geri alması
  açık onaydan sonra mevcut source event POST rsvp=withdrawn sınırındadır.
  Kapasite/üyelik/yazma/origin kuralları genişletilmez. Başarısızlık sahte
  durum üretmez; organizer kendi RSVP'sini geri alırsa event scheduled kalır.
  Yaklaşan listenin son kaydı çıkınca önceki sayfaya dönülür; organizing
  görünümünde event kalır. Geç yanıt değişmiş URL'yi eski sayfaya götürmez.
- UI ortak useCommunityRead, URL/geri/reload ve private/no-store kullanır;
  eski filtre kartı/onayı göstermez. Yeni tablo/migration, takvim dışa aktarımı,
  otomatik hatırlatma, diğer kişinin ajandası veya yeni bildirim yoktur.

## Topluluk içerik dağıtımı

- CommunityPost ve CommunityEvent.distribution, community/general değerleri
  taşır; uygulama katmanında allowlist ile doğrulanır. Migration/eski istemci
  oluşturması community varsayılır, mevcut içerik otomatik genel olmaz.
  Her iki seçenek de kamuya açık okumadır; yalnız keşif dağıtımı değişir.
- GET /api/communities/feed, yalnız topluluk içeriklerinin genel dağıtım
  sorgusudur. İki tablodan en fazla 11'er satır alıp
  createdAt/kind/id azalan sırasıyla 10 kayda indirger. Opaque cursor aynı
  zamanlı iki türde tekrar/kayıp oluşturmadan sınır uygular. Bu canlı sorgudur;
  snapshot veya kaldırılmış içeriğin istemciden anlık silinmesi vaadi yoktur.
- Aynı aktif yazar/iki yönlü engel/kaldırma sınırları uygulanır. İnceleme
  gövdesi spoiler ise DTO'ya konmaz; diğer önizlemeler 240 karakterdir.
  Kaynak topluluk ve detay URL'si vardır; özel kitaplık/katılımcı bilgisi yoktur.
  Gelecekteki scheduled/cancelled etkinlikler gelir; iptal etiketlidir.
- Yazar/aktif yönetim post dağıtımını mevcut POST mutation ile değiştirir.
  Etkinlik tercihi PATCH ve contentVersion ile değişir; gönderilmezse mevcut
  değer korunur. Yalnız dağıtım değişimi sürümü artırır, RSVP bildirimi göndermez.
  Genel keşfe açmak RSVP'nin aktif üyelik koşulunu değiştirmez.
- GET /api/feed/mixed, Yeni/Takip için FeedPost ile aynı topluluk servisinin
  görünür sonuçlarını createdAt/kind/id azalan sırasıyla birleştirir. Sayfa
  toplam 10 içeriktir; cursor üç kaynakta da uygulanır. Eşit ID/tarih tür
  alanıyla ayrılır. Tür filtresi sunucuda all/music/discussion/review/event.
  Takip yalnız Follow ilişkisine bakar; topluluk üyeliği otomatik takip değildir.
  Müzik gizleme/aktif yazar/engel filtreleri sorguda, müzik etkileşim bayrakları
  mevcut ilişkilerden gelir. musicFeedPresentation eski ve karma DTO'yu paylaşır.
- Müzik FeedPost kopyası oluşturulmaz. API müzik postları ve topluluk kartlarını
  ayrı tipli dizilerde döndürür; istemci aynı saf karşılaştırıcıyla sıralar.
  Böylece mevcut müzik etkileşimleri yalnız müzik kimliklerine işlem yapar.
  Topluluk kartı detay rotasına götürür; RSVP yetkisi kaynak toplulukta korunur.
- Yükselen/Sana özel/Kaydedilen mevcut müzik servisinde kalır ve arayüzde açıkça
  etiketlenir. Etiket filtresi yalnız müzikte gösterilir. useHomeFeed istekleri
  kapsam/tür/oturum değişiminde iptal eder; eski yanıt yeni görünümü ezemez.
  İlk yüklemede hata ve yeniden dene, devam sayfasında mevcut içerik ve tekrar
  dene vardır. Şarkı yayınlamak geçerli kapsamı yeniden yükler.
  Topluluk rota CSS'i ana sayfaya taşınmaz; kart CSS module kullanır.

## Etkinlik duyuruları

- Topluluk içindeki Etkinlikler bölümünde oluşturma, yaklaşan/başlangıcı
  geçmiş/iptal edilen liste ve detay vardır. `/api/communities/[slug]/events`
  ile eventId alt rotası session/origin/no-store/gövde sınırını paylaşır.
  Oluşturma ayrı event-create bucket'ında 5/saat; yönetim 40/dakika.
- Yalnız aktif üye oluşturur. Organizer/status istemciden alınmaz; kayıt,
  üyelik kontrolüyle transaction içinde yazılır. Düzenleyen veya aktif
  kurucu/moderatör iptal/kaldırma yapar. İptal duyurusu görünür, kaldırma
  soft-delete ve okumalarda 404'tür. Hedef topluluk her işlemde doğrulanır.
- Tarih/saat ilk sürümde yalnız Europe/Istanbul: dakika hassasiyetli yerel
  tarih UTC'ye çevrilir ve IANA timezone round-trip ile doğrulanır. UTC+03
  dönüşümü ilk sürümün Türkiye kapsamıdır; başka zone/DST genellemesi değildir.
  Geçmiş ve bir yıldan uzak başlangıç reddedilir. UTC saklanır, Türkiye
  saatiyle gösterilir. Başlangıcı geçmiş olmak etkinliğin bittiği anlamına gelmez.
- Şehir/mekân/açıklama kamuya açıktır; oluşturma için açık konum onayı gerekir.
  Okumada aktif organizer ve iki yönlü engelleme filtresi kullanılır.
  CommunityEventRsvp, eventId/userId composite primary key ile tek niyet
  kaydı tutar: attending/interested/withdrawn. Katılacağım kapasite kullanır,
  ilgileniyorum kullanmaz; organizer otomatik katılımcı değildir. Görünür
  sayılar aktif hesap/aktif topluluk üyeliği filtresiyle hesaplanır.
- RSVP transaction'ının ilk sorgusu event.revision artıran UPDATE'dir;
  SQLite writer lock alındıktan sonra üyelik/açıklık/kapasite ve tek kayıt
  kontrol edilir. Ineligible eski tercihler kalıcı withdrawn yapılır;
  böylece reaktivasyon/rejoin eski koltuğu diriltmez. Kilit hataları en fazla
  iki kısa tekrar alır; bu mevcut SQLite tasarımıdır, PostgreSQL'e taşınırken
  yeniden ele alınmalıdır. Etkinlik iptal/kaldırma da event lock ile başlar.
- Ayrılma/yasak aynı transaction'da niyetleri withdraw eder. İptal/kaldırma
  tüm aktif tercihleri çeker. İptal/geçmiş/yasak/yabancı topluluk yeni RSVP'yi
  engeller; kendi vazgeçme işlemi üyelikten ve etkinliğin açık olmasından
  bağımsızdır. Engelleme yeni RSVP/görünürlüğü kapatır, önceki koltuğu otomatik
  bırakmaz; kişi vazgeçebilir. Üyeye özel katılım ayarı yoktur.
- Kamuya açık DTO yalnız sayıları, oturum sahibine yalnız kendi durumunu
  döndürür. Katılacak kişilerin ilk 200 profil adı/slug/id bilgisi yalnız
  aktif organizer/kurucu/moderatöre gider; iki yönlü engelleme süzülür.
  Bu doğrulanmış fiziksel katılım veya rezervasyon değildir. Bitiş saati ve
  bekleme listesi henüz yoktur.
- PATCH event alt rotası aktif düzenleyen/kurucu/moderatörün gelecekteki
  scheduled etkinliği düzenlemesini sağlar. Aynı SQLite writer lock RSVP
  ile kapasite azaltmayı sıralar; mevcut geçerli katılımın altına inilemez.
  İçerik sürümü contentVersion, RSVP revision'ından ayrıdır; eski form 409,
  değişmeyen kayıt sürüm/bildirim üretmez. Tarih/konum değişimi mevcut niyeti
  korur; yeniden onay zorunlu değildir, güncel bilgiyi kontrol etmesi bildirilir.
- Notification.communityEventId, mevcut bildirim merkezine bağlıdır. Aktif
  attending/interested üyeler ve moderatör değişikliğinde düzenleyen, aktör
  hariç bildirim alır; karşılıklı engelleme ve aktif üyelik filtrelenir.
  Düzenleme/iptal/kaldırma ile alıcı snapshot'ı aynı transaction'dadır;
  teslim ayrı işçidedir. Event/version/type/user kimliği çoğalmayı engeller. İptal
  alıcıları niyetler withdraw edilmeden seçilir. E-posta/push gönderilmez.
- Bildirim okuması da erişimi tekrar filtreler, kaldırılmış etkinliğin başlığı
  gizlenir. Bildirim bağlantısı toplulukta Etkinlikler bölümünü ve ilgili
  detayı açar; kaldırma doğrudan listeye gider. Topluluk ekranında bildirim
  merkezi vardır. Silent yenilemede erişimi değişmiş eski event notice'ları
  tutulmaz; eski event geçmişi yeniden yüklenebilir. Fan-out artık kalıcı
  outbox/işçidedir; ayrıntılar sonraki alt bölümdedir.

### Kalıcı etkinlik bildirim outbox'ı

- notifyEventResponders, etkinlik mutation transaction'ında event/version/type
  deterministic job oluşturur, alıcı snapshot'ını tek parametreli SQLite
  INSERT SELECT ile yazar. Kullanıcı başına Notification upsert request'ten
  çıkarılmıştır. Snapshot iptal/kaldırma RSVP çekiminden öncedir. Yeni bir
  olay üretmeyen/no-op veya salt distribution değişimi yine iş üretmez.
- CommunityEventNotificationJob + CommunityEventNotificationRecipient,
  event/actor/user cascade ilişkileriyle kalıcıdır. İşçi 50 alıcılık batch'te
  mevcut hesap/üyelik/iki yönlü engel sınırlarını yeniden daraltır; RSVP'yi
  yeniden aramaz. Alıcı eklemez. İşlem anı snapshot'ından sonra üye olmak
  geçmiş değişikliğin alıcısı yapmaz. Geçersiz alıcı kalıcı olarak atlanır.
- İlk UPDATE SQLite writer lock alır; job revision CAS iki işçiyi sıralar.
  Notification upsert + pending recipient silme + iş ilerlemesi tek
  transaction'dır. Olay tarihini createdAt olarak korur, replay readAt'ı
  değiştirmez. Çökme rollback; kalıcı backoff ve beş hatadan sonra failed.
  Hata kaydı yalnız sınırlı kod, kullanıcı/payload/SQL metni değil.
- scripts/event-notification-worker.mjs ayrı Node sürecidir: 2 saniye,
  tick başına en fazla 20 batch, graceful stop. --once/--status ve açık
  --retry-failed komutları vardır. Kamu worker endpoint'i veya read sırasında
  gizli queue drain yoktur; işçi çalışmıyorsa bildirimler bekler.
- Hesap silme bekleyen alıcılarını ve aktör/düzenleyen olduğu işleri temizler.
  Başarılı alıcı hemen, completed metadata maintenance:cleanup ile 30 gün
  sonra temizlenir; pending/failed temizlenmez. Üretim süreç gözetimi/alarm ve
  gerçek SQLite yükü ayrıca doğrulanmalıdır. PostgreSQL'e geçişte snapshot
  SQL'i ve lock tasarımı yeniden ele alınır. Runbook: docs/ETKINLIK_BILDIRIM_ISCISI.md.

### Etkinlik raporları

- POST event alt rotası action=report ile mevcut origin/session/no-store,
  JSON/gövde ve community-write hız sınırlarını kullanır. CommunityReport
  targetType=event; composite unique hesap/hedef başına tek kayıt tutar.
  Migration gerektirmez. Gerekçe 3–300 karakter; sunucu aktör ve hedefi seçer.
- Yazma event.revision kilidiyle başlar, sonra aktif hesap/aktif üyelik,
  topluluk, scheduled/cancelled durum, aktif düzenleyen ve karşılıklı engel
  kontrol edilir. Kendi etkinliğini raporlama yoktur. Tekrar gönderim
  gerekçeyi değiştirmez, reviewed kaydı yeniden açmaz. ContentVersion ve RSVP
  değişmez; rapor eşiğine dayalı otomatik gizleme yoktur.
- Topluluk detayındaki rol korumalı ilk 30 bekleyen rapor kuyruğu etkinlik
  hedeflerini de döndürür; reporterId/names eklenmez. Kamu/normal üye için
  boş kuyruk; etkinlik detayına sadece aktörün kendi reportStatus/canReport
  alanları eklenir. Düzenleyen olmak kuyruk erişimi sağlamaz; aktif topluluk
  kurucusu/moderatörü olmak gerekir.
- resolve-report mevcut hedef topluluk/aktif yönetim kontrolünü paylaşır;
  reviewed içeriği kaldırmaz. İptal raporları açık bırakır. Soft-remove,
  bildirim alıcılarını seçme, RSVP çekme ve pending event raporlarını reviewed
  yapmayı aynı transaction'da uygular. Kaldırılmış hedefte yeni rapor yoktur.
- Kamuya içerik kopyası/rapor gerekçesi veya yeni bildirim gönderilmez.
  Platforma escalation, karar aktörü/zamanı için kalıcı işlem günlüğü ve
  yönetim sayfalaması bu pakette yoktur; pilot öncesi ayrıca ele alınır.

## Etkinlik işçisi operasyon sınırı

### Pilot ön kontrolü

- scripts/lib/environment-check.mjs saf, değer yazdırmayan ortam doğrulayıcısı;
  check-env ve pilot:check ortak kullanır. Production URL biçimi/HTTPS/yerel
  adres, aynı origin, örnek/basit sırlar ve katalog iletişimi kontrol edilir;
  DNS/TLS veya gerçek sağlayıcı doğrulaması değildir. Sır rotasyonu yapmaz.
- pilot-preflight.mjs mevcut yerel SQLite dosyasını native readOnly+query_only
  ve tek read transaction ile açar. quick_check/FK, tamamlanmış migration
  adları ve dosya checksum'ları, mevcut communityHealth SQL'leri ve kuyruk
  okunur. Eksik dosya yaratılmaz; uyumsuz history bağımlı denetimleri durdurur.
  Native tagged reader Date parametrelerini Prisma'nın SQLite timestamp
  biçimine bağlar; dinamik kullanıcı SQL'i veya yazma bağlantısı yoktur.
- İşçi mevcut özel heartbeat/ilerleme kontrolünden gelir; okunamayan kontrol
  sağlıklı sayılmaz. JSON yalnız kodlar/sayılar/sabit mesajlar içerir; ortam
  değerleri, kişisel kayıtlar ve ham exception yoktur. Script dış HTTP çağrısı,
  migration/replay/restore/temizlik veya süreç yönetimi yapmaz.
- Kod 0 otomatik geçti, 1 hata, 2 uyarı; releaseApproved daima false ve yedi
  manuel kapı unverified kalır. Bu release onayı, tam fiziksel schema diff,
  staging HTTP/worker yükü veya off-host yedek kanıtı değildir. Kamu health
  API'sine eklenmez. Ayrıntı docs/PILOT_ON_KONTROL.md.

### SQLite prova araçları

- `encrypted-backup.mjs`: streaming AES-256-GCM/scrypt, sürümlü sabit
  başlık/AAD, dosya başına salt/IV; exclusive geçici çıktı ve hard-link
  yayımlama. Auth tamamlanmadan plaintext hedef yoktur; overwrite yoktur.
  backup-encrypted önce readOnly snapshot, sonra decrypt + tam fingerprint;
  verify-encrypted yalnız geçici kopyada FK/SQLite ve Prisma schema diff.
  Gerçek restore/off-host/budama yapmaz. Anahtar yedekten ayrı tutulur.
- `pilot:rehearse-recovery`: yalnız kendi sentetik kaynak/yedek/hedefi;
  yeni süreç/DB/HTTP oturumu+inceleme+etkinlik+RSVP, pending outbox teslimi,
  işçi restart sonrası tek bildirim/readAt ve yeni yazma. Kaynak içerik/bayt
  eşitliği korunur; production kurtarma veya RPO/RTO onayı değildir.
- `pilot:build-isolated`: aynı sahipli kopyada kurulu Next sürümünün build
  uygulaması; gerçek .next/DB değişmez. Next yükseltmesinde bu giriş noktası
  tekrar sınanmalıdır. Başarısız derlemede özel tmp build.log korunur.

- `pilot:rehearse-http` .env/DB/URL hedefi kabul etmez: izin listeli kaynak
  kopyası, yeni sentetik SQLite ve ayrı loopback portunda Next development
  süreci. Gerçek HTTP login/üyelik/RSVP/PATCH/bildirim okumaları ve gerçek
  event worker döngüsü; 1/4/8 görev, kapasite, alıcı görünürlüğü, quick_check/FK
  ve heartbeat denetimi. İşçi/uygulama env'i gerçek sırları devralmaz.
  Kendi çocukları IPC ile kapatılır; zorunlu sonlandırmada tmp korunur.
  Kesin tmp sınırı/junction kontrolü dışında recursive cleanup yoktur.
  Mevcut uygulama config'i, .next, veri veya çalışan süreçleri değişmez.
  Production/staging kapasitesi değildir; docs/HTTP_ISCI_PROVASI.md.

- `db:rehearse-restore` read-only `VACUUM INTO` snapshot veya açık seçilmiş
  bağımsız yedek; yalnız kendi tmp kopyasında integrity/FK, tüm satırların
  sıralı fingerprint eşitliği, write/rollback ve Prisma schema diff. Canlı
  restore/migration veya eski yedek budaması yok; yeni snapshot korunur.
- `db:probe-load` DB URL/argüman kabul etmez. Yeni sentetik DB, sekiz ayrı
  Prisma istemcisi, 1/4/8 görev ve gerçek topluluk/RSVP servisleri. Kabul/409
  ret ve okumalar ayrı ölçülür; kapasite ve 12 bütünlük kontrolü zorunlu.
  Gerçek DB/sağlayıcı ayarı değiştirilmez. Bu HTTP veya üretim yük testi değildir.

### İşçi

- runtime-check.mjs salt okunur pilot denetimiyle gerçek APP_URL/api/health'i
  birleştirir. Alarm ayrı açık --notify; yalnız operatörün HTTPS endpoint'i,
  redirect yok, sabit kodlu JSON/Bearer; hata/geçiş/30 dk hatırlatma state'i
  URL özetiyle ayrılmış özel dosyada tutulur. Başarısız teslim state ilerletmez;
  bozuk state fail-closed. Host kapanışını veya oyun/backup servisini izlemez.
  Bunlar dış izleme/OS görevidir. deploy/systemd yalnız kurulmamış örneklerdir.

- `scripts/lib/event-worker-health.mjs`: git-ignored tmp alanında workspace/
  DATABASE_URL özetiyle ayrılmış instance dosyaları; atomik/seri değişim.
  Tick sonucu ve on saniyelik kalp atışı ayrıdır. 35 saniye eski heartbeat,
  beş dakika ilerlememe/kuyruk yaşı, failed/tick hatası health kod 1 yapar.
- `worker:events:health` CLI salt okunur; kamu API'si değildir. Tek seferlik
  komutlar worker kaydı yazmaz. DTO yalnız sayılar/sorun kodlarıdır.
- `worker:events:supervise` sabit repo işçisini shell olmadan başlatır.
  Yalnız kendi çocuğunu izler/sinyal verir; dakikada beş kapanışta durur.
  OS servisi, gözetmenin gözetimi, takılan çocuğun zorla sonlandırılması ve
  dış bildirim bağlantısı ayrıca gerekir. Windows SIGTERM ani kapanabilir.

## Bağımsız platform başvuruları

- `PlatformCommunityCase` ve `PlatformCommunityCaseEvent`, kaynak topluluk
  raporundan ayrıdır. Başvuru/karar audit ile atomiktir; karar pending+version
  CAS kullanır. Hesaba bağlı yazmada ilk aktif hesap kilidi yarışları sıralar.
- `/api/community-cases` yalnız aktif hesabın kendi kayıtları/itiraz bağlamı;
  `/api/admin/community-cases` root veya yeniden doğrulanan global admin.
  Yerel yönetim, başvuranın kendisi ve kaynak karar aktörü için çıkar
  çatışması filtreleri sunucudadır. Root hesapsız güvenilen operatör sınırıdır.
- İki liste 20 kayıt/en fazla 100 sayfa; explicit DTO, private/no-store,
  origin, sınırlı JSON ve ayrı hız sınırları. Kaynak yönetim notu kopyalanmaz.
  İlk paket ban/içerik/sahiplik değiştirmez; yalnız özel yanıt ve durum takibi.
- Başvuranın kayıtları hesap export'unda; hesap silme case/event temizler.

## Oyun altyapısı

- Oyun kataloğu ve API sınırları `lib/games/definitions.ts` sözleşmesini kullanır.
- `GameSession`, `GamePlayer`, `GameEvent`, `GameEntry` ve `GameVote` ortak veri temelidir.
- Tavla motoru adapter sınırının arkasındadır; state sürümlü biçimde saklanır.
- İstemci eşitlemesi revision ve ETag kullanır; görünmeyen/çevrimdışı sekmede polling durur.
- Zaman aşımı yan etkileri `maintenance:games` sürecinde uygulanır.

## Stil yükleme sınırları

- Ortak token ve primitive'ler globaldir.
- Forum stilleri yalnız `/forum` ve forum moderasyonu rotalarında yüklenir.
- Oyun stilleri yalnız `/games` rotalarında yüklenir.
- Yeni ortak bileşen önce `DESIGN_SYSTEM.md` sözleşmesine uymalıdır.
