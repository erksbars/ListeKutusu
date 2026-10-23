# ListeKutusu Tasarım Sistemi

Bu belge ListeKutusu'nun açık ve koyu temada aynı ürün gibi görünmesini sağlayan görsel ve etkileşim sözleşmesidir. Yeni bir sayfa veya bileşen eklenirken doğrudan renk, gölge, köşe yarıçapı ve kontrol yüksekliği yazılmamalıdır.

## 1. Ürün ilkeleri

### 23 Ekim görsel yön güncellemesi

İlk Taste `true-black-flat` denemesi (seed 1848207868) kullanıcının renk
geri bildirimiyle düzeltildi: yapısal iyileştirmeler korunur, ürün kimliği
skill'in nötr palet tercihinin önüne geçer. Aktif koyu zemin/yüzeyler
#0b1019 / #141d2a / #1b2736; metin açık ve okunaklı iki gri katmanındadır.
Cyan ana işlem, seçili menü ve sekmede; yeşil keşif/konu vurgularında kullanılır.
Birincil masaüstü kontrol cyan'dır; disabled/focus/busy davranışları korunur.
Kartların tamamı renkli zemine veya parlak kontura dönüştürülmez.
Dinlenim kartında gölge/gradient kullanılmaz. Sistem fontu gerçek `Segoe UI`;
indirilmeyen Variable font adları kullanılmaz. Ürün işareti `Layers3`, farklı
medya türlerinin tek kişisel kitaplıkta buluşmasını temsil eder.

Bu yönün uygulama katmanı `primitives.css` içindeki marka renkli Taste masaüstü bloğudur;
eski ekranlar ayrı dilimlerde taşınır. Profil/oyun/diğer özelliklerin eski
gradient kurallarının tamamı bu pakette kaldırılmış değildir. Açık tema ve
mobil ekran doğrulaması ertelenmiştir. Renkli aktif menü korunur; aşağıdaki
eski dinlenim kartı gölgesi önerisi koyu masaüstünde uygulanmaz.

1. Arayüz içerik merkezlidir. Dekorasyon; akış, forum, profil ve liste işlerini gölgelememelidir.
2. Ana deneyim tam ekran sosyal ürün düzenidir: sabit üst alan, solda sol hizalı navigasyon, ortada ana içerik, gerektiğinde sağda bağlamsal bilgi.
3. Açık ve koyu tema aynı hiyerarşiyi korur. Tema değiştiğinde bileşen türü veya önem sırası değişmez.
4. Birincil işlem her görünümde yalnızca bir kez baskın görünür.
5. Kartlar sayfa bölümü yerine tekil içerik, araç veya tekrar eden kayıt için kullanılır.
6. Hareket kısa ve işlevseldir. İçerik okunmasını veya düşük güçlü cihazları zorlayan sürekli animasyon kullanılmaz.

## 2. Kaynak dosyalar

- `app/globals.css`: Tailwind direktifleri, reset, temel sayfa kabuğu ve ilk nesil ortak bileşenler.
- `app/styles/feature-surfaces.css`: akış, keşfet, profil, hesap, kontrol ve yönetim yüzeylerinin eski uyumluluk katmanı.
- `app/styles/forum.css`: forum liste, konu, yanıt, oluşturma, loading ve responsive yüzeyleri.
- `app/styles/interaction-refinements.css`: mobil etkileşim, forum konuşma, menü ve özellik bazlı son düzenlemeler.
- `app/styles/unified-surfaces.css`: eski koyu yüzeyleri ortak görsel dile bağlayan son uyumluluk katmanı.
- `app/styles/tokens.css`: renk, tipografi, ölçü, yarıçap, gölge ve hareket tokenları.
- `app/styles/primitives.css`: buton, kart, form, sayfa kabuğu ve semantik tema kuralları.
- `app/components/ui`: yeni ekranların kullanacağı `Button`, `Card`, `TextField`, `TextAreaField`, `SelectField`, `Checkbox` ve `HorizontalScroller` bileşenleri.
- `app/components/ThemeToggle.tsx`: tema seçimi ve kalıcı tercih.
- `app/components/PageTopbar.tsx`: iç sayfaların ortak üst yapısı.
- `app/components/AppShell.tsx` + `PrimaryNavigation.tsx`: ortak masaüstü sol navigasyon.
- `app/components/HomeCommunitySummary.tsx`: ana akışın kişisel sağ bağlam özeti; ikinci ana menü değil.
- `app/components/ModalPortal.tsx`: body modal katmanı, arka alan inert/scroll ve odak otoritesi.
- `app/components/ui/ContentState.tsx`: yükleme, boş, giriş, hata ve kullanılamıyor durumları.
- `app/components/CommunityReadFeedback.tsx`: HTTP durumunu doğru görünüme ve hedefi koruyan girişe bağlar.
- `app/hooks/useNotifications.ts`: panelin okuma/yazma, bilinmeyen sayaç ve
  oturum/yetki kaybında temizleme sınırı; görünüm ortak durum kartlarını kullanır.
- `app/components/DraftNavigationProvider.tsx`: birden fazla form için tek, yalnız bellekte dirty/busy kayıt otoritesi.
  Geçici kayıt/geri alma callback'leri metin kopyalamaz. Tek desteklenen dirty
  profil kaydında kaydet-ve-devam-et açılır; başarısızlık hedefi korur.
  Hesap bölüm/geri ve yetkili kuyruk filtre/sayfa/yenileme de ortak onaydadır.
  Yeni içerik otomatik yayımlanmaz; bütün formlar/geçmiş kapsamda değildir.
- `app/components/MobileDock.tsx`: mobil ana navigasyon.
- `GAMES_DESIGN_SYSTEM.md`: oyun merkezi, oda, canlı maç, sonuç, performans ve çok oyunculu etkileşim sözleşmesi.

Stil import sırası `layout.tsx` içinde yukarıdaki dosya sırasını, ardından `tokens.css` ve `primitives.css` katmanlarını korur. Bu sıra değiştirilmez: son iki dosya eski renkleri semantik temaya bağlayan otorite katmanıdır. Yeni genel stil `globals.css` veya uyumluluk dosyalarına eklenmemeli; ortak kural `tokens.css` ya da `primitives.css` içinde tanımlanmalıdır. Yeni ve tamamen bağımsız özellik stilleri özellik dosyasında tutulur.

## 3. Renk sistemi

Renkler yalnızca semantik token ile kullanılır.

| Rol | Koyu tema | Açık tema | Kullanım |
| --- | --- | --- | --- |
| Sayfa | `--ui-bg` | `--ui-bg` | Uygulama zemini |
| Yüzey | `--ui-surface` | `--ui-surface` | Kart, panel, modal |
| Yükseltilmiş yüzey | `--ui-surface-raised` | `--ui-surface-raised` | Form, aktif sekme, açılır menü |
| Ana metin | `--ui-text` | `--ui-text` | Gövde metni |
| Güçlü metin | `--ui-text-strong` | `--ui-text-strong` | Başlık, önemli sayı |
| İkincil metin | `--ui-text-muted` | `--ui-text-muted` | Açıklama, meta bilgi |
| Birincil | `--ui-primary` | `--ui-primary` | Ana işlem, aktif navigasyon |
| Vurgu | `--ui-accent` | `--ui-accent` | Başarı ve keşif vurgusu |
| Başarı | `--ui-success` | `--ui-success` | Tamamlanan durum |
| Uyarı | `--ui-warning` | `--ui-warning` | Dikkat gerektiren durum |
| Hata | `--ui-danger` | `--ui-danger` | Silme ve hata |
| Kenarlık | `--ui-border` | `--ui-border` | Normal ayırıcı |
| Odak | `--ui-focus` | `--ui-focus` | Klavye odağı |

Durum renklerinin yumuşak zemini için `--ui-success-soft`, `--ui-warning-soft`, `--ui-danger-soft` ve `--ui-info-soft` kullanılır. Kırmızı yalnızca hata, engelleme ve geri döndürülemez işlem içindir.

Eski yüzeylerdeki düşük yoğunluklu renk katmanları için `--ui-surface-tint-xs`, `--ui-surface-tint-sm`, `--ui-surface-tint-md`, `--ui-surface-tint-lg`, `--ui-surface-tint-xl` ve `--ui-surface-tint-strong` kullanılır. Bu tokenlar dekoratif yeni bir renk paleti değildir; aynı yüzey derinliğini açık ve koyu temada semantik olarak koruyan geçiş katmanıdır.

### Açık tema yüzey kuralı

Açık tema saf beyaz bir belge görünümü değildir. Sayfa zemini düşük parlaklıklı gri-mavi, kartlar kırık beyaz, ikincil alanlar ise soğuk gri-yeşil yüzey kullanır. Büyük bir sayfa bölümü doğrudan `#fff` ile boyanmaz; `--ui-bg`, `--ui-surface`, `--ui-surface-raised` ve `--ui-surface-muted` katmanlarından biri seçilir. Böylece uzun akış ve forum oturumlarında göz yorgunluğu azalır, koyu temadaki içerik hiyerarşisi korunur.

## 4. Tipografi

- Font: `--ui-font-sans`; başlıklarda `--ui-font-display`.
- Sayfa başlığı: `ui-page-title` / `--ui-text-2xl`.
- Bölüm başlığı: `ui-section-title` / `--ui-text-xl`.
- Gövde: `--ui-text-sm` veya `--ui-text-md`.
- Etiket ve meta: en az `--ui-text-xs` (12 px).
- Satır yüksekliği: gövdede `--ui-leading-normal`, uzun metinde `--ui-leading-relaxed`.
- Harf aralığı sıfırdır. Küçük başlıklarda bütün harfleri büyütmek yalnızca kısa kategori/kicker metinlerinde kullanılabilir.

10 ve 11 px eski yardımcı metinler merkezi uyumluluk katmanında 12 px tabanına yükseltilir. Yeni kodda 12 px altı metin kullanılmaz.

## 5. Ölçü ve boşluk

- Kontrol yükseklikleri: küçük 36 px, standart 44 px, büyük 50 px.
- Dokunma hedefi: mobilde en az 44 x 44 px.
- Kart köşesi: `--ui-radius-md` (8 px).
- Büyük kabuk/modal köşesi: en fazla `--ui-radius-lg` (10 px).
- Avatar ve durum rozeti: `--ui-radius-pill`.
- Sayfa yatay boşluğu: mobil 14-16 px; masaüstü `clamp(16px, 2.25vw, 40px)`.
- Boşluklar `--ui-space-1` ... `--ui-space-8` ölçeğine göre seçilir.

## 6. Sayfa kabuğu

Her iç sayfa aşağıdaki yapıyı korur:

```tsx
<main className="stage-shell min-h-screen bg-app ...">
  <section className="ui-page-frame relative mx-auto">
    <PageTopbar ... />
    {/* Sayfa içeriği */}
  </section>
</main>
```

- `ui-page-frame` geniş ekranı kullanır ancak 1480 px üzerinde satırları kontrol eder.
- Ana sayfa `home-grid` ile sosyal ürün kabuğunu kullanır.
- Sol navigasyon her zaman sola hizalıdır; ikon ve metin başlangıç çizgisi sayfalar arasında değişmez.
- 17 Ekim ilk uygulama: root `AppShell` 1024 px ve üstünde tek 224 px sol menüdür; içerik onun sağında akar. Sosyal sayfalarda üstte ikinci ana menü yoktur. Yerel üst çubuk normal belge akışındadır; sayfa başlangıcını örten ikinci sticky katman oluşturulmaz. Maksimum içerik genişliği 1480 px hedefi korunur.
- Profil/onay/rapor modalları `ModalPortal` üzerinden body'ye taşınır; arka alan yalnız görsel olarak karartılmaz, etkileşime de kapatılır. Form kendi Escape/focus/scroll dinleyicisini yeniden kurmaz; ortak katmanı kullanır.
- Mobilde ana işler `MobileDock` üzerinden erişilir; masaüstü kenar çubuğu mobilde kopyalanmaz.

## 7. Butonlar

| Sınıf | Kullanım |
| --- | --- |
| `primary-action`, `topbar-primary-button` | Ekranın ana işlemi |
| `secondary-action`, `topbar-secondary-button` | İkincil/gezinme işlemi |
| `danger-action` | Silme, engelleme, kalıcı kaldırma |
| `theme-toggle`, `ui-icon-button` | Yalnız ikonlu araç |

Yeni React ekranlarında doğrudan sınıf yazmak yerine `app/components/ui/Button.tsx` kullanılır. Link görünümlü komutlar aynı varyantı `buttonClassName()` yardımıyla alır.

Kurallar:

- Aynı satırda iki birincil buton kullanılmaz.
- İkon butonuna `aria-label` ve `title` eklenir.
- Yüklenirken buton disabled olur, metni işlemi açıklar ve yerleşim boyutu değişmez.
- Hover yalnız fare için ek bilgi verir; işlem anlamı renge veya hover'a bağlı kalmaz.
- Disabled durumunda yalnız opacity değil, cursor ve renk de pasifleşir.

## 8. Kart ve paneller

- Yeni kart: `ui-card`.
- Araç veya büyük bölüm: `ui-panel`.
- Tıklanabilir kart: `ui-card ui-card-interactive` ve gerçek link/buton semantiği.
- Kart içine dekoratif ikinci kart konulmaz.
- Gölge: normal içerikte `--ui-shadow-xs`, yalnız yükseltilmiş araçta `--ui-shadow-md`, modal/menüde `--ui-shadow-overlay`.
- Sağ ray kartları ana akış kartından daha baskın görünmez.
- Karma akışta müzik, sohbet, inceleme ve etkinlik aynı `feed-post-card`
  kimlik/başlık bandını kullanır; `feed-content-kind` türü metinle belirtir.
  Kaynak, puan/spoiler ve etkinlik tarih/mekân/kapasitesi korunur. Kart bütünü
  link yapılmaz; detay ve etkileşim hedefleri ayrıdır.
- Yeni tekrar eden içeriklerde `Card`, `CardHeader`, `CardContent` ve `CardFooter` bileşenleri tercih edilir.

## 9. Formlar

Akış gezinmesi: kapsam/içerik türü/müzik konusu URL'de tutulur. Müzik detayı
dönüşü yalnız normalize root filtreleri ve kart işaretini taşır. Yeniden
yüklenen listede kart bulunduğunda görünür/odaklı dönüş yapılır; eski özel
içerik saklanmaz veya otomatik sınırsız sayfalama yapılmaz. Giriş aynı yolu
korur; form metni veya otomatik işlem taşımaz. Diğer detay aileleri açık.

- Alan sınıfı: `ui-field`.
- Etiket: `form-label`; placeholder etiket yerine geçmez.
- Hata metni alanın hemen altında, `--ui-danger` ile ve metinsel açıklamayla gösterilir.
- Başarılı işlem toast ile bildirilir; form içi doğrulama hatası toast'a taşınmaz.
- Toast için açıkça verilen `tone` otoritedir; eski çağrılarda metin çıkarımı geçiş uyumluluğudur. Normal giriş gereksinimi kırmızı hata sayılmaz. Bilinmeyen/yüklenemeyen kayıt sayısı sıfır değildir.
- Özel okumalarda 401 giriş, 403 yetki sınırı, 404 erişilemeyen kaynak, ağ/5xx okuma hatası olarak ayrılır. Giriş yalnız 401'de önerilir; eski hedefin özel verisi ve durumu yeni hedefe taşınmaz. 503 servisin kullanılamadığı nötr durumdur; boş sonuç değildir.
- Keşfet aynı durum yüzeyini aramanın tüm kapsamlarında gösterir. Bilinmeyen
  toplam/sonuç sayısı sıfır yazılmaz; gerçek boş sonuç yalnız başarılı veriyle
  gösterilir. Başvurunun tür/rapor değişimi onay ve güncel bağlam kontrolü
  ister; yeni konuya eski açıklama taşınmaz.
- Kayıtlı formlar iç linkten ayrılırken tek çıkış onayı kullanır. İptal metni korur; pending işlem geçişi engeller. Ortak beforeunload belgeden ayrılmayı uyarır; bu, aynı belge geri/ileri veya tüm yerel düğmeler için tamamlanmış koruma değildir. Otomatik/persist edilmiş taslak veya otomatik gönderim yoktur.
- Şifre, arama ve seçim alanları aynı 44 px kontrol yüksekliğini kullanır.
- Yorumda yanıt hedefi değiştirme/vazgeçme metin varsa onay ister. Kaldırma
  onayı bağlı yanıtları açıklar. Hata metni korur; silinmiş hedefin taslağı
  sessizce kök yoruma dönüştürülmez. Sayı yüklenmediyse — gösterilir.
- Klavye odağı kaldırılmaz; merkezi focus ring korunur.
- Müzik kartı menüsü açılınca ilk kullanılabilir işlem odaklanır; ok tuşları,
  Home/End, Escape ile tetikleyiciye dönüş ve Tab ile kapanma desteklenir.
  Uzun not aç/kapa düğmesi aria-expanded ve aria-controls ilişkisini taşır.
- Yeni alanlarda `TextField`, `TextAreaField` veya `SelectField` kullanılır; bu bileşenler etiket, sayaç/meta, ipucu, hata, `aria-invalid` ve `aria-describedby` ilişkisini birlikte kurar.

## 10. Tema davranışı

- İlk boyamadan önce kayıtlı veya sistem teması `app/layout.tsx` içinde uygulanır.
- Tema seçimi `listekutusu-theme` anahtarıyla tarayıcıda saklanır.
- Tema değiştirme tüm ana sayfa ve iç sayfa üst çubuklarında görünür.
- Bileşenlerde `[data-theme="light"]` ile tek tek yeni renk üretmek yerine semantik token kullanılır.
- Yeni görsel test her iki temada yapılır.

## 11. Hareket ve akıcılık

- Hızlı geri bildirim: 100 ms.
- Normal hover/tema geçişi: 160 ms.
- Panel/modal: en fazla 220 ms.
- Yalnız `transform`, `opacity`, renk ve gölge animasyonu tercih edilir.
- `prefers-reduced-motion` açıkken animasyon ve yumuşak kaydırma devre dışıdır.
- Skeleton alanları son içerik ölçüsünü yaklaşık koruyarak layout shift'i azaltır.

## 12. Erişilebilirlik kabul ölçütleri

1. Tüm işlemler klavye ile erişilebilir.
2. Görünür odak halkası vardır.
3. Metin 12 px altına düşmez.
4. Mobil buton hedefi 44 px civarındadır.
5. Durum yalnız renkle anlatılmaz; ikon veya metin eşlik eder.
6. Sayfa tek bir anlamlı `h1` içerir.
7. Dekoratif ikonlar `aria-hidden`, işlevsel ikonlar isimli kontrol içindedir.
8. 390 px genişlikte document seviyesinde yatay taşma olmaz.

## 13. Yeni bileşen kontrol listesi

- [ ] Renkler semantik tokenlardan geliyor.
- [ ] Açık ve koyu tema kontrol edildi.
- [ ] 390, 768, 1024, 1280 ve 1728 px kontrol edildi.
- [ ] Hover, focus, active, disabled ve loading durumları var.
- [ ] Metin ve uzun kelime taşması kontrol edildi.
- [ ] Boş, hata ve yükleme durumları tanımlı.
- [ ] İkon butonları erişilebilir isim taşıyor.
- [ ] Yeni genel CSS `globals.css` yerine doğru tasarım sistemi dosyasına eklendi.
- [ ] Tekrarlanan stil varsa ortak primitive'e taşındı.

## 14. Otomatik UI kalite kapısı

`npm run ui:check` aşağıdaki tasarım sistemi regresyonlarını build öncesinde durdurur:

- Büyük sayfa ve CSS dosyalarının belirlenen satır bütçesini aşması.
- TSX içinde 12 px altı metin sınıfı eklenmesi.
- TSX bileşenlerinde semantik token yerine ham HEX rengi kullanılması.
- Türkçe metinlerde bozuk UTF-8 dizisi oluşması.
- CSS sözdizimi hatası veya açık/koyu tema çekirdek tokenlarının kaybolması.
- Kullanılan bir `--ui-*` veya `--brand-*` tasarım tokenının tanımsız kalması.
- Eski uyumluluk CSS dosyalarında belirlenen ham renk bütçesinin yeniden büyümesi.

Ham renk bütçesi `tokens.css` ve `primitives.css` için uygulanmaz; bu iki dosya tasarım sisteminin renk kaynağıdır. `feature-surfaces.css`, `forum.css`, `interaction-refinements.css` ve `unified-surfaces.css` içindeki bütçe sıfırdır. Ana kabuğun özel marka/atmosfer efektlerini barındıran `globals.css` ile birlikte kalan toplam bütçe 72'dir ve yalnız aşağı yönlü güncellenir. Yeni özelliklerde bütçe artırmak yerine semantik token kullanılır.

`npm run a11y:check` ise TSX katmanında aşağıdaki statik erişilebilirlik sözleşmesini korur:

- Butonların açıkça `type` belirtmesi.
- Görsellerin `alt` metni taşıması.
- Yeni sekmede açılan bağlantıların güvenli `rel` niteliği kullanması.
- Pozitif `tabIndex` eklenmemesi ve kontrolsüz `autoFocus` kullanılmaması.
- Türkçe sayfa dili, skip link ve `main-content` hedefinin korunması.

Her iki denetim de `deploy:check` zincirine dahildir. TSX ve CSS katmanlarında 12 px altı metin bütçesi sıfırdır; yeni bir küçük metin kullanımı kalite kapısını doğrudan durdurur.

`npm run test:browser`, yerel geliştirmede Microsoft Edge; CI ortamında ise Playwright'ın taşınabilir Chromium sürümü üzerinde `/`, `/account`, `/discover`, `/forum`, `/legal`, `/control`, `/suggest`, `/admin` ve `/admin/forum` rotalarını açık/koyu tema ile `1728px` geniş ekran, `1280px` masaüstü, `1024px` küçük dizüstü, `768px` tablet ve `390px` mobil görünümde denetler. `PLAYWRIGHT_CHANNEL` verilirse tarayıcı kanalı açıkça seçilebilir. CI kurulumu ilk kez hazırlanırken `npm run test:browser:install` çalıştırılır. Test matrisi:

- Axe ile WCAG 2.0, 2.1 ve 2.2 A/AA ihlalleri.
- JavaScript çalışma zamanı hataları ve HTTP 500 yanıtları.
- Document düzeyinde yatay taşma ve yinelenen `id` değerleri.
- Ana içerik hedefinin görünürlüğü ve tema sözleşmesi.
- Hesap girişi, oturumlu hesap paneli, uzun hesap verisi ve hukuk sayfalarında beş viewport ve iki tema; dolu ana akış, forum, keşfet, profil ve yönetim yüzeylerinde geniş ekran/mobil uçlar için toplam 54 kalıcı görsel karşılaştırma.
- Dolu veri baseline'larında harici ve rastgele API yanıtları mock'lanır; görsel fark yalnız ürün kodundaki bilinçli değişiklikten oluşur.
- Ana akış ve keşfette beğeni, kaydetme, takip ve listeye ekleme; forumda durum filtresi ve sayfalama başarı/rollback davranışları beş viewport'ta sınanır. Profilin dolu veri görünümü ve giriş gerektiren istemci yönlendirmesi geniş/mobil uçlarda korunur. Toplam tarayıcı matrisi 220 senaryodur.
- Ana akışın açık temadaki boş durumunda ayrı kontrast ve erişilebilirlik regresyonu.

Referans görüntüler `tests/browser/__screenshots__` altında tutulur. Tasarım değişikliği bilinçliyse önce görüntüler gözle incelenir, ardından `npm run test:browser:update` ile güncellenir. Sıradan kod değişikliklerinde baseline otomatik yenilenmez.

`npm run contrast:check`, açık ve koyu temanın ana/ikincil/yardımcı metin, birincil buton, durum metni ve odak halkası çiftlerini WCAG kontrast formülüyle ölçer. Normal metinlerde 4.5:1, büyük/yardımcı ikincil metinde 4:1 ve işlevsel odak göstergesinde 3:1 alt sınırı build öncesinde korunur.

## 15. Geçiş sırası

1. Ana akış, navigasyon, profil ve forum gibi günlük kullanım yüzeyleri.
2. Hesap/listeler, keşfet ve öneri araçları.
3. Moderasyon ve yönetim ekranları.
4. Boş, hata, loading ve yasal sayfalar.
5. Yayın öncesi performans, erişilebilirlik ve görsel regresyon kontrolü.

Güvenlik anahtarı yenileme, token şifreleme ve production secret işlemleri görsel ürün çalışmasının arasına alınmaz. Bunlar yayına çıkmadan önce ayrı ve zorunlu bir son sertleştirme aşamasıdır.
