# ListeKutusu — bütüncül tasarım, ekran ve kullanıcı akışı incelemesi

Tarih: 17 Ekim 2026
Durum: **İnceleme ve tasarım yol haritası; uygulama değildir.**

## 1. Sonuç ve önerdiğim yön

Uygulamanın baştan yapılması gerekmiyor. Koyu renk ailesi, ortak kontroller, profil vitrini, oyun kabuğu ve topluluk altyapısı kullanılabilir bir temel oluşturuyor. Asıl problem, farklı zamanlarda eklenen parçaların **aynı ürün haritasını ve aynı işlem dilini paylaşmaması**.

Bugün ürün müzik, dizi, film, kitap, oyun ve toplulukları kapsıyor; fakat bazı girişler, profil kimliği, aramalar, bildirimler ve açıklamalar hâlâ yalnız müzik + eski forum ürünü gibi davranıyor. Sayfa geçişleri ve kişisel merkezler de bu farkı büyütüyor.

Önerilen yaklaşım:

1. Önce ürün haritası, kavramlar ve ekranların ana görevleri netleşsin.
2. Sonra gezinme, geri dönüş, taslak, durum ve onay davranışları ortaklaştırılsın.
3. Ardından tek uygulama kabuğu ve ortak görsel hiyerarşi uygulansın.
4. Modüller bu sisteme sırayla taşınsın; bütün sayfalar aynı anda yeniden çizilmesin.
5. Animasyon ve görsel cilalama, bağlamı ve kullanıcı emeğini koruyan akışların üstüne gelsin.

Tasarım hedefi: **kişisel zevklerin sergilendiği, içerik keşfedilen ve insanlarla buluşulan tek sosyal ürün**. Profil daha karakterli ve vitrin odaklı olabilir; gündelik keşif, koleksiyon ve yönetim ekranları daha sakin ve iş odaklı kalmalı. Steam benzeri kişisel vitrin hissi, her sayfayı büyük banner ve neon kartlarla doldurmak anlamına gelmemeli.

## 2. Kapsam, yöntem ve kanıt sınırları

- 25 adet kullanıcıya dönük page.tsx rota şablonu kaynak üzerinden incelendi; alt paneller/durumlar ayrıca envanterlendi.
- Ortak kabuk, üst çubuklar, navigasyon, arka plan, kart, alan, toast, modal, skeleton ve hata bileşenleri ele alındı.
- Canlı tarayıcı incelemesi masaüstü koyu temada 1440 × 900 ölçüsünde yapıldı.
- Ana akış, Keşfet, topluluk keşfi/detayı/sohbet detayı/etkinlik boşluğu, kitaplık müzik ve kitap giriş durumları, hesap giriş/kayıt, açık profil/vitrin/Hakkında/takipçi penceresi, müzik paylaşım detayı, oyun merkezi, forum listesi, kullanım-gizlilik ve yönetim girişi görsel kapsamdadır.
- Oturumlu hesap panelleri, profil düzenleyici, gerçek bildirim geçmişi, dolu kişisel kitaplık, yönetici/moderatör panelleri ve canlı oyun/sonuç/reconnect durumları **kaynak üzerinden incelendi**. Bu durumların tamamı görsel doğrulanmış değildir.
- Yeni hesap, paylaşım, katılım, rol, kayıt, ayar değişikliği, silme veya demo seed işlemi yapılmadı; kimlik bilgisi girilmedi.
- Uygulama kodu, CSS, veri modeli ve mevcut plan belgeleri değiştirilmedi. Bu çalışma yalnız bu raporu üretir.
- Salt okunur statik `ui:check` ve `a11y:check` geçti. Bu sonuç, bütün ekranların kullanılabilir veya erişilebilir olduğuna dair tam sertifika değildir.
- Tam browser testi, üretim performans ölçümü, piksel kontrast matrisi, mobil veya açık tema denetimi yapılmadı. Geliştirme sunucusunun ilk derleme beklemeleri üretim hız sorunu diye yorumlanmadı.
- Mobil, açık tema ve bağımsız forum geliştirmesi askıda kalır. Forum yalnız mevcut içeriğin ve ortak deneyimin korunması açısından ele alınır.

Kanıt işaretleri:

| İşaret | Anlam |
| --- | --- |
| G | Canlı tarayıcıda görüldü; uygun yerde DOM/konum ölçümüyle desteklendi. |
| K | Kaynakta doğrulandı; ilgili çalışma anı görsel olarak sınanmadı. |
| Ö | Önerilen tasarım/ürün kararı; mevcut özellik veya doğrulanmış hata değildir. |

Öncelik: P1 kullanıcı emeği, bağlam, yanlış işlem veya yanıltıcı beklenti riski; P2 bütünlük ve kullanım rahatlığı; P3 isteğe bağlı zenginleştirme. Bu tasarım incelemesinde P0 kanıtlanmadı; bu bir güvenlik/iş mantığı denetimi değildir.

## 3. Tam rota ve panel envanteri

| Rota | İncelenen yapı ve durumlar | Görsel kapsam |
| --- | --- | --- |
| / | Başlık/kişi arama, sol menü, beş akış sekmesi, içerik türü, composer, beşli keşif, karma kartlar, sıralama, boş/hata/yükleme | Dolu anonim akış görüldü; oturumlu düzenleme kaynakta |
| /discover | Arama, sonuç türleri, popüler/yeni, etiketler, istatistik, seçki, kişi/liste sonuçları, sağ ray | Anonim temel/boş müzik sonucu görüldü; alt durumlar kaynakta |
| /p/[id] | Yazar/eser/not, etkileşimler, paylaşan kişi, yorum formu/listesi, kopyalama | Anonim müzik detayı görüldü |
| /u/[slug] | Kendi/ziyaretçi/engelli profil, hero, vitrin/aktivite/hakkında/rozetler, takip penceresi, oyun/paylaş/engel | Ziyaretçi vitrini, Hakkında ve takipçi penceresi görüldü |
| /library | Müzik/Diziler/Filmler/Kitaplar, katalog/özel kayıtlar, durum/vitrin/silme; müzik gruplama/arama/Spotify/import/davet | Müzik ve kitap oturum kapıları görüldü; dolu yönetim kaynakta |
| /control | Eski müzik kontrol adresinden kitaplığa yönlendirme | Kaynak |
| /suggest | Kod çözme, alıcı özeti, şarkı arama, seçilenler, toplu gönderim, geçmiş | Kaynak; oturum kapısı ayrıca görsel planında |
| /account | Giriş/kayıt; gelen öneriler, profil, güvenlik, gizlilik, veri/hesap; eski listem yönlendirmesi | Giriş ve kayıt görüldü; oturumlu paneller kaynakta |
| /communities | Topluluk/etkinlik keşfi, filtreler, sonuçlar, sayfalama, kişisel kısayollar, oluşturma/teklifler | Dolu anonim keşif görüldü |
| /communities/[slug] | Üyelik/arşiv, sohbet/inceleme/etkinlik; composer, detay/yorum, spoiler, düzenle/raporla, yerel yönetim | Akış, sohbet/yorum detayı ve etkinlik boşluğu görüldü; yazma/yönetim kaynakta |
| /community-events | Özel ajanda, tarih/ilişki filtresi, kaynak detay, tercih geri çekme onayı | Kaynak |
| /community-saved | Özel kayıtlar, tür/inceleme filtresi, karma kart, müzik kayıtlarına geçiş | Kaynak |
| /community-cases | Topluluk/karar bağlamı, özel başvuru, durum/yanıt takibi, itiraz | Kaynak |
| /games | Katalog, önizlemeler, açık odalar, geçmiş/istatistik, giriş/boş/hata | Anonim katalog görüldü |
| /games/backgammon/new | Giriş, görünürlük seçimi, masa önizlemesi, oluşturma | Kaynak |
| /games/backgammon/[id] | Lobi, katılma, oyuncu/seyirci, tahta, kontroller, günlük, bağlantı, sonuç/terk/onay | Kaynak |
| /games/elimination/new | Liste/arama, dört parça, 2/4 oyuncu, görünürlük, opponent bağlamı, oluşturma | Kaynak |
| /games/elimination/[id] | Seçim/lobi, eşleşme/oy, video, bekleme/seyirci, grup/sonuç/paylaşım, reconnect | Kaynak |
| /forum | Kategori rayı, arama/sıralama, açık/çözüldü, konu listesi, özet, loading | Anonim liste görüldü; yeniden geliştirme kapsamı değil |
| /forum/new | Konu formu, taslak, moderasyon bekleme | Kaynak; mevcut işlev korunacak |
| /forum/[slug] | Konu/yanıt, kilit/çözüm, düzenleme/rapor/moderasyon durumları | Kaynak |
| /admin | Giriş, genel bakış, raporlar, kullanıcılar, öneri kuyruğu, istatistik/dışa aktarım | Giriş; yetkili içerik kaynakta |
| /admin/community-cases | Özel platform başvuruları, durum/karar/gerekçe/onay | Kaynak |
| /admin/forum | Donmuş forumun mevcut moderasyon paneli | Kaynak |
| /legal | Amaç, sağlayıcılar, veri/silme/oturum/puan/gizlilik açıklamaları | Görüldü |

Rota olmayan ortak durumlar: 404, render/global hata, route loading, istemci fetch loading, modal/menu/drawer, toast, kopyalama, sonsuz liste, sayfalama, offline/reconnect, oturum sonu ve izin değişimi. Ayrı /about rotası olmaması başlı başına eksik değildir; yardımın nereden erişileceği tasarlanmalıdır.

## 4. Korunması gereken güçlü temel

- Koyu lacivert/grafit yüzey, cyan ana vurgu ve kontrollü yeşil destek rengi zaten aynı aileyi oluşturuyor.
- Ortak Button/Card/alan bileşenleri ve PageTopbar var; sıfırdan ikinci bir tasarım sistemi gerekmiyor.
- Beş tür arka plan simgesi mevcut; arka plan yalnız notadan oluşmuyor. Yeniden simge ekleme işi yok.
- Canvas ve reduced-motion altyapısı var; yeni animasyon sistemi icat edilmemeli.
- Topluluk URL/hedef/filtre ve eski yanıt iptali, oyun revision/polling ve hesap silme onayları önemli sağlamlıklar.
- Birçok sekmede yön tuşları ve odak yönetimi; dialoglarda Escape/odak geri getirme temeli mevcut.
- Spoiler, özel kitaplık, açık tercihli vitrin, isteğe bağlı/gizli üniversite ve özel etkinlik ajandası sınırları korunmalı.
- Profilin kişisel karakteri ve Tavla tahtasının kendine özgü materyali, ortak kabukla çelişmeden yaşatılmalı.
- Görselsiz eserler ve monogram avatarlar için iyi bir tipografik tasarım mümkün; her karta zorunlu kapak veya yeni upload sistemi eklemek gerekmez.

Statik ölçüm notu: 12 px altı metin bütçesi sıfır; 92 semantik token referansı tanımlı. Hesap sayfası mevcut 620/620 satır bütçesinde; genel CSS 1441/1500. Bu, yeni tasarımı büyük dosyalara ek yama şeklinde büyütmek yerine ortak varyantlarla yürütmek için bir bakım işaretidir; tek başına görsel hata değildir.

## 5. En önemli ortak bulgular

### T-01 — P1 / G+K: Sayfa geçişinde başlık sabit menünün altında kalıyor

Ana akış → Keşfet ve sonraki bölüm geçişlerinde gözlendi. Keşfet'te DOM ölçümü: global menü top=0, yükseklik yaklaşık 62,4 px, z=40; sayfa başlığı top yaklaşık 13,6 px ve ikinci header top=0, z=30; scrollY yaklaşık 62,4 px. Başlık üst menünün arkasında kalıyor. Doğrudan sayfa açılışında aynı çift katman farklı görünüyor.

Kod dayanağı: [sosyal kabuk](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/layout.tsx:7>), [sticky menü ve iç header override](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/styles/primitives.css:492>).

Öneri: tek kabuk yüksekliği/scroll-offset sözleşmesi; yeni bölümde başlığın görünmesi, detaydan dönüşte eski konuma dönme. Önce konum/odak, sonra animasyon. Kriter: her ana bölüm Link geçişinde h1 menünün altında görünür ve klavye odağı anlamlı hedefe gider.

### T-02 — P1 / G+K: Modal, global navigasyonu gerçek anlamda örtmüyor

Profil takipçi penceresinde arka plan bulanıklaşırken üst ana menü açık kaldı. DOM hit-test üst şeritte hâlâ /communities bağlantısını verdi. Modal aria-modal=true; backdrop z=70 ama ana içerik stacking context'i z=1, global menü z=40. Yüksek yerel z-index tek başına global katman sırasını çözmüyor.

Kod: [takipçi modalı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/u/[slug]/ProfileClient.tsx:363>), [global navigasyon](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/styles/primitives.css:492>), [ortak ConfirmDialog](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/ConfirmDialog.tsx:23>).

Öneri: uygulama seviyesinde tek modal katmanı/portal ve arka planın etkileşimsizliği. Menü, toast, drawer ve onay katmanlarının sırası belgelenmeli. Canlı bulgu takipçi penceresi içindir; bütün onay pencerelerinde aynı etki olmuş gibi sunulmamalı, onlar ayrıca sınanmalı.

### T-03 — P1 / K: Kullanıcının emeğini koruma sözleşmesi parçalı

Profil bazı çıkışları onaylıyor, fakat AccountMenu Link'leri aynı korumayı almıyor; etkinlik editörü iptalde dirty onayı vermiyor; post hedefi değişince yorum state'i sıfırlanıyor. Tarayıcı beforeunload, SPA içi Link geçişini tek başına kapsamaz.

Kod: [hesap çıkış/panel koruması](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/account/page.tsx:281>), [hesap menüsü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/AccountMenu.tsx:123>), [post değişiminde reset](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityClient.tsx:68>), [etkinlik editörü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityEventEditor.tsx:8>).

Öneri: değişmedi/değişti/kaydediliyor/hata/kaydedildi; Kaydet / Kaydetmeden ayrıl / Düzenlemeye dön. Kapsam tüm çıkış yollarıyla belirlenmeli. Kalıcı yerel taslak ayrı karar; hassas açıklamalar otomatik localStorage'a konmamalı.

### T-04 — P1 / K: Arama vaadi, gerçekten aranan kapsamdan geniş

Keşfet genel arama gibi konuşuyor ama q sunucuya gitmiyor. Hazır seçki istemcide süzülüyor: son 30 günden en fazla 250 kaynak müzik paylaşımından ilk 18 benzersiz şarkı; sınırlı kişi/liste kümesi. İçerik ilk seçkide yoksa uygulamada yokmuş gibi anlaşılabilir.

Kod: [Keşfet yükleme](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/discover/page.tsx:119>), [istemci filtreleri](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/discover/page.tsx:167>), [seçki sınırı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/lib/discover.ts:80>), [API kapsamı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/api/discover/route.ts:27>).

Öneri: kısa vadede “Bu seçkide ara” gibi dürüst kapsam; kapsamlı ürün araması istenecekse ayrıca gerçek arama akışı. “Keşfet tüm ürün mü, müzik keşfi mi?” Faz 0 kararıdır.

### T-05 — P1 / K: Hata bazen sıfır sonuç, bazen sonsuz bekleme gibi görünebilir

- Keşfet people/lists durumunda genel loadError yalnız şarkı bloğunda; “bulunamadı” ile karışabilir.
- Suggest kod çözme/arama/toplu gönderimde fetch reddi loading/sending temizliğine ulaşmayabilir.
- Düello kurulum yükleme/oluşturma da benzer ağ hata yolu taşır.
- Profil aramasında HTTP hatası boş kullanıcı listesi olarak sunulabilir.

Kod: [Keşfet hata bloğu](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/discover/page.tsx:509>), [Suggest](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/suggest/page.tsx:94>), [düello kurulum](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/elimination/new/page.tsx:29>), [kişi araması](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/ProfileSearch.tsx:85>).

Öneri: veri yok / filtre yok / erişim yok / ağ hatası / sonuç bilinmiyor / kısmi başarı ayrı tasarım halleri. Gönderimde belirsizlik “başarısız, tekrar gönder” diye otomatik yorumlanmamalı; tekrar öncesi mevcut sonuç güvenli biçimde sorgulanmalı.

### T-06 — P1 / K: İtiraz açıklaması bağlam değişince yanlış hedefe taşınabilir

Başvuru formunda seçilen topluluk değişirken reason korunuyor; hedef özetine güçlü dikkat/onay yok. Teknik report ID ve slug kullanıcıdan isteniyor.

Kod: [başvuru state ve topluluk seçimi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/communityCases/CommunityCaseClient.tsx:27>), [hedef/kimlik alanları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/communityCases/CommunityCaseClient.tsx:56>).

Öneri: topluluk/içerikten bağlamlı başlatma, insan-okur hedef/karar özeti, topluluk değişiminde taslak uyarısı; gönderim öncesi hedef adı ve özel alıcı sınırı.

### T-07 — P1 / K: Oyun davetinin gizlilik vaadi kesin değil

“Yalnız bağlantıyı paylaştığın kişi katılır” metni hedef kişiye özel yetki gibi algılanıyor. Mevcut unlisted oda bağlantısına sahip girişli kişi katılabilir. Profil kaynaklı opponent adı ekranda var ama oluşturma payload'ında hedefli davet yok.

Kod: [Tavla görünürlük metni](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/backgammon/new/page.tsx:91>), [katılma koşulu](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/api/games/backgammon/[id]/route.ts:39>), [opponent ve oluşturma](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/elimination/new/page.tsx:49>).

Öneri: mevcut özellik “Listelenmeyen — bağlantıya sahip kişiler katılabilir” olmalı. “Kişiye özel davet” ayrı özellik olarak tasarlanmalı; şu anda gönderilmiş/kişiye kilitli davet varmış gibi gösterilmemeli. Bu bir yetki açığı iddiası değil, beklenti sorunudur.

### T-08 — P1 / K: Reconnect bildirimi ile işlem yapabilme hâli ayrışıyor

Bağlantı rozeti varken Tavla kontrollerinin ve düello oyunun kilidi bağlantı durumunu içermiyor. Sunucu doğrulaması var; sorun kullanıcının eski state üzerinde niyet gönderip kaydedildi mi bilememesi.

Kod: [Tavla kilidi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/components/BackgammonBoard.tsx:426>), [düello oy kontrolü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/elimination/[id]/page.tsx:324>).

Öneri: son doğrulanan sahne korunmalı; sabit banner, eşitleme durumu ve güvenilir state gelene kadar açık işlem kısıtı tanımlanmalı.

### T-09 — P2 / G+K: İki ayrı ana navigasyon ve değişen kabuk

Ana akışta hem üst beşli menü hem sol aynı bölüm menüsü var. Hesap, Suggest, legal ve yönetim başka kabuklara geçiyor. /community-events, /community-saved, /community-cases yolunda Topluluklar aktif olmuyor.

Kod: [ana navigasyon aktifliği](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/PrimaryNavigation.tsx:15>), [sol menü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/HomeSidebar.tsx:75>), [PageTopbar](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/PageTopbar.tsx:35>).

Öneri: bir ana navigasyon otoritesi; özel hesap/yönetim bağlamı değişse de marka, hesap alanı, geri davranışı ve ölçü sistemi aynı kalsın.

### T-10 — P2 / G+K: Aynı kavramlar farklı şeylere karşılık geliyor

Kaydet bazen müzik paylaşımını, bazen topluluk içeriğini tutuyor; ana Kaydedilen sekmesi yalnız müzik. Kitaplık ise eser koleksiyonu ve yine ayrı. “Müzik listem”, “Listem”, “Kitaplığım” girişleri tekrarlanıyor.

Kod: [kayıt merkezi kısayolları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/HomeSidebar.tsx:115>), [akış kapsamı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/page.tsx:329>).

Öneri: Kitaplığım=eser koleksiyonum; Kaydettiklerim=daha sonra döneceğim paylaşımlar; Etkinliklerim=özel niyet ajandam; Profil=vitrinim; Hesap=ayarlarım. Ortak giriş ilk aşamada tür sekmeleriyle mevcut ayrı API'leri kullanabilir; veri modellerini zorla birleştirmek gerekmez.

### T-11 — P2 / G+K: Giriş gereksinimi aynı aile içinde hata veya normal kapı olarak sunuluyor

Müzik kitaplığı oturumsuzken açıklamalı normal giriş kartı; Kitaplar sekmesinde kırmızı “Önce giriş yapmalısın” paneli ve pasif arama var. Kullanıcı normal bir başlangıç durumunda hata yapmış gibi karşılanıyor.

Öneri: bütün özel koleksiyonlarda aynı LoginGate: neden, kazanım, doğru next hedefi. 0 kayıt, oturum bilinmiyorken veya veri yüklenememişken gerçek sayı gibi gösterilmemeli.

### T-12 — P2 / G+K: Başlık ve geri bildirim semantiği tutarsız

Müzik paylaşım detayında “Paylaşım” ve eser adı iki h1. Forum detay, admin giriş, 404/error da ortak PageTopbar yüzünden aynı deseni taşıyor. Bazı sayfa metadata'ları marka ekini iki kez alıyor: “Topluluklar | ListeKutusu | ListeKutusu”. Games/forum gibi bazı ekranların tarayıcı adı yalnız marka.

Kod: [paylaşım başlıkları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/p/[id]/PostDetailClient.tsx:135>), [asıl eser h1](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/p/[id]/PostDetailClient.tsx:175>), [üstbar varsayılanı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/PageTopbar.tsx:28>), [çift marka başlığı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/page.tsx:3>).

Öneri: tek asıl h1; bölüm adı breadcrumb/etiket; metadata marka ekini tek merkezden alsın. Toast sonucu metinden tahmin edilmesin: başarılı “reddedildi” işlemi hata kırmızısı olmamalı ([Toast sınıflandırması](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/Toast.tsx:20>)).

## 6. Ekran ailelerine göre ayrıntılı tasarım işleri

### 6.1 Ana akış ve genel arama

Ana görev: yeni içerik okumak, anlamak, etkileşmek; müzik öneri aracını yönetmek değil.

- G+Ö: 1440 × 900 ilk görünümde global menü, ikinci üst alan, akış hero/sekme, içerik filtresi, giriş composer'ı ve beşli müzik seçkisi ilk asıl paylaşımı alt sınıra itiyor. Bu bir ilk-bakış hiyerarşisi sorunu; geliştirmenin yavaşlığı iddiası değil.
- K: Etkinlik/inceleme filtresinde de müzik composer'ı, beşli seçki ve müzik liderlik sağ rayı kalıyor. Bunlar bağlamsal/küçültülebilir olmalı.
- K: “İlk şarkını paylaş” boş CTA'sı, etkinlik veya inceleme boşluğunda aynı görevi anlatmıyor.
- K: Müzik ve topluluk kartlarında yazar, menü, tarih, yorum ve kaydet aksiyonlarının yerleri farklı.
- K: scope URL'de, içerik türü ve etiket bazı yerlerde yalnız state'te; yenileme/geri beklentisi değişiyor.
- K: Korumalı sekme ve kart etkileşimlerinden girişe geçişte hedef kaybı var; composer dönüşü iyi örnek olarak korunmalı.
- K: Keşfet girişinde q/type bağlamı, ana akıştaki Beşli Keşif'te gerçek kaynak sayfa ve karma kart işlemlerinde içerik hedefi korunmuyor. Dönüş her zaman genel / veya /discover olmamalı ([Keşfet](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/discover/page.tsx:249>), [Beşli Keşif](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/DiscoverySession.tsx:115>), [karma kart](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/CommunityCardActions.tsx:28>)).
- Ö: kompakt type picker + aktif filtre chip'leri, ana akışta tek içerik başlangıç çizgisi, ikincil müzik önerisi kısayolu.
- Ö: ortak Oluştur/Paylaş girişi düşünülebilir. Müzik doğrudan; sohbet/inceleme/etkinlik önce uygun topluluğu seçer. Mevcut yetki/dağıtım kuralları değişmiş gibi gösterilmez.
- Ö: “Müziksever ara” şimdiki hâliyle “Kişi ara” diye dürüstçe adlandırılabilir. Gerçek global arama sonraki teknik kapsam kararıdır.

Kanıtlar: [sabit yan modüller](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/page.tsx:331>), [boş CTA](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/FeedEmptyState.tsx:71>), [karma kart](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/CommunityFeedCard.tsx:16>), [profil araması](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/ProfileSearch.tsx:114>).

### 6.2 Keşfet

Ana görev kararı: bütün ürünün keşif merkezi mi, yalnız müzik alt alanı mı?

- T-04/T-05 kapanmadan yalnız kartları büyütmek arama güvenini çözmez.
- G: son 30 gün boşluğu görülürken 18 liste gibi başka kapsamın sayıları aynı özet alanında bulunuyor; sayımların nesnesi ve zaman aralığı açık olmalı. Sıfır tek başına ürünün boş olduğu izlenimini yaratmamalı.
- K: q/type korunuyor ama seçili etiket ve sıralama her zaman URL'de değil.
- K: şarkı adı düz başlık; paylaşım/yorum detayına doğal geçiş sunmuyor. İkon+sayı eylemleri salt istatistik sanılabilir.
- Ö: türüne göre kapsam etiketli sonuçlar; kendi alanında arama ile katalogda arama ayrımı; boş sonuç ve servis hatası ayrı yüzey.
- Ö: müzik keşfi korunursa menü/kapsam bunu söylemeli; geniş keşif hedeflenirse Müzik / Topluluk / İnceleme / Etkinlik / Kişi alanları aşamalı eklenmeli.

### 6.3 Paylaşım okuma ve yorumlar

- Müzik detayı ile topluluk sohbet/inceleme detayı aynı okuma anatomisini paylaşmalı: bağlam, başlık, yazar/zaman, içerik, etkileşim, yorum.
- G+K: topluluk kartı/yorumunda tarih görünmezken müzikte var; yeni/eskimiş konuşmayı ayırmak zorlaşıyor.
- G: müzik detayında oturumsuz yorum CTA'sı içerik sonunda var; topluluk sohbetinde buna eşdeğer bağlamsal yönlendirme zayıf.
- K: başlığa basarak detay açma buton semantiğinde; yeni sekme ve geri dönüş beklentisi gerçek link kadar doğal değil.
- Ö: tek ikon+metin+sayım aksiyon sırası; müzikte “Listeme ekle” tür özelidir, her karta yapıştırılmaz.
- Ö: uzun okuma için yaklaşık 65–80 karakterlik okunabilir satır hedefi prototipte sınansın; ana sayfa/filtre genişliğiyle aynı kural olmak zorunda değil.
- Ö: “Kullanıcının eser seçimi” gibi teknik açıklamalar daha anlaşılır “Elle eklenen eser” gibi, doğrulanmış katalog seçimini yanlış ima etmeyen dille sunulsun.

### 6.4 Topluluk keşfi

- G: arama + üniversite + şehir + tür + ilgi kontrolleri, sağ çağrı paneli ve açıklamalar sonuçlardan önce geniş alan alıyor.
- K: oturumlu görünümde bunlara kişisel merkezler, teklifler ve sağda tam topluluk kurma formu da ekleniyor.
- Ö: ilk satır arama + topluluk/etkinlik görünümü; gelişmiş filtreler isteğe bağlı panel; aktif filtreler sonuç başında chip.
- Ö: “Topluluk oluştur” tek CTA ile odaklı forma gitsin; keşif ekranı sürekli yönetim/oluşturma formu gibi görünmesin.
- Ö: kartta ad, konu/ilgi, kısa tanım, üye sayısı, açık okuma durumu; üniversite/şehir varsa yardımcı metadata. Süs kapağı zorunlu değil.
- Ö: Topluluklarım, Etkinliklerim, Kaydettiklerim ortak ikinci düzey alan menüsünde bulunmalı.
- Ö: mevcut forum bağlantısı korunabilir ama yeni topluluklarla eşit yatırım alanı gibi vurgulanmamalı.

Kanıt: [keşif ve oluşturma](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityDirectory.tsx:52>).

### 6.5 Topluluk içi akış, composer ve inceleme

- K: aktif üyeye tam composer akıştan önce gelir; okuyan kullanıcıya üretim formu hâkim olabilir.
- Ö: kısa paylaşım girişinden odaklı Sohbet / İnceleme / Etkinlik akışı.
- İnceleme sırası: tür → eser seçimi → puan → metin/spoiler → topluluk/dağıtım özeti → yayınla. Katalog/kitaplık/manual yöntemlerin anlamı açık.
- K: katalogda Ara/Enter, başka alanlarda farklı otomatik bekleme süreleri kullanılıyor; dış katalog ve kendi kayıt araması açıkça ayrılmalı.
- K: dağıtım açıklamasında hâlâ “Topluluklardan bölümü” var; mevcut Yeni/Takip karma akışıyla çelişiyor.
- K: giriş next'i yalnız topluluk kökünü koruyor; doğrudan post/event hedefi kaybolabiliyor.
- Ö: topluluk kuralları kısa özet + ayrıntı; gerekli görünürlük/spoiler uyarıları ilgili işlem yanında kalmalı.
- Ö: yorum taslağı, inceleme düzenleme ve yeni yayın aynı ortak taslak sözleşmesine bağlanmalı.

Kanıt: [composer](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityComposer.tsx:30>), [dağıtım metni](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/CommunityDistributionField.tsx:5>), [giriş hedefi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityClient.tsx:105>).

### 6.6 Etkinlikler ve özel ajanda

- G: boş etkinlik durumunda kısa “Bu görünümde etkinlik yok” ve genel üyelik cümlesi var; keşif/giriş için açık sonraki adım zayıf.
- K: oturumsuz, üye olmayan, geçmiş, iptal ve arşiv durumları aynı genel açıklamaya düşebiliyor.
- Ö: etkinlik üstünde tarih/saat/şehir/başlık/doluluk; tek baskın Katılacağım veya mevcut tercih; İlgileniyorum ikincil.
- Ö: açıklama, katılımcı listesi ve yönetim kontrolleri ayrı odak yüzeyleri; katılımcı listesi mevcut izin sınırında kalmalı.
- Ö: “Giriş yap”, “Topluluğa katıl”, “Başladı”, “İptal”, “Arşivde” nedene özel durumlar.
- K: düzenleme dirty/onay davranışı inceleme editörüyle eşit değil.
- K: ajandadan detaya gidip sabit Geri'ye basınca keşfe dönülebiliyor; geldiği ajanda ve filtre korunmalı.
- Ö: ajanda liste/tarih gruplarıyla sade kalmalı; ICS/takvim görünümü P3, yeni zorunlu entegrasyon değil.
- Ö: mekânı görünür kılmak adına hassas konum veya katılımcı listesini gereksiz yere herkese açmamak.

Kanıt: [etkinlik detay/erişim/boş durum](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityEventsPanel.tsx:51>), [ajanda dönüşü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/community-events/CommunityAgendaClient.tsx:40>).

### 6.7 Üyelik, sahiplik ve yerel moderasyon

- K: ayrılma/kaldırma onayı genel “Onayla” diyor; ayrılmanın RSVP'leri çektiği etkisi işlem bağlamında yeterli açıklanmıyor.
- Ö: hedef adlı, sonucu açık onay: “Topluluktan ayrıl ve katılım tercihlerimi geri çek”.
- K: sahiplik teklifinde üyeden profil URL'sinin /u/ sonrası isteniyor.
- Ö: uygun aktif üyeden ad/avatar/rol ile aramalı seçim; son onayda hedef ve yetki etkisi. Ayrı kabul ve süre sınırları korunmalı.
- Ö: Akış/Üyeler/Raporlar/Geçmiş/Ayarlar bağlama göre düzenlenebilir; sıradan üye yönetim araçlarına boğulmamalı.
- Ö: raporu kapatma, içeriği kaldırma ve kişiyi uzaklaştırma farklı sonuçlardır; aynı buton tonu/tek açıklamada eritilmemeli.
- Ö: arşiv, özel okuma veya silme gibi adlandırılmamalı. Yerel moderatör ile platform yöneticisinin yetkisi ekranda ayrılmalı.

Kanıt: [genel onay](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityClient.tsx:100>), [sahip seçimi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/communities/CommunityOwnershipPanel.tsx:42>).

### 6.8 Kitaplık: müzik, dizi, film, kitap

- K: dört bölüm fikri doğru; fakat müzikte koleksiyon solda/ekleme sağda, diğer türlerde katalog solda/koleksiyon sağda. Tür değişince görevlerin yeri tersine dönüyor. Dolu koleksiyonların bu yerleşimi kaynakta doğrulandı; oturumlu canlı görünümü ayrıca sınanmalı.
- Ö: dört türde üstte tür/özet/arama/durum; ana alanda koleksiyon; aynı yerde “Eser ekle” paneli.
- K: müzik yerel arama/gruplama sunuyor; diğer koleksiyonlarda kayıt içi arama/durum filtresi/sıralama eksik.
- Ö: son eklenen/ad/yıl sıralaması, durum chip'leri, kompakt liste/kart seçeneği. Harici API şart değil.
- K: müzikte silme modalı; medya vitrin/kaldırmada inline onay; hata davranışları farklı.
- Ö: aynı işlem sınıfına aynı onay/undo ailesi. “Kitaplıktan kaldır” ve “Profil vitrininden kaldır” farklı fiiller.
- Ö: özel okuma/izleme durumu, açık vitrin tercihi, en fazla görünen seçkiler alanın yanında anlaşılır olmalı.
- Ö: müzik Spotify oluştur/senkron/import/davet araçları ana koleksiyonun rakibi değil ikincil “Müzik araçları” alanında.
- Ö: kapaksız kayıtlar için kitap/film/dizi simgesi, başlık, yazar/yönetmen/yıl hiyerarşisi; rastgele sahte afiş yok.
- Oyun kitaplığı geleceğe rezervlenebilir; mevcut dört bölüm sessizce beşe çıkarılmaz.

Kanıt: [medya yerleşimi ve işlemler](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/library/LibraryClient.tsx:115>), [müzik yerleşimi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/library/MusicLibraryPanel.tsx:318>).

### 6.9 Şarkı önerme ve Spotify araçları

- K: /suggest ortak sosyal layout dışında kendi topbar/dock kabuğunda.
- Ö: hedef kişiyi doğrula → parça seç → seçilenleri gözden geçir → sonuç/yeniden dene. Üç adımlı mevcut temel korunabilir.
- K: kod çözme/arama/gönderim ağ hataları bazı bekleme durumlarını kilitleyebilir.
- Ö: alıcı adı ve liste adı seçilenlerin üzerinde sabit; yanlış alıcıya öneriyi azaltacak son özet.
- Ö: kısmi başarıda gönderilenler/kalanlar ayrı; seçilmeyenler veya başarısızlar kaybolmasın.
- Ö: Spotify işlemlerinde “kişisel listeye kaydet” ile “Spotify'a aktar/senkronla” ayrı sonuçlar.
- Ö: içe aktarmada biçim örneği, geçerli/tekrar/geçersiz adet özeti ve işlem sonucu; tümünü tek toast ile geçmemek.

### 6.10 Profil ve vitrin

- G+K: karakterli banner/hero ve vitrin fikri iyi; kimlik ve aktivite çoğunlukla müzik/legacy forumla tanımlanıyor.
- K: yeni topluluk sohbet/incelemesi profil aktivitesinde temsil edilmiyor; bunu eklemek yalnız metin değil veri/sunum kapsamı.
- Ö: Genel bakış/Vitrin, Paylaşımlar ve incelemeler, Hakkında, Başarımlar gibi sade içerik haritası; kesin sekme sayısı Faz 0'da kararlaştırılmalı.
- Ö: herkese açık seçkiler çoklu ilgi alanını temsil etsin; özel ajanda, özel okuma durumu ve gizli üniversite açık profile taşınmasın.
- G: Hakkında/müzik kimliği, üst hero, sağ ray ve sekme içinde tekrar edebiliyor; aynı bilgiye tek ana yer.
- K: modül sırası yalnız CSS order ile değişiyor; görsel sıra ile DOM/klavye sırası ayrışabiliyor.
- Ö: Steam hissi için kontrollü banner/tema, seçilebilir modül düzeni, başarımlar/son katkılar. XP/mağaza/avatar upload gibi yeni sistemler önkoşul yapılmamalı.
- K: özel oyun butonu hedefli davet gönderilmiş sanılmamalı; T-07 terminolojisiyle aynı.
- Ö: boş/sade profil bilinçli tercih olabilir; kullanıcıyı rozet/üç eser doldurmadığı için eksik ilan etmemek.

Kanıt: [profil vaadi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/profile/ProfileHeroV3.tsx:24>), [aktivite bileşimi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/profile/ProfileTabPanels.tsx:69>), [CSS order](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/profile/ProfileTabPanels.tsx:130>).

### 6.11 Profil düzenleyici

- K: önizleme otomatik öne çıkanı posts[0] alırken gerçek vitrin beğeni+ekleme sıralaması yapıyor; tür sayısı da farklı.
- Ö: gerçek sunum modeliyle aynı önizleme veya açıkça “yaklaşık önizleme”; kayıt sonrası kullanıcıya sürpriz olmamalı.
- K: iki birincil Profili kaydet noktası ve müzik/rozet koşullu tamamlanma sinyali var.
- Ö: tek sabit kaydet çubuğu; değişti/kaydediliyor/kaydedildi/hata; “tamamlama zorunluluğu” yerine isteğe bağlı zenginleştirme.
- Ö: Kimlik / İlgi alanları / Vitrin / Görünüm ayrımı; medya vitrininin Kitaplık'tan yönetildiği açık kısayolla anlatılmalı.
- K: sürükleme tutacağı çağrışımı yapan ikonun davranışı yukarı/aşağı düğmeleri. Gerçek sürükleme eklenmese de etiket ve klavye alternatifi açık olmalı.
- Ö: “Herkesin gördüğü” ziyaretçi önizlemesi; gizli alanlara göz/özel açıklaması.

Kanıt: [önizleme modeli](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/AccountProfilePanel.tsx:126>), [gerçek seçim](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/profile/ProfileTabPanels.tsx:61>), [kaydet noktaları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/AccountProfilePanel.tsx:463>).

### 6.12 Giriş, kayıt ve hesap merkezi

- G: kitap eklemek için gelen kişiye kayıt ekranı müzik paylaşma ve kişisel müzik listesi adı üzerinden sesleniyor.
- Ö: genel ürün vaadi; temel hesap için gereken alanlar ile isteğe bağlı ilk koleksiyon adımı ayrı değerlendirilmeli. Mevcut liste veri modeli şimdi değiştirilmiyor.
- K: hesap ilk açılışta gelen önerilere gider; Profil dâhil ilk alan “Liste yönetimi”.
- Ö: Profil / Güvenlik ve oturumlar / Gizlilik / Bildirimler / Veri ve hesap. Kitaplık içerik yönetimidir, ayar paneli değildir.
- K: hatalar çoğunlukla toast; parola tekrarı dışında alan ilişkisi zayıf.
- Ö: alan altında açıklama + ilk hataya odak; ağ hatası kalıcı form banner'ı; başarılı işlem kısa toast.
- K: son karar araması önce yüklenen 20 kararın içinde; “tüm geçmiş” beklentisi oluşmamalı.
- K: aktif oturumlar “Diğer oturum” etiketiyle ayırt etmekte zayıf; kapatma sonrası sonuç ve hata duyurusu zenginleştirilmeli.
- Ö: mevcut cihaz, açılış/son etkinlik/sona erme; gereksiz konum/IP toplamak önerilmiyor.
- K: gizlilik paneli esasen engellenenler; üniversite/vitrin/bildirim tercihleri dağınık.
- Ö: “Herkesin gördükleri / özel kalanlar / engellenenler” özet ve doğru ayara kısayol.
- Ö: export için hazırlık/hata/sonuç; hesap kapatmada mevcut parola/kesin metin/açık arşiv onayı korunarak etki özeti ve başarı sonucu.
- P3: Şifremi unuttum/e-posta değişikliği beklentisi tasarlanmalı; sağlayıcı/güvenlik gerektiren yeni iş olarak ayrılmalı, çalışan özellikmiş gibi çizilmemeli.

Kanıt: [kayıt vaadi/alanları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/AccountAuthPanel.tsx:75>), [ayar grupları](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/AccountDashboardSidebar.tsx:16>), [karar arama sınırı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/account/page.tsx:125>), [oturum listesi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/ActiveSessionsPanel.tsx:85>).

### 6.13 Bildirimler

- K: takip/beğeni/listeye ekleme tercihleri var; etkinlik değişiklik/iptal bildirimlerinin kategori/tercih mantığı kullanıcıya aynı açıklıkla anlatılmıyor.
- Ö: Sosyal / Topluluk / Etkinlik / Sistem kapsamları; okunma durumu ve hangi bildirimin tercihle değiştirildiği net.
- K: Tümü/Okunmamış seçimi yalnız CSS'te; ortak tab/pressed semantiği yok.
- K: okundu isteği başlarken panel kapanır; hata geri bildirimi görünmeyebilir.
- Ö: panel kısa özet; tam geçmiş sayfası P3 aday. Mevcut geçmişi okurken sessiz yenileme satırları ve scroll'u zıplatmamalı.
- Ö: bildirim bağlantısı doğru post/event hedefine ve geri dönülebilir bağlama gitmeli.

Kanıt: [bildirim filtre/tercihler](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/NotificationCenter.tsx:252>), [okuma ve kapanış](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/NotificationCenter.tsx:315>).

### 6.14 Özel başvuru, platform yönetimi ve moderasyon

- T-06 öncelikli: kullanıcıdan teknik slug/report ID istemek yerine insan-okur karar/içerik bağlamı.
- Ö: başvuru akışı Topluluk/konu → olay/karar → açıklama → özel alıcı/hedef özeti → takip. ID yalnız referans numarası olarak ikincil.
- Ö: durum kartı son yanıt, karar özeti ve zaman çizgisi; yanıt süresi veya kaynak yaptırımının otomatik değişeceği vaat edilmemeli.
- K: admin dört sekme, platform başvuruları ayrı metin linki; forum moderasyonu başka kabukta, yerel topluluk yönetimi kaynakta.
- Ö: yönetim kabuğu Genel bakış / İçerik bildirimleri / Platform başvuruları / Kullanıcı yetkileri / İşlem geçmişi / Bağlantılar; role göre görünürlük.
- K: admin ağ yükleme hatasında yetkisiz giriş görünümüne düşebiliyor; “erişim yok” ile “servise erişemedik” ayrılmalı.
- K: Spotify'a aktarılmış liste sayısı o an yüklenen 20'lik/süzülmüş sayfadan hesaplanıp toplam gibi sunuluyor.
- Ö: her KPI nesne/kapsam/zaman/güncellik taşır; bağlantı mevcut olmak “sağlıklı son senkron” diye gösterilmez.
- Ö: toplu işlemde seçili adet/hedef/sonuç; tehlikeli eylemde açık neden/etki; işlem günlüğüne kısayol.
- Yerel moderatör, global moderatör, platform admin ve root operatör sınırları tasarımda karışmamalı.

Kanıt: [sınırlı liste yükleme](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/admin/page.tsx:128>), [sayfa üzerinden toplam](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/admin/page.tsx:534>), [gösterge dili](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/components/admin/AdminOverview.tsx:45>), [yetki/ağ ayrımı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/admin/page.tsx:111>).

### 6.15 Oyun merkezi, Tavla ve Şarkı Düellosu

- G: katalog kartları aynı ailede; önizlemeler iyi başlangıç. Anonim görünümde birçok “Giriş yap” aynı önemle tekrar ediyor; oyun niyetini adlandıran CTA daha anlaşılır.
- K: yükleme esnasında oda yok veya iki oyun gibi kesin sayılar erken görünebiliyor; skeleton ile gerçek sıfır ayrılmalı.
- K: oyun loading skeleton üç kolon, gerçek katalog iki; kurulum ve canlı sahne aynı placeholder'a zorlanmamalı.
- K: düello parça arama alanının erişilebilir adı zayıf; sıfır arama sonucu ile gerçekten dört parçası olmama aynı açıklamaya düşüyor.
- Ö: seçilen dört parçanın sabit özeti, arama kapsamı/sonuç sayısı, seçim limiti; başarısızlıkta seçimler korunur.
- K: görünürlük radio benzeri özel düğmelerde; klavye ve tek seçim sözleşmesi ortak olmalı.
- T-07/T-08: listelenmeyen oda/davet ve reconnect davranışı önce netleşmeli.
- Ö: ortak lobi: oyuncu koltukları, Sen/rol, görünürlük, kapanma açıklaması, davet, bağlantı ve sahibin kontrolü.
- K: düello maç günlüğü sahneden önce; Tavla'da sonra. Ana işin yeri sabitlenmeli.
- K: video ID varsa iframe, fakat ID olup oynatılamayan hâl için uygulama içi alternatif zayıf.
- Ö: metinsel parça kimliği hep görünür, video alanı yüksekliği sabit, dış önizleme yolu; video oy vermenin önkoşulu değil.
- K: Tavla sonuç overlay'i tüm tahtayı blur ile örter; son tahtayı inceleme yolu yok.
- Ö: kapanabilir sonuç/son durumu incele; yeni oyun ve paylaşım önceliği tüm oyunlarda tutarlı.
- K: Tavla davet kopyalama hatası sessizken düelloda ele alınıyor; ortak kopyalandı/kopyalanamadı ve seçilebilir URL alternatifi.
- Yeni oyun eklemek, bu kapanışın önkoşulu değil.

Kanıt: [parça seçimi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/components/GameTrackPicker.tsx:39>), [düello günlüğü](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/elimination/[id]/page.tsx:224>), [video alternatifi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/components/YouTubeMatchPreview.tsx:15>), [sonuç yüzeyi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/components/BackgammonBoard.tsx:512>).

### 6.16 Forum, kullanım-gizlilik, 404 ve hata ekranları

- Forum yeniden açılmıyor; mevcut kategori, konu ve moderasyon içerikleri korunuyor.
- K: forum filtre geçmişi yeni topluluk URL/geri davranışıyla eşit değil. Koruma paketinde yalnız bağlam/başlık/ortak kabuk ele alınmalı.
- G+K: legal metinler müzik/Spotify/eski forum ve eski hesap kapanışı anlatısıyla sınırlı. Yeni kitaplık/katalog, topluluk/etkinlik, üniversite, özel başvuru ve arşiv tercihleriyle ürün açıklaması güncel değil.
- Ö: okunabilir içerik genişliği, başta kısa özet, konu başlıkları, güncelleme/sorumlu/iletişim alanı; gerçek hukuki metin yetkili inceleme gerektirir. Bu rapor hukuki uygunluk kararı vermiyor.
- K: 404/hata ekranlarında çift h1; her hataya aynı “Bağlantı sorunu” ve her yokluğa retry uygun değil.
- K: genel hata ekranındaki “Verilerin güvende” cümlesi render hatasının kanıtlamadığı bir garanti; taslak da kaybolmuş olabilir.
- Ö: kaynak biliniyorsa o alana dönüş; bilinmiyorsa Ana akış/Keşfet. Hata başlığı, açıklama ve CTA gerçek duruma uygun.
- Ö: genel loading “Ana akış yükleniyor” yerine bulunduğu rotayı anlatmalı; skeleton son ekran ailesinin geometrisine yakın olmalı.

Kanıt: [legal içerik](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/legal/page.tsx:7>), [forum geçmişi](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/forum/page.tsx:212>), [kanıtsız güvence](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/error.tsx:29>), [oyun hata başlığı](<C:/Users/barto/Documents/Codex/2026-07-02/bu/playlist-app/app/(social)/games/components/GameErrorState.tsx:28>).

## 7. Önerilen bilgi mimarisi

Önerdiğim ana yön: masaüstünde **kalıcı sol bölüm menüsü + tek üst hesap/arama alanı + içerik başlığı**. Üstte aynı beş bölümü tekrar eden ikinci ana menü büyütülmemeli. Odaklı canlı oyun ve editörde sol menü kontrollü daralabilir; geri dönüş yolu kaybolmaz.

Bu bir öneridir; Faz 0 prototip onayı olmadan mevcut kabuk değiştirilmez.

```text
ListeKutusu
├─ Ana akış
│  ├─ Yeni / Takip / diğer kapsamı açık akışlar
│  └─ İçerik türü: müzik / sohbet / inceleme / etkinlik
├─ Keşfet
│  └─ Alan kapsamı Faz 0'da netleşecek; şu an müziğe ağırlıklı
├─ Topluluklar
│  ├─ Keşfet / Topluluklarım
│  ├─ Etkinliklerim (özel)
│  └─ Topluluk detay: akış / etkinlik / yetkili yönetim
├─ Oyunlar
│  └─ Merkez → kurulum → lobi → oyun → sonuç
├─ Kitaplığım
│  └─ Müzik / Diziler / Filmler / Kitaplar
└─ Kişisel alan
   ├─ Profilim / Profili düzenle
   ├─ Kaydettiklerim (müzik + topluluk kaynakları açık ayrımlı)
   ├─ Bildirimler
   ├─ Hesap / Güvenlik / Gizlilik / Veri
   └─ Özel başvurular / uygun yetkide yönetim
```

Forum, mevcut adresleri korunarak ikincil/legacy erişimde kalır. Kitaplık, bookmark ve etkinlik niyeti aynı veri olarak birleştirilmez. Üniversite kamusal alanı ile özel profil bilgisi karıştırılmaz.

### Kavram sözlüğü

| Kavram | Tek anlam | Kaçınılacak kullanım |
| --- | --- | --- |
| Kitaplığım | Kişisel eser koleksiyonu | Kaydedilen her sosyal post |
| Kaydettiklerim | Daha sonra dönmek için saklanan sosyal içerik | İzlenecek/okunacak durumunun adı |
| Profil vitrini | Açıkça seçilmiş kamusal sunum | Özel koleksiyonun tamamı |
| Etkinliklerim | Kişisel tercih/düzenleme ajandası | Gerçek fiziksel katılım belgesi |
| Toplulukta dağıtım | İçeriğin hangi akışta öne çıkarıldığı | Gizli/özel okuma |
| Listelenmeyen oda | Keşifte görünmeyen, linkle erişilen oda | Belirli kişiye kilitli davet |
| Geri | Geldiği görev/konum | Her durumda ana sayfa |
| Topluluklara dön | Açık hiyerarşi hedefi | Önceki sayfaymış gibi genel Geri |

## 8. Ortak tasarım ve etkileşim sözleşmesi

| Alan | Tasarım kuralı |
| --- | --- |
| Sayfa yapısı | Tek h1; kısa amaç; tek baskın ana işlem; aynı içerik başlangıç çizgisi |
| Genişlik | Mevcut 1480 px kabuk temeli; okuma, koleksiyon, operasyon ve oyun için bilinçli varyantlar |
| Sağ ray | Yardımcıdır; ana içerikten önce okumayı/işlemi zorunlu kılmaz |
| Tipografi | Ana metin ile metadata ağırlığı belirgin ayrılır; 12 px taban korunur; uzun okuma daha rahat satır/satır aralığı |
| Renk | Mevcut semantik tokenlar; cyan ana eylem, durum rengi anlam için; bütün kartı kategori rengine boyamamak |
| Kart | Kimlik/bağlam → içerik → metadata → aksiyon; her iç bölüm yeni dekoratif kart olmak zorunda değil |
| Kontrol | Mevcut 36/44/50 px ailesi; form, filtre ve toolbar varyantları açık |
| Sekme | Seçili durum ve klavye davranışı ortak; ana bölüm gezinmesi ile anlık filtre aynı şey değil |
| Katalog/arama | Kapsamı açık ad; aynı arama ailesinde tutarlı tetikleme; seçilen eser ayrı sabit özet |
| Geri/scroll | Yeni bölüm başı görünür; detay dönüşü filtre/sayfa/scroll'u korur; hash başlığı menü altında kalmaz |
| Taslak | Değişti/kaydediliyor/hata/kaydedildi; çıkışta üç seçenek; tekrar gönderim güveni açıklanır |
| Form hatası | Alan hatası alan yanında; ağ hatası kalıcı panelde; başarı kısa toast |
| Onay | Hedef + sonuç + kesin fiil; “Onayla” her tehlikeli işlem için yeterli değil |
| Modal | Global katman; arka plan etkileşimsiz; odak içeride, Escape ve önceki odağa dönüş |
| Gizlilik | Kim görüyor/ne özel kalıyor/kim işleyebiliyor yerinde ve anlaşılır; güvenlik kuralları görsellik adına gevşetilmez |
| Yükleme | Gerçek sayısal iddia yok; son içeriğe yakın skeleton; append yüklemesi mevcut listeyi kaldırmaz |

### Hareket ve geçiş dili

- Hover/focus yaklaşık 100–160 ms; küçük panel/drawer yaklaşık 160–220 ms hedefi mevcut sistemle uyumlu.
- Her sayfa geçişine büyük kaydırma/zoom eklenmemeli. Ana kabuk yerinde kalsın, yalnız değişen içerik sakin geçsin.
- Hareket, yükleme veya veri kaydını gizlemesin; tamamlanmamış işlem başarı animasyonu almasın.
- Layout yüksekliği korunmalı; liste → detay ve filtre sonucu değişimi kullanıcıyı sayfanın başka yerine fırlatmamalı.
- Bildirim/adet değişimi çevreyi titreştirmeden gösterilmeli; ambient arka plan form/okuma/oyun odağını bastırmamalı.
- Reduced-motion altında aynı görev aynı açıklıkla tamamlanabilmeli. Animasyon güvenilir konum/odak davranışının yerine geçmez.

## 9. Durum matrisi — her ailede tasarlanacak görünümler

| Durum | Gösterilecek bilgi | Sonraki adım |
| --- | --- | --- |
| İlk yükleme | Yerleşime yakın skeleton, nesneye özel etiket | Bekle; tekrar işlemi yok |
| Gerçek boş hesap | Henüz neden kayıt olmadığı | İlk anlamlı ekleme/keşif |
| Filtrede sonuç yok | Seçili kapsam ve filtre | Filtreleri temizle/değiştir |
| Oturum yok/bitti | İşlem için neden hesap gerektiği | Aynı hedefe dönmeli giriş |
| Üyelik/rol yetmiyor | Gerekli koşul ve mevcut rol | Katıl veya uygun geri dönüş |
| Ağ/servis hatası | Veri yok sanılmayacak açık hata | Güvenli tekrar dene |
| Gönderim sonucu belirsiz | İstek alınmış olabilir | Önce durumu doğrula |
| Kısmi başarı | Tamamlanan ve kalan ayrı | Yalnız kalanlarla devam |
| Eski sürüm/conflict | Başka değişiklik olduğu | Güncel durumu göster; taslağı koru |
| Arşiv/iptal/kaldırılmış | Hangisi olduğu ve etkisi | Kaynağa/ajandaya/keşfe dön |
| Kaydedildi/başarılı | Ne değiştiği, nerede bulunacağı | Göreve devam; uygun undo |
| Offline/reconnect | Son doğrulanan veri/etkileşim sınırı | Bağlantı gelince güvenli eşitle |

Bu matris tasarımın bitiş ölçütüdür. Her satırı yalnız genel bir toast'a indirgemek kabul edilmez.

## 10. Uçtan uca tasarlanacak kullanıcı yolculukları

1. Anonim kullanıcı → içerik → Kaydet → giriş → aynı içerik/niyete dönüş.
2. Keşfet araması → doğru kapsam → sonuç detayı → filtre/sayfa/scroll korunarak geri.
3. Topluluk keşfi → topluluk → katılma gereksinimi → inceleme/etkinlik hedefi korunması.
4. İnceleme → katalog/kitaplık/manual eser → puan/spoiler → dağıtım özeti → yayın sonucu.
5. Etkinlik → katılım/ilgi → özel ajanda → değişiklik bildirimi → doğru detay → tercih geri çekme.
6. Kitaplık türü → kendi kayıtlarında ara → eser ekle → durum değiştir → isteğe bağlı vitrin → profilde görünür sonucu gör.
7. Profil → düzenle → önizleme → tek kaydet → gerçek sonuçla eşleşme; çıkışta taslak koruma.
8. Şarkı önerisi → alıcıyı doğrula → seç → kısmi/ağ hatası → güvenli tamamlama.
9. İçerik/karar → doğru hedefli özel başvuru → durum/yanıt → kaynak bağlama dönüş.
10. Oyun → kurulum → lobi → görünürlük/davet → sahne → reconnect → sonuç → yeniden oynama/son durumu inceleme.
11. Moderatör → filtreli kuyruk → kanıt → kapsamı açık karar/onay → sonuç ve işlem geçmişi.
12. Hesap → veri indir/kapatma etkileri → sahiplik devri/arşiv tercihi → açık sonlandırma sonucu.

Her yolculukta “Neredeyim, ne görüyorum, kim görebilir, şimdi ne yapabilirim, geri gidersem ne olur?” soruları cevaplanmalı.

## 11. Fazlı uygulama yol haritası

Şu anda hiçbir faz kodlanmıyor. Aşağıdaki sıra sonraki tasarım/uygulama çalışmasının önerisidir; tarihler yerine bağımlılık ve kabul kapılarıyla verilmiştir.

| Faz | Çıktı | Öncelikli kapsam | Bitiş ölçütü |
| --- | --- | --- | --- |
| 0 — Ürün haritası ve dil | Onaylı ekran ağacı, kavram sözlüğü, ana görev/CTA listesi | Keşfet kapsamı; kitaplık/kayıt/ajanda; çoklu ilgi kimliği; forumun yeri | Aynı kavram iki farklı veri/iş için kullanılmıyor |
| 1 — Kabuk ve akış sözleşmeleri | Navigasyon, header/scroll/odak, overlay, form/taslak/durum prototipleri | T-01/02/03/05/06/07/08; güven veren temel | Konum, kullanıcı emeği ve işlem sonucu korunuyor |
| 2 — Ortak görsel sistem | Sayfa/kart/form/menü/modal/skeleton varyantları | Tipografi, yüzey derinliği, CTA yoğunluğu, hareket | Aynı bileşen her modülde aynı anlama geliyor |
| 3 — Akış ve keşif | Karma kart, filtre, gerçek kapsamlı arama prototipi, kayıt girişi | Ana akış, Keşfet, post/yorum detayları | Ana içerik ilk görünümde öncelikli; arama vaadi doğru |
| 4 — Topluluk ve etkinlik | Keşif, composer, inceleme, ajanda ve yönetim prototipleri | Katmanlı filtre; bağlamlı üretim; RSVP/yetki/onay | Keşif → detay → giriş/üyelik → işlem → geri zinciri kopmuyor |
| 5 — Kitaplık ve öneri | Dört türde tek koleksiyon modeli, katalog paneli, müzik araçları | Ters yerleşim, liste içi arama, durum/vitrin/kaldırma, Suggest | Tür değişince ana işlerin yeri/anlamı değişmiyor |
| 6 — Profil ve kişisel merkez | Çoklu ilgi vitrini, gerçek önizleme, hesap/bildirim/gizlilik | Profil/editör, giriş-kayıt, kişisel durumlar | Özel/açık sınır ve kayıt sonucu öngörülebilir |
| 7 — Oyun, yönetim, yardımcı yüzeyler | Ortak lobi/sahne/sonuç; role göre yönetim; hata/legal/forum koruması | Auth/izin/bağlantı/davet/sonuç; KPI kapsamı | Sahne, görev ve yetki açık; eski içerik bozulmuyor |
| 8 — Bütünleşik görsel kabul | Ekran/durum envanteri üzerinden son kontrol | Geçişler, yoğun veri, klavye, reduced-motion | 25 rota ve seçilmiş kritik durumlar aynı ürün gibi çalışıyor |

Faz 1'de P1 davranışları prototiplenir; ilgili ekranların uygulama fazında tek tek doğrulanmadan kapandı sayılmaz. Farklı modüllerde paralel çalışma ancak Faz 0–2 ortak sözleşmeleri sabitlendikten sonra verimli olur.

### İlk yapılacak somut tasarım paketi

- Ana kabuk için iki karşılaştırılabilir masaüstü wireframe: önerilen kalıcı sol menü ve mevcut üst menünün sadeleştirilmiş alternatifi. Tek yön seçilecek; ikisi birlikte büyütülmeyecek.
- Ana akış / topluluk detay / kitaplık / profil / canlı oyun için ortak hizalama şablonu.
- Girişe dönüş, taslak çıkış, yanlış hedefli başvuru, network hata ve modal katmanı için akış çizimleri.
- Tek ekranlık kavram/CTA sözlüğü ve state component örnekleri.
- Sonuç onaylanmadan renk, banner ve CSS rötuşlarına başlanmaması.

## 12. Eklenebilecekler ve şimdi ertelenmesi gerekenler

### Önce değerlendirilecek, mevcut özellikleri birleştiren eklemeler

- Ortak Kaydettiklerim girişi ve açık kaynak/tür sekmeleri.
- Kitaplık içi arama, durum ve sıralama; tüm türlerde aynı koleksiyon araç çubuğu.
- Bağlamlı genel Oluştur/Paylaş girişi; topluluk gerektiren türler için topluluk seçimi.
- Tüm profil katkılarını, görünürlük kurallarıyla bir araya getiren aktivite.
- Bildirimlerin içerik türlerine göre anlaşılır kategorileri.
- İnsan-okur başvuru/karar bağlamı ve aktif üyeden sahip seçimi.
- Oyun içinde kısa yardım, son tahtayı inceleme ve video alternatifi.

### Sonraya bırakılacak veya ayrı teknik/politika kararı isteyenler

- Avatar/kapak yükleme, kullanıcı medyası ve moderasyon; sırf görsel zenginlik için acele eklenmemeli.
- Takvim/ICS, harita, push/e-posta bildirimleri, hedefli davet.
- Tam düzenleme geçmişi, otomatik kalıcı taslak, kapsamlı genel arama.
- XP mağazası, ziyaretçi defteri, yeni oyunlar, analitik.
- Parola sıfırlama/e-posta doğrulama ve sağlayıcı seçimi.
- SSE/PostgreSQL gibi altyapı genişlemeleri.
- Mobil/açık tema veya bağımsız forumun yeniden açılması.

Tasarımda “gelecek” gösterilen şey çalışır özellik gibi vaat edilmemeli.

## 13. Sonraki görsel doğrulama listesi

Bu çalışma tüm durumları çalıştırılmış test saymaz. Sonraki tasarım kabulünde:

- 1280 px küçük masaüstü ve 1440/1728 px genişlik; gerekli uzun okuma/oyun yüksekliği.
- Anonim, yeni hesap, dolu hesap, sahip/ziyaretçi, üye/üye değil, moderatör/admin.
- Uzun ad/başlık, çok kart, çok yorum, çok kayıt, taşan etiket ve çoklu seçim.
- İlk yükleme/append, gerçek boşluk/filtre boşluğu/ağ hatası/izin bitti.
- Liste → detay → geri; giriş → aynı query/hash; refresh; browser geri/ileri.
- Taslak → global menü/sekme/geri/modal kapama; başarı/hata/belirsiz sonuç.
- Modal açıkken global menü ve arka plan; kapanınca odağa dönüş.
- Yalnız klavye, görünür focus, tek h1, anlamlı etiketler; görsel sıra = DOM/odak sırası.
- Reduced-motion; oda reconnect; video var/yok/oynatılamıyor; son sahneyi inceleme.
- Ekran başına tek baskın işlem; aynı iş için aynı fiil ve durum tonu.
- Gizli ajanda/üniversite/okuma durumunun tasarımda yanlışlıkla kamusal gösterilmemesi.
- Bilinçli değişiklik dışında eski görsel baseline'lar otomatik yenilenmemeli.

Gereksiz test maliyeti yaratmamak için her modülde ilgili koyu masaüstü kontrolü; 4–6 bağlı değişiklik sonunda toplu kalite kapısı. Mobil/açık tema matrisi bu plana kendiliğinden eklenmez.

## 14. Nihai değerlendirme

Renk paletini değiştirmekten önce ürünün **tek bir gezinme ve işlem mantığı** olması gerekiyor. En yüksek getirili sıra: bağlam/emeği koru → tek kabuk → ortak kart/form/durum dili → modül bazlı yeniden düzenleme → ölçülü görsel hareket.

Tasarım çalışmasına hazır bir teknik temel var; ancak bütün kullanıcı halleri tasarım açısından tamamlanmış değil. Bu rapor, tamamlandığını iddia etmek yerine nerede doğrulama ve karar gerektiğini gösterir. Yayın için mevcut yedi teknik/operasyonel/hukuki kapıyı kapatmaz.

**Önerilen sonraki adım: Faz 0 ve Faz 1'in ekran haritası + akış/wireframe paketini hazırlamak; henüz uygulama koduna geçmemek.**
