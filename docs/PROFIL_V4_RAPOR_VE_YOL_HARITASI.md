# ListeKutusu Profil V4 — değerlendirme ve yol haritası

Tarih: 21 Eylül 2026. Başlangıç noktası: `e079c6c` sonrası kaynak kod.
Durum: tasarım ve uygulama planı; aşağıdaki yeni özellikler henüz uygulanmadı.
Kapsam: masaüstü, koyu tema. Mobil ve açık tema askıda. Kullanım limitini koruyan dar doğrulama politikası geçerli.

## 1. Ürün hedefi

Profil, kullanıcının müzik zevkini, topluluğa katkısını ve seçtiği kimliği sergilediği kişisel bir alan olmalı. Ziyaretçi ilk ekranda kimin profilinde olduğunu, ne tür müzik keşfedebileceğini ve hangi etkileşimi yapabileceğini anlamalı. Profil sahibi ise görünümü değiştirdiğinde farkı hemen görmeli ve kendi seçkisini sahiplenmeli.

Steam'den alınacak temel fikirler: kişisel arka plan, avatar çerçevesi, düzenlenebilir vitrinler, sergilenen başarımlar ve profilin diğer yüzeylerde tanınmasını sağlayan küçük kimlik kartı. Steam'in profil arka planları, avatarları, çerçeveleri ve mini profil varlıkları resmi [Steamworks belgesinde](https://partner.steamgames.com/doc/marketing/pointsshopitems?l=english); vitrinler [Points Shop](https://store.steampowered.com/points/shop/profileshowcases) içinde yer alıyor. ListeKutusu için aşağıdaki kapsam, bu referanslardan çıkarılan özgün ürün önerisidir.

İlk hedef, kozmetik mağaza veya büyük bir XP ekonomisi kurmak değildir. Önce ziyaret edilmek ve düzenlenmek istenen bir müzik profili oluşturulacak. Mevcut tek kişisel liste ilkesi korunacak; profil vitrinleri ek playlist sahipliği yaratmayacak. Oyun puanı veya rekabetçi avantaj satılmayacak.

## 2. İncelemenin sınırı ve mevcut temel

Bu rapor kaynak kod ve mevcut masaüstü profil referans görüntüsüne dayanır. Referans görüntüsü eski düzeni gösteriyor; güncel V3 görünümünün canlı ekran doğrulaması sayılmaz. Bu turda uygulama, veritabanı veya test referansları değiştirilmedi; test çalıştırılmadı. Aşağıdaki teknik bulgular kodda görülen davranışlardır; tarayıcıda yeniden üretilmiş hata iddiası değildir.

| Alan | Mevcut durum | V4 yaklaşımı |
| --- | --- | --- |
| İlk yükleme | Profil ve ziyaretçi sunucuda alınıyor | Bu avantaj korunur; ilk içerik tekrar istemci fetch'ine taşınmaz |
| Kimlik | Ad, kullanıcı adı, biyografi, durum, katılma tarihi | Görsel hiyerarşi ve kişisel arka plan güçlendirilir |
| Avatar | İsmin ilk harfi ve gradyan | Önce hazır avatar/çerçeve kataloğu; yükleme sonraki kapsam |
| Görünüm | Aurora, Mor, Zümrüt, Gün batımı; 3 banner, 2 yoğunluk | Aynı kimlikleri koruyan tutarlı preset sistemi |
| Vitrin | featured, identity, recent, forum; görünürlük ve sıra | İlk sürüm mevcut 4 modülü iyileştirir; rozet/oyun ayrı eklenir |
| Sabitleme | Kullanıcının tek paylaşımı ve kazanılmış bir rozet | İmza keşfi ve başlıkta görünür rozet olarak güçlendirilir |
| Düzenleyici | Hesap panelinde bölümler, önizleme, kaydedilmedi bilgisi | Gerçek profil bileşenleriyle ortak önizleme ve yerinde düzenleme |
| Sosyal | Takip, takipçi listesi, paylaşma, engelleme | Ağ hatalarına dayanıklı işlemler ve profil kartından etkileşim |
| Sekmeler | Vitrin, Aktivite, Hakkında, Rozetler | URL ile tutarlı, ayrı sorumluluklu paneller |
| Keşif | Ortak türler ve benzer profiller | Açıklanabilir ortak zevk kartı; kanıtsız uyum yüzdesi yok |
| Aktivite | Paylaşım, forum ve oyun listelerinin birleşimi | Gerçek olay zamanı ve sayfalama; toplamlarla örnekler ayrılır |
| Başarımlar | 10 eşik tabanlı tanım, sonraki rozet ilerlemesi | Rozet vitrini; seviye sistemi daha sonraki paket |

Yeniden yapılmaması gerekenler: profil SSR, takip/engelleme API'leri, mevcut rozet hesaplama temeli, vitrin normalizasyonu, klavye sekmeleri ve mevcut ayar kayıt akışı. Geliştirme bu altyapıya dayanmalı.

## 3. Tasarımdan önce çözülmesi gereken teknik bulgular

### P0 — etkileşim ve veri doğruluğu

1. `ProfileClient.tsx` içindeki `toggleFollow` ve `toggleBlock`, fetch reddinde `catch/finally` kullanmıyor. Ağ kesilirse `busy` açık kalabilir. Her işlem hata mesajı, tekrar deneme ve kesin kilit açma davranışı kazanmalı.
2. `lib/publicProfile.ts` oyun geçmişi ve tamamlanan oyun sayısını `ownerId` ile sorguluyor. Katılan oyuncuların geçmişi eksik kalabilir. `GamePlayer.userId` üzerinden katılım esas alınmalı; aynı maç bir kez sayılmalı.
3. `ProfileTabPanels.tsx` oyunları `gameCode` değerine rağmen Şarkı Düellosu etiketi ve `/games/elimination/...` bağlantısıyla gösteriyor. Tavla doğru ad, sonuç ve rotaya yönlenmeli.
4. `ProfileIdentityRail` oyun sayısını en fazla 6 öğelik `games.length` üzerinden gösteriyor. Forum örnekleri en fazla 3. Toplam istatistikler ayrı alanlardan gelmeli; kısa liste uzunluğu toplam gibi sunulmamalı.
5. Genel paylaşım sayısı `_count.feedPosts` üzerinden, görünür içerik ise `published` filtresiyle geliyor. Profil, rozet ve ayar doğrulamasında yayınlanmış içerik ölçütü tutarlı hale getirilmeli.

### P1 — güvenilir sunum

6. Otomatik öne çıkan paylaşım yüklenen paylaşım kümesinden seçiliyor; bu tüm zamanların en popüler paylaşımı olduğu anlamına gelmez. Kullanıcı sabitlemesi öncelikli olsun; otomatik fallback ya sunucuda hesaplanmalı ya da “son keşiflerden” diye etiketlenmeli.
7. Forum aktivitesi “konu açtı” derken `lastActivityAt` kullanıyor. Eski konu yeni yanıt alınca açılış yeni olmuş gibi görünebilir. Açılış olayı `createdAt`, güncellenme olayı ayrı etiket kullanmalı.
8. Profil sekmesi ilk mount'ta URL'den okunuyor, seçim `replaceState` ile yazılıyor. Profil değişimi ve geri/ileri davranışı için URL/state senkronu açıkça ele alınmalı; mevcut davranış test edilmeden yeni sekmeler eklenmemeli.
9. “Oyuna davet et” hedef slug ile kurulum açıyor ve odayı gizli seçiyor; incelenen oluşturma isteği hedef kullanıcıyı API'ye göndermiyor. Otomatik alıcı bildirimi/katılım yetkisi varmış gibi sunulmamalı. İlk sürüm “Özel oyun oluştur”, gerçek davet ayrı geliştirme olmalı.
10. Aynı tema editör önizlemesinde token gradyanları, gerçek profilde Tailwind renkleriyle tanımlı. Ortak preset kaynağı ile önizleme/sonuç farkı kaldırılmalı.

## 4. Önerilen sayfa yapısı

```text
Kalıcı ListeKutusu bölüm navigasyonu
Profil atmosferi / temalı üst alan
  Avatar + çerçeve | ad, kısa durum, seçili rozet | bağlama uygun eylem
  Takipçiler · takip edilenler · yayınlanmış keşifler
Vitrin | Aktivite | Hakkında | Rozetler
  Geniş içerik alanı                         Dar bilgi sütunu
  İmza keşfi                                Hakkında / müzik kimliği
  Seçili vitrinler                          Ortak zevk
  Son paylaşımlar                           Rozet özeti
  Forum / oyun vitrini                      Benzer müzikseverler
```

Önerilen içerik üst sınırı 1280 px; 24 px kolon aralığı, yaklaşık 280–300 px sağ sütun. 1280 px masaüstünde içerik kullanılabilir genişliğe küçülür; 1728 px ekranda metin satırları gereksiz uzamaz. Bunlar uygulama sırasında mevcut ortak tokenlara bağlanacak tasarım başlangıç değerleridir.

Üst alan yaklaşık 240–280 px, avatar 104–120 px. Arka plan başlığın arkasında kişisel atmosfer verir; içerik okunabilirliği için sabit koyu yüzey kullanılır. Eski profil görünümlerini üst üste CSS override'larıyla çoğaltmak yerine mevcut profil bileşenleri ve stilleri düzenlenir.

Profil sahibi için baskın eylem “Profili düzenle”; ziyaretçi için “Takip et”. Paylaşma ve oyun oluşturma ikincil eylemler. Girişsiz ziyaretçide etkileşimden sonra hedef profile dönüş korunur. Engellenmiş ilişkide sosyal aksiyonlar ve gizlenen içerikler hem sunucuda hem istemcide aynı sözleşmeye uyar.

## 5. Dikkat çekicilik ve etkileşim özellikleri

### 5.1 Kişisel görünüm

- İlk sürüm dört mevcut tema ailesini korur; arka plan dokusu, kenar vurgusu ve avatar çerçevesi aynı preset'ten gelir.
- Avatar için hazır müzik simgeleri ve mevcut harf fallback'i. Kullanıcı fotoğrafı yükleme; depolama, kırpma, boyut sınırı ve moderasyon gerektirdiğinden ayrı aşama.
- Çerçeve varyantları: sade, ince ışık, plak halkası. Sürekli yoğun parıltı ve imleci takip eden ağır efekt kullanılmaz.
- Hover/focus geçişleri 100–160 ms, panel geçişleri en fazla 220 ms. Reduced motion etkinse hareket kapanır.
- İlk paket video arka planı içermez. İleride hareketli tema gelirse görünmeyen sekmede durmalı ve tek efekt bütçesine uymalı.

### 5.2 İmza keşfi ve vitrinler

- Mevcut sabitlenmiş paylaşım büyük bir “İmza keşfim” modülünde, sahibinin notuyla gösterilir. Bu bir çalma kontrolü değildir; Spotify'a dış bağlantı açıkça adlandırılır.
- Albüm görseli zorunlu değildir; kapaksız müzik kimliği mevcut veriyle çalışır. Görsel kullanılırsa kaynak, lisans ve fallback ayrıca belirlenir.
- Son paylaşım kartında beğenme, kişisel listeye ekleme ve yorum ayrıntısına gitme. Mevcut servisler kullanılır; aynı aksiyon için ikinci iş kuralı oluşturulmaz.
- Rozet vitrini en fazla 3 seçili kazanılmış rozet; oyun vitrini oyun türüne göre en fazla 3 son açık sonuç. Bu iki modül sonraki pakette veri sözleşmesine eklenir.
- Vitrin düzeni kontrollü kolon genişlikleriyle çalışır. İlk etapta yukarı/aşağı taşıma korunur; sürükleme gelirse klavye alternatifi kalır.
- Ziyaretçide boş, isteğe bağlı modüller yer kaplamaz. Profil sahibinde kısa kurulum çağrısı görünür. Vitrini boş bırakma davranışı açıkça tanımlanır; mevcut normalizasyon boş diziyi varsayılana çeviriyor.

### 5.3 Rozetler ve ilerleme

- Rozet tıklanınca adı, kazanma şartı ve mevcut ilerleme açılır; kazanılma tarihi kaydedilmiyorsa uydurulmaz.
- İlk sürüm mevcut 10 rozetle çalışır. Kilitli rozetler sahip görünümünde ilerleme amacı taşır.
- Seviye/XP ikinci aşamadır. Önce hangi olayın ne kadar katkı verdiği, tekrar sınırı ve geri alma davranışı tanımlanır.
- Takip et/bırak, beğen/geri çek ve içerik silip yeniden paylaş ile sınırsız XP üretilmemeli. Seviye yarışma puanından ayrı tutulmalı; başlangıç görünüm seçenekleri seviyeye kilitlenmemeli.

### 5.4 Sosyal bağ

- Ortak zevk kutusu gerçek ortak türleri ve varsa ortak keşifleri açıklar. Dinleme geçmişi yokken “en çok dinlediğin sanatçı” veya “şu an dinliyor” gösterilmez.
- İleride mini profil: hover ve klavye focus ile kısa kimlik, öne çıkan rozet ve takip eylemi. Önce profil içinde pilot, ardından akış/forumda yeniden kullanım.
- Gerçek oyun daveti: alıcı, gönderen, oda, süre ve durum sunucuda tutulur; alıcıya bildirim ve kabul/ret eylemi eklenir. Mevcut bağlantı paylaşımı ayrı kalır.
- Ziyaretçi defteri sonraki sürümdür: sahibin kapatabildiği/izinli kitlesini seçtiği yorumlar, silme, rapor, hız sınırı ve engel kuralları birlikte geliştirilir. İlk sürüme özel mesaj sistemi eklenmez.

## 6. Teknik tasarım ve veri değişiklikleri

Profilin mevcut server-first sayfası korunur. `ProfileClient` etkileşimleri takip, bağlantı penceresi, sekme durumu ve düzenleme sorumluluklarına ayrılır. Pasif profil kimliği mümkün olduğunca sunucu verisiyle çizilir; görüntüleyen kullanıcıya bağlı takip/engel verisi ortak public cache'e konmaz.

| Değişiklik | Mevcut temel | Önerilen ek |
| --- | --- | --- |
| Görünüm preset'i | profileTheme, profileBanner, profileDensity | Ortak tipli preset kataloğu; gerekirse avatarPresetId ve frameId |
| Vitrin | profileShowcase JSON dizisi | Sürümlü doğrulama; eski 4 modül ve sıraları korunur |
| Rozet vitrini | featuredAchievementId | Seçili rozet ID listesi; kayıt anında kazanılmışlık kontrolü |
| Doğru istatistik | postCount, kısa games/forum listeleri | publishedPostCount, completedGameCount, forumThreadCount |
| Doğru aktivite | Ayrı veri kümeleri | Önce doğru zaman/etiket; ölçek gerekirse cursor'lu etkinlik uç noktası |
| Beğen/ekle | Akış mutation API'leri | Profil DTO'sunda likedByMe, addedByMe ve uygunluk durumu |
| İlerleme | Anlık rozet hesabı | Sonraki aşamada tekrar korumalı olay kaydı; kazanılma tarihi gerekiyorsa kalıcı kayıt |
| Davet/defter | Profilde yerleşik sistem yok | Ayrı modeller, yetki kontrolleri ve sınırlı sayfalama |

Eski profiller yeni alanlar olmadan açılmalı. Bilinmeyen preset güvenli varsayılana düşmeli. Sabitlenen paylaşım sahibine ait ve yayınlanmış olmalı. Gizli oyun içeriği ziyaretçiye sızmamalı. Profil ayarları allowlist ile doğrulanmalı; serbest CSS/HTML kabul edilmemeli.

Editör taslağı kaydedilmiş profilden ayrı tutulur. Kaydet tek işlem, iptal eski değere dönüş; hata taslağı kaybetmez. Önizleme ve yayın görünümü aynı presentational bileşenleri kullanır. İlk sürümde büyük drag-and-drop veya animasyon bağımlılığı eklenmez.

## 7. Uygulama paketleri

Eforlar takvim taahhüdü değil, göreli büyüklüktür: S dar değişiklik, M birkaç bağlı bileşen, L veri/API/UI birlikte. Sıra bağımlılıkları gösterir.

| Paket | İş | Efor | Bağımlılık | Kabul ölçütü |
| --- | --- | --- | --- | --- |
| P0 | Takip/engel ağ hataları, doğru oyun rotası/katılımcı/istatistik, yayınlanmış paylaşım sayıları | M | Yok | Ağ hatasında kontroller açılır; Tavla kendi rotasına gider; toplamlar örnek listeye bağlı değildir |
| P1 | Ortak preset kaynağı, güçlü hero, kontrollü arka plan, avatar çerçevesi, masaüstü kolonları | M | P0 | Dolu ve boş profilde okunabilir ilk ekran; 1280 px'de taşma yok; 4 tema görsel olarak ayrışır |
| P2 | Mevcut 4 vitrinin tasarımı, imza keşfi, boş durumlar, tekrarlanan bilgilerin azaltılması | M | P1 | Sabitleme önceliği doğru; kayıtlı sıra korunur; ziyaretçide boş vitrin duvarı oluşmaz |
| P3 | Taslaklı görünüm editörü, ortak önizleme, kaydet/iptal, çerçeve seçimi | M | P1–P2 | Önizleme kaydedilen görünümle eşleşir; yenilemede seçim korunur; hata taslağı silmez |
| P4 | Profil kartlarından beğen/ekle, rozet ayrıntısı ve URL sekme davranışı | M | P0–P2 | Tek istek, doğru sayaç, hata geri alma; oturumsuz ve engellenmiş kullanıcı kuralları tutarlı |
| P5 | Rozet/oyun vitrinleri ve ortak zevk kartı | M | P0, P3–P4 | Yalnız izinli içerik sergilenir; kullanıcı sahip olmadığı rozeti seçemez |
| P6 | Profil mini kartı ve gerçek oyun daveti | L | P4–P5 | Davet alıcıya ulaşır; reddetme/süre bitimi/engel davranışları tanımlı |
| P7 | Kalıcı ilerleme ve kozmetik açılımları | L | Veri ölçütleri kesinleşmiş olmalı | Aynı olay tekrar XP üretmez; geçmiş veri geçişi ve puan geri alma kuralları belirli |
| P8 | İsteğe bağlı ziyaretçi defteri ve yüklenen profil medyası | L | Moderasyon ve depolama kararı | İzin, rapor/silme, boyut sınırı ve hız sınırı birlikte çalışır |

İlk teslim sınırı P0–P4: ziyaret edilebilir, belirgin biçimde kişiselleştirilebilir ve doğrudan etkileşimli profil. P5 ikinci teslim; P6–P8 ilk sürümün bitmesini engellemez. Bu ayrım kozmetik/XP ve moderasyon kapsamının ilk tasarımı geciktirmesini önler.

## 8. Değişecek dosyalar

- `app/(social)/u/[slug]/page.tsx`: mevcut sunucu veri sınırı; korunacak.
- `app/(social)/u/[slug]/ProfileClient.tsx`: ağ hataları, sekmeler ve etkileşimlerin ayrıştırılması.
- `app/components/profile/ProfileHeroV3.tsx`: kimlik, kapak, avatar/çerçeve ve eylemler.
- `app/components/profile/ProfileIdentityRail.tsx`: doğru toplamlar, ortak zevk ve sade bilgi sütunu.
- `app/components/profile/ProfileTabPanels.tsx`: vitrinleri ayrı bileşenlere ayırma ve oyun/aktivite düzeltmeleri.
- `app/components/AccountProfilePanel.tsx`: gerçek bileşenlerle önizleme ve taslak düzenleme.
- `lib/publicProfile.ts`: katılım sorguları, yayınlanmış sayılar, görünürlük ve etkileşim durumu.
- `lib/profileAppearance.ts`, `lib/profileShowcase.ts`: preset ve geriye uyumlu vitrin sözleşmesi.
- `app/api/accounts/settings/route.ts`: doğrulama ve yeni görünüm alanlarının kaydı.
- `app/styles/profile.css`: profil görsel sistemi. Profil stillerini ilgili route layout'una taşıma ayrıca değerlendirilmeli; global yük mevcut.
- `prisma/schema.prisma`: yalnız yeni kalıcı alan gerektiğinde migration; P0 için zorunlu şema değişikliği öngörülmüyor.

## 9. Sınırlı doğrulama planı

Rapor aşamasında test yok. Her küçük görsel adımda build, tam E2E veya tüm tarayıcı matrisi çalıştırılmaz.

- P0: yalnız değişen iş kuralları ve ağ hatası davranışı için dar kontrol; typecheck.
- P1–P3: bir masaüstü koyu profil görünümü, sahip/ziyaretçi ve uzun ad/boş içerik durumları; gerekirse typecheck. Her tema için ayrı tam browser koşusu yok.
- P4: tek dar senaryoda giriş gereksinimi, mutation hata geri alma ve sayaç. Mevcut servis testleri tekrar yazılmaz.
- P0–P4 paketi sonunda bir toplu kontrol: typecheck, lint, production build; ilgili profil/görünüm testleri ve profil için masaüstü Axe. Tam oyun/API matrisi yalnız ilgili hata varsa.
- Görsel referans ancak gözle incelenip bilinçli tasarım farkı onaylandıktan sonra güncellenir.
- Mobil/açık tema koşuları, her adımda tüm repo taraması ve tekrar tekrar performans koşusu yok.

Önerilen performans kabulü: ilk profil içeriği sunucudan gelir; yeni işler başlangıca tekrarlı profil sorgusu eklemez; editör/detay panelleri ihtiyaç anında yüklenir. Paket sonunda profil rota JS artışı mevcut ölçüme göre en fazla yaklaşık 15 kB hedeflenir; bu mevcut ölçülmüş sonuç değil, önerilen bütçedir. CLS hedefi ≤0,1; ilk sürüm otomatik video/ses yüklemez.

## 10. Başarı ölçütleri ve ilk başlanacak iş

Ürün analitiği şu anda tamamlanmış olmadığından sayısal kullanıcı etkisi iddiası yok. İleride kişisel içerik toplamadan profil ziyaretinden takibe dönüşüm, vitrin tıklaması, düzenleme tamamlama ve imza keşfinden listeye ekleme izlenebilir. İlk sürüm için ölçülebilir kabul: düzenlenen görünüm kalıcı, etkileşim doğru, hata durumu toparlanabilir, istatistik güvenilir ve masaüstü yerleşim taşmasız.

Önerilen ilk uygulama: P0 doğruluk düzeltmeleri + P1 üst alan/preset tasarımı. Sonraki paket P2–P3 vitrin ve canlı editör; ardından P4 doğrudan etkileşim. Ana akış/Keşfet server-first işi mevcut genel yol haritasında korunur; profil çalışması kendi aşaması olarak yürür.
