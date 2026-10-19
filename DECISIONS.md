# ListeKutusu Karar Günlüğü

## D-001: Masaüstü koyu tema aktif kapsamdır

Mobil ve açık tema silinmemiştir ancak masaüstü koyu deneyim istenen seviyeye
ulaşana kadar bu alanlarda kapsamlı çalışma ve test yapılmaz.

## D-002: Ürün çekirdeği Spotify değildir

Sosyal içerik, profiller, listeler, forum ve puanlar kendi veritabanında tutulur.
Spotify arama, bağlantı ve isteğe bağlı liste senkronu için entegrasyondur.

## D-003: Her kullanıcının tek kişisel listesi vardır

Bir kullanıcı adına sınırsız oda/listeler açılmaz. Davet koduyla öneri toplama
kişisel liste panelinde ikincil bir özellik olarak kalır.

## D-004: Oyun puanı satın alınamaz

Premium plan görsel kişiselleştirme ve reklamsız deneyim sağlayabilir; rekabetçi
puan veya oyun avantajı sağlamaz.

## D-005: Şimdilik ETag polling kullanılır

Tur tabanlı oyunlarda revision/ETag polling yeterli ve test edilmiştir. Gerçek
push/SSE ancak mevcut fallback korunarak ve ölçülmüş ihtiyaçla eklenir.

## D-006: Oyunlar ortak sözleşmeye uyar

Yeni oyun, ortak kabuk, oda sözleşmesi, hata durumları, oyuncu koltukları,
bağlantı durumu ve masaüstü ölçülerini kullanmadan yayınlanmaz.

## D-007: Eski raporlar aktif bağlam değildir

`docs/archive/` geçmiş kararları korur ancak normal geliştirmede okunmaz.
Güncel gerçekler `PROJECT_STATUS.md`, açık işler `ROADMAP.md` içindedir.

## D-008: Müzik dışı katalog aşamalı ve bağımsız eklenir

23 Eylül kullanıcı talebi: film/dizi/kitap kapsamı açıldı. TMDB film/dizi,
Open Library kitap arama adaptörüdür; sağlayıcı kökeni korunur. Mevcut tek
müzik listesi ve oyunlar değiştirilmez. Yeni kişisel kitaplık ayrı geliştirilir.
Entegrasyon varsayılan kapalı; lisans/atıf incelemesi yayın öncesi zorunlu adımdır.

## D-009: Kitaplık ortak yönetim merkezidir

24 Eylül kullanıcı talebi: Müzik, Diziler, Filmler ve Kitaplar ayrı listeler
olarak `/library?type=music|tv|movie|book` içinde yönetilir. Varsayılan müziktir.
Bu bir arayüz taşımasıdır; müzik Suggestion/UserList verisi, Spotify senkronu
ve düello kaynakları MediaLibraryEntry'ye taşınmaz. Medya servis anahtarı müzik
bölümünü kapatmaz. `/control` ve hesap listesi sekmesi kitaplığa yönlenir.

## D-010: Ücretli TMDB yerine aşamalı sağlayıcı değişikliği

Kullanıcının ticari ürün/abonelik maliyeti tercihiyle diziler TVmaze'e, filmler
Wikidata'ya geçirildi. TVmaze ve Wikidata adaptörleri tamamlandı; canlı arama
kontrolleri ve gerçek oturumlu yerel uçtan uca akış tamamlandı. Yerel özellik
açık; ticari yayın uygunluğu ve üretim dağıtımı ayrı kontrol olarak kalır.
İlk sürüm afişsizdir. TVmaze verisi CC BY-SA atfıyla ve kaynak kimliğiyle
korunur; eski kayıtların sağlayıcı kimlikleri yeniden etiketlenmez.

## D-011: Topluluklar ürünün yeni sosyal çekirdeğidir

9 Ekim kullanıcı yönü: müzik/dizi/film/kitap/oyun sohbetleri, incelemeler ve
gerçek dünyada buluşma etkinlikleri aşamalı geliştirilir. Üniversite bilgisi
ileride isteğe bağlıdır; doğrulanmış öğrencilik anlamına gelmez. Mobil/açık
tema askıda ve dar doğrulama politikası korunur.

Bağımsız forum geliştirmesi dondurulur; içerik silinmez veya otomatik
topluluğa taşınmaz. Ana menü Topluluklar'a yönlenir; `/forum` ve mevcut
konular Topluluklar ekranından erişilebilir kalır. Forumun salt okunur arşive
çevrilmesi ayrıca kararlaştırılmalıdır; mevcut yazma yetkileri korunmuştur.

## D-012: İlk topluluk teslimi sohbet ve güvenli üyelikle sınırlıdır

Topluluklar herkese açık okunur, yazmak aktif üyelik gerektirir. İlgi alanı,
üniversite ve yerel kategorileri etiketlerdir; konum veya öğrenci doğrulaması
yapmaz. Paylaşım ve yorumlar müzik akışı/forumdan ayrı saklanır. Kurucu ve
moderatör yetkileri topluluğa özeldir. Rapor kuyruğu, kaldırma ve uzaklaştırma
ilk teslimdedir; incelemeler, etkinlikler, genel akışa çıkarma ve üniversite
profil alanı sonraki fazlardır. Üyeliğe özel okuma/gizli topluluk bu teslimde yoktur.

## D-013: İncelemeler önce manuel eser referansıyla açılır

12 Ekim: topluluk paylaşımına ayrı review türü eklendi. Müzik, dizi, film,
kitap, video oyunu ve kutu oyunu aynı 1–10 tam sayı puanı kullanır; metin
en az 20 karakterdir. Eser adı kullanıcı beyanıdır. İsteğe bağlı bağlantı
yalnız Spotify, TVmaze, Wikidata, Open Library, Steam veya BoardGameGeek'in
izinli HTTPS hostlarına gider; dış istek/metadata doğrulaması yapılmaz.
Bağlantı doğrulanmış katalog seçimi gibi gösterilmez. Kitaplıktan/katalogdan
imzalı seçim bağlama sonraki küçük pakettir; yeni oyun API'si gerekmez.

Spoiler metni listede önizlenmez; detayda metin ve yorumlar açık tercih ile
gösterilir. Başlık ve eser adı gizlenmez; form bunu uyarır. Bu tercih gizli
paylaşım veya API erişim kontrolü değildir. Mevcut üyelik/rapor/kaldırma/
engelleme kuralları incelemeye de aynen uygulanır.

## D-014: İnceleme kitaplık kaydını değil eser snapshot'ını yayımlar

12 Ekim: müzik/dizi/film/kitap için kullanıcının kendi kitaplık kaydından
seçim eklendi. İlk 20 sonuç aranabilir; müzikte yalnız onaylı parçalar.
Yazarken kayıt sahibi ve türü transaction içinde yeniden kontrol edilir.
Özel kitaplık kayıt kimliği, durumu veya bütünü kamuya çıkmaz. Kullanıcı
seçilen eser adı ve kaynak bağlantısını açık incelemede yayımladığını formda
görür. Kaynak URL provider/externalId'den kurulur; istemci metadata'sı ve
library.sourceUrl alanı güven kaynağı değildir. Eski TMDB kayıtları yeni
TMDB isteği yapmadan seçilebilir; oyunlar manuel kalır.

Snapshot bağımsızdır: kaynak özel kaydı silmek incelemeyi silmez; paylaşımı
ayrıca kaldırmak gerekir. Doğrudan katalog arama ve inceleme düzenleme ek
iyileştirmelerdir; ana sıradaki faz etkinlik ve katılımdır. Aktif yol haritası
için yaklaşık %45 kapsam tahmini kullanılabilir; yayın hazırlığı oranı değildir.

## D-015: Etkinlik önce duyuru/yönetim, sonra katılım olarak teslim edilir

12 Ekim: ilk paket başlık, açıklama, başlangıç/Türkiye saati, şehir, mekân ve
isteğe bağlı kapasiteyle oluşturma/liste/detaydır. Aktif topluluk üyeleri
oluşturur, herkes okuyabilir. Mekân kamuya açık olduğundan formda hassas
adres uyarısı ve API'de açık onay gerekir. Düzenleyen/aktif topluluk yöneticisi
iptal veya kaldırma yapabilir; iptal duyurusu görünür, kaldırma gizlenir.

İlk sürüm Europe/Istanbul, en fazla bir yıl sonrası ve 2–200 kişi kapasite
bilgisiyle sınırlıdır. Kapasite şu an doluluk hesabı değildir. Sonraki katılım
paketinde organizer otomatik katılımcı sayılmayacak; katılacağım dediğinde
koltuk kullanacak. İlgileniyorum koltuk tüketmeyecek, bekleme listesi ilk
katılım paketinde olmayacak. Aynı kullanıcı tek RSVP kaydı, kapasite kontrolü
transaction, iptal/geçmiş/yasak durumunda yeni katılıma kapatma kabul şartıdır.
Üyelikten ayrılma/yasak sonrası RSVP davranışı katılım paketiyle belirlenir.

## D-016: RSVP niyet kaydıdır; kapasite ve görünürlük ayrı korunur

12 Ekim: katılım çekirdeği eklendi. Yalnız aktif topluluk üyesi açık/gelecek
etkinliğe yeni attending/interested kaydı verir. Organizer ancak attending
dediğinde sayılır. Attending/interested arasında geçiş tek satırı değiştirir;
withdrawn yer bırakır. Kendi tercihinden vazgeçmek üyelik/açıklık kontrolü
gerektirmez; etkinlik hedefi ve aktif oturum yine doğrulanır.

Ayrılma/yasak, iptal/kaldırma kayıtları aynı transaction'da withdraw eder.
Engelleme mevcut koltuğu otomatik bırakmaz ama görünürlük/yeni katılımı
kapatır. Deaktif/üyeliği olmayan eski niyetler RSVP yazarken kalıcı geri
çekilir; rejoin/reaktivasyon eski koltuğu otomatik canlandırmaz.

Kamuya açık yalnız sayılar; kişi kendi durumunu görür. Katılacakların profil
bilgisi yalnız aktif düzenleyen/topluluk yöneticilerine, engelleme filtresiyle
gösterilir. Formda bu açıklanır. Gerçekleşmiş katılım veya rezervasyon vaadi
yoktur. Bekleme listesi yoktur; dolu etkinlikte ilgileniyorum kullanılabilir.
Etkinlik düzenleme/kapasite azaltma ve bildirimler sıradaki pakettir.

## D-017: Etkinlik güncellemesi sürümlü ve bildirimle atomiktir

15 Ekim: yalnız aktif düzenleyen/topluluk yöneticileri açık ve başlamamış
etkinliği düzenler. Başlık/açıklama/tarih/şehir/mekân/kapasite değişebilir;
hedef topluluk, düzenleyen ve durum edit payload'ından alınmaz. İptal veya
başlangıcı geçmiş etkinlik düzenlenmez. Yeni yer için açık konum onayı gerekir.

contentVersion eski taslağın yeni içeriği ezmesini engeller; RSVP revision'ı
edit çatışması yaratmaz. Kapasiteyi geçerli attending sayısının altına
indirmek reddedilir; kimse otomatik atılmaz. Niyetler tarih/konum değişiminde
korunur, yeniden onay zorunlu değildir; bildirimde güncel bilgiye bakması istenir.

Değişiklik, iptal ve doğrudan kaldırma bildirimleri mevcut Notification'da,
aynı transaction içinde saklanır. Alıcılar aktif attending/interested üyeler
ve moderatör değiştirirse düzenleyendir; aktör, engellenen/ayrılmış/vazgeçmiş
diğer kişiler almaz. Değişmeyen kayıt/tekrar iptal bildirim çoğaltmaz. E-posta
ve push yoktur; etkinlik bildirimleri RSVP/düzenleyen rolüyle uygulama içinde
gelir, takip/beğeni tercihlerini değiştirmez. Genel akış dağıtımı sıradaki fazdır.

## D-018: Genel dağıtım açık tercih, okuma gizliliği değildir

15 Ekim: sohbet/inceleme ve etkinlik için community/general dağıtım seçilir.
Varsayılan ve eski içerik community kalır. Her iki tür bağlantıyla herkese
açık okunur. Yazar veya aktif topluluk yönetimi dağıtımı değiştirebilir;
etkinlik tercihi sürümlü düzenleme içindedir, salt dağıtım değişimi katılımcı
bildirimi üretmez. RSVP hâlâ aktif topluluk üyeliği gerektirir.

İlk dağıtım paketi ana sayfanın Yeni görünümünde ayrı Topluluklardan bölümü
olarak teslim edilir. Sohbet/inceleme/gelecek etkinlikler tarih sırasıyla
birleşir; müzik sıralaması ve müzik etkileşimleri korunur. Bu bölüm takip,
sana özel veya kaydedilen müzik görünümünde gösterilmez. Tek karma müzik+
topluluk sıralaması sonraki pakette açıkça ele alınmalıdır. Genel dağıtıma
açmak eski paylaşımı yeni tarihliymiş gibi üste taşımaz. İptal gelecek
etkinlik etiketli görünür, başlangıcı geçen keşiften çıkar, kaldırılan gizlenir.

## D-019: Yeni/Takip karma, müzik öneri/arşiv görünümleri açıkça sınırlıdır

15 Ekim: önceki ayrı ana sayfa bölümü tek Yeni/Takip zaman çizgisine taşındı.
Müzik, genel dağıtımlı sohbet/inceleme ve gelecek etkinlikler oluşturulma
tarihine göre birleşir. Tür filtresi ve 10 içeriklik üç kaynaklı keyset cursor
vardır; tür+ID kimliği çakışmayı önler. Takip, Follow edilen yazar/düzenleyen
anlamına gelir; topluluk üyeliğinden örtük takip türetilmez.

Yükselen/Sana özel/Kaydedilen şimdilik yalnız müzik içerir, arayüz bunu söyler.
Topluluk içeriklerine müzik beğeni/listeye ekleme/kaydetme API'leri bağlanmaz.
Genel akıştaki kart kaynak topluluğa gider; spoiler ve RSVP üyelik sınırı
değişmez. Topluluklara ortak beğeni/arşiv/öneri eklemek ayrı ürün paketidir.
Karma akış canlıdır; önceden yüklenen içerik kaldırıldığında push ile anında
silme vaadi yoktur, yeni okuma/yenileme erişimi tekrar değerlendirir.

## D-020: Üniversite bilgisi isteğe bağlı ve varsayılan gizlidir

15 Ekim: Kimlik düzenleyicisine elle girilen üniversite adı ve ayrı açık
görünürlük tercihi eklendi. Üniversite ekleme zorunlu değildir ve profil
tamamlanma puanını artırmaz. Kullanıcı beyanıdır; kurum bağlantısı veya
öğrencilik doğrulanmaz, e-posta alan adından rozet türetilmez.

Gizli ad yalnız hesap sahibinin ayar ve dışa aktarımında kalır; kamu profil
DTO/HTML'ine taşınmaz. İki yönlü engelde açık ad da gizlenir. Eski istemci
alan göndermiyorsa kayıt korunur; yeni istemci de üniversiteye dokunmadan
biyografi kaydederken eski görünürlüğü tekrar yazmaz. Boşaltmak adı siler ve
görünürlüğü kapatır. Hesap silme her iki alanı temizler. Üniversite/yerel
keşif filtreleri sonraki pakettir; gizli ad bunlarda kullanılmamalıdır.

## D-021: Keşif kişisel profil değil açık topluluk etiketlerini kullanır

15 Ekim: /communities, topluluk ve yaklaşan etkinlik keşfini ayrı görünümlerle
sunar. Üniversite/şehir/ilgi alanı etiketleri topluluk kurucu/moderatörünün
açık beyanıdır. Kişisel üniversite, açık olsa bile otomatik eşleştirme veya
prefill için okunmaz; özel profil verisi aramaya, sayı veya öneriye katılmaz.
Resmî kurum/öğrenci doğrulaması, otomatik kurum alias'ları ve GPS yoktur.

Etkinlik keşfi genel dağıtımlı gelecekteki scheduled kayıtlarla sınırlıdır.
Şehir etkinliğin kendi şehridir; üniversite/ilgi alanı kaynak topluluktandır.
İptal edilmiş kayıtlar kendi topluluğunda ve mevcut genel akış politikasında
görülebilir ama bu yaklaşan keşfinde listelenmez. Genel keşif RSVP üyeliğini
genişletmez. Eski topluluklara etiket, profil veya demo adından türetilmez.

## D-022: Etkinlik raporu yönetim kararıdır, otomatik gizleme değildir

15 Ekim: aktif topluluk üyesi başkasının görünür duyurusunu bildirir. Aynı
hesap/hedef tek rapor; tekrar reviewed kaydı açmaz. Geçmiş veya iptal edilmiş
duyuruda da uygunsuz içerik olabileceğinden rapor kabul edilir. İptal raporu
kapatmaz; kaldırma mevcut RSVP/katılımcı bildirim transaction'ında raporları
da kapatır. İncelendi yalnız kuyruğu kapatır, etkinliği değiştirmez.

Gerekçe yalnız kaynak topluluğun aktif yönetiminde, kendi rapor durumu yalnız
bildirenin detayında görünür. Düzenleyen rolü şikâyetlere ayrı erişim vermez;
bildiren kimliği kuyruk DTO'suna eklenmez. Bu platformdan bağımsız denetim
veya acil yardım hizmeti değildir. Kötüye kullanan topluluk yönetimine karşı
platform itiraz/escalation ve karar işlem günlüğü pilot öncesi ayrı iştir.

## D-023: Etkinlik bildirimleri kalıcı snapshot kuyruğundan teslim edilir

15 Ekim: önceki senkron fan-out yerine etkinlik ve alıcı snapshot'ı aynı
transaction'da kaydedilir. Ayrı işçi bounded batch'lerde uygulama içi
Notification yazar. İptal RSVP'yi çekmeden önce alınan kitle korunur;
teslimde hesap/üyelik/engel yeniden daraltılır, yeni katılan alıcı eklenmez.
Bu anlık teslim veya e-posta/push garantisi değildir. İşçi durduğunda
etkinlik kaydı geçerlidir, bildirim işi veritabanında bekler.

Deterministic event/version/type/user kimliği ve atomik batch tekrarları
çoğaltmaz, readAt'ı değiştirmez. Beş başarısızlık sonrası failed işler
otomatik sonsuz retry yapmaz; sorun giderilip açık komutla yeniden hazırlanır.
Kuyruk halka veya topluluk yönetimine alıcı listesi olarak açılmaz.
Üretimde ayrı işçi süreci/yeniden başlatma/izleme zorunlu dağıtım işidir.

## D-024: Yönetim geçmişi özel, veri-minimum ve işlemle atomiktir

17 Ekim: yeni yönetim endpoint'i aktif kurucu/moderatör için şikâyet, üye
ve karar geçmişini 20 kayıtlık sayfalarla sunar. Normal üyeler/anonim/deaktif
hesaplar ve başka topluluğun yöneticileri erişemez. Şikâyetçinin kimliği
ve kaldırılan içeriğin metni geçmişe kopyalanmaz. Geçmişte işlem, hedef ID,
aktör, tarih ve isteğe bağlı 300 karakterlik tek satır yönetim notu tutulur.

İnceleme actor/timestamp'ı ve log, içerik/üyelik/etkinlik değişikliğiyle
aynı transaction'dadır; log yazılamıyorsa karar da rollback olur. Rol/durum
no-op'ları geçmişi çoğaltmaz. Eski reviewed raporlara bilinmeyen aktör veya
tarih uydurulmaz. Silinmiş aktörün kişisel adı gösterilmez. UI'da log silme/
düzenleme yoktur; bu kriptografik/tamper-proof bir sistem değildir.

## D-025: Pilot bütünlük kontrolü salt okunurdur

17 Ekim: check:communities sahiplik/rol, etkinlik/RSVP, rapor ve bildirim
işlerinde 12 kontrolü yalnız sayılarla raporlar. Veri ihlali hata, pasif
kurucu/bekleyen hedef veya uzun/failed kuyruk operatör uyarısıdır. Otomatik
sahip atama, silme, şikâyet kapama veya replay yapmaz. Sağlık çıktısını
kamu health endpoint'ine ya da üretim/yük testi yerine koymaz.

## D-026: Sahiplik devri teklif ve kabul gerektirir

17 Ekim: mevcut aktif sahip, başka aktif ve engellenmemiş topluluk üyesine
yedi günlük teklif gönderebilir. Teklif yetki vermez; yalnız hedefin açık
kabulüyle ownerId ve iki üyelik rolü aynı transaction'da değişir. Eski
sahip normal üye kalır, kaynak içerik/etkinlik yazarı hakları değişmez.
Bir toplulukta tek bekleyen teklif vardır; teklif ID'si kabulde doğrulanır.
Reddetme/geri çekme/süre sonu, hedefin ayrılması/ban ve hesap kapanışı eski
teklifle yetki kazanılmasını önler. Rastgele veya otomatik sahip ataması yoktur.

## D-040: Teknik kapanış gerçek dağıtım ve veri politikası yetkisi vermez

17 Ekim: tasarım işleri sonraya bırakıldı. Şifreli yedek native readOnly
snapshot'tan üretilir; AES-GCM doğrulaması bitmeden hedef yayımlanmaz,
mevcut dosya ezilmez. Anahtar env/secret store'dadır, yedekten ayrı tutulur;
otomatik off-host aktarım, budama veya canlı restore yoktur.

Kurtarma HTTP provası yalnız sentetik yedeği yeni uygulama/işçi süreçlerinde
çalıştırır; eski oturum ve pending işi koruduğunu doğrular. Gerçek kurtarma
sonrası oturum/silme talepleri uzlaştırması ayrı operatör kararıdır. İzole
production build mevcut .next'i değiştirmez ve yayın onayı değildir.

Runtime salt okunur; --notify operatörün HTTPS hedefine dar JSON alarmıdır.
Provider/URL/sır/kişisel kayıt payload'a girmez. Kurulmamış systemd örnekleri
host seçimi veya servis kurulumu anlamına gelmez. Yedi manuel kapı, hukuki
onaylar, süre/sorumlu/RPO/RTO ve gerçek dağıtım kullanıcı adına seçilmez.

## D-039: HTTP/işçi provası yalnız sahipli sentetik ortamı çalıştırır

17 Ekim: pilot:rehearse-http dış URL/DB parametresi veya .env kabul etmez.
Kaynak kopyası/yeni sentetik SQLite/ayrı loopback portu ve development
oturumlarıyla gerçek API + event worker döngüsü sınanır. Gerçek sağlayıcı
sırları devralınmaz; üretim çerez politikası gevşetilmez. Mevcut sunucuya
yük verme, süreçlerini durdurma veya gerçek veriyi kopyalama yoktur.

Sahip olunan çocuklar IPC ile kapatılır; zorunlu sonlandırma gerekirse tmp
korunur ve hata verilir. Temizlik doğrulanmış kendi tmp sınırı/junction
kontrolüyle yapılır. Küçük 1/4/8 yerel örneklem kapasite/SLA/yayın onayı
değildir; staging yük ve kurtarma kapıları ayrı açık kalır.

## D-038: Otomatik pilot ön kontrolü yayın izni vermez

17 Ekim: ortam/SQLite migration history+bütünlük/topluluk ve yerel işçi
denetimleri pilot:check altında salt okunur raporlanır. Native readOnly
eksik DB yaratmaz; migration checksum farkı/yarım geçmiş düzeltilmez.
Rapor kod ve sayıları taşır; sır/URL/e-posta/DB yolu/ham SQL veya exception yoktur.

Development başarısı production uygunluğu değildir; yerel HTTP production
kontrolünü geçemez. releaseApproved daima false'dur; süreç/dış alarm, off-host
yedek, staging yük/kurtarma, lisans, veri politikası ve gerçek TLS/sır/yayın
kararı manuel kalır. Hedef host seçme, harcama, yayınlama veya sır değiştirme
bu rapordan türetilmez. Kod 0 yalnız otomatik kontrol başarısı anlamına gelir.

## D-037: Etkinliklerim özel niyet ajandasıdır, katılım kanıtı değildir

17 Ekim: kişinin RSVP verdiği ve düzenlediği görünür etkinlikler tek özel
/community-events ekranına alındı. Yaklaşanlarda yalnız aktif attending/
interested ve düzenledikleri; geçmiş/iptal görünümünde varsa withdrawn
ilişkileri de gösterilir. Geçmiş fiziksel katılım veya rezervasyon değildir;
eski tercihin ne olduğu çıkarılmaz. Düzenleyen otomatik attending sayılmaz.

Kaldırılmış/deaktif düzenleyenli/iki yönlü engelli içerik görünmez. Kamuya
ajanda veya başkasının katılımcı listesi açılmaz. Arşiv ve community dağıtım
görünür kaynak okumasını kapatmadığından geçmiş/iptal kayıt kalabilir.
20 kayıt/100 sayfa, zaman ve kendi rolü URL filtreleridir. Yeni tablo yoktur.

Kendi tercihini geri çekme açık onayla mevcut source RSVP servisini kullanır.
Koltuk boşalabilir; yeniden katılım o andaki üyelik/kapasiteye bağlıdır.
Organizer RSVP'sini geri çekmek etkinliği iptal etmez. Etkinlik yönetimi
kaynak toplulukta kalır; hatırlatma/harici takvim/yeni bildirim eklenmez.

## D-036: Eski okuma yeni hedefin içeriği veya işlem yetkisi olamaz

17 Ekim: paylaşım detayı ve etkinlik liste/detay okumaları URL+yenileme
nesline bağlandı. Hedef/filtre/sayfa değiştiğinde önceki yanıt gösterilmez;
geç gelen istek iptal edilir, eski hata yeni hedefe taşınmaz. Pasif etkinlik
paneli okunmaz; detay açıkken liste isteği de gönderilmez. İptal/kaldırma
onayı yalnız güncel hedefe ait detayla görünür. Sunucu yetkileri değişmez.

İnceleme düzenlemesinde değişiklik varsa Akışa dön/Düzenlemeden vazgeç
taslak silme onayı ister. İptal ve Escape yazılanları korur; değişmeyen form
ve başarılı kaydetme uyarı üretmez. Bu sayfa içi iki komutun korumasıdır;
tarayıcı geri/yenileme/dış link veya yetki hatasından taslak kurtarma değildir.
Yerel/sunucu kalıcı taslak, global gezinme engeli veya tam geçmiş eklenmez.

## D-035: Katalogdan inceleme seçimi kitaplığa ekleme değildir

17 Ekim: inceleme oluşturma film/dizi/kitap için Katalogda ara seçeneği
sunar. Mevcut Wikidata/TVmaze/Open Library araması ve kullanıcıya bağlı
30 dakikalık imza kullanılır; yeni sağlayıcı, ücretli hesap veya DB alanı
yoktur. Müzik kitaplıktan seçilir/elle girilir; oyunlar elle kalır.

Yayın imzayı, türü ve sağlayıcıyı üyelik/aktif hesap/arşiv transaction'ında
doğrular. Dış istek yapmaz; kitaplığa, profile veya müzik listesine eklemez.
İstemci metadata'sı değil doğrulanmış başlık ve canonical kaynak snapshot'ı
kalır. İmza, arama metni ve özel seçim kimliği kamuya yazılmaz. Eski kayıtlar
aynı provider metadata'sıyla korunduğundan UI kökeni kitaplık diye sunmaz.

Arama açık düğme/Enter ile başlar, otomatik tuş başı sorgu yoktur. Hata ve
süresi dolan seçim inceleme metnini silmez; aynı eser yeniden aranıp açıkça
seçilebilir. Tür değişimi eski seçimi taşımamalıdır. Özellik anahtarı kapalı
iken yeni katalog yayını kapanır ama manuel/kitaplık/eski içerik korunur.
Canlı sağlayıcı/lisans/üretim uygunluğu bu yerel paketten türetilmez.

## D-034: Karma kartlar ortak tercihi, kayıt merkezi yalnız kendi görünür kaynaklarını kullanır

17 Ekim: Yeni/Takip sohbet ve incelemelerinde kaynak toplulukla aynı beğeni/
kayıt vardır; etkinlik RSVP'si ayrı kalır. /community-saved farklı topluluk
kayıtlarını savedAt/postId azalan sırasıyla toplar. Tür/alan URL'dedir,
20 kayıt/en fazla 100 sayfadır. Ana akış müzik Kaydedilen değişmez.

Kayıt içerik snapshot'ı değildir: kaldırılmış/deaktif yazarlı/iki yönlü
engelli kaynak görünmez. Arşiv veya community dağıtım özel okuma olmadığı
için görünür kaynak kayıtta kalabilir; yeni tercih kaynak üyeliği ve açık
topluluk gerektirir. Kendi geri alması açık kalır. Liste başkasının ID'siyle
seçilemez; kişinin kaydı ve kayıt zamanı kamu akışına taşınmaz.

Ana akıştan ekleme general dağıtımı yeniden doğrular. Tek transaction'da
güncel minimal tercih yanıtı, başarısız isteklerde sahte optimistic durum
üretmez. Geri alırken kaynak feed'den çıkmışsa eski kart metinsiz duruma
döner; eksik ve gizli hedef aynı null yanıtını verir. Etkinlik kaydetme,
toplu gizli kayıt temizleme, bildirim/puan/öneri veya canlı push eklenmez.

## D-033: Topluluk beğenisi ve özel kayıt müzikten ayrıdır

17 Ekim: ilk paket kaynak topluluk sohbet/inceleme liste ve detayında beğeni
sayısı, kendi tercihi ve özel kayıt sunar. Aktif üye ekler, kendi paylaşımına
beğeni veremez; kendi paylaşımını kaydedebilir. Aktif hesap kendi tercihini
arşiv/ayrılma/ban/engel veya kaldırılmış kaynakta geri alabilir. Eksik veya
gizli hedefte geri alma aynı başarılı no-op yanıtını verir; yalnız kendi
source-scoped kaydını siler. Toggle değil açık boolean, tekrar tek kayıttır.

Ayrılma/ban beğeniyi siler; yeniden katılım bunu diriltmez. Özel kayıt
kalabilir ama kaynak görünürlüğünü genişletmez ve metin snapshot'ı oluşturmaz.
Kaydettiklerim ilk pakette topluluk içindedir, içerik tarihine sıralanır.
Kimlerin kaydettiği/kayıt sayısı/liker listesi açılmaz; yalnız kendi hesap
export'unda tercih metadata'sı vardır. Hesap kapanışı kendi tercihlerini siler.

Beğeni sayısı aktif hesap/üyelik ve mevcut görüntüleyenin engel filtresine
bağlıdır. Müzik API/verisi, ana akış Kaydedilen/Yükselen/Sana özel, puan ve
bildirim sistemi değişmez. Karma kart etkileşimi ve topluluklar arası kayıt
merkezi sonraki pakettir; kamuya kaydetme tercihi taşınmaz.

## D-032: İnceleme düzenlemesi eseri değil yazarın yorumunu günceller

17 Ekim: ilk düzenleme paketi yalnız aktif kaynak üyesi yazarın başlık,
metin, 1–10 puan ve spoiler tercihini değiştirir. Eser/kaynak/provider,
tür/yazar ve dağıtım korunur; kitaplık kaydı tekrar aranmaz. Yerel yönetim
ve global admin başka yazarın incelemesini düzenleyemez. Eski sürüm 409,
no-op değişmez; revision/editedAt/audit atomik, eski metin audit'e yazılmaz.
Şikâyet düzenlemeyle otomatik kapanmaz; tam sürüm geçmişi/geri alma yoktur.

İçerik türü ve inceleme alanı filtreleri sayfalama öncesi sunucuda uygulanır
ve URL'de tutulur. Başarılı yeni paylaşım seçili filtreye uymuyorsa filtre
temizlenerek paylaşımın görünmez kalması önlenir. Üyelik/engel/arşiv ve
genel akış dağıtımı kuralları değişmez. Mobil/forum kapsamı açılmaz.

## D-031: Topluluk konumu paylaşılabilir, yazım taslakları URL'ye girmez

17 Ekim: topluluk detayı/sekmesi, liste ve yorum sayfaları, etkinlik filtresi
URL'de tutulur; geri/ileri ve yenileme aynı konumu açar. Paylaşım/etkinlik
bağlantısı yalnız kaynak kimliğini içerir. URL üyelik veya özel okuma yetkisi
vermez; sunucu kuralları değişmez. Sayfa sınırı 100 arayüzde de uygulanır.

Aynı toplulukta oluşturma formları detay/sekme geçişinde mount kalır; metin
ve mekân taslağı URL, localStorage veya sunucuya otomatik yazılmaz. Koruma
aynı sayfa yaşamıyla sınırlıdır; reload/sayfadan ayrılma veya yetki/okuma
hatası kurtarması değildir. Spoiler açma tercihi yenilemede sıfırlanır.

## D-030: Kurtarma ve yük provası canlı veritabanını değiştirmez

17 Ekim: kurtarma provası read-only kaynaktan yeni tutarlı snapshot alır
veya seçilmiş bağımsız yedeği kullanır; yalnız kendi geçici kopyasında
bütünlük/FK, tam içerik eşitliği, yazma rollback ve mevcut Prisma şema
uyumunu sınar. Yedekleri budamaz, mevcut hedefi ezmez, canlıya restore veya
otomatik migration yapmaz. Sağlam eski şema kod 1'dir.

Sınırlı yük komutu DB hedefi kabul etmez; yalnız yeni sentetik SQLite ve
gerçek servisleri kullanır. 1/4/8 eşzamanlılık, kapasite tutarlılığı ve
okuma/mutation gecikmeleri raporlanır. Ölçüm HTTP/üretim kapasitesi/SLA
değildir; gerçek DB'nin journal/timeout/indeks veya sağlayıcısı değiştirilmez.

## D-029: İşçi sağlığı kuyruk boşluğundan bağımsız ve operatöre özeldir

17 Ekim: yerel event worker health, son kalp atışıyla son başarılı tick'i
ayırır; boş kuyruk işçinin çalıştığını kanıtlamaz. Git-ignored dosya kayıtları
workspace+DB özetine ve instance'a ayrılır. Kamu API'sine aktarılmaz; health
salt okunur sayısal JSON ve kod 0/1'dir. Hatalı/gecikmiş kayıt fail-closed'dur.
Eski crash kaydı sağlıklı yeni işçi varken tek başına alarm değildir.

İsteğe bağlı yerel gözetmen yalnız kendi Node çocuğunu yeniden başlatır;
artan bekleme ve dakikada beş kapanış devre kesicisi vardır. Failed işleri
otomatik replay etmez. Gözetmeni ayakta tutmak, dış alarm ve OS servis
yönetimi ayrı üretim işidir. Windows programatik SIGTERM graceful değildir;
ani kapanışta transaction rollback'e dayanılır, teslim garantisi eklenmez.

## D-028: Platform başvurusu topluluk yönetiminden bağımsız ve özeldir

17 Ekim: aktif hesap, üye olmasa veya uzaklaştırılmış olsa da genel başvuru,
kendi incelenmiş şikâyetine ya da güncel ban kararına itiraz gönderebilir.
Arşiv bunu engellemez. Başvuru ve yanıt yalnız başvuran ve uygun platform
admin/root'a açıktır; global moderator veya yerel yöneticiye açılmaz.
Hesaba bağlı admin kendi başvurusunu, yönettiği topluluğun başvurusunu veya
kendi verdiği karara itirazı göremez/inceleyemez. Hesapsız root güvenilen
operatördür; gerçek kişi çıkar çatışması bu oturumda teknik tespit edilmez.

İlk paket gerekçeli tek yanıt ve özel durum takibidir; kaynak yaptırımı,
üyeliği veya içeriği değiştirmez. Kapalı kayıt yeniden açılmaz. Aynı güncel
ban veya kaynak rapor için tek başvuru; genel konuda aynı anda tek bekleyen
kayıt vardır. Tekrar açıklamayı ezmez. Karar sürümlü CAS ve audit ile aynı
transaction'dadır. Başvuran DTO'su inceleyen kimliğini/iç audit'i içermez.
Kendi başvuruları dışa aktarılır; hesap kapanışında başvuru ve olayları silinir.
E-posta/push, yanıt süresi garantisi ve acil yardım işlevi yoktur.

## D-027: Hesap kapanışı açık arşiv seçeneğiyle yönetimsiz aktif topluluk bırakmaz

17 Ekim: topluluk active/archived durumundadır. Arşiv silme veya özel okuma
değildir; kaynak içerikler bağlantıyla mevcut yazar/engel koşullarında okunur.
Yeni üyelik/yazma/etkinlik yönetimi kapanır, genel keşif/akıştan çıkar.
Üye ayrılabilir ve kendi RSVP'sini çekebilir; yönetim geçmişi salt okunur.
Yaklaşan scheduled etkinlikler iptal, aktif niyetleri withdrawn olur.
Yeniden açma bunları canlandırmaz. Yalnız aktif sahip arşivler/yeniden açar.

Aktif topluluğu olan hesap, silmeden önce devir yapabilir veya ayrı varsayılan
kapalı arşiv onayı verebilir. Onaysız eski istemci 409 alır; veriler/oturum
silinmez. Onaylı kapanış yalnız hâlâ sahibi olduğu aktif toplulukları
arşivler; üyesiz tek sahipli topluluk da kapsamda, hesap kapanışı süresiz
engellenmez. Önceden devredilmiş topluluk arşivlenmez. Yeni sahip seçilmez.
Topluluk içeriği korunur; silinen hesabın içeriği mevcut aktif yazar filtresiyle
kamuya kapanır. Müzik/profil silme mevcut davranışı korur. Topluluk kişisel
veri saklama/anonimleştirme politikasının tamamlandığı iddiası değildir.

Arşiv/devir/hesap kapanışı SQLite writer lock ile sıralanır; log/RSVP/outbox
ve yaşam döngüsü değişikliği atomiktir. Açık arşivde iptal bildirimi snapshot'ı
set-based alınır. Hesap silmede silinen aktör/düzenleyenin bildirimleri
gizlilik filtresiyle kapanır; bu kaynaktan teslim garantisi verilmez.

## D-028: Ortak koyu masaüstü kabuğu tek sol menüdür

17 Ekim tasarım incelemesinden sonra kullanıcı uygulamaya devam edilmesini
istedi. Root AppShell beş ana bölümü 224 px sol menüde birleştirir; ana akış
ikinci bölüm menüsü çizmez. Sayfa üst bilgisi normal akışta kalır. Özel
merkez kısayolları yeni yetki üretmez; anonim giriş ve mevcut rota korumaları
sürer. Forum adresleri ve yazma politikası korunur, bağımsız geliştirme açılmaz.

Onay/rapor/profil pencereleri ortak body portalıyla sayfa stacking context'inden
çıkarılır. Arka alan inert, scroll kilidi, klavye çevrimi ve geri odak tek
otoritededir. Yeni ortak menü hesapta mevcut taslak ve kayıt kilidini aşamaz;
bu dar koruma bütün formlar ve tarayıcı geçmişi için global guard kabulü değildir.

## D-029: Taslak kayıt otoritesi metin saklamaz; okuma hatası yetki çıkarımı yapmaz

17 Ekim ikinci tasarım uygulaması: root DraftNavigationProvider birden fazla
formun yalnız dirty/busy bayraklarını bellekte toplar. İç linkte tek onay,
pending kilidi ve beforeunload var; yazı/parola/konum/katalog token'ı kalıcı
taslak deposuna alınmaz. Aynı belge geri/ileri veya bütün programatik çıkışlar
bitmiş sayılmaz; History API patch'i eklenmez. Kayıt/giriş otomatik gönderim
veya otomatik katılım üretmez. Literal ters eğik çizgi/kontrol karakterli
giriş dönüşü reddedilir; filtre/hedef güvenli uygulama yolunda korunur.

Özel okuma durumu istek URL'si ve nesliyle damgalıdır. 401 ile 403/ağ/5xx
ayrılır; JSON olmayan hata HTTP kodunu kaybettirmez. Yeni hedefte eski özel
kuyruk çizilmez. Başvuruda topluluk değiştirme onaylı ve ön doğrulamalıdır;
başarısız doğrulama eski hedef/metni korur, başarılı geçiş eski hassas metni
yeni topluluğa taşımaz. Gerçek yetki ve mutation kuralları sunucuda kalır.

## D-030: Kaydet-ve-devam-et açık profil düzenlemesiyle sınırlıdır

Ortak otorite metin kopyalamadan geçici kayıt/geri alma callback'i alabilir.
Yalnız tek dirty kayıt ve desteklenen profil save callback'i varsa üçüncü
seçenek açılır; birden fazla form sırayla otomatik kaydedilmez. Başarı boolean
sonucu hedefe devam ettirir; hata/401 formu ve hedefi korur. Pending tekrar
kaydı ve pencereyi kapatmayı kilitler. Bu oturum yenileme veya girişte taslak
taşıma değildir. Hesap bölüm/geri ve yetkili kuyruk filtre/sayfa/yenileme
ortak onaydadır; tarayıcı geçmişi ve tüm programatik çıkışlar tamamlanmadı.

## D-031: Başvuru konusu değişimi güncel bağlamla doğrulanır

Tür veya itiraz edilen rapor değişirken açıklama/rapor seçimi varsa onay
gerekir. Salt okunur güncel bağlam raporu veya uzaklaştırma itiraz hakkını
doğrulamazsa önceki seçim ve metin korunur. Başarılı geçiş açıklamayı
temizler; başka rapora/konuya aktarmaz. Bu ön doğrulama yazma yetkisi veya
rezervasyonu değildir; son yetki/iş kuralı kontrolü sunucuda kalır.
Başarı taslak seçimini temizler; hata/duplicate korur. Raporsuz konuda
önceki rapor kimliği payload'a taşınmaz. Kalıcı taslak/girişte aktarım yoktur.

## D-032: Bildirim okuması mutation sonucunu veya yetki kaybını örtemez

Panel 401/403 aldığında eski öğeler, sayaç ve tercih yüzeyi kapanır; giriş
yalnız 401'de sunulur. Geçmiş sayfasının geçici okuma hatası mevcut ilk sayfayı
silmez. Bilinmeyen sayaç sıfır sayılmaz. Mutation başlarken eski okuma iptal
edilir; periyodik okuma pending mutation ile yarışmaz. Tercih hatası rollback,
okundu hatası değişmeyen sayaç üretir. Başlamış açık PATCH sayfa içi gezinmede
tamamlanabilir; unmount olmuş panelin durumuna uygulanmaz. Yetki otoritesi
sunucuda kalır, istemci yeni izin veya kalıcı bildirim deposu üretmez.

## D-033: Akış dönüş yolu filtre ve kart işaretidir, içerik cache'i değildir

Root kapsam/tür/müzik konusu normalize URL sözleşmesidir. Müzik detayı `from`
yalnız root yolu, bilinen filtreler ve geçerli public kart işaretini kabul
eder; dış adres/başka rota/ek parametreler taşınmaz. Normal kart linki mevcut
history entry'sine kaynak işaretini yazar, Next metadatasını korur; metotlar
patch edilmez. Yüklenen listede bulunan karta görünür/odaklı dönülür; eski
özel post snapshot'ı saklanmaz, rastgele derin sayfalar otomatik çekilmez.
Giriş aynı yolu korur fakat taslak aktarmaz veya işlem göndermez. Bu, bütün
detay aileleri/derin sayfalama/U-03 geçmiş taslak koruması kabulü değildir.
