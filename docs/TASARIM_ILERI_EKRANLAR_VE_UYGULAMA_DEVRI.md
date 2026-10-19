# ListeKutusu — ileri ekranlar, uygulama devri ve ilerleme tahmini

Tarih: 17 Ekim 2026
Durum: **Tasarım v4 + yedinci uygulama devri. Güncel kodlama kanıtı bölüm 17'de; yayın kabulü değildir.**

Önceki paketler: [denetim](TASARIM_BUTUNLUGU_VE_AKIS_DENETIMI_2026-10-17.md), [kabuk/akış](TASARIM_FAZ_0_1_KABUK_VE_AKIS_PAKETI.md), [durum/etkileşim](TASARIM_DURUM_VE_ETKILESIM_PAKETI.md).

**Okuma notu:** Bölüm 1–10 kod yazılmadan hazırlanan tasarım aşamasını ve o andaki %0 uygulama durumunu korur. Sonraki “Devam edelim” talimatıyla kodlama başladı; ilk dilim bölüm 11, güncel uygulama bölüm 17'dir. Önceki örnek gözlemleri geriye dönük gerçek ürün kanıtına çevrilmez.

## 1. Sonuç ve kapsam

Ana harita ve günlük ekranlardan sonra kişisel alan, özel görev, operasyon ve oyun ailesinin ilk ayrıntı tasarımı hazırlandı. Ortak sözleşme aynı: bağlam → tek başlık → durum → ana içerik → göreve uygun işlem → geri dönüş. Profil karakterli, yönetim yoğun, oyun sahne odaklı olabilir; aynı dekorasyonu her ekrana zorlamak bütünlük değildir.

Sol menü çalışma yönüdür. Önceki karşılaştırmadaki seçim bu yönde ilerlemeyi destekler; nihai görsel/ürün onayı veya kodlama izni diye yorumlanmaz. Bu turda uygulama kodu/CSS/veri/API değiştirilmez. Yerel sunucu, hesaplar ve üretim ayarları korunur. Mobil/açık tema/bağımsız forum askıda.

Konuşmadaki örnek; sentetik profil, başvuru, bildirim, kuyruk ve oyun verisiyle çalışır. Ekran seçicisi tasarım inceleme aracıdır; uygulamaya eklenecek yeni bir ana menü değildir. Gerçek başvuru, moderasyon, kayıt, giriş, bağlantı kopyalama veya maç yürütülmez. Form metinleri yalnız açık bellektedir; URL, kalıcı tarayıcı deposu veya konuşma durumuna taşınmaz.

## 2. Profil ve gerçekçi önizleme

### Yerleşim

1. Kimlik/hero: ad, kısa tanıtım, kontrollü banner, ilişki veya düzenleme eylemi.
2. Vitrin/katkı/hakkında içerik haritası; kesin sekme sayısı uygulama öncesi sonlandırılır.
3. Açıkça seçilmiş müzik ve medya vitrini; modül sırası görsel ve DOM sırasıyla aynı.
4. Sahibin düzenleyicisinde kimlik, görünürlük ve modül düzeni. Tek kayıt otoritesi.
5. Aynı modelden ziyaretçi önizlemesi; kaydedilmemiş görünüm açıkça belirtilir.

### Durumlar ve sınırlar

| Hal | Görünüm / ana eylem | Sınır |
| --- | --- | --- |
| Dolu sahip | Profili düzenle; kendi görünürlük tercihleri | Özel bilgi ayar alanındadır, açık vitrine taşınmaz |
| Ziyaretçi / önizleme | Açık kimlik, seçilmiş vitrin, uygun ilişki eylemi | Gizli üniversite için dolaylı “gizli” ipucu bile gösterilmez |
| Bilinçli boş | Sahibe isteğe bağlı düzenleme; ziyaretçiye sakin boşluk | Zorunlu tamamlanma yüzdesi ve bilgi açmaya zorlama yok |
| Okuma hatası | Yeniden dene | Kullanıcı paylaşım yapmamış sanılmaz |
| Etkileşimi kısıtlı | Nedene uygun sınırlı görünüm | Takip/oyun gibi yetkisiz işlemler önerilmez |
| Kayıt hatası | Alan/ağ hatası; taslak ve önizleme korunur | Yeni değişiklik kaydedildi diye temizlenmez |

- Dizi/film/kitap okuma/izleme durumları, özel koleksiyon toplamları ve ajanda ziyaretçi modeline hiç aktarılmaz.
- Müzik listesi görünürlüğü medyanın özel kayıt/açık vitrin modeliyle aynı ilan edilmez.
- Üniversite kullanıcı beyanıdır; doğrulanmış aidiyet rozeti önerilmez.
- Öne çıkanın sabit/otomatik seçilmesi gerçek sunum modeliyle eşleşmeli; editör başka seçki uydurmamalı.
- Topluluk katkılarının profile birleştirilmesi ayrı veri/sunum işidir. Örnek bunu hazır özellik gibi saymaz.

**Kabul:** aynı örnek modelde modül sırası iki görünümde aynı; gizli üniversite önizleme DOM'unda yok; kaydetmeden önizleme gerçek profile yazmaz. Bu örnek, gerçek profil API'siyle eşleşmeyi kanıtlamaz.

## 3. Özel başvuru ve hedef değişimi

Ana sıra: topluluk → başvuru türü → varsa ilgili karar/tarih → açıklama → gönderim özeti → özel takip.

- İnsan-okur hedef adı ve kısa karar özeti; teknik ID ikincil referanstır.
- Alıcı sınırı: başvuran ve yetkili platform ekibi. Yerel topluluğa otomatik açıklanmaz.
- Başvuru, kaynak yaptırımın kalkması veya yanıt süresi garantisi değildir.
- Topluluk, başvuru türü veya karar değişiminde kirli açıklama varsa onay gerekir.

```text
Eski hedef + açıklama
  → yeni hedef isteği
  → Mevcut hedefte kal | Hedefi değiştir ve taslağı temizle
      kal    → eski seçim + metin
      onayla → doğrulanabilir yeni hedef + boş açıklama
  → hedef/tür/alıcı özeti
  → açık gönderim
```

Yeni hedef doğrulanamazsa eski hedef ve taslak korunur. Temizlenen şey yalnız gönderilmemiş metindir; geçmiş başvurular silinmez. Hata metni korur; sonuç belirsizse önce mevcut başvuru kontrol edilir. Otomatik ikinci gönderim yok.

**Kabul:** iptal eski hedef ve açıklamayı birlikte korur; onay yeni hedefle eski hassas metni birleştirmez. Gönderim özeti hassas açıklamayı global toast'a taşımaz. Hedef arama/zengin karar seçimi yeni uygulama işidir.

## 4. Bildirim ailesi

- Kısa panel ve gerekirse gelecekte tam geçmiş; tam sayfa ilk uygulamanın önkoşulu değil.
- Her satır: kaynak/kişi, olay, zaman, okunma durumu ve doğru içerik hedefi.
- Sosyal / Topluluk / Etkinlik / Sistem etiketleri anlaşılabilir sınıflardır; her sınıf için hazır aç/kapat tercihi olduğu anlamına gelmez.
- Mevcut takip/beğeni/liste tercihleri ile etkinlik değişiklik bildirimlerinin davranışı açıklanır; push/e-posta eklenmiş gibi sunulmaz.
- Tümü/Okunmamış seçimi ortak klavye/pressed semantiğine sahip olmalı.
- Okundu isteği hata verirse satır sessizce başarıya geçmez; panel kapanıp hatayı kaybettirmez.
- Canlı yenileme okunan listeyi kaldırmaz, scroll'u ve odaklanan satırı bozmaz.

| Hal | Bilgi / eylem |
| --- | --- |
| Dolu | Kaynak ve okunma durumu; doğru hedefe geçiş |
| Gerçek boş | Henüz bildirim yok; keşfe/göreve devam |
| Okunmamış boş | Okunmamış bildirim yok; tümünü göster |
| Okuma hatası | Yeniden dene; varsa önceki listeyi koru |
| Oturum bitti | Giriş; özel listeyi sırf önce yüklendi diye göstermeye devam etme |
| Hedef kaldırıldı | Açıklama ve ilgili alana dönüş; ağ hatası diye retry döngüsü yok |

**Kabul:** okundu hatası ile içerik yönlendirme sonucu ayrılır; etkinlik bağlantısı doğru event hedefine gider. Tercih/kategori/veri kaynağı ayrımı tasarımda açık kalır.

## 5. Yönetim ve moderasyon

Kamusal sosyal kabuğun operasyon varyantı: kapsam/rol üstte, filtreli kuyruk ana alanda, kanıt ve karar bağlamlı yan panel veya odaklı detayda. Büyük vitrin/banner ve sosyal başarı dekorasyonu yok.

### Yetki ile hata ayrımı

| Durum | Gösterilecek | Gösterilmeyecek |
| --- | --- | --- |
| 401 / oturum yok | Yetkili giriş yolu | Kesin servis arızası |
| 403 / yetki yok | Açık yetki sınırı ve güvenli çıkış | Önceki özel kuyruk satırları |
| Ağ / 5xx | Yüklenemedi + yeniden dene | Yeniden giriş yapman gerekiyor varsayımı |
| Yüklendi, boş | Bu filtrede kayıt yok | Genel servis sağlıklı veya tüm sistemde sıfır kayıt iddiası |

- Yerel topluluk sahibi/moderatörü, platform moderatörü, admin ve operatör kapsamları karıştırılmaz.
- Yerel yönetim özel platform başvurusunu otomatik okuyamaz.
- Her gösterge nesne + kapsam + zaman/güncellik taşır. Sayfalanan 20 kayıttan toplam kullanıcı sayısı çıkarılmaz.
- Bilinmeyen gösterge “— / yüklenemedi”; 0 değil. Spotify bağlantısı son senkron sağlığı değildir.
- Karar öncesinde hedef, gerekçe ve etki görülür. Bildirimi kapatmak, içeriği kaldırmak ve kişiyi uzaklaştırmak ayrı eylemdir.
- Aynı kararın başarısı yetki kaldırma veya kaynak yaptırımının değişmesi gibi farklı sonuçla karıştırılmaz.

**Kabul:** hata/yetkisizlik halleri farklı yüzeyler; yetki kaybında özel içerik görünmez; gösterge etiketi örnek/sayfa kapsamını açık söyler; karar kesin fiille onaylanır. Örnekte hiçbir moderasyon mutasyonu çalışmaz.

## 6. Oyun lobi, sahne ve sonuç

Sıra: bağlam → durum/görünürlük → oyuncu/rol → ana sahne → birincil kontroller → ikincil günlük.

| Hal | Baskın bilgi | Ana işlem |
| --- | --- | --- |
| Lobi | Dolu/boş koltuk, Sen/sahip, oda görünürlüğü, hareketsizlikte kapanma | Mevcut role göre davet bağlantısı veya katılım |
| İşlem sende | Sabit sahne, yasal seçim, doğrulanmış durum | Tavlada zar/hamle; düelloda eşdeğer iki oy |
| Bekliyorsun | Kimin sırası/kimlerin oyu bekleniyor | Gereksiz tekrar işlem yok |
| İzliyorsun | Açık seyirci etiketi | Oyun mutasyonu yok; yeni seyirci izni önerilmez |
| Yeniden bağlanıyor | Son doğrulanan sahne ve güvenilir eşitleme sınırı | Yeni hamle/oy kilidi |
| Sonuç | Kazanan/oda favorisi, kısa özet, son sahne | Yeni oyun; merkez/paylaşım ikincil |
| Terk edilmiş | Kapanma nedeni | Yeni oda; otomatik kazanan uydurulmaz |

- Aynı oda URL'si ve sahne geometrisi korunur. Sunucu otoritesi, revision ve seçim gizliliği tasarım için değiştirilmez.
- Listelenmeyen oda bağlantıya sahip uygun kişilere açıktır; hedef kişiye kilitli davet değildir.
- Davet kopyalamak gönderildi/alındı/okundu demek değildir. Profildeki opponent bağlamı yetki üretmez.
- Hareketsizlikte kapanma kuralı doğru açıklanmalı; oda oluşturulduğu andan başlayan uydurma geri sayım çizilmez. Tavlada çalışır bir tur sayacı varmış gibi çizilmez; mevcut sınırsızlık/süre sözleşmesi korunmalı.
- Gezinmeden ayrılmak ile maçtan çekilmek ayrı komutlardır; yeni düello kapatma/oyuncu çıkarma işlemi eklenmez.
- Sonuç son sahneyi örtemez. Tam maç tekrarı değil, mevcut son durum/günlük incelenir.
- Video engelli/oynatılamıyor halinde metinsel parça kimliği ve uygun alternatif; oy vermek videoya mecbur değil.

**Kabul:** reconnect sırasında sahne sabit ve mutasyon kapalı; bekleme ve seyirci eylemi farklı; sonuçtan son sahne incelenir; video/süre/rol bilgisi sahte özellik vaat etmez. Konuşma örneği motor veya çoklu kullanıcı testi değildir.

## 7. Tek uygulama devri

Aşağıdaki sıra, tasarım aşamasında hazırlanan bağımlılık planıdır. İlk uygulama bölüm 11'de, güncel uygulama/kalan kabul bölüm 12'de izlenir. Bir kart çizildi diye davranış kapandı sayılmaz.

| Paket | Kapsam / denetim ilişkisi | Bağımlılık | Bitiş kanıtı |
| --- | --- | --- | --- |
| U-01 | Ortak kabuk, tek navigasyon, header/scroll, modal portal; T-01/02/09/12 | Kabuk yönünün son gözden geçirmesi | Bölümler arası başlık görünür; modalda global menü etkileşimsiz; tek h1 |
| U-02 | Ortak durum/alan hatası/işlem sonucu, toast tonu; T-05/11/12 | U-01 bileşen çerçevesi | Boş/hata/oturum ayrılır; bilinmeyen sayı sıfır gösterilmez |
| U-03 | Global taslak, güvenli giriş dönüşü, doğru hedefli başvuru; T-03/06 | U-01/02 | Tüm çıkışlar korunur; hata metni korur; aynı hedefe dönülür |
| U-04 | Ana akış/Keşfet/kart/yorum; T-04/09/10 | U-01/02/03 | İlk içerik görünür; arama kapsamı doğru; geri filtre/scroll'u korur |
| U-05 | Topluluk/inceleme/etkinlik/ajanda ve yerel yönetim | U-01…04 | Giriş/üyelik/RSVP ayrılır; kapasite ve ayrılma etkisi açık |
| U-06 | Dört kitaplık türü, medya araçları, Suggest; T-05/10/11 | U-01…03 | Ana işler yer değiştirmez; katalog/koleksiyon ve vitrin ayrılır |
| U-07 | Profil/gerçek önizleme/hesap/gizlilik/bildirim | U-01…03, U-06 | Özel veri ziyaretçide yok; gerçek seçim/sıralama eşleşir; okundu hatası görünür |
| U-08 | Oyun kurulum/lobi/bağlantı/sonuç; T-05/07/08 | U-01…03 | Kesintide güvenli kontrol; doğru davet dili; son sahne açık |
| U-09 | Yönetim/başvuru kuyruğu, legacy forum koruması, legal/hata | U-01…03; U-05 rol bağlamı | Yetki/ağ ayrılır; KPI kapsamı doğru; mevcut forum içerikleri korunur |
| U-10 | Bütünleşik koyu masaüstü kabul ve performans | U-01…09 | Seçilmiş kritik yolculuklar, roller, uzun veri, klavye ve reduced-motion |

U-03, U-07/08/09 için ortak güvenlik davranışının temelini kurar; bütün özel formların o pakette bitmesi gerekmez. U-09'un legal içerik doğruluğu geç bir renk rötuşu değildir; sorumlu içerik/hukuk incelemesi paralel hazırlanır ve yayın öncesi onay ister.

### Dar doğrulama ilkesi

- Küçük pakette ilgili koyu masaüstü rota ve odaklı test; bütün repo matrisi tekrarlanmaz.
- İlgili 4–6 uygulama adımı sonunda toplu lint/typecheck/görsel kontrol; büyük aşamada build.
- 1280/1440/1728 masaüstü; anonim/oturumlu/rol, boş/hata, uzun veri, geri/ileri ve değişen izinler seçilerek doğrulanır.
- Bilinçli değişiklik dışında görsel baseline yenilenmez. Mobil/açık tema matrisi kendiliğinden açılmaz.
- Servis/motor/izin değişikliği yalnız görünüm işi gibi gösterilmez; ayrıca test ve kapsamı belirlenir.

### Son tasarım kararları — koddan önce

1. Sol menünün nihai ölçüsü/yoğunluğu ve Keşfet'in yönlendirme kapsamı.
2. Ana kart ve koleksiyonun uzun/dolu veri örnekleri; filtre ve sağ rayın dar masaüstündeki önceliği.
3. Profil için gerçek veriyle önizleme kabulü; hangi bildirim tercihlerinin gerçekten kullanıcı kontrolünde olduğu.
4. Moderasyon/başvuru/hesap kapanışında sorumlu içerik metinleri ve alıcı sınırlarının son kontrolü.
5. İlk uygulama paketinin açıkça başlatılması; bu belge otomatik kodlama izni değildir.

## 8. Yaklaşık ilerleme — tanım ve hesap

Bu oran görev sayacı, otomatik ölçüm veya yayın yüzdesi değildir. 17 Ekim 2026 itibarıyla **tasarımdan uygulamaya hazırlık için kapsam ağırlıklı çalışma tahmini**. Yaklaşık ±5 puan belirsizlik vardır; yeni kapsam veya kullanıcı geri bildirimi oranı değiştirebilir.

Olgunluk: 0 çıktı yok; 0,25 sorun/kapsam; 0,50 ana taslak; 0,75 kritik durum/rol/geri dönüş; 1,00 gözden geçirilmiş çıktı + mevcut/önerilen ayrımı + devir/kabul ölçütleri. Gerçek ürün kabulü ayrıca izlenir.

| İş paketi | Ağırlık | Tahmini olgunluk | Katkı |
| --- | ---: | ---: | ---: |
| Bilgi mimarisi, kavramlar, rota/kapsam | 10 | 1,00 | 10,00 |
| Ortak kabuk/navigasyon/geri/odak | 15 | 0,75 | 11,25 |
| Ortak bileşen/durum/modal/taslak | 15 | 1,00 | 15,00 |
| Akış/Keşfet/topluluk/etkinlik | 20 | 0,75 | 15,00 |
| Kitaplık/müzik araçları/öneri | 10 | 0,75 | 7,50 |
| Profil/editör/hesap/gizlilik | 10 | 0,75 | 7,50 |
| Oyun kurulum/lobi/sahne/sonuç | 10 | 0,75 | 7,50 |
| Bildirim/yönetim/özel başvuru | 5 | 0,75 | 3,75 |
| Tek devir/bağımlılık/kabul listesi | 5 | 1,00 | 5,00 |
| Toplam | 100 | | 82,50 |

**Beşlik dilime yuvarlanmış tasarım hazırlığı: yaklaşık %85.** Önceki v3 tahmini 78,75/100, yaklaşık %80 idi. Bu tur ortak bileşenlerin uzun içerik, rol değişimi, açılım, modal ve sayfalama kabulü netleştiği için yalnız bu alan 0,75'ten 1,00'e çıkarıldı. Bu değer tasarım çıktısının devre hazır olduğunu anlatır; uygulandığını veya kullanıcı tarafından onaylandığını değil. Diğer alanlar yeni bir örnek çizildi diye tamamlanmış sayılmadı.

Kalan yaklaşık %15–20: nihai kabuk/yoğunluk tercihi, gerçek profil ve yetkili akışlarla eşleşme, ailelere özgü görsel ayrıntılar ve bütünleşik kullanıcı kabulü. Her pikselin veya her durumun bitmiş olduğu iddia edilmez.

### Birbirine karıştırılmayacak göstergeler

- Tasarım hazırlığı: **yaklaşık %85** (82,50/100; yaklaşık ±5 puan, bu rubrik).
- Yeni tasarımın gerçek uygulamaya aktarımı: **%0** (bu aşamada kod başlamadı).
- Önceki topluluk/inceleme/etkinlik yerel işlevsel kapsamı: **yaklaşık %95**, mevcut ROADMAP tahmini; tüm uygulamanın veya yayın hazırlığının oranı değil. Bu turda değişmedi.
- Yayın durumu: **yayın onayı yok; yedi manuel kapı açık**. Host/TLS/sırlar, süreç/dış alarm, off-host yedek, staging/RPO-RTO, ticari sağlayıcılar, veri/moderasyon sorumluluğu ve yayın onayı tasarım puanıyla kapanmaz. Kanıtı olmayan tek bir genel yayın yüzdesi üretilmez.

## 9. Doğrulama ve devir durumu

- Dar örnek kontrolünde profil modül sırası ve gizli üniversitenin önizlemeden çıkarılması; başvuru hedefinde iptal/metin koruma ve onaylı temizleme; okundu hatasında okunmamış durum; 403'te özel kuyruğun kaldırılması; reconnect oy kilidi ve sonuçtan son sahneyi inceleme tarayıcıda görüldü.
- Son sahne örneği 1024 px konuşma önizlemesinde yatay taşmıyor ve tek görünür h1 içeriyor. Bu, ürünün tüm rota/rol/klavye veya mobil/açık tema testi değildir.
- Örnek betiğin sözdizimi ve servissiz/kalıcı metin deposuz yapısı kontrol edildi. Gerçek uygulama için build, geniş test veya yeni tarayıcı matrisi çalıştırılmadı.
- Sentetik örnekler gerçek hesap/servis/oyun veya moderasyon kabulü değildir.
- Kaynak denetiminin bulguları mevcut kalır; yalnız tasarımsal çözüm/devir önerileri genişletildi.
- Gerçek profil seçimi, tüm rol/erişim kombinasyonları, bildirim işçisi ve çoklu oyuncu eşitlemesi yeni tasarımla henüz sınanmadı.
- Nihai kullanıcı tasarım onayı ve uygulama başlatma ayrı; mobil/açık tema/bağımsız forum kapsamı değişmedi.

Sonraki önerilen iş: aşağıdaki kabul listesi üzerinden kabuk yönünü ve kodlamaya geçişi açıkça onaylamak; ardından U-01 + U-02 uygulamasını başlatmak. Yeni özellik veya yeni bir genel rapor bu devir için önkoşul değil.

## 10. Son tasarım kabul listesi — uzun içerik ve rol sınırları

Bu bölüm ilk tasarım taslağını tek devir noktasına bağlar. **Belgelenmiş**, **sentetik örnekte gözlenmiş** ve **gerçek üründe doğrulanmış** ayrı durumlardır. Önceki kaynak denetimindeki T-01…T-12 bulguları henüz uygulamada kapatılmadı.

### 25 rotanın kapsam kontrolü

| Aile | Rotalar | Tasarım dayanağı / kalan ürün kabulü |
| --- | --- | --- |
| Sosyal okuma (3) | `/`, `/discover`, `/p/[id]` | Kabuk, kart ve durum paketi; gerçek filtre/scroll/giriş dönüşü U-04'te |
| Kişisel alan ve müzik aracı (3) | `/u/[slug]`, `/account`, `/suggest` | Profil/hesap/gizlilik ve araç bağlamı belgeli; gerçek önizleme/ayar eşleşmesi U-06/07'de |
| Koleksiyon ve eski giriş (2) | `/library`, `/control` | Dört tür ayrımı belgeli; kitap listesi uzun veri örneği gözlendi; gerçek tür/durum/API U-06'da |
| Topluluk ve özel merkezler (5) | `/communities`, `/communities/[slug]`, `/community-events`, `/community-saved`, `/community-cases` | Üyelik/dağıtım/RSVP/özel başvuru ayrımı belgeli; gerçek kapasite ve rol kombinasyonları U-05/09'da |
| Oyun (5) | `/games`, `/games/backgammon/new`, `/games/backgammon/[id]`, `/games/elimination/new`, `/games/elimination/[id]` | Lobi/sahne/kesinti/sonuç örneği; gerçek motor ve eşitleme U-08'de |
| Korunan forum (3) | `/forum`, `/forum/new`, `/forum/[slug]` | Yeniden geliştirme askıda; mevcut içerik/adresler ve erişim U-09'da korunacak |
| Yetkili operasyon (3) | `/admin`, `/admin/community-cases`, `/admin/forum` | Yetki/ağ/KPI sınırları belgeli; gerçek 401/403 ve kuyruk kabulü U-09'da |
| Belge (1) | `/legal` | Okuma kabuğu belgeli; hukuki içerik/sorumlu onayı manuel kapı |
| Toplam | 25 rota | Bu tur 25 canlı ekranın yeniden görsel testi yapılmadı |

### Ortak yerleşim kararları

- Uzun başlık, görünen ad ve tek parça etiket metni işlem düğmelerini dışarı itemez. Başlık doğal satıra döner; avatar/kapak küçülmez, işlem grubu gerektiğinde ayrı satıra geçer.
- Tam başlık ayrıntıda da okunur. Yalnız hover ile görülebilen temel bilgi yok; metni kesmek yeni bir veri uzunluğu sınırı oluşturmaz.
- Uzun okuma içeriği yaklaşık 72 karakterlik satır ölçüsünde kalır; kartın bütünü daraltılmaz. Uzun adres/etiket taşmadan kırılır.
- Ayrıntı ve spoiler kullanıcı isterse açılır. Spoiler saklama erişim veya gizlilik mekanizması değildir. İçerik açılması ana eylemleri örtmez.
- Liste toplamı ile mevcut sayfa sayısı açık ayrılır. Örnekte 8 sentetik kayıt, sayfada 4 kayıt vardır; bu sayı ürün sayfa boyutu veya gerçek koleksiyon toplamı değildir.
- Sayfa değişiminde odak gövdeye düşmez: mevcut sayfalama düğmesi devre dışı kalırsa kullanılabilir komşusuna gider; sonuç kısa canlı durumla bildirilir. Gerçek üründe satır/odak korunması U-06/U-10 kabulüdür.
- Modal arka alanı etkileşimsiz bırakır; tam başlık okunur. Escape kapatınca başlangıç düğmesine dönülür. Bu örnek ürünün mevcut portal/stack sorununu düzeltmez.

### Rol ve hata kararları

| Durum | Kabul kuralı | Bu tur kanıtı |
| --- | --- | --- |
| Aktif üye | Uygun içerik oluşturma; üyelik RSVP anlamına gelmez | Sentetik ana durum |
| Üye olmayan | Açık okuma sürer; üyelik koşulu işlemden önce açık | Tasarım tanımı; gerçek giriş/üyelik entegrasyonu bekler |
| Yerel moderatör | Yalnız yerel yönetim alanı; platform başvuruları ayrı | Örnekte yönetim düğmesi görüldü |
| Moderatörlük kaldırıldı | Eski yönetim içeriği ve düğmesi DOM'dan kalkar; devam eden üyelik ayrı kalır | Örnekte yönetim düğümü sayısı 1 → 0 |
| Arşiv | Okuma sürer; yeni paylaşım/katılım komutu sunulmaz | Örnekte oluşturma düğmesi yok |
| Oturum bitti | Açık içerik okunur; işlem aynı hedefe dönen giriş ister | Örnekte açık okuma + giriş açıklaması |
| İçerik erişilemiyor | Kesin kaldırılma nedeni uydurulmaz; güvenli bağlama dönüş | Ayrı kaynak durumu gözlendi |
| Ağ/okuma hatası | İçerik yok veya yetki kalktı sonucu çıkarılmaz; yeniden dene | Ayrı hata durumu gözlendi |

Gerçek oturum/yetki kaybında daha önce yüklenmiş özel içerik de kaldırılmalıdır. Kamusal topluluk örneğinin okunabilir kalması özel yönetim verisinin tutulmasına izin vermez. Kitap/dizi/film durumları özel, açık vitrin seçimi ayrıdır; müzik listesinin mevcut görünürlük modeli aynı diye genellenmez.

### Dar gözlem kaydı

- 1280 px'te uzun topluluk/kullanıcı/içerik başlığı, açılmış tek parça etiket ve kitap listesinde yatay taşma gözlenmedi.
- 1440 px'te uzun inceleme, açılmış spoiler ve uzun kaynak metni; 1728 px'te aynı okuma yüzeyinin maksimum genişliği kontrol edildi. Bu, her örneğin her genişlikte çapraz testi değildir.
- 1024 px kitaplık ve 320 px konuşma sarmalında ölçülen içerik taşmadı. Dar konuşma sarmalı, mobil ürün geliştirmesi veya mobil kabulü değildir.
- Kitap ayrıntısı tam başlıkla açıldı; Escape sonrası odak ilgili Ayrıntı düğmesine döndü. İki liste sayfası ve uçtaki devre dışı düğmeler görüldü.
- Örnekte sayfalama odağını bozan yinelenen durum geri yüklemesi engellendi. Son kontrolde önceki/sonraki sonrası odak kullanılabilir düğmede kaldı; Return ile sayfa değişimi ve canlı sonuç bildirimi görüldü.
- Örnek betiği sözdizimi kontrolünden geçti; ağ isteği, gerçek kayıt ve form metni deposu yok. Uygulama sunucusu/DB/kod değiştirilmedi; geniş test/build çalıştırılmadı.

### Devir kararı

**İlk kapsamlı tasarım/akış taslağı devredilebilir.** Yeni kapsam açılmayacak. Sol menü ve rahat yoğunluk çalışma varsayımıdır; kesin ölçüler U-01'de mevcut tasarım tokenlarına bağlanacak. Son kullanıcı tasarım onayı henüz yoktur.

Uygulamaya geçiş açıkça istenirse ilk paket U-01 (tek kabuk, içerik başlangıcı, modal/odak), ardından U-02 (ortak durum ve hata dili). Gerçek profil önizlemesi, tüm özel roller ve bütünleşik görsel kabul ilgili uygulama paketlerinde kanıtlanacak; tasarım örneği bunların yerine geçmez. Kullanıcının mevcut **bu aşamada kod yazma** sınırı yeni bir kodlama talimatı gelene kadar korunur.

## 11. İlk uygulama — U-01/U-02 temeli, 17 Ekim 2026

Kodlamaya geçiş sorusuna kullanıcının “Devam edelim” yanıtıyla uygulama başladı. Tasarımın tamamının veya her pikselinin onaylandığı varsayılmaz.

| Paket | Uygulanan | Açık kabul |
| --- | --- | --- |
| U-01 ~%75 | Root tek sol menü; eski üst/ana akış menüsü tekrarının kaldırılması; yerel başlık akışı/sarma; ortak portal, inert, scroll ve klavye/geri odak | 25 rotanın dolu/rol/uzun içerik bütünleşik kabulü; kişisel alan ve sahneye özgü ölçüler |
| U-02 ~%25 | Ortak ContentState; kitaplık giriş/servis/hata/boş/yükleme; akış hatası; bilinmeyen kitaplık sayısı; açık Toast tonu | Diğer kişisel/topluluk/operasyon yüzeylerine yayılım; tüm legacy toast çağrılarının açık tonlara geçişi |
| U-03 başlangıç koruması | Yeni menü hesap taslağını onaysız bırakmaz; kayıt sürerken geçiş yok | Bütün formlar, geri/ileri, kayıt sonrası hedef, genel giriş dönüşü ve rol kaybı; henüz tamamlanmış paket sayılmaz |
| U-04…U-10 | Başlatılmadı | Planlanan bağımlılık/kabul devam eder |

### Doğrulama kanıtı ve sınırı

- `desktop-shell.spec.ts`: üç seçilmiş masaüstü genişliğinde tek görünür ana menü, doğru aktif bölüm, gezinme sonrası görünür başlık ve yatay taşma; kitaplık 401/503/500/200 ayrımı; mevcut demo profil takipçi penceresi body katmanı, üstte hit-test, arka alan inert, Escape ve geri odak.
- `social-shell.spec.ts`: Ana akış/Keşfet/Topluluklar/Oyunlar ve tarayıcı geri dönüşünde aynı root menü düğümü korunur. Forum artık ana menü öğesi değildir; mevcut erişimi Topluluklar'dan sürer.
- `library-hub.spec.ts`: dört kitaplık bölümü, müzik liste adı/gruplama ve geri dönüş; kayıt HTTP mutasyonu mock'tur.
- `profile-editor.spec.ts`: taslak iptal/geri alma, kayıt hatasında metin, pending kilidi; ortak menüde iptal ve onaylı hedef, kayıt sırasında geçiş kilidi; modal Tab/Escape, inert ve body scroll temizliği. Gerçek kullanıcı profili yazılmaz.
- Son paket **8 browser senaryosu geçti**. Ardından yalnız demo modalinin reduced-motion/animasyon sonu ekran kanıtı bir kez yenilendi ve geçti. `UI_DEMO_PROFILE=1` salt okunur mevcut yerel demo fixture'ı ister; yoksa otomatik seed yapılmaz. Bağlantı listesi mock'tur.
- Navigasyon kapsamı birim testi, TypeScript, değişen dosyalarda ESLint, UI ve erişilebilirlik statik kapıları geçti. Geniş build/test, mobil/açık tema, tüm oyun/rol veya yayın kabulü yapılmadı. Ekran kanıtları test çıktısıdır; baseline güncellenmedi.

### İnisiyatifler ve sonraki sınır

Ana akışın aylık özeti ve rozet erişimi silinmedi, sağ bağlam alanına taşındı. Profilin kendi h1'i korunur; marka h1'i yalnız ana akışta görev adıyla değiştirildi. Yeni menüde özel merkez adları görünür olabilir; bu, giriş veya özel veriyi okuma izni vermez. Mevcut API/DB/üyelik/RSVP/oyun kuralları değişmedi.

Yeni menü hesap sayfasında yeni bir taslak kaybı çıkışı oluşturacağı için yalnız o çıkışa dar koruma eklendi. Bu, U-03'ün üç seçenekli tüm kayıt/çıkış sözleşmesinin bittiği anlamına gelmez. Sıradaki çalışma U-03 genel güvenli gezinme ve U-02 durum yayılımı; ardından U-04 içerik/kart düzenidir.

**İlk dilim tahmini:** tasarım hazırlığı yaklaşık %85 (önceki rubrik değişmedi); yeni tasarım uygulaması yaklaşık %10. İkincisi 10 devir paketini kaba eşit kabul edip U-01'i 0,75, U-02'yi 0,25, kalanını 0 sayan çalışma tahminidir; süre/işlev/yayın sayacı değildir. Yedi manuel yayın kapısı bu paketle kapanmaz.

## 12. İkinci uygulama — kişisel merkezler ve ortak taslak otoritesi

### Uygulanan

- Root `DraftNavigationProvider` birden fazla kayıtlı form için tek onay verir. Hesap, sohbet/inceleme, etkinlik oluşturma/düzenleme, başvuru ve platform yanıtı yalnız dirty/busy bilgisi kaydeder. İç linkler, yeni sekme/indirme ve sayfa içi fragment ayrılır; dış belge çıkışı beforeunload kapsamındadır. Taslak metni, parola, konum veya katalog token'ı kaydedilmez. İptal tüm mevcut taslakları korur; devam seçilen iç hedefe gider; pending işlem geçişi durdurur.
- Topluluk kayıtları, kişisel ajanda ve kendi/yetkili platform başvuruları ortak ContentState/CommunityReadFeedback kullanır. Giriş gereksinimi yalnız 401'den çıkarılır; 403, 404, ağ ve 5xx ayrı kalır. 503 nötr kullanılamıyor durumudur. Giriş `next` parametresi kişisel filtreleri ve başvuru topluluğunu taşır; giriş yapmak işlemi kendiliğinden göndermez.
- `communityFetch` JSON olmayan hata halinde bile HTTP kodunu korur, ham yanıt markup'ını hata metnine koymaz. Geçersiz başarı yanıtı boş liste sayılmaz. `useCommunityRead` veri, hata ve HTTP kodunu URL/yenileme nesline bağlar. Başvuru kuyruğunda hedef/filtre değişiminde eski özel kayıtlar görünmez; gerçek 403/401 sonrası eski kuyruk tutulmaz.
- Başvuruda **topluluk hedefi** değişirken açıklama/itiraz seçimi varsa onay gerekir. Yeni hedef salt okunur sorguyla doğrulanmadan eski hedef/metin temizlenmez. Hata veya bulunamayan hedefte eski bağlam korunur; onaylı/doğrulanan geçiş yeni hedefe eski metni katmaz. Yazma hatası yeni taslağı korur, yinelenen başvuru açıklamayı ezmez.
- Modal tüm kontrolleri pasifken odağı body'ye düşse de üst pencerenin Escape/busy sınırı çalışır; işlem bitince kullanılabilir kontrol odaklanır. Pasif fieldset kontrolleri odak çevrimine alınmaz. Birincil link butonunun metin rengi genel topluluk link renginden korunur. Güvenli giriş dönüşü literal ters eğik çizgi ve kontrol karakterlerini reddeder.

### Kanıt

- 13 birim kontrolü: HTTP hata/JSON/ağ ayrımı, no-store/AbortSignal/method, istek nesline bağlı status, iç link/yeni sekme/indirme ve güvenli giriş dönüşü. DB veya gerçek sağlayıcı kullanmaz.
- Son 7 dar browser senaryosu: üç kişisel merkezde 401/500/gerçek boş; geciken özel kuyrukta eski kaydın gizlenmesi ve 403/401; topluluk hedefi iptal/hata/bulunamayan hedef/onay ve yazma hatasında metin; iki bağımsız taslakta tek onay ve iptal; mevcut hesap düzenleyici kayıt/pending/odak regresyonu. Bütün kayıt mutasyonları mock'tur.
- Ajanda giriş kartında dar Axe WCAG 2 A/AA kontrolü ve görüntü incelemesi yapıldı. TypeScript, değişen kaynaklarda ESLint, UI/a11y statik kapıları geçti. beforeunload dinleyicisi sentetik olayla sınandı; gerçek native diyalog ve tüm geçmiş matrisi sınanmadı.
- Kenar kontrolünde pasif düğmeler sonrası Escape ve link butonu kontrastı sorunu görüldü, düzeltildi ve ilgili paket yeniden sınandı. Bu önceki tüm kaynak bulgularının kapandığı anlamına gelmez.

### Açık kalanlar

1. Aynı belge geri/ileri; yerel sekme/filtre/programatik düğmeler ve bütün formlar için ortak çıkış sözleşmesi. Özellikle kuyruk filtresinde yazılan platform yanıtı ve başvuru türü/tekil rapor hedefi değişimi ayrıca ele alınacak.
2. Profilde kaydet-ve-devam-et, kayıt hatasında bekleyen hedefi koruma; giriş sırasında taslak devamlılığı. Şu an giriş URL'si hedefi/filtreyi korur, sayfa dışına otomatik taslak aktarmaz.
3. Kalan kamusal topluluk/Keşfet/bildirim/yönetim/oyun durumlarının ortak dile geçişi; U-04 günlük kart/akış düzeni ve sonraki aileler.
4. Performans/build, bütünleşik koyu masaüstü kabul ve yedi manuel yayın kapısı. Mobil/açık tema/bağımsız forum özel geliştirmesi açılmadı; DB, seed, baseline ve sunucu süreci değiştirilmedi.

**Güncel yaklaşık uygulama hesabı:** 10 eşit devir paketinde U-01 0,75 + U-02 0,50 + U-03 0,50; diğerleri 0 → 17,5/100, beşlik dilime yuvarlak **%20**. Süre veya tamamlanmış ürün yüzdesi değildir. Tasarım hazırlığı **~%85** kalır; uygulandı diye tasarım onayı veya yayın onayı üretilmez.

## 13. Üçüncü uygulama — profil kaydı sonrası devam ve yerel çıkışlar

- Ortak onayda tek desteklenen dirty profil için kaydet-ve-devam-et var.
  401/ağ hatası metni ve hedefi korur; açık tekrar kayıt başarılı olursa aynı
  hedefe gider. Pending Escape/çıkış/tekrar kaydı kilitler. Metin depolanmaz;
  kayıt/geri alma callback'leri yalnız mevcut form belleğinde çalışır.
- Hesap yerel bölüm ve ana akış düğmeleri ortak korumayı kullanır. Listeyle
  birleşik profil kaydı desteklenmez. Yeni paylaşım/etkinlik/başvuru/karar
  kaydet-ve-devam-et ile yayımlanmaz.
- Yetkili kuyruk filtre/sayfa/yenilemesi yanıt taslağı varsa onay ister.
  İptal eski filtreyi/metni korur; onay eski özel kuyruğu yeni sorguya taşımaz.
- 8 odaklı koyu masaüstü browser senaryosu, TypeScript, kaynak ESLint ve
  UI/a11y statik kapıları geçti. HTTP mutasyonları mock'tur. DB/seed/baseline/
  sunucu süreci değiştirilmedi; geniş build/matris yapılmadı.
- Açık: başvuru türü/tekil rapor hedefi, aynı belge geri/ileri, giriş boyunca
  güvenli taslak devamı; tüm formlar ve kalan U-02/U-04…U-10 kabulü.
- Tasarım hazırlığı ~%85. Yeni tasarım uygulaması yaklaşık ~%20: U-01 0,75 +
  U-02 0,50 + U-03 0,65 = 19/100, beşliğe yuvarlak. Bu yayın/tüm ürün oranı
  değildir. Mobil/açık tema/forum özel geliştirmesi hâlâ askıdadır.

## 14. Dördüncü uygulama — doğru başvuru konusu ve Keşfet durumları

- Tür/itiraz edilen rapor değişimi metin veya rapor seçimi varsa onay ister.
  Yeni konu güncel salt okunur bağlamda doğrulanır. Kaldırılmış rapor/itiraz
  hakkı veya hata eski metin/seçimi korur; başarılı geçiş açıklamayı temizler.
  Gerçek yazma sunucunun güncel yetki/iş kurallarına tabidir. Başarılı yeni
  kayıt tür/rapor/metni temizler; hata/duplicate metni ve seçimi korur.
- Keşfet ortak yükleme/giriş/yetki/503/hata durumuna geçti. Arama kullanıcı/
  liste kapsamındayken de hata görünür; hata ve boş sonuç birlikte çizilmez.
  Bilinmeyen sayaçlar sıfır değildir. Geçersiz başarı yanıtı boş sayılmaz;
  iptal edilen isteğin geç sonucu yükleme/veriyi ezmez.
- 10 odaklı koyu masaüstü browser senaryosu, Keşfet boş kartında dar Axe ve
  yatay taşma, TypeScript, değişen kaynaklarda ESLint, UI/a11y kapıları geçti.
  Mutasyonlar mock; gerçek kullanıcı/DB/seed/baseline/sunucu değişmedi.
  Tam görsel kabul, build ve mobil/açık tema matrisi çalıştırılmadı.
- Açık U-03: aynı belge geri/ileri ve giriş boyunca kimliğe bağlı güvenli
  taslak devamı; mevcut History API patch etmeme/kalıcı metin depolamama sınırı
  korunur. Tüm form çıkışları tamamlanmadı. Kalan U-02 bildirim/yönetim/oyun;
  sıradaki ana yüzey paketi U-04 akış/kart/yorumdur.
- Tahmin: tasarım hazırlığı ~%85, yeni tasarım uygulaması ~%20
  (U-01 0,75 + U-02 0,60 + U-03 0,70 = 20,5/100; beşliğe yuvarlak).
  Bu tüm ürün/yayın oranı değildir; yedi manuel yayın kapısı açık kalır.

## 15. Beşinci uygulama — bildirim durumları ve ilk kart etkileşim dilimi

- Bildirimler ortak durum kartları kullanır; bilinmeyen sayaç — olur.
  401/403 okuma/geçmiş/yazma yanıtı eski öğe, sayaç ve tercih yüzeyini kapatır.
  503 nötr kullanılamıyor; geçersiz başarı boş değildir. Geçmişte ağ/5xx
  ilk sayfayı silmez. Giriş dönüşü mevcut yol/sorguyu korur.
- `useNotifications` okumayı panelden ayırır. Yazma eski okumayı iptal eder;
  geç poll okundu/tercih sonucunu ezmez. Tercih hatası rollback yapar, okundu
  hatası sayacı düşürmez. Başlamış PATCH client gezinmede sürebilir; unmount
  olmuş paneli güncellemez. API iş/yetki kuralı değişmez, yeni kalıcı depo yok.
- U-04 başlangıcı: müzik kartı menüsünde odak/ok tuşları/Home/End, Escape
  ile geri odak ve Tab ile kapanma; not aç/kapa semantik ilişkileri.
  Karma kart görsel hiyerarşisi, bütün yorum ve filtre/scroll kabulü açık.
- Son 6 seçilmiş koyu masaüstü senaryosu, bildirim paneli/kartta dar Axe,
  TypeScript, kaynak ESLint ve UI/a11y statik kapıları geçti. Eski bildirim
  gruplaması korundu. Yazmalar mock; gerçek kullanıcı/DB/seed/baseline/sunucu
  değiştirilmedi. Geniş build, tam görsel kabul ve mobil/açık tema yok.
- Sonraki: U-04 karma kart/içerik aksiyonları/yorum. U-02 yönetim/oyun,
  U-03 aynı belge geri/ileri ve giriş boyunca güvenli taslak devamı açık.
- Tasarım hazırlığı ~%85; yeni tasarım uygulaması ~%25
  (U-01 0,75 + U-02 0,70 + U-03 0,70 + U-04 0,15 = 23/100; beşliğe yuvarlak).
  Tüm ürün/yayın tamamlanma oranı değildir; yedi manuel yayın kapısı açık.

## 16. Altıncı uygulama — karma kartlar ve yorum güvenliği

- Müzik/sohbet/inceleme/etkinlik aynı kabuk, kimlik-tarih, tür etiketi ve
  başlık bandında. Topluluk kaynağı ve TVmaze atfı korunur; spoiler metni
  önizlemede yoktur. Etkinlik tarih/mekân/kapasite/iptali ayırır; otomatik
  katılım/üyelik yoktur. Detay ve etkileşim hedefleri ayrıdır.
- Yorum okuması ortak yükleme/HTTP/boş durumuna geçti; bilinmeyen sayı —.
  Eski okuma iptal edilir. Yazma hatası metni korur ve formda görünür.
  Yanıt hedefi geçişi/vazgeçme metin varsa onaylı; iptal hedef/metni korur.
  Ortak iç-link/beforeunload koruması ve pending kilidi var. Kaldırma onayı
  bağlı yanıtları açıklar; kaldırılmış hedefin taslağı kök yoruma taşınmaz.
  Sunucu yetkileri değişmedi.
- 3 browser + 2 mantık testi; kartta dar Axe/taşma/görüntü incelemesi,
  TypeScript, ESLint, UI/a11y geçti. Yorum okuması mevcut public paylaşımı
  salt okunur açtı; API yanıtı mock. Gerçek kullanıcı/DB/seed/baseline/sunucu
  değişmedi. Oturumlu yorum gönderme/silme/hedef değişiminin tam browser
  kabulü yapılmadı; geçiş/silme hesabı birim testlidir.
- Sonraki: U-04 filtre/detay/geri dönüş ve oturumlu yorum kabulü. U-02
  yönetim/oyun, U-03 geçmiş/girişte taslak devamı, geniş build/görsel kabul,
  mobil/açık tema ve yedi manuel yayın kapısı açık kalır.
- Hazırlık ~%85; uygulama ~%25 (U-01 0,75 + U-02 0,70 + U-03 0,70 +
  U-04 0,40 = 25,5/100; beşliğe yuvarlak). Tüm ürün/yayın oranı değildir.

## 17. Yedinci uygulama — filtre URL'si ve müzik detayından dönüş

- Akış kapsam/tür/müzik konusu URL'den birlikte okunur, yenilemede korunur;
  uyuşmayan gizli filtre temizlenir. URL hazır olmadan ilk varsayılan istek
  atılmaz. Hesap değişimi veriyi tazeler; private post cache'i eklenmez.
- Müzik başlık/tarih/yorum linki, detay geri bağlantısı ve normal karttan
  sonra browser back normalize kaynak karta döner. Yüklenen listede bulunan
  kart görünür/odaklıdır. Dönüş yalnız root filtreleri ve geçerli kart işareti;
  dış adres/başka rota/ek token reddedilir. Next entry metadatası korunur;
  History API patch edilmez, U-03 geçmiş taslak koruması bitmiş sayılmaz.
- Ana akış/detay/yorum girişi aynı bağlamı taşır, taslak/otomatik işlem değil.
- 5 koyu masaüstü browser + 3 saf test, TypeScript, ESLint, UI/a11y geçti.
  Public paylaşım yalnız okundu; istemci API yanıtı mock. DB/seed/baseline/
  sunucu değişmedi; geniş build ve bütün görsel/rol kabulü çalıştırılmadı.
- Açık: kart yüklenen listede yoksa derin sayfalı konum (otomatik sınırsız
  çekim yok), topluluk/etkinlik detayından dönüş ve oturumlu yorum kabulü.
  U-03 geçmiş/girişte taslak, U-02 yönetim/oyun ve manuel yayın kapıları açık.
- Hazırlık ~%85; uygulama ~%30 (U-01 0,75 + U-02 0,70 + U-03 0,70 +
  U-04 0,60 = 27,5/100; beşliğe yuvarlak). Tüm ürün/yayın oranı değildir.
