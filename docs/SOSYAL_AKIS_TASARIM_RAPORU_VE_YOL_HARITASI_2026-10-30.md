# ListeKutusu — sosyal akış tasarım raporu ve yol haritası

Tarih: **30 Ekim 2026**

İncelenen kaynak: `705bf8850a87649af8fa884a82fc99bafea98476`

Durum: **inceleme ve öneri; uygulama değişikliği yapılmadı.**

## 1. Sonuç ve çalışma sınırı

Ana akış ile topluluk akışı ortak üst çubuğu kullanıyor, fakat aynı içeriği farklı kart, filtre ve okuma davranışlarıyla sunuyor. En büyük iyileştirme, bu iki akışı ortak bileşenlere taşımak. Yalnızca renk ve boşluk değiştirerek bu ayrışma giderilemez. Etkinliklerin kapasite ve katılım temeli mevcut; eksik olan, bilgiyi hızlı okunur bir sosyal kartta sunmak ve katılımcı profillerini uygun görünürlük tercihiyle göstermek.

Hedef deneyim: kullanıcı ana akıştan bir topluluğa geçtiğinde **aynı ürünün o topluluğa daraltılmış akışını** görmeli. Kart okuma, yorum, spoiler açma ve etkinliğe katılma alışkanlıklarını yeniden öğrenmemeli. Topluluğun adı, kuralları, üyelik durumu ve yönetimi kendi bağlamını oluşturabilir.

Korunacak yönler:

- Sol sidebar geri gelmeyecek. Ortak arama, Topluluk oluştur ve profil/bildirim alanı aynı üst satırda kalacak. Gezinme profil menüsünden yapılacak.
- Topluluklar ortak aramadan bulunup doğrudan açılacak; ayrı topluluk arama/dizin ekranı yeniden kurulmayacak.
- Topluluk içerikleri bugün herkese açık okunur. “Yalnız toplulukta dağıtım” gizli okuma anlamına gelmez; yalnız genel akışta gösterilip gösterilmediğini belirler.
- Mavi tonlu koyu yüzeyler, cyan ana işlem ve yeşil vurgu korunacak. Yeni palet veya genel siyah/beyaz tasarım denemesi bu raporun önerisi değil.
- Aktif kapsam koyu masaüstü. Mobil, açık tema ve bağımsız forum geliştirmesi askıda kalacak. Mevcut forum içeriği ve bağlantıları korunacak.
- Normal hesaplar, listeler ve kitaplık değişmeyecek. Bu incelemede DB yazma, seed veya reset yapılmadı.
- Bu belge uygulama sırasını önerir; ek özellikler tamamlanmış iş veya yayın hazırlığı sayılmaz. Önceki çekirdek geliştirme yüzdeleri bu yeni tasarım paketinin ilerlemesi değildir.

## 2. İnceleme yöntemi ve kanıt sınırları

Kaynak denetimi; ana/topluluk akışları, yorumlar, etkinlik/RSVP servisleri, ortak arama, profil, kitaplık, hesap/öneriler, kayıtlar, ajanda, oyun/forum/yönetim ve ortak gezinme bileşenlerini kapsadı. Akış, etkinlik ve eski ekranlar üç ayrı salt okunur incelemeyle karşılaştırıldı.

Çalışan yerel uygulamada Edge, **1440 × 960** koyu masaüstü ve girişsiz oturum kullanıldı. Şu **12 adres/durum** açılıp görüntülendi:

| Alan | İncelenen adres/durum |
| --- | --- |
| Ana akış | `/`; aynı sayfada sohbet ve etkinlik kartlarına kaydırma |
| Topluluk sohbetleri | `/communities/demo-muzik-toplulugu` |
| Topluluk etkinlikleri | `/communities/demo-kutu-toplulugu?section=events` |
| Açık profil | `/u/demo-topluluk-1` |
| Birleşik arama | `/search?q=Demo` |
| Kitaplık | `/library?type=book`, girişsiz durum |
| Hesap | `/account?mode=login` |
| Oyun merkezi | `/games` |
| Müzik keşfi | `/discover` |
| Ajanda | `/community-events`, girişsiz durum |
| Topluluk kayıtları | `/community-saved`, girişsiz durum |
| Topluluk oluşturma | `/communities/create`, girişsiz durum |

Üye, düzenleyen, moderatör ve hesap içi panellere ilişkin bulgular **kaynak incelemesine** dayanır; bu rollerle canlı uçtan uca kabul yapılmış değildir. İnceleme sırasında yorum/RSVP gönderilmedi. Rapor için yeni test paketi, build veya geniş tarayıcı matrisi çalıştırılmadı.

Karşılaştırma görüntüleri yerel `output/playwright/audit-2026-10-30-*.png` dosyalarındadır ve Git dışındadır. Ekran görüntülerindeki demo kişi ve etkinlikler kurgusaldır. Kaynak dayanakları bölüm 12'de incelenen commit'e sabitlenmiştir.

## 3. Öncelikli bulgular

P0: temel akış bütünlüğünü bozan işler. P1: sosyal ürünün tutarlı çalışması için devam işleri. P2: çekirdek oturduktan sonraki iyileştirmeler. Eforlar göreli olup takvim taahhüdü değildir.

| No | Öncelik | Mevcut durum ve kullanıcıya etkisi | Önerilen karşılık | Dayanak |
| --- | --- | --- | --- | --- |
| A01 | P0 | Aynı sohbet ana akışta tam metin/yerinde yorum, toplulukta kısa özet ve “Sohbeti aç” ile sunuluyor. | Tek gönderi kartı ve kart içinde genişleme; topluluk liste DTO'suna uygun tam metin desteği. | K1, K2 |
| A02 | P0 | Etkinliğe ana akışta katılınabiliyor; toplulukta “Etkinlik detayını aç” gerekiyor. | Her iki akışta aynı etkinlik kartı ve RSVP alanı. | K3 |
| A03 | P0 | Ana akışta tür düğmeleri, toplulukta büyük select/checkbox paneli ve ayrı etkinlik bölümü var. | Ortak filtre çubuğu; topluluğa kapsamlanmış karma akış. | K4 |
| A04 | P0 | Etkinlik metin, tarih, kapasite, tercih ve yenileme sıralarıyla uzun bir form gibi. Katılan insanlar görünmüyor. | Tarih/başlık, kısa özet, insanlar, doluluk ve tek ana eylem hiyerarşisi. | K3, K5 |
| A05 | P0 | Ajandadaki “Etkinlikleri keşfet” eski `/communities?view=events` hedefine gidiyor; yönlendirmede filtre kayboluyor. | Doğrudan mevcut `/?kind=event` hedefine bağlama. | K6 |
| A06 | P1 | Aynı sohbet kartı aynı 1440 px ekranda ana akışta **1071 px**, toplulukta **867 px** genişliğinde. Satır kırılımları ve yoğunluk değişiyor. | Ortak okuma kolonu, kart iç boşluğu ve sağ alan ölçüleri. | Ölçüm, K7 |
| A07 | P1 | Sohbet/inceleme/etkinlik başlıkları da müziğin renkli eser bloğuna yerleşiyor. Türler ayırt ediliyor ama başlıklar gereğinden fazla kutulanıyor. | Ortak dış kart; türe göre sade içerik gövdesi. | K1, görsel inceleme |
| A08 | P1 | Müzik, ana akış topluluk ve eski topluluk detayı üç farklı yorum görünümüne sahip. | Ortak yorum kabuğu, işlem menüsü ve durum dili; desteklenen yetenekler ayrı. | K8 |
| A09 | P1 | Ana oluşturucu müzik odaklı; toplulukta uzun sohbet/inceleme formu, etkinlik formu liste sonunda. | Tek kompakt paylaşım girişi, tür ve hedef topluluğa göre açılan editör. | K9 |
| A10 | P1 | Ana sağ alan müzik sıralamaları ağırlıklı; topluluk sağ alanında okur ve yönetim araçları aynı yığında. | Bağlamsal kısa sağ alan; yönetim ayrı yetkili bölümde. | K7 |
| A11 | P1 | “Yükselen / Sana özel / Kaydedilen” ana akış görünümleri yalnız müzik kapsamlı. | Kapsamı açık gösterme; karma sıralama ve birleşik kayıtları ayrı işler olarak ele alma. | K4 |
| A12 | P1 | Profil çoklu medya vitrini sunsa da sosyal paylaşım/aktivite modeli yeni topluluk içeriğini kapsamıyor. | Ortak kartlı Paylaşımlar; açık tartışma, inceleme ve düzenlenen etkinlikleri uygun görünürlükle birleştirme. | K10 |
| A13 | P1 | Keşfet, hesap/giriş ve oyun açıklamalarında eski müzik merkezli metinler var. | Gerçek kapsama uygun adlandırma ve tanıtım metni. | K11, K12 |
| A14 | P1 | Kitaplık dört türü zaten yönetiyor; müzik paneliyle diğer türlerin görsel/işlem dili ayrılıyor. | Ortak liste/sekme/menü/boş durum; müziğe özel araçlar kendi bağlamında. | K13 |
| A15 | P1 | Müzik ve topluluk kayıtlarının giriş/filtre kabukları ayrı; ajanda eski etkinlik şablonunda. Topluluk kayıt kartları ortak kartı zaten kullanıyor. | Tek Kaydedilenler girişi; ajandada ortak etkinlik kartı. Kitaplık ayrı görevini korur. | K14 |
| A16 | P1 | Arama paylaşım sonuçları başka bir kart dili kullanıyor. | Ortak kimlik, tür ve spoiler kurallarıyla kompakt kart varyantı. | K15 |
| A17 | P1 | `canRespond=false` nedeni kartta ayrışmıyor; arşiv/yasak durumunda da genel üyelik çağrısı görülebiliyor. | Sunucudan neden kodları ve doğru kapalı durum eylemi. | K5 |
| A18 | P2 | Editör keşif kaynağı yapılandırılmadığından ana/Keşfet alanında sürekli “henüz ayarlanmadı” görünüyor. | Yapılandırılmamış paneli kısa boş duruma indirgeme veya gizleme; editör kaynağı seçimi ayrı iş. | Görsel inceleme |
| A19 | P2 | Forum/oyun/yönetim kabukları eski kapsam ve araç yerleşimlerini taşıyor. | Ortak kabuk ve yetkili girişler; forum işlevlerini genişletmeden uyumluluk. | K12, K16 |
| A20 | P2 | Tasarım belgesinde yeni üst alan notuyla eski sidebar ölçüleri birlikte duruyor. | Uygulama fazında aktif tasarım sözleşmesini tek güncel sürüme indirme. | `DESIGN_SYSTEM.md` |
| A21 | P1 | Sosyal yükleme iskeleti hâlâ 220 px sol kolon ve yedi menü satırı çiziyor. Geçişte eski kabuk görünüyor. | İskeleti sidebar'sız ortak kabuk ve gerçek kart ölçülerine taşıma; doğru sayfa yükleme etiketi. | K17 |
| A22 | P1 | Bildirim modeli etkinlik değişikliklerini kapsıyor; topluluk gönderisi yorumları ve sahiplik teklifleri tanımlı değil. Metinler de eski kapsamda. | Önce ortak içerik hedefi, ardından ayrı bildirim türleri ve tercihleri. Yalnız CSS işi değildir. | K18 |
| A23 | P1 | Sahiplik teklifleri oluşturma sayfasında gizli kalıyor; ilk 20 tekliften sonra devam kontrolü yok. Platform başvurusunda slug elle kopyalanıyor. | Profil menüsünden topluluk yönetim/gelen kutusu erişimi, devam sayfası ve topluluk seçimi. | K19 |
| A24 | P1 | Başlangıç rehberinin görevleri müzik paylaşımı/listeye eklemeye bağlı. Diğer ilgi alanlarıyla gelen kullanıcıyı temsil etmiyor. | Profil, topluluk bulma ve etkileşimi kapsayan rehber; müzik adımları bağlamsal. | K20 |
| A25 | P1 | Kullanım/gizlilik sayfasının amaç/veri açıklaması topluluk, RSVP, medya kitaplığı ve platform başvurularını kapsamıyor. | Mevcut ürün/veri davranışlarına göre ayrı içerik gözden geçirmesi. Bu bulgu hukuki uygunluk değerlendirmesi değildir. | K21 |

## 4. Ortak akışın hedef tasarımı

### 4.1. Aynı iskelet, bağlama göre içerik

Her iki akış şu sırayı kullanmalı: **kısa bağlam başlığı → filtre/sıralama → kompakt paylaşım girişi → gönderiler → devam yükleme**. Ortak üst çubuk dışında ikinci yapışkan ana gezinme katmanı eklenmemeli. Ana sayfadaki “Ana akış / Yeni keşifler” gibi üst üste başlıkların ilk gönderiyi aşağı itmesi azaltılmalı.

Ana akış başlığı genel bağlamı; topluluk başlığı ise isim, kısa açıklama, üye sayısı ve katıl/üyelik durumunu taşır. Uzun kurallar ve yönetim formları bu başlık altında sürekli açık durmaz. Topluluk karakteri küçük simge, başlık ve isteğe bağlı kapakla korunabilir; kapak görseli ortak akışı bitirmenin ön koşulu değildir.

Önerilen başlangıç ölçüleri: aynı masaüstünde her iki akış için **720–800 px okuma kolonu**, **280–320 px sağ alan**, arada **20–24 px**. Bunlar denenecek ürün ölçüleridir. İlk karşılaştırmada 760 px kart hedefi denenebilir; sağ alan gerekmiyorsa kartlar sınırsız genişlemek yerine aynı okuma genişliğinde kalır. Uygulamada mevcut tokenlar kullanılmalı; üçüncü bir ölçü sistemi açılmamalı.

Kart içi 16–20 px boşluk, kartlar arasında 12–16 px aralık; 8 px köşe, 36/44 px kontrol ölçekleri mevcut tasarım sistemiyle eşleştirilmeli. Okuma metni 14–16 px, yardımcı bilgi 12–13 px aralığında değerlendirilmeli. Son karar örnek içeriklerle masaüstü karşılaştırmasında verilir.

### 4.2. Tek kart ailesi

| Parça | Ortak davranış | Türe özgü fark |
| --- | --- | --- |
| Üst satır | Yazar avatarı/adı, topluluk, zaman, tür ve `…` menüsü aynı hizada. Profil/topluluk linkleri ayrı hedefler. | Müzik gönderisinde topluluk ilişkisi yoksa sahte topluluk etiketi üretilmez. |
| Başlık/gövde | Aynı tipografi, metin genişletme, boşluk ve spoiler davranışı. | Sohbet düz başlık/metin; müzik kompakt eser satırı; inceleme eser/tür/puan satırı; etkinlik tarih bloğu. |
| Eylem satırı | Desteklenen işlemler aynı ad ve sırada: Beğen, Yorumlar, Kaydet; ikincil işlemler menüde. | Müzikte Listeme ekle; etkinlikte RSVP ana eylemdir. Olmayan beğeni/yorum API'si varmış gibi düğme gösterilmez. |
| Açılan alan | Aynı kartta metin, yorum veya katılımcı alanı açılır. | Her alan yalnız kendi verisini ve izin verilen ayrıntıyı yükler. |
| Durum | Yükleniyor, boş, hata, erişim kaybı ve tekrar aynı bileşen diliyle gösterilir. | Dolu/iptal/arşiv/spoiler gibi anlamlar ayrıca korunur. |

Gönderi kimliği ve eylemler kartın tamamını link yapmamalı. Zaman damgasından isteğe bağlı kalıcı bağlantı alınabilir. Normal okuma, yorum ve katılım için akışın yerini başka detay görünümü almamalı. Mevcut kalıcı detay adresleri paylaşım, eski bildirim ve yönetim için çalışmaya devam etmeli.

### 4.3. Filtre ve sıralama

Ortak çubukta içerik türleri görünür ve kısa olmalı. Ana akışta Tümü/Müzik/Sohbetler/İncelemeler/Etkinlikler; toplulukta mevcut modele uygun Tümü/Sohbetler/İncelemeler/Etkinlikler kullanılabilir. Toplulukta bağımsız müzik paylaşımı bugün ayrı tür değildir; müzik incelemesi İncelemeler altında kalır.

Topluluk için önerilen varsayılan **Tümü**, sohbet+inceleme+etkinlik birleşimidir. Bunun için ayrı post ve etkinlik sayfalarını yalnız istemcide yan yana koymak yeterli olmaz: sunucu kapsamlı sıralama/sayfalama sözleşmesi gerekir. Etkinlikler filtresinde Yaklaşan/Geçmiş/İptal alt seçenekleri korunur; inceleme alanı seçimi yalnız İncelemeler seçildiğinde açılır.

Yeni/Takip/Sana özel gibi akış kapsamlarıyla içerik türleri görsel olarak iki ayrı işlev olmalı. Topluluk içinde desteklenmeyen kişiselleştirme sekmesi kopyalanmamalı. Mevcut müziğe özel Yükselen/Sana özel için kapsam açıklaması korunmalı; karma sıralama daha sonraki ürün işidir. Filtre URL'ye yansır, yenileme/geri dönüş aynı seçimi korur. “Kaydettiklerim” özel görünümü bir checkbox kalabalığı yerine Kaydedilenler girişinden veya ikincil filtre menüsünden erişilebilir.

### 4.4. Oluşturma ve yorumlar

Kompakt “Ne paylaşmak istersin?” girişi açılınca Müzik/Sohbet/İnceleme/Etkinlik seçimi sunulabilir. Müzik mevcut genel paylaşım yolunu kullanır. Diğer türler için uygun aktif üyeliği olan hedef topluluk seçilir; topluluk içindeyken hedef önceden doludur. Hiç uygun topluluk yoksa katılma/oluşturma yönü verilir. Genel akışta gösterme seçimi topluluk dağıtım tercihidir; yeni bir topluluksuz sohbet/etkinlik API'si varsayılmaz.

Başlık, eser, puan, spoiler, tarih ve kapasite alanları yalnız ilgili türde açılır. Uzun eser seçimi ve etkinlik düzenleyicisi ortak modal veya aynı yerde açılan editör kullanabilir; okuma kartı sürekli açık form taşımaz. Kapatma/filtre/çıkış mevcut taslak korumasını kullanır; otomatik yayın yapılmaz.

Yorumlarda ortak avatar/metin/zaman, küçük işlem menüsü, yükleme/boş durum ve gönderme alanı kullanılmalı. Müzikte mevcut alt yanıtlama korunur; toplulukta iç içe yanıt **ayrı yeni özelliktir**. Paneli kapatma taslağı silmemeli; başarılı gönderim sayıyı yenilemeli. Bildir/kaldır gibi yetkili işlemler ulaşılabilir menüde kalmalı. Erişim kaybı ve spoiler onayı tüm yorum görünümlerinde aynı kurala bağlanmalı.

## 5. Etkinlik kartının ayrıntılı tasarımı

### 5.1. Okuma sırası ve örnek

Kart ilk bakışta “ne, ne zaman, nerede, kimlerle, yer var mı, ben katılıyor muyum?” sorularını cevaplamalı. Aşağıdaki sayılar ve kişiler yalnız yerleşim örneğidir:

```text
Masa Etrafında · Duru · 2 saat önce                         …

  07     Kutu oyunu tanışma masası
  KAS    Cumartesi 19.00 · İstanbul · Oyun Kafe

Yeni başlayanlara açık bir masa kuruyoruz…  Devamını göster

[D] [E] [A] [+2]  8 kişi katılacağını belirtti
                  Görünür katılımcıları gör
████████░░░░      8 / 12 kişi · 4 yer kaldı

[ Katılacağım ]  İlgileniyorum
```

1. **Tarih ve başlık:** küçük gün/ay bloğu, okunur başlık, gün/saat/şehir. Türkiye saati açık olmalı. Mekân bir satırda, uzun adres içeride genişleyebilir; izinsiz üçüncü taraf harita isteği şart değil.
2. **Açıklama:** ilk 2–3 satır, yerinde genişleme. Ayrı sayfa zorunluluğu yok.
3. **İnsanlar:** izin verilen 3–5 baş harfi avatarı ve görünür kalan profiller için `+N`. Toplam katılım sayısı ayrıca gösterilir. Profil sayısı toplam katılım gibi sunulmaz.
4. **Doluluk:** tek kapasite satırı ve sade gösterge. Sınırsız etkinlikte sahte yüzde/progress olmaz; iptal/geçmiş durumda katılım çağrısının yerini durum bilgisi alır.
5. **Eylem:** tek baskın Katılacağım; seçildiğinde “Katılacaksın”. İlgileniyorum ikincil; tercih değiştirme ve vazgeçme erişilebilir küçük alanda. Gönderim sırasında yalnız ilgili işlem kilitlenir, çift istek engellenir.
6. **Ayrıntı:** katılımcı paneli ve tam metin aynı kartta açılır. Düzenleme/iptal/raporlama yetkili `…` menüsündedir; mevcut onaylar korunur.

“Katılımı yenile” her normal kartın sürekli büyük eylemi olmamalı. Başarılı işlem sonrası veri otomatik yenilenir; hata halinde Yeniden dene görünür. Manuel yenileme gerekiyorsa ikincil menüde tutulabilir. Canlı güncelleme veya WebSocket bu tasarımın ön koşulu değildir.

### 5.2. Hangi katılımcılar görünmeli?

Bugün isim listesi yalnız etkinliği yönetebilen aktif düzenleyen/kurucu/moderatörlere dönüyor; ana kart hiç isim göstermiyor. Dolayısıyla kullanıcıların birbirini görmesi CSS değişikliğiyle tamamlanamaz. Yeni bir görünürlük tercihi ve sunucu yanıtı gerekir.

Önerilen ilk sürüm politikası:

| İzleyici | Gösterilecek bilgi |
| --- | --- |
| Girişsiz kullanıcı / topluluk üyesi olmayan | Katılacak/ilgilenen toplamı ve doluluk; profil listesi yok. |
| Aktif topluluk üyesi | “Katılacağım” deyip profilinin topluluk üyelerine görünmesini seçmiş uygun kullanıcılar. |
| Düzenleyen / yetkili topluluk yöneticisi | Mevcut operasyonel katılımcı listesi; engel/hesap/üyelik filtreleri korunarak. |
| İlgileniyorum yanıtı verenler | Ayrı toplam; varsayılan avatar önizlemesine karıştırılmaz. |

RSVP sırasında “Profilimi bu topluluğun üyeleri görebilsin” seçimi verilmeli. **Eski yanıtlar kendiliğinden görünür yapılmamalı.** Genel akışa dağıtım, katılımcı isimlerini herkese açma tercihi olarak yorumlanmamalı. Üye ana akışta da aynı izinli önizlemeyi görebilir; karar sayfa yoluna göre değil izleyici yetkisine göre alınır.

İlk sürüm mevcut baş harfi avatarlarıyla tamamlanabilir. Fotoğraf yükleme/depolama yeni bir özelliktir. Profil bağlantısı yalnız mevcut açık profil kimliğini kullanır; eposta, özel üniversite veya iletişim bilgisi kart DTO'suna taşınmaz.

Veri gereksinimi: RSVP görünürlük alanı; sınırlı profil önizlemesi; görünür profil sayısı; `canViewParticipants`; sayfalı katılımcı listesi. Mevcut yönetici `participants` dizisini herkese açmak yerine genel/üye/yönetici sunumları ayrılmalı. Bugünkü yönetici listesi en fazla 200 kişi ve cursor'sız; genişleyen panel için sınırlı sayfalama tanımlanmalı.

`+N` yalnız izleyiciye görünür olup önizlemede gösterilmeyen profilleri anlatır. Örneğin 8 katılacak, 5 görünür profil, ilk 3 avatar varsa `+2` gösterilir; gizli 3 kişi eklenmez. “8 kişi katılacağını belirtti” toplamı sunucunun koltuk sayımından gelir. Engel nedeniyle görünmeyen profil sayısı kapasite hesabını değiştirmez.

### 5.3. Durumlar ve iş kuralları

| Durum | Kart davranışı |
| --- | --- |
| Girişsiz | Hedefi koruyan Giriş yap; katılmış gibi seçili durum gösterilmez. |
| Üye değil | Uygunsa Topluluğa katıl; sonrasında kullanıcı açıkça RSVP verir. Üyelik otomatik RSVP değildir. |
| Yasak / arşiv | Doğru neden metni; çalışmayacak genel katıl düğmesi sunulmaz. |
| Dolu | Kalan 0; yeni Katılacağım kapalı, İlgileniyorum ayrı; mevcut katılımcı tercihini değiştirebilir. |
| İptal / başlamış | Yeni RSVP kapalı; tarih/durum net. Yanıtı geri çekme yalnız servis izin veriyorsa açık. |
| Son koltuk yarışı | 409 sonrası sunucu sayısı ve kendi yanıtı yenilenir; sahte başarı gösterilmez. |
| Geçici okuma/yazma hatası | Kart yerinde kalır; eski sayı güncelmiş gibi sunulmaz; tekrar ve bekleyen durum anlaşılır. |
| Yetki / görünürlük kaybı | Artık görünmeyen profil önizlemesi, özel alan ve eski işlem onayı temizlenir. |

İlgileniyorum koltuk tüketmez; düzenleyen otomatik katılımcı sayılmaz. Tekrarlı RSVP tek yanıt üretir. Son koltuk kontrolü transaction içinde kalır. Ayrılma/yasak/deaktivasyon eski koltuğu kendiliğinden geri getirmez. İptal davranışı mevcut servisle uyumlu olmalı; eski isimler canlı katılım listesi gibi kartta kalmamalı.

## 6. Eski ekranları yeni sosyal yapıya taşıma

| Ekran / yapı | Yapılacak değişiklik | Korunacak özellik / sınır |
| --- | --- | --- |
| Topluluk başlığı ve sağ alan | Kısa kimlik, üyelik, kurallar özeti; yönetim/keşif/sahiplik ayrı yetkili bölüm. | Rol, arşiv, rapor, uzaklaştırma, sahiplik devri kaybolmaz. |
| Topluluk oluşturma | Ortak form düzeni; gerekli temel alanlar önde, isteğe bağlı şehir/üniversite/ilgi alanı bir arada. Sahiplik gelen kutusu yalnız bu sayfaya bağlı kalmaz. | Mevcut doğrulama, kurucu atama ve başarısızlıkta taslak korunur. |
| Arama | Kompakt ortak kartlar; içerik/kişi/topluluk kimliği ve spoiler aynı; sonuçtan dönüşte sorgu/sekme/konum. | Topluluk sonucuna tık doğrudan topluluğa gider. Arama, ayrı dizine dönüştürülmez. |
| Profil | Vitrin yanında ortak kartlı Paylaşımlar; topluluk tartışmaları/incelemeleri ve görünür düzenlenen etkinlikler. Müzik merkezli açıklamalar kapsayıcı olur. | Mevcut çoklu medya vitrini, rozetler, oyun kimliği ve kişisel karakter korunur. Özel kitaplık veya RSVP geçmişi otomatik yayınlanmaz. |
| Profil sayıları | “Toplam” ile “bu sayfada yüklenen” açık ayrılır; paylaşım türlerinin kapsamı tutarlı olur. | Sayfalama nedeniyle eksik sayıyı tüm etkinlik toplamı gibi göstermeme. |
| Kitaplığım | Müzik/Dizi/Film/Kitap aynı sekme, satır, menü ve boş durum düzeni. | Spotify, içe aktarma, katalog atıfları ve özel koleksiyon/vitrin ayrımı korunur. Oyun kitaplığı ayrı yeni özellik. |
| Kaydedilenler | Tek giriş ve içerik türü filtreleri; mevcut müzik/topluluk kayıtlarını ortak kart ailesiyle gösterme. Topluluk kayıt kartı zaten ortak bileşende; esas iş kabuk ve erişimi birleştirmek. | Başkasının içeriğini kaydetmek ile kendi kitaplığına eser eklemek ayrı eylemler kalır. Etkinlik kaydetme bugün varmış gibi varsayılmaz. |
| Etkinliklerim | Aynı etkinlik kartının ajanda varyantı; zaman/rol filtreleri ve yerinde katılım yönetimi. | Kişisel liste, geçmiş/iptal görünümü ve tercih geri çekme onayı korunur; fiziksel katılım kaydı iddiası yok. |
| Keşfet | Kısa vadede “Müzik keşfi” kapsamını açıklaştırma; tekrar eden genel arama çağrısını azaltma. | Mevcut müzik sıralamaları çalışır. Çok alanlı Keşfet ayrı genişletme. |
| Hesap / giriş / kayıt | Tanıtım metni yalnız müziği anlatmaz. Oturumlu varsayılan kimlik/gizlilik/güvenlik merkezli olur. | Giriş hedefi, mevcut oturum ve hesap kapatma/izin işlemleri korunur. |
| Müzik önerileri / davetler | Kitaplık müzik alanından anlaşılır “Öneriler ve davetler” erişimi; aynı form/menü dili. | Davet kodu, toplu öneri ve liste sahibi onayı kaldırılmaz; sosyal gönderi oluşturmayla karışmaz. |
| Bildirimler | Aynı içerik kimliği ve kart hedefi; uygun durumda ilgili kart/yorum yerinde açılır. Topluluk yorumları/sahiplik teklifleri için eksik türler ayrıca planlanır. | Etkinlik değişiklik/iptal bildirimleri zaten mevcut. Okunma/görünürlük/engel ve taslak çıkış kuralları korunur. Eski kalıcı hedefler çalışır. |
| İlk kullanım rehberi | Profilini düzenle / bir topluluk bul / bir etkileşim yap gibi kapsayıcı görevler; tamamlanma ölçüsü gerçek işlemlere bağlanır. | Üniversite alanı zorunlu olmaz; mevcut müzik görevleri ilgili kullanıcıya önerilebilir. |
| Oyun merkezi / odalar | Kapsayıcı metin, ortak oda/davet kartları ve durum dili. | Tavla tahtası, düello oynanışı ve canlı oda etkileşimi içerik kartına zorla benzetilmez. |
| Forum / eski gönderi detayları | Ortak üst alan, başlık/işlem menüsü ve geri dönüş uyumu. | Yeni forum özellikleri yok; mevcut konu/yazma hakları sessizce kapatılmaz, içerik silinmez. |
| Yönetim / başvurular / itirazlar | Yetkiye bağlı anlaşılır yönetim/gelen kutusu girişi; vaka, durum ve karar adları ortak. Topluluk slug'ını elle kopyalamak yerine seçim. | Platform başvuruları üyelik onay kuyruğu değildir; topluluğa katılma bugün doğrudan üyelik açar. Özel karar formları okur akışına taşınmaz. |
| Hukuk / yükleme / hata / bulunamadı | Yükleme iskeletinden eski sidebar kaldırılır. Mevcut ortak hata/404 kabuğunda metin/ikon ve odak uyumu; ürün/veri kapsamı için ayrı metin incelemesi. | Çalışan hata/404 sayfalarını yeniden kurmak gerekmez. Hukuki metin bu raporda yeniden yazılmaz veya uygunluk onayı verilmez. “Verilerin güvende” gibi her hatada doğrulanamayan kesinlik azaltılır. |

Profilin kişisel üst alanı ve oyun tahtası farklı görünebilir; bütünlük ortak gezinme, tipografi, içerik kimliği, kontroller ve durum davranışlarından gelmeli. Her ekranı aynı büyüklükte akış kartlarına dönüştürmek hedef değil.

## 7. Teknik bağımlılıklar ve geçiş yaklaşımı

Önerilen ortak parçalar: akış yerleşimi, bağlam başlığı, filtre çubuğu, gönderi üst satırı, eylem satırı, genişleyen içerik, yorum kabuğu ve etkinlik kartı. Bunlar bileşen sorumluluklarıdır; tüm API'leri tek dev bileşene taşımak gerekmiyor. Mevcut `Button`, `Card`, `ContentState`, modal ve taslak otoritesi yeniden kullanılmalı.

Özellikle gereken işler:

1. **Topluluk DTO uyarlaması:** eski özet DTO'su yalnız excerpt taşıyor. Spoiler olmayan tam metin ve açık kart yetenekleri eklenmeli; spoiler metni açık onay öncesi akış yanıtında bulunmamalı. Yorum için açık `canComment` sözleşmesi değerlendirilmeli.
2. **Topluluk karma zaman çizelgesi:** post ve etkinliğin ayrı sayfalarını rastgele birleştirmek yerine sabit sıralama, eşit zamanlarda deterministik sıra ve tek devam sınırı tanımlanmalı. Ana akışın yalnız `distribution=general` okuyan servisi doğrudan topluluğa bağlanmamalı; topluluğa özel dağıtılan içerik de orada görünmeli. Arşiv/geçmiş kapsamları ayrıca korunmalı.
3. **Görünürlük veri dilimi:** RSVP görünürlük tercihi, eski kayıtlar için kapalı varsayılan, sınırlı sunucu filtreli profil önizlemesi ve sayfalama. Yönetici verisi genel DTO'ya sızmamalı.
4. **Tutarlı durum:** üyelik, arşiv, engel, doluluk ve başlamış etkinlik için açık nedenler; kart/ajanda/topluluk işlemden sonra aynı sunucu durumuna döner. Kontroller gizlenince backend yetki kontrolü kaldırılmaz.
5. **İstek maliyeti:** bugün her ana akış etkinliği ayrıca detay GET yapıyor. Gerekli ilk katılım özetini toplu taşımak veya ortak okuma önbelleğiyle birleştirmek değerlendirilmeli. Her avatar için profil GET yapılmamalı; kapalı yorum/katılımcı paneli tüm listeyi önceden indirmemeli. İlk/son durumlarda istek sayısı kaydedilmeli.
6. **Gezinme uyumu:** mevcut `?post=`, `?event=`, eski detay rotaları, `from`/kaynak dönüşü ve `/control` → müzik kitaplığı uyumluluğu korunmalı. Seçili eski link yeni kartı bulup açabilir; kart kayıpsa anlaşılır durum gösterir. Filtre/geri/ileri/yenilemede taslak ve yüklenmiş konum korunmalı.
7. **CSS geçişi:** ortak kurallar token/primitives katmanında, yalnız türe özgü düzenler özellik stilinde tutulmalı. Eski stiller kullanılmadığı doğrulandıktan sonra kaldırılmalı; paleti değiştiren yeni genel override katmanı eklenmemeli.
8. **Kayıt merkezi sınırı:** ilk dilim tek giriş ve tür sekmeleriyle mevcut iki kayıt servisini kullanabilir. Bütün kayıtları tek tarih sırasıyla “Tümü” altında birleştirmek istenirse kayıt zamanı ve ortak sayfalama ayrıca tasarlanmalı; yalnız UI sekmesi bunu tamamlamaz.

## 8. Aşamalı yol haritası

F0 bu belgeyle tamamlanan incelemedir. **F1–F5 henüz uygulanmadı.** Her faz bütün ve gözden geçirilebilir bir Git kilometre taşı olmalı. Alt fazlar, tasarım ile veri/izin değişikliğini karıştırmadan ilerlemeyi sağlar.

| Faz | Kapsam ve teslim | Bağımlılık / göreli efor | Bitmiş sayılma ölçütü |
| --- | --- | --- | --- |
| F0 — İnceleme | Karşılaştırma, sorun listesi, kapsam ve kabul ölçütleri. | Tamamlandı; rapor işi. | Mevcut/öneri ayrımı ve kaynak dayanakları kayıtlı. |
| F1A — Ortak görsel temel | Aynı akış genişliği, kısa başlık, filtre ve gönderi üst/eylem satırı. Eski sidebar yükleme iskeleti ve yanlış etkinlik keşif hedefini düzeltme. | İlk uygulama dilimi; orta. | Aynı sohbet/inceleme iki bağlamda aynı ölçü ve eylem diliyle görünür; yeni palet/sidebar yok. |
| F1B — Topluluk akışını taşıma | Tam metin DTO uyarlaması, ortak kartlar, yerinde metin/spoiler/yorum; topluluk kapsamlı karma liste ve filtreler. | F1A; büyük. | Topluluğa özel içerik kaybolmaz; listeyi kapatan zorunlu “detayı aç” yolu yok; sayfalama tekrarsız. |
| F2A — Etkinlik görünümü | Tarih/yer, özet, tek doluluk satırı, RSVP, neden durumları; ana/topluluk/ajanda ortak kartı. | F1 temel; orta. Katılımcı izinleri değişmeden başlanabilir. | Aynı etkinlik üç yerde aynı kimlik/sayı/tercih gösterir; temel işlem URL'yi değiştirmez. |
| F2B — Katılımcılar | Görünürlük tercihi, baş harfi avatarları, görünür sayı ve yerinde sayfalı panel. | F2A + şema/API dilimi; orta-büyük. | Eski RSVP açılmaz; üye/üye değil/yönetici görünümü doğru; engeller ve toplam koltuk hesabı korunur. |
| F3 — Paylaşım ve etkileşim | Kompakt tür/hedef seçimi, ortak yorum kabuğu, işlem menüleri; okur/yönetici ayrımı ve kapsayıcı ilk kullanım rehberi. | F1/F2 kart sözleşmesi; büyük. | Mevcut müzik/sohbet/inceleme/etkinlik oluşturma yolları ulaşılır; taslak, spoiler ve yetki kuralları korunur. |
| F4A — Sosyal ekranlar | Arama, Kaydedilenler, sosyal profil ve bildirim hedeflerini ortak kartlara uyarlama. Eksik topluluk yorum/sahiplik bildirimlerini ayrı veri/işçi diliminde tamamlama. | F1–F3; büyük, ayrı küçük teslimler. | Sonuçtan dönüş, özel kayıtlar ve izinli profil içeriği tutarlı; özel koleksiyon görünmez; bildirim türleri gerçek hedef ve tercihlerle eşleşir. |
| F4B — Eski paneller | Kitaplık/hesap/öneriler; oyun/yönetim/hukuk/hata kabukları ve kapsam metinleri. Forumda yalnız uyumluluk. | F4A ile bağımsız parçalar paralel olabilir; orta-büyük. | Çalışan eski işlevler kaldırılmadan aynı form/durum dili; müzik kuyruğu kaybolmaz. |
| F5 — Son düzen ve dar kabul | Kontrast/odak, hareket, boş/hata/busy, istek sayıları ve seçili koyu masaüstü akışları. Güncel tasarım sözleşmesi. | Önceki fazlar; orta. | Bölüm 10'un ilgili ölçütleri geçer; kalan pilot/yayın işleri ayrıca işaretlidir. |

Önerilen ilk uygulama oturumu: **F1A + F1B'nin DTO ve sohbet/inceleme kartı geçişi**, ardından **F2A**. Karma topluluk liste API'si tamamlanmadan “Tümü” karma çalışıyormuş gibi yayımlanmamalı. Katılımcı görünürlüğü F2B'de ayrı, denetlenebilir veri değişikliği olarak gelmeli. Faz 4'teki tüm eski ekranlar bitene kadar etkinlik tasarımını bekletmek gerekmiyor.

## 9. Ek özellik fırsatları

Bunlar keşfedilmiş adaylardır; ilk tasarım paketine otomatik eklenmez. Önce aynı içeriğin farklı yüzeylerde tutarlı görünmesi tamamlanmalı.

| Sıra | Aday | Kullanıcıya katkı | Mevcut temel / yeni gereksinim |
| --- | --- | --- | --- |
| P2 | Toplulukta sabitlenen karşılama/kural gönderisi | Yeni üye nereden başlayacağını görür. | Pin durumu, yetki ve sıralama yeni iş. |
| P2 | Etkinliği takvime ekle (`.ics`) | Tarih, mekân ve zaman dilimi tek işlemde takvime geçer. | Mevcut etkinlik verisinden üretilebilir; güncelleme/iptal bilgisi düşünülmeli. |
| P2 | Değişen saat/mekân özeti ve uygun hatırlatma | Katılımcı önemli değişikliği kaçırmaz. | Değişiklik/iptal bildirimi ve outbox mevcut; yeni hatırlatma planlama ve tercihleri ayrı. |
| P2 | Kutu oyunu alanları | Minimum oyuncu, deneyim düzeyi, tahmini süre ve malzeme ihtiyacı netleşir. | Yeni doğrulanan alanlar; minimum sayı gerçekleşme garantisi değildir. |
| P2 | Etkinlik içi soru-cevap | “Yeni başlayan gelebilir mi?” gibi sorular akıştan kopmadan yanıtlanır. | Etkinlik hedefli yorum modeli/izin/moderasyon gerekir; bugün post yorumunu aynen bağlamak yeterli değil. |
| P2 | İnceleme eser bağlamı | Tür, eser adı, puan, spoiler ve kaynak daha kolay taranır. | Mevcut metadata/snapshot kullanılabilir; kapak satın alma veya yeni medya API'si zorunlu değil. |
| P2 | Karma keşif ve topluluk içinde arama kapsamı | İlgili içerik bulunur; ayrı arama ekranları çoğalmaz. | Ortak aramada kapsam, alaka ve karma sıralama yeni servis işi. |
| P3 | Bekleme listesi | Dolu etkinlikte boşalan yer için açık sıra. | İlgileniyorum bekleme sırası değildir. Koltuk teklifi, süre ve bildirim ayrı tasarlanmalı. |
| P3 | Oyun kitaplığı | Video/kutu oyunlarını kişisel koleksiyonda yönetme. | Yeni koleksiyon türü ve gerekirse katalog entegrasyonu. |
| P3 | Profil fotoğrafı/topluluk kapağı | Daha kişisel sosyal görünüm. | Yükleme, boyut/saklama ve moderasyon maliyeti; baş harfi avatarı önce yeterli. |

Ödeme, biletleme, rezervasyon, zorunlu konum haritası, DM/grup sohbeti veya fiziksel katılım doğrulaması bu yol haritasının varsayılan parçası değildir. Topluluk buluşması çekirdeğini tamamlamadan bunlarla kapsam büyütülmemeli.

## 10. Kabul ölçütleri ve sınırlı doğrulama

### Görsel ve davranış kabulü

- Aynı demo sohbet/inceleme ve etkinlik, aynı genişlikte ana/topluluk akışında karşılaştırılır: kart genişliği, font, boşluk, kimlik ve eylem sırası aynı sözleşmededir.
- İlk ekranda başlık/filtre/composer alanı içeriği gereksiz aşağı itmez; uzun başlık, uzun Türkçe isim ve metin taşmaz. Türler yalnız renk farkıyla anlatılmaz.
- Ana/topluluk akışında metin genişletme, spoiler, yorum açma/yazma ve RSVP için zorunlu sayfa/alt görünüm değişimi olmaz. Profil/topluluk ve isteğe bağlı kalıcı bağlantılar işlevini korur.
- Etkinlik kartında tarih/saat/yer, toplam katılım, kapasite/kalan ve kişinin tercihi görünür. Görünür katılımcı profili ile toplam kişi sayısı karıştırılmaz.
- Yorum/katılımcı panelleri açılıp kapandığında odak ve taslak davranışı tutarlı; çoklu kartlar birbirinin input ID'sini/taslağını kullanmaz.
- `…` menüsüne taşınan düzenle/bildir/kaldır/iptal erişilebilir ve yetkiye bağlıdır. Menü, modal ve profil gezinmesi Escape/odak dönüşünü korur.
- Yükleniyor/boş/hata/erişim kaybı/sunum dışı durumları ortak görünür. Yapılandırılmamış editör alanı kalıcı hata gürültüsü oluşturmaz.
- Dekoratif arka plan simgeleri ve açılma hareketleri metinle yarışmaz; azaltılmış hareket tercihi gözetilir. Yeni sürekli animasyon katmanı eklenmez.

### Veri ve iş kuralı kabulü

- Genel dağıtım ve toplulukta dağıtım korunur. Karma topluluk listesinde sabit sıra/cursor, tekrar etmeyen sayfalar ve filtre dönüşü doğrulanır.
- Üye olmayan, üye, düzenleyen/moderatör, engelli, yasaklı ve arşiv durumlarında doğru kontroller/DTO; eski yetkili bilgi temizlenir.
- Katılımcı tercihi eski kayıtlarda kapalı; üye olmayan kimlik okuyamaz. Engel filtresi hem önizleme hem açılan listede uygulanır.
- İlgileniyorum koltuk tüketmez; son koltuk yarışında kapasite aşılmaz; çift tıklama/tekrar aynı RSVP'yi çoğaltmaz. İptal/ayrılma sonrası hayalet katılım olmaz.
- Geçici 503 taslağı silmez. 401 giriş hedefini korur; 403/404 görünmemesi gereken içerik/özel taslak ve onayları taşımamalı. Eski yanıt başka karta uygulanmaz.
- Profilin yeni sosyal akışı özel kitaplık, kapalı üniversite veya kişisel RSVP listesini kendiliğinden açmaz. Kaydedilenler gizliliği korunur.

### Test bütçesi

Bu rapor için ek test çalıştırılmadı. Uygulamada her küçük CSS adımında bütün suite yerine, 4–6 ilişkili adımdan sonra gerekli dar kontroller biriktirilmeli. Bileşen değişiminde ilgili kontroller; DTO/katılım/görünürlük değişiminde ilgili mevcut birim testleri ve typecheck çalıştırılmalı. Yeni test yalnız yeni izin kuralı veya karma sayfalama gibi anlamlı davranışı doğrulamak için eklenmeli.

Görsel kabul aynı örnek kartlarla 1440 koyu masaüstünde, daha dar masaüstü kontrolü 1280'de yapılabilir. Üyelik/RSVP yazmaları normal DB'de yapılmamalı; gerekirse mevcut izole kabul ortamı veya açıkça belirtilmiş istemci taklidi kullanılmalı. Mobil/açık tema/geniş matris bu kapsamla yeniden açılmaz. Production build ve yayın kapıları ayrı kilometre taşlarıdır.

## 11. İlerleme ve teslim kararı

**Tamamlanan:** salt okunur kaynak/tarayıcı incelemesi, karşılaştırma, eksiklerin önceliklendirilmesi, etkinlik ve katılımcı tasarım önerisi, eski ekran geçiş listesi ve faz kabul ölçütleri.

**Henüz yapılmayan:** ortak akışa taşıma, yeni etkinlik görünümü, katılımcı görünürlük alanı/API'si, karma topluluk liste sözleşmesi ve eski panellerin tasarım değişiklikleri. Bu belge bu özellikler için tamamlandı yüzdesi vermez. Pilot/staging, operasyon, lisans ve yayın hazırlığı ayrıca mevcut teknik yol haritasında açık kalır.

Sonraki geliştirmede önce mevcut renkler ve son üst alan korunarak aynı gönderinin iki akıştaki farkı kapatılmalı. İlk uygulama teslimi görsel karşılaştırma ve dar davranış kabulüyle değerlendirilir; ardından etkinlikler sosyal görünüm ve katılımcı katmanını kazanır.

## 12. Kaynak dayanakları

Bağlantılar inceleme anındaki commit'e sabittir; sonraki uygulamada satırlar değişebilir.

| Kod | İncelenen kaynak |
| --- | --- |
| K1 | [Ortak topluluk kartı ve eser bloğu](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/CommunityFeedCard.tsx#L29), [kart içi metin](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/CommunityPostContent.tsx#L18) |
| K2 | [Eski topluluk listesi/detay görünümü](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityClient.tsx#L116), [özet DTO](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/communityTypes.ts#L10) |
| K3 | [Ana akış etkinlik kartı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/CommunityInlineEvent.tsx#L37), [topluluk etkinlik liste/detayı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityEventsPanel.tsx#L55) |
| K4 | [Ana akış türleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/FeedContentTabs.tsx#L4), [müziğe özel sıralama kapsamı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/page.tsx#L301), [topluluk filtreleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityContentFilters.tsx#L8) |
| K5 | [Etkinlik izinleri/katılımcı seçimi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/communityEvents.ts#L91), [RSVP şeması](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/prisma/schema.prisma#L169), [katılım kuralları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/communityAttendance.ts#L17) |
| K6 | [Ajanda keşif hedefi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/community-events/CommunityAgendaClient.tsx#L43), [eski dizin yönlendirmesi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/page.tsx#L5) |
| K7 | [Ana ölçü tokenı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/styles/tokens.css#L173), [ana sağ alan](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/styles/primitives.css#L566), [topluluk ölçüleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/communities.css#L1) |
| K8 | [Müzik yorum bağlantısı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/FeedPostCard.tsx#L325), [kart içi topluluk yorumları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/CommunityInlineComments.tsx#L27), [eski detay yorumları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityClient.tsx#L130) |
| K9 | [Müzik oluşturucu](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/FeedComposer.tsx#L85), [topluluk oluşturucu](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityComposer.tsx#L33) |
| K10 | [Profil içerik tipleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/u/%5Bslug%5D/profileTypes.ts#L1), [aktivite kapsamı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/profile/ProfileTabPanels.tsx#L394) |
| K11 | [Keşfet kapsamı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/discover/page.tsx#L383), [hesap varsayılanı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/account/page.tsx#L61) |
| K12 | [Oyun açıklamaları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/games/page.tsx#L101), [müzik öneri akışı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/suggest/page.tsx#L266) |
| K13 | [Ortak kitaplık türleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/library/LibraryHub.tsx#L11), [medya kitaplığı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/library/LibraryClient.tsx#L118), [müzik paneli](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/library/MusicLibraryPanel.tsx#L262) |
| K14 | [Topluluk kayıt merkezi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/community-saved/CommunitySavedClient.tsx#L30), [ajanda filtre/kartları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/community-events/CommunityAgendaClient.tsx#L47) |
| K15 | [Birleşik arama sonuçları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/search/SearchResults.tsx#L34), [arama eşleştirme kapsamı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/socialSearch.ts#L19) |
| K16 | [Forumun mevcut girişleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/forum/page.tsx#L319), [yetkili menü](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/AccountMenu.tsx#L151), [yönetim merkezi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/admin/page.tsx#L478) |
| K17 | [Sosyal yükleme iskeleti](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/RouteLoading.tsx#L42), [sosyal fallback etiketi](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/loading.tsx#L4) |
| K18 | [Bildirim türleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/notificationPresentation.ts#L3), [bildirim hedefleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/lib/notificationPresentation.ts#L104), [bildirim tercihleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/NotificationCenter.tsx#L143) |
| K19 | [Sahiplik gelen kutusu](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityOwnershipInbox.tsx#L15), [oluşturmada erişim](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/%28social%29/communities/CommunityCreate.tsx#L57), [platform başvurusu topluluk alanı](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/communityCases/CommunityCaseClient.tsx#L119) |
| K20 | [İlk kullanım görevleri](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/components/GettingStarted.tsx#L8) |
| K21 | [Amaç ve saklanan veri açıklamaları](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/legal/page.tsx#L7), [genel hata metni](https://github.com/erksbars/ListeKutusu/blob/705bf8850a87649af8fa884a82fc99bafea98476/app/error.tsx#L29) |

Önceki teknik/pilot kapsamı `ROADMAP.md`, `docs/PILOT_EKSIKLERI.md` ve `docs/TEKNIK_KAPANIS_VE_YAYIN.md` dosyalarında izlenir. Eski tasarım raporlarındaki sidebar/dizin önerileri yerine bu belgedeki son kullanıcı yönü esas alınır.
