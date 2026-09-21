# ListeKutusu - Güncel Uçtan Uca Analiz ve Geliştirme Yol Haritası

**İncelenen proje:** `C:\Users\barto\Documents\Codex\2026-07-02\bu\playlist-app`  
**Analiz tarihi:** 18 Temmuz 2026  
**Teknoloji:** Next.js 15.5, React 18.3, TypeScript, Prisma 5, SQLite, Tailwind CSS, Lucide React  
**Kapsam:** Kod, çalışan uygulama, girişli/girişsiz akışlar, 390 / 768 / 1024 / 1280 / 1728 px görünümler, API, veri modeli, build, test, güvenlik ve ürün mimarisi

---

## Güncel ürün önceliği

Bu rapordaki güvenlik bulguları geçerlidir; ancak aktif geliştirme sırası ürün sahibinin güncel kararına göre aşağıdaki şekilde düzenlenmiştir:

1. Merkezi açık/koyu tema, renk, tipografi, buton, kart ve form sistemi.
2. Tam ekran sosyal ürün kabuğu; sol hizalı masaüstü navigasyonu ve tutarlı mobil dock.
3. Ana akış, profil, keşfet ve forumun kullanıcıyı uygulamada tutacak sade ve akıcı deneyime taşınması.
4. Bütün sayfaların ortak üst yapı, boşluk, loading, boş durum, hata ve responsive davranışına geçirilmesi.
5. Performans, erişilebilirlik, görsel regresyon ve son kalite kontrolü.
6. Yayın öncesi son kapı olarak anahtar yenileme, Spotify token şifreleme ve production güvenlik sertleştirmesi.

Bu sıra güvenlik çalışmalarını iptal etmez. Anahtar ve şifreleme işleri canlı yayından önce zorunludur; fakat tasarım sisteminin kurulmasını ve kullanıcı deneyiminin olgunlaştırılmasını bölmeyecek şekilde en sona planlanmıştır.

## 18 Temmuz tasarım sistemi uygulama durumu

| İş paketi | Durum | Uygulanan kapsam | Sonraki eşik |
|---|---|---|---|
| Semantik açık/koyu tema | Tamamlandı | Renk, yüzey, metin, durum, kenarlık, gölge ve odak tokenları merkezi hale getirildi. Açık tema düşük parlaklıklı gri-mavi yüzeylerle yeniden kuruldu. | Yeni bileşenlerde ham renk eklenmemesi |
| Tam ekran uygulama kabuğu | Tamamlandı | Ortak üst yapı, sol hizalı masaüstü navigasyonu, mobil dock ve geniş ekran çerçevesi birleştirildi. | Yeni sayfaların aynı kabuğu kullanması |
| Ortak UI primitive'leri | Tamamlandı | `Button`, `Card`, `TextField`, `TextAreaField`, `SelectField`, `Checkbox` ve `HorizontalScroller` eklendi; giriş, tema, onay, hata, bildirim tercihleri, yönetim seçimi, paylaşım bestecisi ve forum yüzeylerinde kullanılmaya başlandı. | Eski sayfaların parça parça bu bileşenlere taşınması |
| Mobil dokunma ve yatay akış | Tamamlandı (temel akışlar) | Ana akış sekmeleri, forum kategorileri, keşfet aksiyonları ve hesap formu 44 px hedef ve scroll-snap davranışına geçirildi. | Nadir admin ve ayar alt ekranlarının aynı denetimden geçirilmesi |
| Açık tema görsel kalite geçişi | Tamamlandı | Saf beyaz büyük yüzeyler kaldırıldı; kart, form ve üst alan katmanları göz yormayan bir kontrasta getirildi. | Gerçek kullanıcı testiyle ince kontrast ayarı |
| Büyük CSS ve client component ayrıştırması | Devam ediyor | `globals.css` 6.707 satırdan 1.341 satıra indirildi; stil sırası korunarak dört sorumluluk dosyasına ayrıldı. Ana akış 1.049'dan 475, hesap sayfası 1.006'dan 571 ve admin sayfası 968'den 545 satıra indirildi. Dört özellik/uyumluluk CSS katmanında ham renk bütçesi sıfırlandı. | `globals.css` özel efektlerini azaltmak ve kalan büyük sayfaları route/feature düzeyinde ayırmak |
| Görsel regresyon ve Axe otomasyonu | Tamamlandı (genişletilmiş matris) | Dokuz kritik rota açık/koyu tema ve 1728/1280/1024/768/390 px Edge üzerinde taranıyor. 90 Axe/responsive senaryosu; hesap girişi, oturumlu/uzun hesap paneli, hukuk, dolu profil ve dolu akış/forum/keşif/yönetim yüzeylerinde 54 kalıcı görsel baseline var. Hesap onayı, istemci yönlendirmesi, sosyal başarı/rollback ve forum filtre/sayfalama davranışları doğrulanıyor. | Gerçek kullanıcı testinden çıkan yeni kritik durumları aynı matrise eklemek |
| Production güvenlik sertleştirmesi | Son kapı | Temel oturum/rol korumaları mevcut. | Anahtar yenileme, Spotify token şifreleme, e-posta doğrulama ve parola sıfırlama |

### 19 Temmuz ilerleme notu

- Admin sayfası 968 satırdan 545 satıra indirildi. Giriş, genel durum, dönem raporu, şikâyet moderasyonu, kullanıcı listeleri ve öneri kuyruğu bağımsız feature bileşenlerine ayrıldı.
- Admin aksiyonları ortak `Button` primitive'ine geçirildi; filtre sekmelerinin klavye yönlendirmesi panel içine alındı.
- Açık tema ikinci kontrast geçişinden geçti: kartlar beyaz yüzeylere, sayfa katmanı sakin gri-mavi/yeşil arka plana, sınırlar ve gölgeler daha belirgin tokenlara taşındı.
- Admin açık tema için giriş, özet, rapor, form ve audit yüzeylerinin tamamına semantik renk eşlemesi eklendi.
- TSX dosyalarında 12 px altı metin kullanımı sıfırlandı. Admin CSS'indeki küçük metadata sayısı azaltıldı.
- `npm run ui:check` eklendi ve `deploy:check` zincirine bağlandı. Kontrol; satır bütçesi, CSS parse, UTF-8 bozulması, ham bileşen rengi, tema tokenı ve küçük metin regresyonunu denetliyor.
- 390 ve 1440 px tarayıcı kontrollerinde yatay taşma görülmedi. Mobil admin girişinde form ilk görünüme taşındı; ana işlem artık tanıtım metninin altında kaybolmuyor.
- Hesap sayfası 931 satırdan 571 satıra indirildi. Kimlik doğrulama, oturum/güvenlik ve liste/profil işlemleri üç ayrı hook'a; veri, gizlilik ve güvenlik görünümü ortak form primitive'lerine taşındı.
- Uygulamadaki 102 adet 9-11 px CSS metni 12 px erişilebilirlik tabanına yükseltildi. Statik denetimde TSX ve CSS küçük metin bütçesi artık `0/0`.
- Hesap, ana akış, keşif ve forum 390 px açık/koyu tema kontrollerinden yatay taşma veya buton metni kırpılması olmadan geçti.
- Ana akış sayfası 872 satırdan 475 satıra indirildi. Besteci araması/paylaşımı ile beğeni, kaydetme, takip, listeye ekleme, gizleme, şikâyet, düzenleme ve silme işlemleri bağımsız hook'lara taşındı.
- Şarkı aramasına istek iptali eklendi; kullanıcı hızlı yazdığında eski ağ yanıtının daha yeni sonucu ezmesi engellendi.
- Eski CSS katmanlarındaki ham renk kullanımı beş geçişte 1.286'dan 72'ye indirildi. `feature-surfaces.css`, `forum.css`, `interaction-refinements.css` ve `unified-surfaces.css` bütçeleri sıfırlandı; kalan değerler ana kabuğun özel efektlerinde. Kalite bütçesi yeni ham renk eklenmesini engelliyor.
- Altı seviyeli semantik yüzey tint ölçeği eklendi. Ham renk bütçesi dosya bazında `ui:check` ile kilitlendi; yeni geliştirmeler artık bu teknik borcu yeniden büyütemiyor.
- `npm run a11y:check` eklendi ve yayın kontrol zincirine bağlandı. 135 yerel butonun türü, 2 görselin alternatif metni, 11 yeni sekme bağlantısının güvenlik niteliği, odak kuralları, Türkçe dil ve skip link yapısı statik olarak doğrulanıyor.
- Ana akış, forum, keşfet, hesap, öneri, kontrol, hukuk ve yönetim rotaları 1280 ve 390 px'te açık/koyu tema ile yeniden tarandı. Sunucu hata ekranı, document seviyesinde yatay taşma veya kırpılan ana işlem görülmedi.
- `npm run contrast:check` eklendi. İki temada 20 kritik metin/yüzey çifti WCAG oranıyla ölçülüyor; açık tema yardımcı metni 4.04:1, ana buton metni 5.59:1 ve ikincil metin en az 5.12:1 oranını koruyor.
- Ortak form primitive'i seçim alanı ve etiket sayacı/meta desteği kazandı. Yeni forum konusu ve ana akış paylaşım formundaki altı kontrol ortak hata, ipucu, odak ve erişilebilirlik sözleşmesine taşındı.
- Playwright + Axe kalite matrisi gerçek Edge üzerinde devreye alındı. Testler iki tema ve iki viewport'ta 36/36 geçti; erişilebilir ismi eksik mobil bağlantılar ile yanlış ARIA kullanılan yükleme durumları test sırasında düzeltilip kalıcı korumaya alındı.
- Hesap girişi, oturumlu/uzun hesap paneli ve hukuk sayfalarının açık/koyu, geniş ekran/masaüstü/küçük dizüstü/tablet/mobil görünümleri; dolu ana akış, forum, keşfet ve yönetim ekranlarının geniş ekran/mobil uçları için toplam elli görsel baseline üretildi ve doğrulandı.
- Dolu veri baseline'larında ana akış 10 paylaşım, forum 20 konu, keşfet 18 parça/10 küratör ve yönetim moderasyon-liste-audit verisiyle sınanıyor. Keşfin rastgele beşli kaynağı testte sabitlendi.
- Mobil yönetim özetindeki yatay taşan dört metrik, iki sütunlu ve tamamı görünen 2×2 düzene geçirildi.
- Normal checkbox ve switch varyantlarını birleştiren ortak `Checkbox` primitive'i eklendi. “Beni hatırla”, bildirim tercihleri ve yönetim toplu seçimi 44 px hedef, ortak odak ve disabled sözleşmesine taşındı.
- UI kalite kapısı 1-11 px metnin tamamını ve tanımsız semantik token referanslarını reddedecek şekilde güçlendirildi. Forumda kalan 8 px sayaç metni 12 px tabana yükseltildi.

Tasarım sistemi altyapısı ileri seviyededir; ancak bu, bütün sayfaların son görsel işçiliğinin tamamlandığı anlamına gelmez. Statik UI/erişilebilirlik/kontrast kapıları, beş viewport'lu Axe/responsive tarama, 54 kalıcı görsel baseline ve ortak primitive katmanı tamamlandı. `globals.css` ham renk bütçesi 72'ye indirildi; hesap istekleri ortak buton primitive'ine taşındı; hesap, akış, forum, keşif, profil ve yönetimin uzun/dolu veri durumları ile sosyal mutasyonların başarı/rollback yolları matrise eklendi. Kalan iş, gerçek kullanıcı testinden çıkacak ince görsel ve mikro etkileşim ayarlarıdır.

Bu tablo mevcut ilerlemeyi gösterir; eski analiz bölümlerindeki tespitler tarihsel başlangıç fotoğrafıdır. Çözülen maddeler yukarıdaki durum tablosuna göre değerlendirilmelidir.

## Doğrulama özeti

Bu rapor önceki ZIP raporunun kopyası değildir. Güncel çalışma klasörü yeniden çalıştırılmış ve aşağıdaki kontroller yapılmıştır:

- `npm run typecheck`: başarılı
- `npm run lint`: başarılı
- `npm run test:unit`: 43/43 başarılı
- `npm run test:smoke`: 34/34 başarılı
- `npm run test:browser`: 181 başarılı, yalnız geniş/mobil uçlara ayrılmış 39 senaryo diğer viewport'larda bilinçli olarak atlandı
- `npm run ui:check`, `npm run a11y:check`, `npm run contrast:check`: başarılı
- `npm run test:e2e`: tüm hesap, oturum, sosyal akış, liste, forum ve veri silme senaryoları başarılı
- `npm run build`: 30,6 saniyede başarılı
- `npm audit --omit=dev`: 0 bilinen açık
- `npm run db:check`: veri bütünlüğü başarılı
- Tarayıcı konsolu: denetlenen sayfalarda error/warning yok
- 390 px, 1024 px ve 1440 px görünümlerde document seviyesinde yatay taşma yok
- Geçici test hesabı ile kayıt, hesap paneli, liste, profil, önerme, kontrol ve forum ekranları incelenmiş; hesap daha sonra temizlenmiştir

Build boyutları makul durumdadır:

- Ortak ilk yük JavaScript'i: yaklaşık 102 kB
- Ana sayfa: yaklaşık 128 kB first load
- Hesap sayfası: yaklaşık 130 kB first load
- Diğer temel sayfalar: yaklaşık 114-120 kB first load

Bu nedenle projenin mevcut ana sorunu "çalışmıyor" veya "build olmuyor" değildir. Esas sorunlar; tasarım sistemi dağınıklığı, responsive geçiş kararlarının olgunlaşmaması, büyük client component'ler, bazı ölçeklenebilirlik sınırları ve production güvenlik/operasyon eksikleridir.

---

# 1. Projenin genel değerlendirmesi

## Amaç

ListeKutusu, kullanıcıların şarkı keşiflerini topluluk akışında paylaştığı, diğer kullanıcıları takip ettiği, şarkıları kendi tekil listesine eklediği, forumda müzik konularını tartıştığı ve isteğe bağlı olarak listesini Spotify ile senkronladığı sosyal müzik kurasyon ürünüdür. Uygulama müzik stream etmez; Spotify'ı arama, dış bağlantı ve playlist senkronu için kullanır.

## Hedef kullanıcı

- Yeni müzik keşfetmek isteyen dinleyiciler
- Kendi müzik seçimini paylaşmak isteyen küratörler
- Müzik, enstrüman, kayıt ve ekipman konularında tartışmak isteyen kullanıcılar
- Arkadaşının liste koduna kontrollü şarkı önerisi göndermek isteyen gruplar
- Puan, başarım ve sıralama motivasyonuna cevap veren topluluk üyeleri

## Temel özellikler

- Sosyal şarkı akışı: yeni, yükselen, takip, sana özel ve kaydedilen filtreleri
- Paylaşım beğenme, kaydetme, gizleme, raporlama ve listeye ekleme
- Profil, takip, engelleme ve sosyal bağlantı yönetimi
- Keşfet merkezi ve rastgele beşli keşif
- Aylık parça ve kullanıcı sıralamaları
- Tek kullanıcı / tek liste modeli
- Davet koduyla listeye şarkı önerme
- Toplu Spotify track URL/URI aktarımı
- Spotify playlist oluşturma ve senkronlama
- Forum kategori, konu, yanıt ve kabul edilen çözüm sistemi
- Bildirim tercihleri, günlük hedefler ve başarımlar
- Oturum yönetimi, veri dışa aktarma ve hesap silme
- Forum moderasyonu, şikayet yönetimi, audit log ve rol yönetimi

## Güçlü yönler

1. **Farklı ürün çekirdeği:** Sosyal akış, tekil liste, kontrollü öneri ve forumun aynı üründe birleşmesi ayırt edici.
2. **Gerçek ürün kapsamı:** Oturum iptali, hesap silme, export, block, bildirim tercihi, moderasyon ve audit gibi prototiplerde genellikle eksik kalan alanlar mevcut.
3. **Tutarlı ana kimlik:** Koyu lacivert, cyan ve zümrüt vurgular müzik/topluluk ürününe uyuyor.
4. **Sağlam test tabanı:** Kritik mutasyonlar ve tüm temel kullanıcı akışları E2E ile doğrulanıyor.
5. **Güvenli varsayımlar:** HttpOnly cookie, session token hash'i, SameSite, güvenlik başlıkları, Prisma parametreleme, rate limit ve rol kontrolü mevcut.

## En önemli eksikler

1. E-posta doğrulama ve parola sıfırlama yok.
2. Paylaşılmış eski ZIP içindeki sırlar yenilenmediyse operasyonel risk devam ediyor.
3. Spotify access/refresh tokenları veritabanında uygulama seviyesinde şifrelenmiyor (`prisma/schema.prisma:14-15`).
4. Genel yönetim paneli halen tek yerel anahtara dayanıyor (`lib/adminAuth.ts`).
5. Eski özellik ve uyumluluk stilleri semantik tokenlara taşındı; `globals.css` içindeki özel marka/atmosfer rengi 72'ye indirildi ve kalite kapısında kilitlendi.
6. `app/account/page.tsx` ve `app/admin/page.tsx` sırasıyla 571 ve 545 satır; önceki yapıya göre belirgin küçüldüler fakat kalan alt bölümlerin route/feature ayrımı sürecek.
7. Görsel baseline kimlik doğrulama, oturumlu/uzun hesap paneli, hukuk ve dolu akış/forum/keşif/yönetim yüzeylerini kapsıyor. Sosyal etkileşimlerin başarı/rollback sonuçları davranış testiyle korunuyor; ayrı mutasyon kareleri yalnız görsel bir ihtiyaç doğarsa eklenecek.
8. Liderlik ve özel akış algoritmaları veri büyüdükçe uygulama belleğinde lineer maliyet üretecek.

## Profesyonel ürüne yakınlık

- Yerel / kapalı beta hazırlığı: **%94**
- Tasarım sistemi olgunluğu: **%95**
- Halka açık production hazırlığı: **%65**
- Büyük ölçeğe hazırlık: **%55**

İlk izlenim modern ve güvenilir. Giriş, yönetim, kontrol ve forum ekranları aynı ürüne ait görünüyor. Buna karşın düşük veri miktarında ana sayfanın büyük bir bölümü boş kalıyor; çok sayıda benzer koyu panel ve ince çerçeve, hiyerarşiyi yer yer zayıflatıyor.

## Benzer ürünlere göre konum

**Güçlü:** Spotify'ı kopyalamayan topluluk kurasyonu, tek liste modeli, kontrollü arkadaş önerisi, forum ve sosyal akışın birleşmesi.  
**Zayıf:** Kullanıcı geri kazanımı, e-posta güveni, yüksek kaliteli seed içerik, admin operasyon altyapısı ve ölçeklenebilir toplulaştırma eksik.

## Kullanıcı kaybına yol açabilecek başlıca noktalar

- Parolayı unutan kullanıcının geri dönüş yolu yok.
- Yeni ziyaretçi az içerik görürse ürünün sosyal değerini düşük algılayabilir.
- "Paylaş", "Listeme ekle", "Listeye öner" ve "Liste kontrolü" farkı ilk kullanımda tam açık değil.
- Mobilde kesilen yatay alanlar bazı özelliklerin fark edilmemesine yol açıyor.
- Forum konusunun moderasyon sonucunu izleyen bir "Konularım" ekranı yok.
- Spotify senkronu hata verdiğinde teknik detay kullanıcının zihinsel yükünü artırabilir.

---

# 2. Kullanıcı deneyimi analizi

| Problem | Sayfa / bileşen | Kullanıcıya etkisi | Seviye | Önerilen çözüm | UX katkısı |
|---|---|---|---|---|---|
| Temel kavramlar ilk kullanımda birbirine yakın | `HomeSidebar`, `MobileDock`, `/suggest`, `/control` | Yanlış akışa girme | Yüksek | GettingStarted içinde "Paylaş / listene ekle / koda öner" üç adımlı mini açıklama | İlk göreve ulaşma süresi kısalır |
| Parola kurtarma yok | `AccountAuthPanel`, accounts API | Hesap tamamen kaybedilebilir | Kritik | Tek kullanımlık, süreli reset tokeni ve mail akışı | Kullanıcı kaybı azalır |
| E-posta doğrulama yok | Kayıt akışı | Yanlış/sahte e-posta ve kurtarma sorunu | Yüksek | Verification tokeni, yeniden gönder ve doğrulanmamış durum politikası | Hesap güveni artar |
| Feed tab'leri 390 px'te kesiliyor | `.feed-tabs`, `.feed-tab` (`globals.css:404-436`) | Son filtreler gözden kaçıyor | Yüksek | Sağa fade, kısmi sıradaki tab veya "Diğer" bottom sheet | Keşfedilebilirlik artar |
| Hesap bölümleri mobilde 452 px; görünen alan 343 px | `/account`, hesap bölüm nav'i | Gizlilik/veri sekmeleri fark edilmeyebilir | Yüksek | Mobilde tek satır selector veya "Bölümler" drawer; aktif bölüme otomatik scroll | Hesap yönetimi kolaylaşır |
| 1024 px'te topbar ve tam genişlik dock aynı anda görünüyor | `MobileDock`, ana app shell | Tablet/küçük laptopta gereksiz tekrar | Yüksek | Dock'u `lg` ve altına sınırla veya 768-1199 için kompakt sol rail | Daha profesyonel responsive geçiş |
| Çok sayıda 32-40 px kontrol | Feed tabs, filtreler, legal nav, kart aksiyonları | Dokunma hatası ve erişilebilirlik sorunu | Yüksek | Görsel boyut değişmeden hit area minimum 44x44 | Tek elle kullanım iyileşir |
| Toast tonu metinden tahmin ediliyor | `app/components/Toast.tsx` | Yanlış renk/ikon gösterebilir; Türkçe metne bağımlı | Orta | `tone` zorunlu prop veya standart `AppError.code` map'i | Geri bildirim güvenilir olur |
| Toast üst alanı kapatabilir | `.toast-stack` | Mobil navigasyon geçici gizlenir | Orta | Topbar yüksekliği tokeni; mobilde dock ustu/bottom toast veya safe offset | Navigasyon görünür kalır |
| Ana sayfa az veride boş kalıyor | `/`, `LeaderboardSidebar` | "Aktif topluluk yok" algısı | Orta/Yüksek | Kaliteli seed içerik, haftanın seçimi ve kompakt empty rail | İlk izlenim güçlenir |
| Forum pending sureci izlenemiyor | `/forum/new`, `/forum` | Konunun kaybolduğu düşünülebilir | Yüksek | Profil veya forumda "Konularım" ve durum/gerekçe | Belirsizlik azalır |
| Form API hataları genellikle toast'ta | Auth, ayarlar, forum | Hangi alanın düzeltilmesi gerektiği geç anlaşılır | Orta | Ortak `FieldError` ve alan bazlı hata sözleşmesi | Form tamamlama hızı artar |
| Checkbox ve switch kullanımları | Auth, bildirimler, yönetim kuyruğu | Çözüldü | Tamamlandı | Ortak `Checkbox` primitive ve 44 px hit area | Tutarlı görünüm ve klavye odağı sağlandı |
| Bazı dahili yönlendirmeler `window.location.href` kullanıyor | `app/page.tsx`, `account/page.tsx`, profil/forum | Tam sayfa reload ve state kaybı | Orta | OAuth hariç `router.push/replace/refresh` | Geçişler akıcı olur |
| Kaydırılabilir forum kategori şeridinde ipucu yok | `/forum` mobil | Sağda başka bölümler olduğu anlaşılmaz | Orta | Fade, scroll snap, kısmı kart | Kategori keşfi artar |
| Profil istatistik satıri mobilde kesiliyor | `ProfileClient.tsx` | "Listeye ekleme" metni okunmuyor | Orta | 2x3 grid veya belirgin horizontal scroller | Profil metrikleri anlaşılır |
| Liste önerme sayfasında aktif/bekleyen panellerin yüzeyi çok farklı | `/suggest` mobil | Disabled alan hata gibi algılanabilir | Orta | Aynı surface; disabled bölümde opaklık + kilit durumu | Adım akışı daha doğal olur |
| Silme/hesap kapatma korumaları güçlü; fakat bazı sosyal işlemlerde undo yok | Feed hide/block/remove | Yanlış aksiyondan dönüş zor | Orta | Uygun işlemlerde 5-8 sn undo toast | Hata toleransı artar |

## Olumlu UX uygulamaları

- Global skip link ve Türkçe `lang` mevcut (`app/layout.tsx`).
- `prefers-reduced-motion` ve `focus-visible` tabanı var (`app/globals.css`).
- ConfirmDialog Escape, odak ve modal semantiğini ele alıyor.
- Akış filtreleri `tablist/tab/aria-selected` kullanıyor.
- Profil araması klavye ok tuşları, Home/End ve Escape destekliyor.
- Kritik hesap silme işlemi parola + açık onay metni istiyor.
- Oturumlar listelenebiliyor ve diğer cihazlar kapatılabiliyor.
- Yeni forum konusu taslağı sekme içinde otomatik saklanıyor.
- Loading, error, 404 ve empty state ekranları mevcut.

---

# 3. Sayfa bazlı tasarım analizi

## 3.1 Ana akış - `/`

**Amaç:** Topluluk keşiflerini göstermek ve sosyal etkileşim sağlamak.  
**Temel işlem:** Şarkı paylaşmak, akış filtrelemek, beğenmek ve listeye eklemek.

**Güçlü yanlar**

- 1440 px'te sol navigasyon, merkez akış ve sağ rail dengeli.
- Girişsiz ve girişli CTA'lar duruma göre değişiyor.
- Kart aksiyonları ikon + metin + sayi ile anlaşılır.
- Onboarding, yeni hesap için doğrudan görevler sunuyor.
- Dikey akış, kullanıcıyı reels benzeri agresif bir modele zorlamıyor.

**Problemler**

- `app/page.tsx` 1.040 satır ve çok sayıda state/fetch/action barındırıyor.
- 390 px'te `Kaydedilen` sekmesi kesiliyor; yatay devam işareti yok.
- 1024 px'te üstte masaüstü aksiyonları, altta geniş mobil dock birlikte.
- Tek paylaşım bulunan veri setinde ekranın büyük kısmı boş kalıyor.
- Feed kartları müziksel kimliği kapak kullanmadan kuruyor; bu yasal stratejiyle uyumlu, ancak tipografi/etiket/küratör sinyali daha güçlü olmalı.
- Yenile butonu filtre şeridinde mobil genişliği azaltıyor.

**Önerilen yapı**

1. `useFeedQuery`, `useFeedMutations`, `useComposer` hook'ları.
2. Server-render shell + client feed island.
3. Mobilde ilk 3 filtre + "Diğer" bottom sheet veya fade'li snap scroller.
4. 768-1199 aralığında kompakt rail; tam genişlik dock kaldırılsın.
5. Sağ rail veri yoksa kompakt "Bu ay henüz sıralama yok" satırına donsun.

## 3.2 Keşfet - `/discover`

**Amaç:** Rastgele keşif, yükselen şarkı, etiket, profil ve liste bulmak.  
**Temel işlem:** Arama ve rastgele beşli keşif.

**Güçlü yanlar**

- 390 px'te yatay document taşması yok.
- Arama, sayfanın erken bölümünde.
- Rastgele 5 listesi hızlı ve listeye ekleme aksiyonu belirgin.
- İstatistikler ürünün canlılığını özetliyor.

**Problemler**

- Alt dock, viewport içindeki son liste satırlarının üzerinde; altta padding olduğu için erişilebilir ama algısal olarak kapatıyor.
- Veri azsa 2x2 istatistik grid'i gereksiz alan kaplıyor.
- Parça adları dar alanda fazla erken ellipsis oluyor.
- "Yeni 5" metni ilk kez gelen için bağlamsız.
- Kart, panel ve çizgi sayısı hiyerarşiyi zayıflatıyor.

**Öneri**

- `Yeni 5` -> `5 yeni parca getir`.
- Sıfır/düşük veride tek satır özet.
- Mobil son 96 px için hafif bottom fade; dock ile içerik ilişkisi netleşsin.
- Arama filtresini URL query'de koru.

## 3.3 Forum ana sayfa - `/forum`

**Amaç:** Müzik konularını bölüm ve alt forumlara ayırmak.  
**Temel işlem:** Konu bulmak, filtrelemek ve yeni konu açmak.

**Güçlü yanlar**

- Technopat benzeri kategori mantığı ürüne uyarlanmış.
- Search, sıralama ve durum filtresi sade.
- Konu kartları yazar, tarih, yanıt ve görüntülenme bilgisini taşıyor.
- Mobilde genel hiyerarşi temiz.

**Problemler**

- Kategori şeridi sağdan kesiliyor; devam ettiği yalnız kaydırarak anlaşılıyor.
- Metadata fontları yer yer 10-11 px.
- Düşük veri miktarında sayfa fazla boş.
- Filtrelerin URL state'i kısmen var; bütün state'in geri/ileri davranışı tutarlı olmalı.

**Önerilen yapı**

- Mobil kategori şeridine fade + snap.
- 44 px chip hit area.
- "Konularım" kısa yolu.
- Düşük veride sağ rail veya ek blok gösterme.

## 3.4 Yeni konu - `/forum/new`

**Amaç:** Moderasyona gidecek kaliteli konu oluşturmak.  
**Temel işlem:** Ana bölüm, alt forum, başlık ve açıklama girmek.

**Güçlü yanlar**

- Ana/alt kategori ayrımı anlaşılır.
- Başlık ve açıklama sayaçları var.
- Inline rehber metinleri mevcut.
- Taslak otomatik saklanıyor.
- Sayfadan ayrılma koruması var.

**Problemler**

- Mobil dock textarea'nin görünen alt kısmını kapatıyor; scroll ile erişılıyor ancak form odağında dikkat dağıtıyor.
- Klavye açıkken sticky CTA/dock çakışması otomatik test edilmiyor.
- Gönderim sonrası kullanıcıya kalıcı pending takip ekranı yok.

**Öneri**

- Form odağı/klavye açıkken dock gizlensin veya küçülsün.
- Başarılı gönderim -> `Konularim > Onay bekliyor`.
- Moderasyon sonucu ve gerekçesi bildirim olarak gitsin.

## 3.5 Konu detayı - `/forum/[slug]`

**Amaç:** Konuyu okumak, yanıtlamak ve çözüm işaretlemek.  
**Temel işlem:** Tartışmaya katılmak.

**Güçlü yanlar**

- Konu yazarı, kategori, zaman ve görüntülenme bilgisi temiz.
- Yanıt boş durumu açık.
- Girişsiz kullanıcı doğru `next` adresiyle girişe gidiyor.
- Kabul edilen yanıt ve kaldırma davranışı E2E ile testli.

**Problemler**

- GET isteğinde görüntülenme yazımı büyük trafikte write amplification yaratabilir.
- Uzun içerikte ortak prose sistemi sınırlı.
- Yanıt taslağı yeni konu kadar güçlü korunmuyor.

**Öneri**

- Görüntülenmeyi buffer/batch et.
- `prose-forum` tokenli tipografi.
- Yanıt autosave ve gönderim sırasında optimistic placeholder.

## 3.6 Hesap giriş/kayıt - `/account?mode=login|create`

**Amaç:** Tek hesapla sisteme girmek veya kaydolmak.  
**Temel işlem:** E-posta ve parola ile kimlik doğrulama.

**Güçlü yanlar**

- Masaüstünde fayda metni + form dengesi güçlü.
- Kayıt sonrası ana akışa yönlenme doğru.
- Parola görünürlüğü ve `Beni hatirla` var.
- Form etiketleri ve açıklama metinleri yeterli.

**Problemler**

- Parola sıfırlama ve e-posta doğrulama yok.
- Checkbox ve bildirim switch'i ortak görsel dile taşındı.
- Parola gücü yalnız uzunlukla anlatılıyor.
- API hata mesajı alan yerine genel toast'ta kalabiliyor.

**Önerilen yapı**

- `Sifremi unuttum` ve `E-postani dogrula` durumları.
- Ortak `FieldError` ve `PasswordMeter` yardımcıları.
- Kayıt formunda koşullar submit'ten önce canlı görünsün.

## 3.7 Hesap paneli - `/account`

**Amaç:** Gelen öneriler, liste, profil, güvenlik, gizlilik ve veri işlemleri.  
**Temel işlem:** Kişisel liste ve hesabı yönetmek.

**Güçlü yanlar**

- Masaüstünde sidebar hiyerarşisi net.
- Gelen öneri, liste ve karar sayaçları iyi özetlenmiş.
- Boş durumlar kullanıcıyı çıkarmaz sokağa bırakmıyor.
- Oturum, engel, export, parola ve silme alanları ayrılmış.
- Kaydedilmemiş liste/profil değişikliği koruması var.

**Problemler**

- `app/account/page.tsx` 1.006 satır ve 20'den fazla state taşıyor.
- `/api/accounts/me` tek istekte 500 öneriyi döndürebiliyor.
- Mobil hesap nav'i 343 px alanda 452 px; son bölümler kesiliyor.
- Tüm bölümler aynı route/client bundle içinde.
- Empty dashboard'da yüksek dikey alan kullanımı var.

**Önerilen yapı**

- `/account/requests`, `/account/list`, `/account/profile`, `/account/security`, `/account/privacy`, `/account/data`.
- Ortak server account shell.
- Öneriler için cursor pagination.
- Mobil section selector/drawer.
- Güvenlik ve gizlilik bileşenlerini lazy-load.

## 3.8 Listeye öner - `/suggest`

**Amaç:** Bir liste koduna birden fazla şarkı önermek.  
**Temel işlem:** Kod doğrula, şarkı seç, toplu gönder.

**Güçlü yanlar**

- Üç adımlı ilerleme açık.
- Giriş zorunluluğu ve `next` dönüşü doğru.
- Toplu seçim ve geçmiş görünümü mevcut.
- Davet kodu bağlamında hedef liste doğrulanıyor.

**Problemler**

- Disabled ikinci adım mobilde kırık/gri panel gibi görünüyor.
- Kod formatı dar ekranda iki satıra kırılıyor.
- `Listeye öner` ile genel akış paylaşımı farkı bu sayfada tek cümleyle daha net anlatılmalı.

**Öneri**

- Tek surface içinde adımlar; kilitli bölüme belirgin `Kodu dogruladiktan sonra açılır` durumu.
- Kod doğrulanınca hedef liste sahibini ve liste adini sabit bağlam satırında göster.
- Duplicate/pending parçayı arama sonucunda etiketle.

## 3.9 Liste kontrolü - `/control`

**Amaç:** Onaylı şarkıları tür/sanatçıya göre gruplamak, eklemek ve kaldırmak.  
**Temel işlem:** Listeyi düzenlemek.

**Güçlü yanlar**

- Girişsiz durum tek CTA ile net.
- Mobil kartlar düzgün alt alta geçiyor.
- Tür/sanatçı segmented control anlaşılır.
- `next/image` kullanılıyor; önceki native image bulgusu artık geçerli değil.

**Problemler**

- `app/control/page.tsx` 500 satır; gruplama, search ve mutation aynı component'te.
- Tür verisi Spotify artist metadata'sına bağımlı; veri yoksa çok sayıda "Tür belirtilmemiş" oluşabilir.
- Büyük listede tüm şarkılar client tarafında gruplanacak.
- Optimistic mutation/rollback standardı yok.

**Öneri**

- 200+ şarkıda virtualization.
- Normalized veya cache'lenmiş artist/genre metadata.
- `useControlList` ve `useTrackSearch`.
- Optimistic ekleme/kaldırma + hata durumunda rollback.

## 3.10 Profil - `/u/[slug]`

**Amaç:** Kullanıcı kimliği, istatistikleri ve keşiflerini göstermek.  
**Temel işlem:** Takip etmek, paylaşımları incelemek, gerekirse engellemek.

**Güçlü yanlar**

- Profil teması ve avatar kullanımı tutarlı.
- İstatistikler ve tab'ler ürünün sosyal değerini anlatıyor.
- Kendine ait profilde hesap paneli aksiyonu doğru.
- Engelleme iki yönlü etkileşimleri saklıyor.

**Problemler**

- `ProfileClient.tsx` yaklaşık 697 satır ve profil temeli client fetch ile geliyor.
- 390 px'te beş istatistik yatay kesiliyor.
- Empty profil ekranında ürün canlılığı düşük.

**Öneri**

- Profil shell'ini server render et; follow/block/modal client island olsun.
- İstatistikleri mobilde 2x3 grid.
- Profil temasını yalnız gradient değil accent, banner ve surface tokenlarıyla farklılaştır.

## 3.11 Yönetim - `/admin`

**Amaç:** Spotify, listeler, öneriler, şikayetler, kullanıcılar ve audit.  
**Temel işlem:** Sistem sahibinin topluluğu yönetmesi.

**Güçlü yanlar**

- Giriş ekranı profesyonel ve bağlamı açıklıyor.
- Rol atama, rapor, audit ve sayfalama mevcut.
- Yetkisiz API erişimleri testli.
- Kullanıcı e-posta ve rol bilgisi yalnız owner panelinde.

**Problemler**

- `app/admin/page.tsx` 1.100 satır ve birden çok domaini tek route'ta.
- Genel owner erişimi tek paylaşılan anahtar + cookie ile.
- Admin bireysel kimliği/MFA yok; forum moderatörde bireysel rol var.
- Bazı listeler 100-200 kayıt sınırında; tam server pagination her yerde yok.

**Önerilen yapı**

- `/admin/overview`, `/admin/users`, `/admin/lists`, `/admin/reports`, `/admin/activity`, `/admin/integrations`.
- Bireysel admin hesapları, MFA ve actor tabanlı audit.
- Filtreleri URL state'e taşı.

## 3.12 Forum moderasyonu - `/admin/forum`

**Amaç:** Bekleyen konuları incelemek, onaylamak, reddetmek veya kilitlemek.  
**Temel işlem:** Topluluk kalitesini korumak.

**Güçlü yanlar**

- Moderatör ve admin rol ayrımı çalışıyor.
- Owner olmayan moderatör genel admin ayarlarına giremiyor.
- Arama, durum ve hızlı kararlar mevcut.

**Problemler**

- Moderasyon gerekçesi kullanıcıya yapılandırılmış şekilde donmuyor.
- Toplu seçim/karar yok.
- 100 kayıtla sınırlı liste büyük kuyrukta yetersiz.

**Öneri**

- Zorunlu/opsiyonel karar gerekçesi şablonları.
- Batch selection.
- Split preview ve klavye sonraki/önceki.
- Kullanıcıya karar bildirimi ve itiraz yolu.

## 3.13 Yasal - `/legal`

**Amaç:** Ürün, Spotify, veri, hesap silme ve topluluk kurallarını açıklamak.  
**Temel işlem:** Kullanıcıya şeffaflık sağlamak.

**Güçlü yanlar**

- Dil sade ve ürünün stream yapmadığı açık.
- Spotify'nin üründeki sınırlı rolü belirtiliyor.
- Mobilde okunabilir beyaz belge yüzeyi var.

**Problemler**

- Son güncelleme tarihi, sürüm, iletişim ve veri saklama sureleri yok.
- Gizlilik, kullanım koşulları ve topluluk kuralları tek uzun belgede.
- Mobil yasal nav 1.393 px genişliğinde yatay akıyor; devam ipucu yok.

**Öneri**

- Üç belge: Gizlilik, Kullanım Koşulları, Topluluk Kuralları.
- Sürüm/tarih/iletişim/veri saklama tablosu.
- Hukuki uzman kontrolü.

## 3.14 Global loading, error, 404

**Güçlü yanlar:** Markaya uygun, kullanıcıyı ana akışa döndüren ve semantic status/alert kullanan ekranlar mevcut.  
**Eksik:** Hata olaylarına trace ID eklenmiyor; hata izleme servisi yok; 404 başlığı iki H1 gibi algılanabiliyor.  
**Öneri:** Kullanıcıya kısa kod, log'a trace ID; tek H1 hiyerarşisi; Sentry/OpenTelemetry benzeri monitoring.

---

# 4. Renk paleti ve görsel bütünlük

## Mevcut durum

- Koyu gece mavisi ana zemin ürüne uygun.
- Cyan ana aksiyon ve zümrüt ikinci vurgu olarak çalışıyor.
- Mor, profil temaları ve bazı gradient alanlarında ikincil rol oynuyor.
- Basari/hata renkleri semantik olarak ayrılıyor.
- Ancak `globals.css` içinde 75 benzersiz HEX ve 502 benzersiz RGB/RGBA değeri var.
- 122 box-shadow ve 29 blur kullanımıyla yüzey dili gereksiz çeşitleniyor.
- Açık kartlar (`/account` auth, `/suggest`, `/legal`) ile koyu ürün yüzeyleri bazen iki farklı ürün gibi hissediliyor.

## Önerilen semantic renk sistemi

| Token | HEX | Kullanım |
|---|---|---|
| `--bg-canvas` | `#06111F` | Ana sayfa zemini |
| `--bg-elevated` | `#0A1B2E` | Sidebar, topbar, dock |
| `--surface-1` | `#0D2238` | Birincil kart |
| `--surface-2` | `#122B45` | Hover/seçilmiş kart |
| `--surface-light` | `#EAF2F7` | Form/yasal açık yüzey |
| `--brand-primary` | `#22D3EE` | Ana CTA, aktif tab, focus |
| `--brand-primary-hover` | `#67E8F9` | Ana CTA hover |
| `--brand-secondary` | `#34D399` | Listeye ekleme, ilerleme |
| `--accent-violet` | `#8B5CF6` | Profil teması ve sınırlı vurgu |
| `--text-primary` | `#F8FAFC` | Koyu zeminde ana metin |
| `--text-secondary` | `#B8C7D9` | Açıklama/metadata |
| `--text-muted` | `#8294AA` | Düşük önemli metin; 12 px altı kullanma |
| `--text-dark` | `#0A1B2E` | Açık yüzey metni |
| `--border-subtle` | `#27445F` | Kart/ayırıcı |
| `--success` | `#22C55E` | Basari |
| `--warning` | `#FBBF24` | Uyarı/bekleme |
| `--danger` | `#F43F5E` | Silme/hata |
| `--info` | `#38BDF8` | Bilgi |
| `--disabled-bg` | `#24364B` | Disabled yüzey |
| `--disabled-text` | `#718096` | Disabled metin |

## Kurallar

1. Gradient yalnız primary CTA, profil banner ve tekil vurgu alanında.
2. Ana CTA cyan; listeye ekleme zümrüt; destructive pembe-kırmızı; ikincil komut outline.
3. Kartlar üç seviyeyi geçmemeli: canvas, surface-1, surface-2.
4. Shadow seti yalnız `sm`, `md`, `overlay`; gerisi kaldırılmalı.
5. Blur düşük donanımda kapatılabilecek tokenla sınırlanmalı.
6. Focus ring renk ile birlikte 2 px kontur/offset kullanmalı; yalnız renge dayanmamalı.

---

# 5. Tipografi analizi

## Mevcut durum

- Kalin şans-serif kimlik modern ve okunaklı.
- Başlık hiyerarşisi genel olarak güçlü.
- Çok sayıda `font-black`, uppercase ve geniş tracking, küçük ekranlarda görsel gurultu üretiyor.
- Metadata ve chip metinleri yer yer 10-11 px; uzun kullanımda okunabilirliği düşürüyor.
- Türkçe büyük harflerde tracking fazla mekanik görünebiliyor.

## Önerilen sistem

| Rol | Masaüstü | Mobil | Weight / line-height |
|---|---:|---:|---|
| Ürün/hero başlığı | 40 px | 32 px | 800 / 1.12 |
| Sayfa başlığı | 28 px | 22 px | 800 / 1.2 |
| Bölüm başlığı | 20 px | 18 px | 750 / 1.3 |
| Kart başlığı | 16 px | 15 px | 700 / 1.35 |
| Normal metin | 15 px | 15 px | 400-500 / 1.6 |
| Ikincil metin | 13 px | 13 px | 500 / 1.55 |
| Buton | 14 px | 14 px | 700 / 1 |
| Form etiketi | 13 px | 13 px | 650 / 1.4 |
| Kicker/eyebrow | 11 px | 11 px | 750 / 1.3; sınırlı uppercase |
| Metadata alt siniri | 12 px | 12 px | 500 / 1.45 |

Kurallar: `font-black` yalnız H1/H2 ve kritik sayılar; body'de en fazla 700. Letter-spacing yalnız kısa kicker'da. Uzun forum/yasal metinde 65-75 karakter satır genişliği.

---

# 6. Buton, kart, çerçeve ve bileşen analizi

## Mevcut problemler

- Bileşenler sınıflarla ortaklaştırılmış olsa da gerçek bir `components/ui` primitive katmanı yok.
- Aynı işlev için 9-18 px radius varyasyonları görülüyor.
- 32, 34, 36, 38, 40 ve 42 px yükseklikli çok sayıda interaktif kontrol var.
- Kart içinde kart ve arka arkaya çerçeve kullanımı bazı dashboard alanlarını ağırlaştırıyor.
- Toast, mesaj metnini analiz ederek tone seçiyor.
- ConfirmDialog iyi bir başlangıç; bağlantı, bildirim ve menü overlay'leri aynı primitive'i kullanmıyor.

## Önerilen primitive seti

- `Button`: primary, secondary, ghost, destructive; `sm=36`, `md=44`, `lg=48`
- `IconButton`: görünen ikon 16-20, hit area 44
- `Input`, `Textarea`, `Select`, `Checkbox`, `Field`, `FieldError`
- `Card`: `plain`, `interactive`, `selected`; radius 12
- `Panel`: dashboard bölüm yüzeyi; radius 16
- `Dialog`, `Drawer`, `BottomSheet`
- `Tabs`, `SegmentedControl`, `HorizontalScroller`
- `Toast`/`useToast`: explicit tone + action + undo
- `EmptyState`, `ErrorState`, `Skeleton`

## Kabul kuralları

- Yeni bileşen hardcoded renk kullanmaz.
- Birincil CTA sayfa/bölüm başına bir tane.
- Tüm dokunma hedefleri 44 px.
- Nested card ancak gerçekten bağımsız tekrarlanan item için.
- Tooltip yalnız anlamı ikonla hemen bilinmeyen kontrollerde.

---

# 7. Responsive ve mobil uyumluluk

## Doğrulanan durum

| Genişlik | Sonuç |
|---|---|
| 390 px telefon | Document seviyesinde yatay taşma yok; dock çalışıyor; bazı yatay şeritler kesiliyor |
| 768-1024 px tablet/küçük laptop | Sol sidebar gizli, masaüstü topbar açık, tam genişlik alt dock açık; arada kalmış layout |
| 1440 px masaüstü | Sol nav + merkez + sağ rail dengeli |
| Çok geniş | `max-width:1480px` sayesinde içerik aşırı yayılmıyor |

## Responsive sorunlar ve çözümler

1. **Akış filtreleri:** 390 px'te scrollWidth 363 / görünen alan 290. Fade + scroll snap veya more sheet.
2. **Hesap nav:** 452 / 343 px. Mobil section selector; aktif sekmeye auto-scroll.
3. **Forum kategori:** Yatay devam sinyali yok. Fade ve son kartın kısmi görünümü.
4. **Profil istatistikleri:** Beş kolon mobilde kesiliyor. 2x3 grid.
5. **Yasal nav:** 1.393 px'lik yatay nav. Mobil accordion/section menü.
6. **1024 px dock:** Tam genişlik dock uygunsuz. `lg` breakpoint'te sol kompakt rail veya maksimum 560 px merkez dock.
7. **Klavye + dock:** Forum/auth/suggest formlarında visual viewport testi eklenmeli.
8. **Touch target:** Görsel chip 32 px kalabilir, fakat pseudo-element/hit-area 44 px olmalı.

Önerilen breakpoint davranışı:

- `<768`: mobil topbar + 5'li dock
- `768-1199`: kompakt sol rail + topbar, dock yok
- `>=1200`: tam sol sidebar + merkez + opsiyonel sağ rail

---

# 8. Performans ve optimizasyon

| Problem | Neden / dosya | Kullanıcı etkisi | Optimizasyon | Beklenen kazanım | Öncelik |
|---|---|---|---|---|---|
| 6.707 satır global CSS | `app/globals.css` | Override riski, stil hesaplama/bakım maliyeti | tokens/base/layout/components dosyaları veya CSS modüle | Daha az regresyon, daha hızlı geliştirme | Yüksek |
| 1.040 satır ana page | `app/page.tsx` | Çok state/re-render ve zor test | Query/mutation hook + server shell | Daha stabil akış | Yüksek |
| 1.006 satır account | `app/account/page.tsx` | Tüm hesap fonksiyonları aynı bundle | Nested route + lazy section | Daha hızlı panel, daha az karmaşa | Yüksek |
| 1.100 satır admin | `app/admin/page.tsx` | Çoklu fetch ve domain | Alt admin route'ları | Daha küçük bundle/kolay yetki | Yüksek |
| 500 öneri tek response | `/api/accounts/me` | Büyük listede response ve render artar | Cursor pagination, status bazlı endpoint | O(20-50) UI listesi | Yüksek |
| Liderlik memory reduce | `/api/leaderboard/route.ts:16-220` | Aylık veri arttıkça CPU/RAM | Pre-aggregate tablo veya SQL groupBy | Sabit/hızlı leaderboard | Yüksek |
| Özel akış 100 post çekiyor | `/api/feed/route.ts:120-220` | Büyümede gecikme, cursor tutarsızlığı | DB aday sorgusu + cursor rank | Daha doğru pagination | Yüksek |
| Profil temel verisi client fetch | `ProfileClient.tsx` | İlk boyama ve SEO gecikir | Server component shell | Daha hızlı LCP | Orta |
| Bildirim 60 sn polling | `NotificationCenter.tsx:75` | Arka planda gereksiz istek | Visibility-aware backoff; ölçekte SSE | Daha az ağ/batarya | Orta |
| Spotify fetch timeout standardı yok | `lib/spotify.ts` | Dış servis takılınca request uzar | Ortak fetch wrapper, AbortSignal, retry budget | Daha kontrollü hata | Yüksek |
| Forum view her GET'te write | forum thread API | Popüler konularda write amplification | Session dedupe + batch counter | DB write azalır | Orta |
| 29 blur / 122 shadow | `globals.css` | Düşük mobil GPU'da scroll maliyeti | 3 shadow token, blur budget | Daha akıcı mobil scroll | Orta |
| Route içinde `window.location` | Ana/hesap/profil/forum | Tam reload | Next router | Daha hızlı geçiş | Orta |
| Cache sınırlı | leaderboard 15 sn hariç | Aynı veriye tekrar sorgu | Discover/forum summary cache | Daha düşük DB yükü | Orta |

## Olumlu performans bulguları

- Bağımlılık listesi küçük; ağır UI kütüphanesi yok.
- Next route code splitting çalışıyor.
- First-load JS 130 kB altında.
- Feed normal akış cursor kullanıyor.
- Forum ve admin listelerinin bir bölümü sayfalı.
- Spotify metadata istekleri batch/chunk mantığına sahip.
- `next/image` kontrol sayfasında kullanılıyor.

---

# 9. Akıcılık ve animasyon

## Mevcut durum

- Hover/focus geri bildirimleri var.
- Skeleton ana akışta kullanılıyor.
- Reduced motion desteği var.
- Blur ve shadow miktarı düşük cihazlarda riskli.
- Ana akış ve keşfette like/save/follow/add işlemleri optimistic güncelleniyor; HTTP veya ağ hatasında arayüz eski duruma dönüyor ve toast ile geri bildirim veriyor.

## Önerilen motion sistemi

| Token | Süre | Kullanım |
|---|---:|---|
| `motion-instant` | 80 ms | Press/active |
| `motion-fast` | 140 ms | Hover, tab, chip |
| `motion-base` | 200 ms | Menü, toast, accordion |
| `motion-slow` | 280 ms | Dialog/drawer |

Kurallar:

- Yalnız `opacity` ve `transform` animasyonu tercih et.
- Layout yüksekliği animasyonlarını sınırla.
- Like/save/follow/add optimistic; hata olursa rollback + toast.
- Resim alanları sabit oranlı olsun; layout shift olmasın.
- Modal/drawer ortak transition kullansın.
- Sonsuz dekoratif animasyon kullanma.

---

# 10. Kod kalitesi ve proje mimarisi

## Güçlü yanlar

- Route ve domain klasörleri anlaşılır.
- TypeScript, lint ve testler temiz.
- Prisma select'leri hassas alanları çoğunlukla istemciye göndermiyor.
- Domain helper'ları `lib` altına ayrılmaya başlanmış.
- Kritik hesap ve sosyal akış davranışları E2E testli.

## Sorunlar

1. Üç ana client page birden fazla domain sorumluluğu taşıyor.
2. API fetch, state, validation ve UI aynı dosyada.
3. Tasarım tokenları sınırlı; hardcoded değer sayısı yüksek.
4. API hata response'ları `{error:string}` etrafında ama standart error code yok.
5. Formlar ortak schema/field error altyapısı kullanmıyor.
6. Forum, profil ve akış için ortak pagination/query client katmanı yok.
7. CSS isimleri ürün tarihçesi boyunca birikmiş; ownership belirsiz.

## Hedef mimari

```text
app/
  (public)/
  (community)/
  account/
    layout.tsx
    requests/page.tsx
    list/page.tsx
    profile/page.tsx
    security/page.tsx
  admin/
    layout.tsx
    users/page.tsx
    reports/page.tsx
components/
  ui/
  shell/
  feed/
  forum/
  account/
features/
  feed/
    api.ts
    hooks.ts
    types.ts
  account/
lib/
  auth/
  db/
  spotify/
styles/
  tokens.css
  base.css
  utilities.css
```

Büyük refactor tek seferde yapılmamalı; her route bir test ve ekran görüntüsü kabul kriteriyle parçalanmalı.

---

# 11. Veri tabanı ve API

## Olumlu bulgular

- Prisma parametreleme SQL injection riskini azaltır.
- Feed, forum, suggestion, notification ve session için temel indeksler var.
- Unique ilişkiler duplicate like/add/save/follow'u engelliyor.
- Oturumlar hash'li tokenla tutuluyor ve revoke edilebiliyor.
- Admin listeleri pagination ve groupBy ile sayim üretiyor.
- API korumaları smoke/E2E ile testli.

## Eksikler

1. `favoriteGenres` ve feed `tags` JSON-string; indekslenemiyor ve sağlıklı filtrelenemiyor.
2. `Settings.spotifyAccessToken` ve `spotifyRefreshToken` plaintext uygulama verisi.
3. SQLite tek instance için uygun; çok instance/concurrent write için sınırlayıcı.
4. In-memory rate limiter instance'lar arasında paylaşılmıyor (`lib/rateLimit.ts`).
5. `/api/accounts/me` 500 suggestion include ediyor.
6. Leaderboard tüm aylık post/add kayıtlarını uygulama belleğinde topluyor.
7. Özel feed scope'ları cursor yerine 100 aday çekip filtreliyor.
8. Spotify çağrıları için ortak timeout, retry sınıfı ve circuit breaker yok.
9. API error code, trace ID ve field errors standardı yok.

## Önerilen veri gelişimi

- `Genre`, `UserGenre`, `PostTag`, `ArtistGenreCache` modelleri.
- `MonthlyUserScore` ve `MonthlyTrackScore` aggregate tabloları.
- `PasswordResetToken`, `EmailVerificationToken` hash'li modelleri.
- Production'da PostgreSQL; migration rehearsal ve rollback.
- Redis tabanlı rate limit/cache ancak çok instance'a geçildiğinde.

---

# 12. Güvenlik analizi

## Güçlü kontroller

- Parolalar düz metin değil; salt'li PBKDF2 hash (`lib/password.ts`).
- Session tokenları 32 random byte ve DB'de HMAC özetiyle tutuluyor.
- Cookie'ler HttpOnly, SameSite=Lax; production'da Secure.
- Kullanıcı diğer oturumlarını iptal edebiliyor.
- Middleware cross-site mutation ve origin kontrolü yapıyor.
- Prisma kullanımı SQL injection riskini düşürüyor.
- Profil API'si e-posta/parola gibi özel alanları döndürmüyor.
- Owner, moderatör ve member yetki sınırları testli.
- X-Frame-Options, nosniff, referrer, permissions, HSTS ve CSP başlıkları mevcut.
- Dosya yükleme yüzeyi yok; file upload riski şu an uygulanamaz.

## Riskler

| Risk | Dosya | Seviye | Çözüm |
|---|---|---|---|
| Eski ZIP'de `.env`/DB paylaşıldıysa secret sızıntısı | Operasyon | Kritik | Spotify secret, session secret ve admin key rotate; token revoke |
| Spotify tokenları şifresiz | `schema.prisma:14-15` | Yüksek | AES-GCM envelope encryption; anahtar ortam/KMS'de |
| PBKDF2 120.000 iteration | `lib/password.ts:3` | Yüksek | Argon2id'e geçiş veya PBKDF2 work factor migration; login'de rehash |
| CSP `unsafe-inline` ve `unsafe-eval` | `next.config.js:20-21` | Yüksek | Nonce/hash tabanlı production CSP; report-only rollout |
| Owner admin tek paylaşılan key | `lib/adminAuth.ts` | Yüksek | Bireysel admin hesap, MFA, rol ve audit |
| Rate limit process-local | `lib/rateLimit.ts` | Orta/Yüksek | Production multi-instance için Redis/managed limiter |
| Origin yoksa mutation devam ediyor | `middleware.ts` | Orta | Production cookie-auth mutationlarda Origin/Fetch-Metadata veya CSRF token zorunluluğu |
| Spotify/dış servis timeout standardı yok | `lib/spotify.ts` | Orta | AbortController timeout, retry budget, hata redaction |
| Log/monitoring redaction merkezi değil | API `console.error` noktalar | Orta | Structured logger + secret/PII redaction |
| E-posta doğrulama/reset yok | Auth | Yüksek ürün/güvenlik | Süreli hash tokenlar, rate limit, session revoke |

OWASP'in güncel Password Storage rehberi yeni sistemlerde Argon2id'i; PBKDF2-HMAC-SHA256 gerekiyorsa daha yüksek work factor'u önerir. Mevcut 120.000 iteration bu hedefin altındadır: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

CSP için nonce/hash tabanlı strict CSP hedeflenmelidir: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

Session cookie yapısı genel olarak doğru yöndedir; HTTPS production'da zorunludur: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

---

# 13. Eksik özellikler ve geliştirme önerileri

| Grup | Özellik | Neden / fayda | Zorluk | Öncelik |
|---|---|---|---|---|
| UX | Şifremi unuttum | Hesap kurtarma | Orta | Kritik |
| Güvenlik | E-posta doğrulama | Hesap ve bildirim güveni | Orta | Yüksek |
| UX | Konularım / moderasyon durumu | Pending/rejected takibi | Orta | Yüksek |
| UX | İlk kullanım kavram rehberi | Paylaş/öner/ekle ayrımı | Kolay | Yüksek |
| Tasarım | UI primitive kütüphanesi | Tutarlılık ve hızlı geliştirme | Orta/Yüksek | Yüksek |
| Tasarım | Responsive section selector | Hesap mobil nav sorununu çözer | Orta | Yüksek |
| Performans | Monthly aggregate tablolar | Liderlik ölçeklenir | Orta | Yüksek |
| Performans | Metadata cache + timeout | Spotify bağımlılığı kontrollü olur | Orta | Yüksek |
| Güvenlik | Token encryption | DB sızıntısının etkisini azaltır | Orta | Yüksek |
| Güvenlik | Admin MFA | Kritik panel erişimi | Yüksek | Yüksek |
| Bağlılık | Haftalık keşif özeti | Geri dönüş motivasyonu | Orta | Orta |
| Bağlılık | Takip edilen küratör aktivitesi | Sosyal değer | Orta | Orta |
| Bağlılık | Profil/rozet ilerleme özeti | Mevcut başarım sistemini güçlendirir | Kolay | Orta |
| Yönetim | Moderasyon gerekçe şablonları | Şeffaf ve tutarlı karar | Orta | Yüksek |
| Yönetim | Sistem health/queue paneli | Operasyon görünürlüğü | Orta | Orta |
| Mobil | HorizontalScroller primitive | Tüm kesilen şeritleri ortak çözer | Orta | Yüksek |
| Erişilebilirlik | Axe + screen reader smoke | Regresyonu erken bulur | Orta | Yüksek |
| Profesyonellik | CI clean build | Platform bağımsız release | Orta | Kritik |
| Profesyonellik | Error monitoring / trace ID | Gerçek hatayı hızlı bulma | Orta | Yüksek |
| Profesyonellik | Versioned legal docs | Şeffaflık ve yasal hazırlık | Orta | Yüksek |

Premium özellikler puan avantajına dönüşmemeli. Profil kişiselleştirme, takip analitiği ve reklamsız deneyim premium olabilir; temel keşif, liste ve forum eşit kalmalıdır.

---

# 14. Önceliklendirilmiş sorun listesi

| Öncelik | Sayfa / bileşen | Problem | Kullanıcıya etkisi | Önerilen çözüm |
|---|---|---|---|---|
| Kritik | Operasyon / eski ZIP | Secret ve gerçek DB paylaşılmış olabilir | Hesap/veri ihlali | Tüm sırlar rotate, eski arşivi kullanma |
| Kritik | Auth | Parola sıfırlama yok | Hesap kaybı | Süreli tek kullanımlık reset akışı |
| Kritik | Release | Temiz Linux CI/CD yok | Deploy regresyonu | `npm ci + prisma generate + test + build` pipeline |
| Yüksek | Spotify Settings | Tokenlar plaintext | DB sızıntısında Spotify erişimi | Uygulama seviyesinde encryption |
| Yüksek | Password | PBKDF2 work factor düşük | Offline brute-force direnci azalır | Argon2id/rehash migration |
| Yüksek | CSP | unsafe-inline/eval | XSS etkisi artar | Nonce/hash CSP |
| Yüksek | Responsive | 768-1024 tam genişlik dock | Tablet/laptopta tekrar ve alan kaybı | Orta breakpoint shell |
| Yüksek | Mobile tabs | Feed/account/forum/profil şeritleri kesiliyor | Özellikler bulunamıyor | Shared HorizontalScroller/selector |
| Yüksek | Touch | Çok sayıda hedef <44 px | Yanlış dokunma | Hit area standardı |
| Yüksek | `app/page.tsx` | 1.040 satır client orchestration | Bakim/re-render riski | Hook + server shell |
| Yüksek | `app/account/page.tsx` | 1.006 satır, 500 öneri | Büyük hesapta gecikme | Nested routes + pagination |
| Yüksek | `app/admin/page.tsx` | 1.100 satır, shared key | Yetki ve bakım riski | Alt routes + bireysel admin |
| Yüksek | Leaderboard | Aylık veriyi memory reduce | Büyümede yavaşlık | Aggregate tablo |
| Yüksek | Feed personalized | 100 aday + memory rank | Pagination/CPU sorunu | DB adaylama ve cursor |
| Yüksek | Auth | E-posta doğrulama yok | Yanlış/sahte hesap | Verification flow |
| Orta | CSS | `globals.css` içinde 72 özel efekt rengi | Ana kabuk bakım maliyeti | Efektleri tokenlaştırarak kademeli azaltma |
| Yüksek | Spotify API | Evrensel timeout yok | Uzun bekleme | Fetch wrapper + timeout |
| Orta | Toast | Tone metinden tahmin | Yanlış feedback | Explicit tone/error code |
| Orta | Forum | Konularım yok | Moderasyon belirsizliği | Pending/rejected takip |
| Orta | Profile | Temel veri client fetch | İlk boyama/SEO | Server shell |
| Orta | Notifications | 60 sn polling | Ağ/batarya | Visibility backoff/SSE ölçekte |
| Orta | Legal | Tarih/sürüm/iletişim yok | Güven/yasal eksik | Versioned belgeler |
| Orta | Motion | Blur/shadow yoğun | Düşük cihaz scroll riski | Motion/elevation budget |
| Düşük | Empty data | Fazla boş alan | Düşük topluluk algısı | Seed/editorial compact blocks |

---

# 15. Sayfa sayfa geliştirme planı

## Ana sayfa

1. Mobil feed tab fade/scroll affordance.
2. 768-1199 shell ve dock kararı.
3. `useFeedQuery` hook'u.
4. `useFeedMutations` hook'u ve optimistic davranış.
5. Composer state'ini ayrı bilesene taşı.
6. Düşük veri sağ rail'ini kompaktlaştır.
7. Leaderboard aggregate/cache entegrasyonu.

## Keşfet

1. `Yeni 5` metnini açıkla.
2. Sıfır veride stats'i tek satıra indir.
3. Track row dokunma hedeflerini 44 px yap.
4. Filter/search state'ini URL'ye taşı.
5. Discover summary cache ekle.

## Forum

1. Kategori HorizontalScroller.
2. Metadata fontlarını minimum 12 px yap.
3. Konularım filtresi ve durum sayacı.
4. Filtre/sayfa URL state'ini tamamla.
5. Düşük veride boş alan hiyerarşisi.

## Yeni konu

1. Klavye açıkken dock testi.
2. Submit sonrası pending detay ekranına yönlendir.
3. Moderasyon gerekçe modelini bağla.
4. Alan bazlı server validation.

## Konu detayı

1. Prose tokenları.
2. Yanıt taslağı autosave.
3. Görüntülenme batch counter.
4. Optimistic yanıt placeholder.

## Hesap auth

1. Forgot/reset veri modeli.
2. Mail provider abstraction.
3. E-posta verification.
4. Password hash migration.
5. FieldError/PasswordMeter.

## Hesap paneli

1. Öneri endpoint pagination.
2. Mobil section selector.
3. Nested route shell.
4. List/profile form hook'ları.
5. Security/privacy lazy loading.

## Öneri sayfası

1. Hedef liste bağlam satıri.
2. Locked adım surface'i.
3. Duplicate/pending durum badge'i.
4. Geçmiş pagination.

## Kontrol

1. Hook'lara ayır.
2. Metadata cache.
3. Optimistic add/remove.
4. 200+ kayıt virtualization.
5. URL'de grup/filter state.

## Profil

1. Server profile shell.
2. Mobil 2x3 stat grid.
3. Tema semantic accent sistemi.
4. Connections ortak Dialog.
5. Profil empty state'ini güçlendir.

## Admin

1. Alt route'lara ayır.
2. Bireysel admin + MFA tasarımı.
3. Tüm listelerde server pagination.
4. Filter URL state.
5. Structured audit export.

## Forum moderasyonu

1. Karar gerekçe şablonları.
2. Kullanıcı notification'i.
3. Batch decision.
4. Split preview.
5. Klavye navigasyonu.

## Legal/global

1. Belgeleri ayır.
2. Sürüm/tarih/iletişim/saklama sureleri.
3. Trace ID'li error state.
4. Monitoring entegrasyonu.

---

# 16. Genel geliştirme yol haritası

## Aşama 1 - Kritik güvenlik ve release (1 sprint)

| Görev | Dosya/alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Secret rotation | Spotify dashboard, `.env`, sessions | Orta | Çok yüksek | Eski secret/token erişim sağlamıyor |
| Temiz release script | `scripts/create-source-release.mjs` | Kolay | Yüksek | ZIP'de `.env`, DB, backup, log, build yok |
| CI clean build | `.github/workflows/ci.yml` | Orta | Çok yüksek | Windows/Linux temiz runner'da pipeline yeşil |
| Password reset tasarımı | Prisma + auth API | Orta | Çok yüksek | Süreli, hash'li, tek kullanımlık token |

## Aşama 2 - Kullanıcı akışları (1 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Kavram onboarding | GettingStarted | Kolay | Yüksek | Test kullanıcısı üç işlemi ayırabiliyor |
| Konularım | Forum/profile | Orta | Yüksek | Pending/published/rejected görünüyor |
| Field error standardı | Auth/forum/settings | Orta | Yüksek | API hatası ilgili alan altında |
| Undo davranışı | Hide/block/remove | Orta | Orta | 5-8 sn geri alma |

## Aşama 3 - Tasarım sistemi (1-2 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Semantic tokenlar | `styles/tokens.css` | Orta | Çok yüksek | Yeni bileşen hardcoded renk kullanmıyor |
| Button/Field/Card | `components/ui` | Orta | Yüksek | Ana sayfalarda primitive kullanılıyor |
| Dialog/Drawer/Scroller | Overlay/nav | Yüksek | Yüksek | Mobil modal ve yatay şeritler ortak |
| CSS parçalama | `globals.css` | Yüksek | Yüksek | globals reset/token/shell ile sınırlı |

## Aşama 4 - Renk ve tipografi (yarım sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| 12 px metadata alt siniri | Tüm app | Kolay | Yüksek | Kritik metin <12 px değil |
| CTA renk kuralı | Tüm app | Orta | Yüksek | Primary/secondary/destructive tutarlı |
| Elevation budget | CSS | Orta | Orta | 3 shadow, sınırlı blur |
| Kontrast testi | CI | Orta | Yüksek | Axe kritik kontrast ihlali yok |

## Aşama 5 - Sayfa tasarımları (2 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Ana akış sadeleştirme | `/` | Orta | Yüksek | Boş/dolu durumda hiyerarşi güçlü |
| Account nested shell | `/account` | Yüksek | Çok yüksek | Her bölüm ayrı route |
| Admin nested shell | `/admin` | Yüksek | Çok yüksek | Her domain ayrı route/yetki |
| Profil server shell | `/u/[slug]` | Orta | Yüksek | Temel profil SSR |

## Aşama 6 - Mobil uyumluluk (1 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| 768-1199 layout | Shell | Orta | Çok yüksek | 1024'te tam dock yok |
| Shared HorizontalScroller | Tabs/chips/stats | Orta | Yüksek | Fade/snap ve klavye desteği |
| 44 px touch audit | Tüm app | Orta | Yüksek | Otomatik kontrol kritik ihlal yok |
| Visual viewport testi | Formlar | Orta | Yüksek | Klavye CTA'yi kapatmıyor |

## Aşama 7 - Performans (1-2 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Suggestion pagination | Account API | Orta | Yüksek | Response 20-50 kayıt |
| Monthly aggregates | Leaderboard | Yüksek | Çok yüksek | Request tüm ayı taramıyor |
| Personalized feed adaylama | Feed API | Yüksek | Yüksek | Cursor stabil, 100 memory scan yok |
| Spotify wrapper/cache | `lib/spotify` | Orta | Yüksek | Timeout/retry/cache metrikli |

## Aşama 8 - Animasyon ve akıcılık (yarım sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Motion token | CSS | Kolay | Orta | 80/140/200/280 ms seti |
| Optimistic mutations | Feed/control | Orta | Yüksek | Anında feedback + rollback |
| Overlay transition | Dialog/drawer | Orta | Orta | Tek ortak transition |
| Blur GPU audit | Mobil | Orta | Orta | Scroll drop/jank yok |

## Aşama 9 - Güvenlik (1-2 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Token encryption | Settings | Orta | Çok yüksek | DB dump tokeni açık vermiyor |
| Argon2id/rehash | Password | Orta | Çok yüksek | Eski hash login'de migrate |
| Strict CSP rollout | Next/middleware | Yüksek | Yüksek | Report-only temiz, unsafe-eval yok |
| Admin MFA | Admin auth | Yüksek | Çok yüksek | Bireysel actor + MFA |
| Distributed limiter | API | Orta | Yüksek | Multi-instance ortak limit |

## Aşama 10 - Test ve yayına hazırlık (1 sprint)

| Görev | Alan | Zorluk | Etki | Kriter |
|---|---|---:|---:|---|
| Playwright visual matrix | 390/768/1024/1440 | Orta | Yüksek | Baseline ve regresyon |
| Axe E2E | Kritik route'lar | Orta | Yüksek | Critical/serious ihlal yok |
| PostgreSQL staging | DB | Yüksek | Çok yüksek | Migration + load testi |
| Monitoring/trace | API/UI | Orta | Yüksek | Hata trace ID ile bulunuyor |
| Backup restore drill | Operasyon | Orta | Yüksek | Belgeli restore ve RTO |
| Release/rollback checklist | Operasyon | Orta | Çok yüksek | Tek komut deploy ve rollback |

## Önerilen ilk 3 sprint

**Sprint 1:** Secret rotation, clean CI, 1024 layout, mobile scroller, 44 px hit area, toast explicit tone.  
**Sprint 2:** Password reset/e-posta doğrulama temeli, token encryption, field error standardı, Konularım.  
**Sprint 3:** Tasarım tokenları, Button/Field/Card primitive'leri, account ve home refactor ilk adımı.

---

# 17. Nihai değerlendirme ve puanlama

| Kategori | Puan /10 | Gerekçe |
|---|---:|---|
| Kullanıcı deneyimi | **7,7** | Temel akışlar net ve testli; kavram onboarding, recovery ve mobil yatay nav eksik |
| Görsel tasarım | **7,8** | Modern kimlik ve iyi ekranlar; fazla yüzey/gölge varyasyonu var |
| Renk kullanımı | **7,2** | Ana palet güçlü; 500+ RGB varyasyonu standardı zayıflatıyor |
| Sayfa düzeni | **7,5** | 1440 px güçlü; düşük veri ve 1024 bandı sorunlu |
| Mobil uyumluluk | **6,9** | Yatay document taşması yok; dock, tab ve touch hedefleri iyileşmeli |
| Performans | **7,0** | Bundle/build iyi; büyük client dosyaları ve memory aggregation riskli |
| Akıcılık | **7,5** | Skeleton/focus/reduced motion ve sosyal optimistic rollback standardı güçlü; bazı tam sayfa reload ve yoğun blur yüzeyleri hâlâ iyileştirilebilir |
| Kod kalitesi | **7,2** | Testler ve domain helper'ları güçlü; monolitik sayfalar/CSS maliyetli |
| Güvenlik | **6,5** | Session/role/CSRF başlangıcı güçlü; token encryption, CSP, hash work factor ve admin MFA eksik |
| Profesyonellik | **7,0** | Audit, moderasyon, export ve testler güçlü; CI, recovery, monitoring ve legal versioning eksik |
| Genel ürün kalitesi | **7,3** | Güçlü kapalı beta; public production için hedefli 3-5 sprint daha gerekli |

## En güçlü üç yön

1. Sosyal akış + tek liste + kontrollü öneri + forum kombinasyonu.
2. Moderasyon, oturum, bildirim, export ve audit dahil gerçek ürün kapsamı.
3. Çalışan build ve geniş E2E test setiyle sağlam teknik temel.

## En zayıf üç yön

1. Tasarım/CSS ve büyük client sayfaların monolitik yapısı.
2. Parola kurtarma, e-posta doğrulama ve production admin güvenliği.
3. 768-1024 responsive geçiş ve yatay scroller affordance'ları.

## İlk düzeltilecek beş problem

1. Paylaşılmış secret'ları rotate et ve clean CI/release kur.
2. 768-1024 shell ile mobil yatay nav problemlerini düzelt.
3. Password reset ve e-posta verification temelini kur.
4. Spotify token encryption ve password rehash migration yap.
5. Semantic design token + UI primitive dönüşümünü başlat.

## Profesyonel seviyeye taşıyacak en önemli değişiklik

**Production güvenlik/release hattı ile tasarım sistemini birlikte standartlaştırmak.** Uygulamanın özellik eksiği az; en büyük kazanç yeni özellikten değil, mevcut ürünün güvenli, tekrar edilebilir ve tutarlı biçimde yayınlanmasından gelecektir.

## Kullanıcının daha uzun kalması için

- Takip edilen küratörlerden kaliteli ve sınırlı haftalık keşif özeti.
- Konularım ve moderasyon durumuyla topluluk geri beslemesi.
- Profil/başarım ilerlemesinin sade görünürlüğü.
- Kaliteli seed içerik ve editoryal "haftanın seçimi".
- Spam üretmeyen, tercih edilebilir bildirimler.

## Daha hızlı ve akıcı hissettirmek için

- Server-render shell, optimistic mutations, cursor pagination.
- Leaderboard aggregate ve Spotify metadata cache.
- Next router ile dahili geçişler.
- Blur/shadow budget ve sabit skeleton boyutları.

## Daha modern görünmesi için

- Daha az nested card ve daha net surface hiyerarşisi.
- Semantic renk/radius/shadow tokenları.
- 12 px minimum metadata, daha az uppercase/font-black.
- 768-1199 için gerçek tablet/küçük laptop navigasyonu.
- Müzik kimliğini telif riski taşıyan kapaklara bağlamadan küratör, etiket, tür ve topluluk sinyalleriyle güçlendirme.

---

## Sonuç

ListeKutusu özellik olarak prototip aşamasını geçmiş, kapalı beta için güçlü bir üründür. Bir sonraki dönemde yeni modüller eklemek yerine; release güvenliği, hesap kurtarma, responsive shell, tasarım tokenları ve büyük sayfa refactor'ları tamamlanmalıdır. Bu yol haritasının ilk üç sprinti tamamlandığında ürün hem daha profesyonel görünecek hem de public beta için belirgin biçimde daha güvenli ve bakımı kolay hale gelecektir.

---

# 18. 22 Temmuz 2026 dış rapor doğrulaması

`ListeKutusu_Kapsamli_UI_UX_Teknik_Inceleme_Raporu_Urun_Akislariyla_Guncellenmis_2026-07-22 (1).md` güncel çalışma alanıyla karşılaştırıldı. Rapor `playlist-app(4).zip` paketini incelediği için aşağıdaki ayrım uygulanmıştır.

## Doğrulanan ve kapatılan bulgular

1. Açık temada boş akış başlığının sabit beyaz olması doğrulandı. Renk `--ui-text-strong` semantik tokenına taşındı ve boş akış için ayrı Playwright/Axe regresyonu eklendi.
2. Playwright'ın yalnız `msedge` kanalına bağlı olması doğrulandı. Yerelde Edge, CI'da bundled Chromium çalışan taşınabilir yapı kuruldu; proje adları tarayıcıdan bağımsız `desktop` ve `mobile` oldu.
3. Eski build, `node_modules`, `.env`, SQLite ve logların ZIP'e girebilmesi operasyonel risk olarak doğrulandı. `npm run package:source` ile yalnız kaynak dosyalarını alan güvenli paketleme akışı eklendi.

## Güncel kaynakta eski veya paket kaynaklı bulgular

1. “Production build tamamlanamıyor” bulgusu güncel Windows çalışma alanında geçerli değildir; temiz production build başarıyla tamamlanmıştır. Linux temiz CI kurulumu yine ayrıca doğrulanacaktır.
2. Linux Prisma binary uyumsuzluğu kaynak kodu hatası değildir; Windows'ta üretilmiş `node_modules` klasörünün ZIP'e eklenmesinden doğar. Kaynak pakette `node_modules` bulunmaz ve `npm ci` sonundaki `postinstall` hedef işletim sistemi için `prisma generate` çalıştırır.
3. ZIP içinde `.env`, veritabanı ve geçmiş oturum bulunması `.gitignore` eksikliği değildir; proje klasörünün doğrudan arşivlenmesi kaynaklıdır. Yeni paketleme komutu bu kalıntıları dışarıda bırakır.

## Yol haritasında kalan geçerli ürün işleri

1. Ana eylemlerin anlamını keskinleştir: paylaş, kaydet, kendi listene ekle ve davet koduyla öner işlemleri aynı görünmemeli.
2. Akış sekmelerini görev odaklı tut; kaydedilen içerikleri uzun vadede ayrı bir “Kitaplık” yüzeyine taşı.
3. Büyük client sayfalarını ve dağınık `fetch` çağrılarını domain hook/API istemcilerine böl; tam sayfa `window.location` geçişlerini Next router ile azalt.
4. Feed, liderlik ve öneri listelerinde veri büyümeden önce sunucu tarafı sayfalama, aggregate ve cache sınırlarını tamamla.

## 22 Temmuz görsel sistem uygulaması

Tamamlananlar:

1. Açık tema çalışma yazılımı hissi veren gri-mavi zeminden daha temiz, aydınlık ve sosyal ürün odaklı semantik palete taşındı.
2. Varsayılan kart ve panel derinliği `--ui-shadow-xs` seviyesine indirildi; belirgin gölgeler yalnız yükseltilmiş araç, menü ve modal katmanlarında bırakıldı.
3. Sayfa çerçevesi `1480px` üst sınırına alındı; ana akış ayrıca tam genişlikte üç sütunlu sosyal kabuğunu korudu.
4. `font-black`, `font-extrabold`, otomatik uppercase ve tracking kullanımları merkezi tipografi hiyerarşisine bağlandı.
5. Ana akış, keşfet, forum ve hesap yüzeyleri açık/koyu tema ile masaüstü ve `390px` mobil viewport'ta görsel olarak doğrulandı; document seviyesinde yatay taşma görülmedi.
6. Açık/koyu tema metin, durum, birincil buton ve odak halkası kontrastları otomatik kalite kapısından geçti.
7. Hesap ve yönetim iç panellerinin koyu temadaki eski degrade, parlak kenarlık ve güçlü gölge katmanı nötr semantik yüzeylere geçirildi.
8. `1728px` geniş ekran projesi, uzun hesap verisi ve onay mutasyonu eklenerek oturumlu hesap paneli beş viewport ve iki tema ile kalıcı regresyon korumasına alındı.
9. Dolu ana akış, forum, keşfet ve yönetim yüzeyleri geniş ekran/mobil uçlarda iki temayla eklendi; görsel kapsam elli kalıcı baseline'a çıkarıldı.
10. Mobil yönetim özeti 2×2 düzene geçirildi; keşfin rastgele veri çağrısı görsel testlerde deterministik hâle getirildi.
11. Ana akış ve keşfette beğeni/listeye ekleme; ana akışta kaydetme/takip işlemleri optimistic update ve hata rollback standardına geçirildi.
12. Forum durum filtresi ve sayfalama, sosyal işlem başarıları ile API hata geri almaları beş viewport'ta sınandı.
13. İç yönlendirmeler Next router akışına geçirildi; güvenli dönüş yolu birim testleri, istemci yönlendirme testi ve dolu profil için dört yeni görsel baseline ile tarayıcı matrisi 220 teste çıkarıldı.
14. Profil sekme içerikleri bağımsız bileşene ayrıldı; mobil profil istatistikleri 2 sütunlu görünür ızgaraya, sekmeler ise kesilmeyen üç sütunlu düzene geçirildi.
15. Ana akış kartlarında takip ve kaydet eylemleri görünür hâle getirildi; üç ana sosyal işlem tek satırda, mobilde erişilebilir ikon düzeninde standardize edildi.
16. Ana akış, keşfet, forum, hesap ve profil yüzeyleri telifli kapaklara dayanmayan dönüşümlü cyan, zümrüt ve mor kimlik sinyalleriyle ayrıştırıldı.
17. Açık tema arka plan, kart, üst çubuk, kenarlık ve gölge tokenları yeniden dengelenerek soluk beyaz panel görünümü azaltıldı; 31 açık tema görsel senaryosu tekrar doğrulandı.
18. Bildirimler paylaşım, profil ve forum hedeflerine derin bağlantıyla açılır hâle getirildi; aynı hedefteki beğeni, listeye ekleme ve forum hareketleri gruplanıp tek işlemle okundu yapılır.
19. Bildirim gruplaması birim testi ile masaüstü ve mobil Playwright davranış testlerine alındı.
20. Ana akışın masaüstü sol navigasyonu `240px` tam menü ile `72px` ikon rayı arasında daraltılabilir hâle getirildi; tercih tarayıcıda korunur ve boşalan alan ana akışa aktarılır.
21. Sol menü daraltma eylemi tam genişlikte ayar satırı görünümünden çıkarılıp gezinme başlığına bağlı, sessiz ve erişilebilir ikon denetimine dönüştürüldü.
22. Sosyal gönderiler masaüstünde daha hızlı taranan kompakt kartlara geçirildi; açıklama ve etiketler tek bağlam satırında toplandı, popüler konu etiketleri akışı istemci tarafında anında süzer hâle geldi.
23. İçerik azlığı yaşayan yeni akışlar için ana kaynak listesinden beslenen `Editörden 5` keşif modülü eklendi; sosyal gönderi taklidi yapılmadan her oturumda gerçek bir keşif başlangıcı sağlandı.
24. `Yükselen` ve `Sana özel` sıralamalarına küratör ve sanatçı çeşitliliği katmanı eklendi; yüksek puanlı tek bir kaynak akışı art arda kaplayamaz.

Geçici ürün kararı: Masaüstü görsel kalite hedefi tamamlanana kadar yeni mobil uyarlama ve mobil görsel regresyon çalışmaları askıya alındı. Mevcut mobil kod ve testler korunacak, günlük geliştirme doğrulamaları `1440px` ve `1728px` masaüstü yüzeylerine odaklanacaktır.

Kalan görsel işler:

1. Eski uyumluluk CSS dosyalarındaki ham renk ve yüksek ağırlık tanımlarını yeni primitive bileşenlere geçtikçe azaltmak.
2. Hesap ve yönetim panellerindeki büyük client sayfalarını route ve domain bileşenlerine bölerek görsel kabuğu sadeleştirmek.
3. Sosyal mutasyonların ayrı görsel karelerini yalnız gerçek kullanıcı testinde görsel bir regresyon riski bulunursa eklemek; davranış kapsamı tamamlandı.
4. Gerçek kullanıcı testlerinde bulunan görsel hiyerarşi ve mikro etkileşim sorunlarını mevcut baseline matrisi üzerinden düzeltmek.

Kalan sosyal ürün işleri:

1. Sıralamada gösterim, gizleme, kaydetme ve listeye ekleme sinyallerini zaman pencereli ağırlıklarla ölçmek.
2. Editoryal seçki, takip edilen profiller, yükselen forum konuları ve sosyal paylaşımları tek akışta kontrollü aralıklarla harmanlamak.
3. Yeni kullanıcı için ilk oturumda üç tür veya sanatçı ilgisi toplayıp boş kişiselleştirme başlangıcını ortadan kaldırmak.
4. Akış kalitesini yalnız etkileşim sayısıyla değil; tekrar oranı, listeye ekleme oranı ve gizleme oranıyla izleyen yönetim metrikleri eklemek.

## Bilinçli olarak alınmayan öneriler

1. Çoklu veya ortak liste modeli alınmadı. Ürün kararı gereği her kullanıcının tek kalıcı listesi vardır.
2. Albüm kapağını ana ürün varlığı yapan tasarım alınmadı. Telif ve Spotify bağımlılığı azaltılarak metin, tür, küratör ve topluluk sinyalleri öne çıkarılır.
3. Spotify dinleme/streaming deneyimini kopyalayan öneriler kapsam dışıdır; Spotify yalnız arama, bağlantı ve isteğe bağlı senkron katmanıdır.
