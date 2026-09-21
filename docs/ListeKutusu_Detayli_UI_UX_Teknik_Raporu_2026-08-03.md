# ListeKutusu Ayrıntılı UI/UX ve Teknik İnceleme Raporu

**Tarih:** 3 Ağustos 2026  
**İncelenen sürüm:** Yerel çalışma ağacındaki güncel kaynak kod  
**Birincil kapsam:** Masaüstü, koyu tema, `1280x720` çalışma görünümü  
**İkincil kapsam:** Mimari, erişilebilirlik, performans, SEO, güvenlik ve ölçeklenebilirlik  
**Bilerek ertelenen alanlar:** Mobil uyarlama, açık temanın nihai tasarımı ve üretim anahtarı/operasyon sertleştirmesi

---

## Proje Bilgisi

| Alan | Değerlendirme |
| --- | --- |
| Proje adı / türü | **ListeKutusu**; sosyal müzik keşfi, kişisel liste yönetimi, topluluk forumu ve sosyal oyunları bir araya getiren web uygulaması |
| Hedef kitle | Türkçe konuşan müzik meraklıları, yeni parça keşfetmek isteyen kullanıcılar, kişisel liste küratörleri ve arkadaşlarından kodla öneri toplamak isteyen liste sahipleri |
| Ana iş hedefi | Kullanıcıların düzenli olarak keşif akışına dönmesi, paylaşım/etkileşim üretmesi, kişisel listesine parça eklemesi ve gelecekte reklam ile kişiselleştirme odaklı premium modele zemin hazırlanması |
| İncelenen materyal | Yerel kaynak kod, `http://127.0.0.1:3000` üzerinde çalışan uygulama, Prisma şeması, testler, proje durum/roadmap belgeleri ve mevcut masaüstü ekranlar |
| Rakipler | Kullanıcı tarafından doğrudan rakip listesi verilmedi. Bağlamsal kıyas için Spotify/Last.fm türü müzik grafiği, Technopat Sosyal türü forum düzeni ve Facebook/X/Instagram türü sosyal akış kalıpları referans alındı; bu bölüm resmî rekabet araştırması değildir. |

## İnceleme Yöntemi ve Sınırlar

- Uygulamanın 18 sayfa rotası, ortak bileşenleri, route layout'ları, stilleri, API katmanı, Prisma şeması ve test araçları incelendi.
- Ana kullanıcı rotaları masaüstü koyu temada çalıştırıldı: `/`, `/discover`, `/forum`, `/games`, `/suggest`, `/u/listekutusu-editor`, `/legal`, `/account?mode=login`.
- Yatay taşma, başlık yapısı, etiketsiz alanlar, adsız buton/bağlantılar, konsol hataları ve içerik hazır olma süreleri gözlendi.
- Ölçümler yerel **geliştirme sunucusundan** alınmıştır. Bunlar gerçek kullanıcı Core Web Vitals verisi değildir; ağ, cihaz ve production cache koşullarını temsil etmez.
- Mobil ve açık tema, mevcut ürün kararı gereği ayrıntılı görsel matrise alınmadı. Bu alanlar “tamamlandı” kabul edilmemelidir.
- Rakip analizi gözlemlenebilir sektör kalıpları düzeyindedir. Fiyat, pazar payı ve dönüşüm kıyaslaması için ayrı araştırma gerekir.

---

# Yönetici Özeti

1. **Ürün artık güçlü bir özellik prototipi, ancak tek parça bir ürün deneyimi değil.** Sosyal akış, keşif, forum, profil, liste yönetimi ve oyunlar işlevsel bir omurga oluşturuyor; buna rağmen sayfalar ortak ve kalıcı bir uygulama kabuğu içinde akmadığı için geçişler “aynı ürünün bölümleri” yerine ayrı ekranların yüklenmesi gibi hissediyor.
2. **Koyu tema görsel yönü başarılı fakat yoğunluk yöntemi hatalı.** `app/styles/primitives.css:689` civarındaki `.desktop-density-80 { zoom: 0.8; }` yaklaşımı ekrana daha fazla içerik sığdırıyor, fakat metinleri ve sık kullanılan hedefleri küçültüyor. Yoğunluk; `zoom` yerine ölçü, grid ve tipografi token'larıyla kurulmalı.
3. **Tasarım sistemi var, tamamlanmış değil.** Renk, tipografi, hareket ve kontrol token'ları iyi bir temel sunuyor; buna karşılık `ui:check` hâlâ tanımsız token, 11 px metin ve ham renk bütçesi hataları veriyor. Büyük ve katmanlı CSS dosyaları görsel sapma riskini artırıyor.
4. **İlk boyama ile kullanılabilir içerik arasında hissedilir boşluk var.** Yerel geliştirme ölçümlerinde ana akış yaklaşık 2,2 sn, forum 2,4 sn, oyunlar 4,0 sn ve profil 6,0 sn içinde iskeletsiz içeriğe ulaştı. Özellikle profil ve oyun ekranlarında route'a özel streaming/loading ve daha küçük veri sözleşmeleri gerekiyor.
5. **Profesyonel ürüne en büyük sıçramayı yeni özellik değil, kabuk ve akış standardizasyonu sağlar.** Kalıcı sol menü/topbar, route'a özel loading sınırları, küçük hedeflerin büyütülmesi, istemci tarafı toplu veri çekimlerinin azaltılması ve tutarlı sayfa ritmi tamamlanmadan ek özellikler mevcut kalite açığını büyütür.

**Mevcut seviye:** Masaüstü koyu tema özellik prototipi yaklaşık **%85**; halka açık, ölçeklenebilir ve üretim kalitesindeki ürün hazırlığı yaklaşık **%68**.

---

# 1. Genel Tasarım Dili ve Marka Tutarlılığı

## Güçlü Yönler

- Koyu lacivert zemin, camgöbeği birincil vurgu, yeşil başarı ve mor ikincil vurgu birlikte ayırt edilebilir bir ListeKutusu kimliği oluşturuyor.
- `app/styles/tokens.css` içinde arka plan, yüzey, metin, durum, radius, kontrol yüksekliği ve hareket sürelerinin merkezileştirilmiş olması doğru tasarım sistemi temeli.
- Lucide ikonlarının yaygın kullanımı, manuel ve tutarsız SVG üretimini azaltıyor.
- Ölçülen temel kontrast çiftleri WCAG AA düzeyini geçti: ana metin/sayfa `18.66:1`, ikincil metin/sayfa `9.38:1`, muted metin/kart `5.15:1`.
- Oyunlar, profil ve hesap girişi gibi gelişmiş ekranlar ürünün “premium koyu tema” yönünü taşıyabilecek görsel kaliteye yaklaşmış durumda.

## Temel Problemler

| Problem | Kanıt | Kullanıcıya etkisi | Önem | Önerilen çözüm |
| --- | --- | --- | --- | --- |
| Yoğunluk `zoom: 0.8` ile sağlanıyor | `app/styles/primitives.css:689`, `app/page.tsx:338`, `app/account/page.tsx:419` | Metinler ve tıklama hedefleri fiziksel olarak küçülüyor; ürün tarayıcı küçültülmüş gibi hissediyor | Kritik tasarım borcu | `zoom` kaldırılmalı; `comfortable` ve `compact` yoğunluk token'ları grid gap, satır yüksekliği ve padding üzerinden tanımlanmalı |
| Tasarım token'ları tam uygulanmamış | `ui:check`: `--ui-text-faint`, `--ui-text-base` tanımsız; profil CSS'inde 26 ham renk | Benzer bileşenler farklı ton/ölçüye kayabiliyor; bakım zorlaşıyor | Yüksek | Eksik token'ları tanımla veya mevcut token'larla değiştir; ham renk bütçesini sıfıra yaklaştır |
| Global CSS katmanı çok büyük | `primitives.css` ~129 KB, `profile.css` ~27 KB; `app/layout.tsx` profil CSS'ini küresel yüklüyor | CSS eşleştirme maliyeti ve çakışma riski artıyor; sayfaya özel görsel kurallar tüm ürünü etkiliyor | Yüksek | Profil CSS'ini route/layout kapsamına taşı; primitives dosyasını kontrol, shell, feed, utility katmanlarına böl |
| Fazla sınır/blur/gölge katmanı | CSS'te 43 `backdrop-filter`, 74 `!important` | Özellikle yoğun ana akışta kartlar birbirleriyle yarışıyor, derinlik hiyerarşisi zayıflıyor | Orta | Blur'u yalnız topbar/modal/özel overlay'de tut; sıradan listelerde düz yüzey + ince border kullan |
| Sayfa başlık ölçekleri farklı | Discover, Games ve Profile hero blokları farklı dikey ritim kullanıyor | Sayfalar ortak ürün yerine ayrı mikro siteler gibi algılanıyor | Yüksek | Tek `PageHeader` sözleşmesi: compact, standard, hero varyantları; sabit üst/alt boşluklar |

## Önerilen Koyu Tema Renk Sistemi

Mevcut yön korunmalı; yeniden marka değişimi gerekmiyor. Ama kullanım kuralları sıkılaştırılmalı.

| Rol | HEX | Kullanım |
| --- | --- | --- |
| Sayfa arka planı | `#080B12` | Ana uygulama zemini |
| Yükseltilmiş zemin | `#0D131D` | Kalıcı sidebar/topbar |
| Kart | `#111824` | Akış kartı, form paneli |
| Yükseltilmiş kart | `#17202D` | Hover/seçili panel, modal |
| Ana metin | `#F7F9FC` | Başlık ve birincil içerik |
| İkincil metin | `#A9B4C4` | Meta veri ve açıklamalar |
| Zayıf metin | `#7F8B9D` | Zaman, sayaç, yardımcı bilgi; küçük metinde dikkatle |
| Kenarlık | `#2A3748` | Standart yüzey ayrımı |
| Ana vurgu | `#48C7E8` | Birincil CTA, seçili navigasyon |
| İkincil vurgu | `#8F7CF6` | Oyun/özel içerik, sınırlı kullanım |
| Topluluk vurgusu | `#35C99A` | Takip, başarı, olumlu durum |
| Başarı | `#35C98A` | Başarı bildirimi |
| Uyarı | `#F3B64B` | Bekleme/dikkat |
| Hata | `#F1737F` | Silme/hata; ana CTA yerine kullanılmamalı |
| Disabled | `#566273` | Pasif ikon/metin; yüzeyden hâlâ ayrışmalı |

## Tipografi Sistemi

`Segoe UI Variable`/sistem font zinciri ürün için uygun. Sorun font seçimi değil, ölçek ve yoğunluk uygulaması.

| Rol | Öneri | Kullanım |
| --- | --- | --- |
| Ekran başlığı | 32 px / 1.15 / 750 | Yalnız sayfa hero başlığı |
| Sayfa başlığı | 26 px / 1.2 / 700 | Standart üst bar başlığı |
| Bölüm başlığı | 20 px / 1.3 / 700 | Akış bölümü, sağ ray başlığı |
| Kart başlığı | 16 px / 1.35 / 650 | Şarkı, konu, oyun kartı |
| Normal metin | 15–16 px / 1.55 / 400 | Açıklama ve gövde |
| İkincil metin | 13–14 px / 1.45 / 450 | Meta bilgi |
| Buton | 14–15 px / 1 / 650 | En az 36–40 px kontrol yüksekliği |
| Form etiketi | 13 px / 1.3 / 650 | Alan üstü etiket |
| Mikro metin | 12 px / 1.4 / 500 | Yasal/yardım; 12 px altına inilmemeli |

---

# 2. Sayfa Yapısı ve Bilgi Mimarisi

## Genel Değerlendirme

Ana bilgi mimarisi anlaşılır bir omurgaya sahip: Akış, Keşfet, Forum, Kaydedilenler/Profil, Liste ve Oyunlar. Sorun, bu omurganın bütün sayfalarda aynı kalıcı kabukla taşınmaması. Ana sayfada özel `HomeTopbar/HomeSidebar`, diğer ekranlarda `PageTopbar`, forum ve oyunlarda route'a özel layout kullanılması geçiş anında yapının değişiyormuş gibi görünmesine neden oluyor.

## Önerilen Uygulama Kabuğu

```text
AppShell
├── PersistentSidebar
├── PersistentTopbar
├── RouteProgress
└── ContentViewport
    ├── PageHeader (compact / standard / hero)
    ├── RouteLoadingBoundary
    └── PageContent (1 / 2 / 3 column templates)
```

- Sidebar ve topbar route değişiminde yeniden kurulmayacak.
- `app/(social)/layout.tsx` gibi bir route group, ana sosyal deneyimi ortak shell altında toplamalı.
- Hesap/auth, admin ve tam ekran oyun oturumları ayrı shell varyantı kullanabilir.
- Geri butonu yalnız bağlamsal alt sayfalarda gösterilmeli; ana navigasyon köklerinde gösterilmemeli.
- `PageTopbar` içindeki varsayılan `/` dönüşü yerine gerçek bağlam (`forum`, `games`, profil kaynağı) korunmalı.

## Sayfa Bazlı İnceleme

| Sayfa / rota | Amaç ve ana işlem | Güçlü yön | Sorun / risk | Önerilen yapı |
| --- | --- | --- | --- | --- |
| Ana akış `/` | Keşif, paylaşım, listeye ekleme | Zengin sosyal içerik, sağ ray ve best-of bölümü | Üç kolon + %80 zoom küçük hedefler oluşturuyor; ilk veri istemciden geliyor | Kalıcı shell; 680–760 px okunabilir feed; sağ ray sabit ama sade; ilk 5 gönderiyi server render/stream |
| Hesap `/account` | Giriş, kayıt, hesap ayarı | Net iki kolon ve güçlü birincil CTA | Dosya 621 satır; panel modunda density zoom; farklı alt modlar aynı büyük bileşende | Auth ve settings bileşenlerini ayır; ortak form primitive; giriş sonrası hedefe dönüş |
| Admin `/admin` | Sistem ve Spotify sahibi yönetimi | İşlevler tek yerde | Operasyon araçları sosyal tasarımla aynı görsel ağırlıkta; geniş dosya | Düşük dekorlu operasyon shell'i, görev bazlı sekmeler ve audit özeti |
| Forum moderasyon `/admin/forum` | Konu/yorum onayı | Rol ayrımı mevcut | Filtre/karar akışında toplu işlem ve yoğunluk standardı doğrulanmalı | Moderasyon kuyruğu, klavye kısayolu, neden şablonları, sabit filtre barı |
| Liste kontrolü `/control` | Onaylı şarkıları düzenleme | Ayrı iş akışı doğru karar | Başka liste ekranlarıyla bilgi ve eylem tekrarı | Hesap içindeki “Listem” alanıyla aynı veri bileşenlerini paylaş; üstte tek ana CTA |
| Keşfet `/discover` | Kullanıcı/parça keşfi | Editorial hero ve sosyal keşif hedefi güçlü | 250 gönderi + 100 hesap istemciye geliyor; kalıcı “hazırlanıyor” sentinel ölçümü yanıltıyor | Server-side sayfalama, arama sonuç modu, ayrı kullanıcı/parça sekmeleri, gerçek sona ulaşma durumu |
| Forum `/forum` | Konu keşfi ve tartışma | Kategori rayı ve Technopat benzeri tarama mantığı | İlk iskelet ile gerçek içerik arasında ~2,4 sn; kategori sayıları için 1000 kayıt | İlk sayfayı server render; kategori sayaçlarını aggregate sorgu; route'a özel skeleton |
| Forum konusu `/forum/[slug]` | Konuyu okuma ve yanıtlama | Derin link ve tartışma yapısı | Dinamik metadata yok; uzun yorumlarda konum kaybı riski | Konu metadata/JSON-LD; sabit yanıt CTA; sayfalı yorum ve son okunana dön |
| Yeni konu `/forum/new` | Moderasyona konu gönderme | Alan sınırları ve doğrulama temeli | Form terk etme/geri dönüş güveni zayıf olabilir | Taslak autosave, kategori açıklaması, gönderim sonrası net moderasyon durumu |
| Oyunlar `/games` | Oyun keşfi ve aktif odaya giriş | En güçlü görsel sayfalardan biri | İçeriğe hazır olma ~4 sn; oyun durumu sorguları sayfa algısını ağırlaştırıyor | Oyun kataloğunu statik/server render, canlı odaları ayrı stream; kart CTA'larını standartlaştır |
| Tavla `/games/backgammon/[id]` | Canlı Türk tavlası | Kapsamlı mekanik ve görsel tasarım | Gerçek zamanlı/polling, canvas arka planı ve tahta aynı anda maliyet üretebilir | Tam ekran game shell; animasyon kalite seviyesi; yalnız görünür/aktif turda polling |
| Yeni tavla `/games/backgammon/new` | Oda oluşturma | Akış ayrı tutulmuş | Oda seçenekleri ile ürün dili sade kalmalı | 3 adımlı değil tek form; “Herkese açık” varsayılanı ve net katılımcı bilgisi |
| Eleme oyunu `/games/elimination/[id]` | Çok oyunculu şarkı eşleşmesi | Eşzamanlı karar modeli ayırt edici | YouTube gömme belirsizliği akışı kırabiliyor; medya yükü yüksek | Video uygunluk ön kontrolü; ses/görsel fallback; aşama ve bekleyen oyuncu durumu sabit başlıkta |
| Yeni eleme `/games/elimination/new` | Oda ve şarkı seçimi | Dört şarkı kurgusu net | Uzun seçim akışında ilerleme ve hata geri kazanımı önemli | Adım göstergesi, seçili 4 parça özeti, oda oluşmadan embed sorgusu yapmama |
| Yasal `/legal` | Kullanım/gizlilik bilgisi | Okunabilir ve erişilebilir temel | İlk soğuk yük yerelde uzun; içerik navigasyonu zayıf | Statik server sayfası, içerik tablosu, güncelleme tarihi ve sürüm |
| Paylaşım `/p/[id]` | Tek gönderi ve yorum | Paylaşılabilir URL yapısı | Ana akış kabuğu ile bağlamın korunması gerekir | Feed kartını yeniden kullan; paylaşım metadata/JSON-LD; “akışa dön” bağlamı |
| Şarkı öner `/suggest` | Hesapla listeye toplu öneri | Manuel URL yedeği ve Spotify araması güçlü | Oturumsuz kullanıcı redirect ile bağlam kaybedebilir; rota metadata/noindex eksik | Giriş ekranına `next` ile dön; son girilen kodu güvenli geçici state'te tut; noindex |
| Profil `/u/[slug]` | Kullanıcı kimliği, paylaşımlar, takip | Güçlü hero ve sosyal sinyal bileşenleri | İki `H1`; içerik ~6 sn; fazla eşzamanlı veri grubu | Tek H1; profil özeti server render; sekmeleri lazy/stream; ağır sayımları geciktir |
| Not found / error / loading | Hata ve bekleme yönetimi | Ortak dosyalar mevcut | Tek genel `app/loading.tsx` tüm rotaların düzenini temsil etmiyor | Sosyal, forum, profil, oyun ve auth için route'a özel loading/error sınırları |

## Navigasyon ve CTA İlkeleri

- Bir sayfada yalnız bir **görsel olarak baskın** CTA bulunmalı. Diğer eylemler secondary/ghost olmalı.
- Ana navigasyon köklerinde geri butonu yerine seçili sidebar öğesi kullanılmalı.
- Alt sayfalarda geri butonu aynı sol üst koordinatta kalmalı ve bağlama dönmeli.
- Profil menüsü, tema/ayar ve çıkış eylemleri tek hesap menüsünde gruplanmalı.
- Anonim kullanıcı için “Giriş yap” birincil, “Kayıt ol” ikincil olmalı; aynı viewport'ta tekrarlanan CTA'lardan kaçınılmalı.

---

# 3. Kullanıcı Deneyimi ve Kullanılabilirlik

## Bulgular

| Problem | Sayfa/bileşen | Etki | Önem | Çözüm | UX katkısı |
| --- | --- | --- | --- | --- | --- |
| Küçük sık kullanılan hedefler | Ana akış sekmeleri 29 px, konu chip'leri 24 px, bazı ikonlar 29–30 px; forum arama/sıralama kontrolleri 19–20 px | Hızlı kullanım ve motor erişilebilirlik zayıflar | Yüksek | Sık kullanılan kontroller min. 36 px; chip min. 28–32 px; ikon buton 40 px | Daha az yanlış tıklama, daha rahat tarama |
| Profilde iki H1 | `PageTopbar.tsx:41` ve `ProfileHeroV3.tsx:30` | Ekran okuyucu/SEO hiyerarşisi bozulur | Orta | Topbar başlığını profil rotasında `div/p`, profil adını tek H1 yap | Daha net belge yapısı |
| Genel loading gerçek sayfayı temsil etmiyor | `app/loading.tsx` tek global iskelet | Geçişte layout sıçraması ve “başka sayfa” hissi | Yüksek | Route group başına skeleton; ölçüler son içerikle aynı | Daha akıcı, güven veren geçiş |
| İstemci veri beklerken sayımlar sıfır görünüyor | Discover/forum ilk kare | Kullanıcı gerçek 0 ile yüklenmeyi ayıramıyor | Orta | Sayaç skeleton'ı veya server data; 0'ı veri gelmeden render etme | Yanlış anlamayı önler |
| Geri davranışı bağlamı her zaman korumuyor | `PageTopbar` varsayılan `backHref="/"` | Kullanıcı akış ortasında ana sayfaya sıçrayabilir | Orta | `returnTo`/route context; gerektiğinde `router.back()` + güvenli fallback | Yön duygusunu korur |
| İşlem sonucu dili farklı bileşenlere dağılabilir | Toast 17, ConfirmDialog 10 dosyada kullanılıyor ancak tüm akışlar primitive'e taşınmamış | Hata/başarı geri bildirimi tutarsızlaşabilir | Orta | Tüm mutasyonlarda ortak toast sözleşmesi ve hata kodu eşlemesi | Öğrenilebilirlik ve güven |
| Kritik silme/çıkış davranışları merkezi değil | Farklı hesap/liste/forum akışları | Yanlış işlem veya belirsizlik | Yüksek | Destructive eylem için tek ConfirmDialog; açıklayıcı sonuç; loading lock | Hatalı işlemleri azaltır |

## Erişilebilirlik

### Doğrulananlar

- Otomatik statik kontrolde 191 butonun `type` niteliği, 2 görselin `alt` metni, 13 yeni sekme bağlantısının `rel` değeri ve autofocus kullanımı geçti.
- İncelenen sekiz masaüstü rotada adsız buton/bağlantı, etiketsiz form alanı ve yatay taşma görülmedi.
- Focus ring ve `prefers-reduced-motion` desteği `app/globals.css` içinde var.
- Ana koyu tema kontrast çiftleri WCAG AA eşiğini geçti.

### Eksikler

- Hedef boyutu, özellikle `zoom: 0.8` sonrasında sık kullanılan kontrollerde yetersiz. WCAG 2.2 minimumu 24x24 px olsa da sosyal masaüstü uygulamasında sık eylemler için 36–44 px daha doğru ergonomik hedeftir.
- Tam klavye akışı, modal focus trap, oyun tahtası klavye alternatifi ve ekran okuyucu canlı bölge davranışı gerçek yardımcı teknolojiyle ayrıca test edilmelidir.
- Renk dışında durum anlatımı büyük ölçüde iyi görünse de oyun hedefleri ve seçili durumlar ikon/metinle de doğrulanmalı.
- Açık tema test kapsamı ertelendiği için kullanıcıya sunulmamalı; tema düğmesi açık kalırsa eksik bir deneyime erişim verir.

---

# 4. Dönüşüm Optimizasyonu (CRO)

ListeKutusu'nun birincil dönüşümü bugün ödeme değil; **hesap oluşturma, ilk paylaşım, ilk listeye ekleme ve ilk takip**. Bu nedenle dönüşüm hunisi bu dört olaya göre tanımlanmalı.

## Mevcut Durum

- Hesap sayfasında tek güçlü birincil CTA ve yasal/güven metinleri iyi.
- Ana akış anonim kullanıcıya içerik değerini gösterme potansiyeline sahip; giriş duvarı ürünü denemeden önce gelmemeli.
- “Şarkı paylaş”, “Ekle”, “Takip et” gibi eylemler ürünün çekirdek değerini görünür kılıyor.
- Sağ ray görevleri etkileşimi teşvik ediyor fakat ilk kez gelen kullanıcı için ana değerden daha baskın olmamalı.

## Sürtünmeler

- Geçişlerin tam ekran yenileniyormuş gibi hissedilmesi keşif zincirini kesiyor.
- Aynı viewport'ta birden fazla giriş/kayıt çağrısı bulunması karar yükünü artırabilir.
- İstemci veri beklerken boş/sıfır içerik görülmesi sosyal kanıtı zayıflatıyor.
- Liste/Spotify özelliklerinin güçlü olması, sosyal keşif ana önerisini gölgeleyebilir; bilgi mimarisinde “kişisel araç” ikincil kalmalı.

## A/B Test Hipotezleri

| Hipotez | A varyantı | B varyantı | Başarı metriği |
| --- | --- | --- | --- |
| Anonim paylaşım kapısı | Tıklamada doğrudan login redirect | Kart içinde kısa değer anlatımı + login modal | Giriş başlatma ve tamamlama oranı |
| Kalıcı shell | Mevcut tam sayfa geçiş | Kalıcı sidebar/topbar + route progress | Oturum başına görüntülenen sayfa, geri dönüş, geçiş terk oranı |
| Sosyal kanıt | Yalnız CTA | CTA yanında “bu ay X listeye eklendi” | Listeye ekleme ve takip dönüşümü |
| Akış yoğunluğu | Mevcut compact/%80 | 720 px rahat feed, daha büyük hedefler | Scroll derinliği, yanlış tıklama, etkileşim oranı |
| Keşfet başlangıcı | Editorial hero | Arama + ilgi alanı chip'leri önce | İlk anlamlı etkileşime kadar süre |

Analitik altyapısı kurulmadan A/B test sonuçları güvenilir ölçülemez. Önce olay sözlüğü oluşturulmalı: `signup_started`, `signup_completed`, `first_post`, `track_added`, `user_followed`, `forum_topic_opened`, `game_joined`.

---

# 5. Performans ve Teknik Optimizasyon

## Yerel Masaüstü Gözlemleri

| Rota | İskelet/yükleme göstergesi bitene kadar yaklaşık süre | Not |
| --- | ---: | --- |
| `/` | 2,17 sn | Ana içerik istemci isteklerini bekliyor |
| `/forum` | 2,42 sn | İlk iskelet hızlı, gerçek konu/sayaçlar sonra geliyor |
| `/games` | 4,03 sn | Katalog ile canlı durum aynı algısal yük içinde |
| `/u/listekutusu-editor` | 5,95 sn | Zengin profil verisi ve sekmeler |
| `/discover` | İlk gerçek içerik yaklaşık 4 sn | Sonsuz kaydırma sentinel'i sürekli “hazırlanıyor” metni taşıdığı için otomatik bitiş ölçümü güvenilir değil |

Bu süreler production LCP/INP değildir. Gerçek hedefler production RUM verisinde p75 için LCP `<=2.5 sn`, INP `<=200 ms`, CLS `<=0.1` olmalıdır.

## Teknik Bulgular

| Problem | Muhtemel neden / kanıt | Kullanıcı etkisi | Optimizasyon | Beklenen kazanım | Öncelik |
| --- | --- | --- | --- | --- | --- |
| Sayfa geçişi sırasında shell korunmuyor | Topbar/sidebar sayfa bileşenlerinde; tek kök loading | Tam ekran değişim ve gecikme hissi | Route group `AppShell`, nested layouts ve Suspense | Daha hızlı algılanan geçiş, daha az CLS | Kritik |
| İlk içerik çoğunlukla istemci isteğini bekliyor | Ana sayfa feed/account/leaderboard fetch'leri; Discover ve Forum client fetch | Önce boş/skeleton sonra içerik | İlk sayfayı Server Component üzerinden getir, etkileşimleri client island yap | Daha erken içerik, daha az JS | Yüksek |
| Discover toplu veri çekiyor | `app/api/discover/route.ts:43` 250 paylaşım, `:77` 100 hesap ve istemci sıralaması | Veri büyüdükçe transfer/CPU hızla artar | Cursor pagination, server ranking, yalnız görünür bölüme gerekli alanlar | Ölçeklenebilir sabit yanıt boyutu | Kritik büyüme riski |
| Forum kategori sayımı geniş sorgu | `app/api/forum/route.ts:74` 1000 kayıt | Forum büyüdükçe gecikme | DB aggregate/groupBy veya denormalize sayaç | Daha düşük DB ve transfer maliyeti | Yüksek |
| Profil çok sayıda veri grubunu aynı anda ister | `lib/publicProfile.ts:94` sekiz paralel grup | İlk kullanılabilir profil gecikir | Özeti önce; sekme içeriğini lazy stream; sayaç cache | Profil ilk görünümü hızlanır | Yüksek |
| CSS yükü ve çakışma riski | `primitives.css` ~129 KB, `games.css` ~93 KB, global `profile.css` | Stil hesaplama/bakım maliyeti | Route-scope CSS, kullanılmayan selector temizliği, katmanları böl | Daha küçük route CSS ve daha az regresyon | Yüksek |
| Büyük client bileşen oranı | App TS/TSX dosyalarının %40,1'i `use client` | Hydration ve JS maliyeti | Server-first sayfalar, küçük etkileşim adaları | Daha düşük bundle/hydration | Orta-yüksek |
| Global ambient canvas sürekli çalışıyor | `AmbientMusicBackground.tsx`: 104 nota, normalde ~30 fps | Zayıf cihazda pil/CPU; oyunla yarışabilir | Otomatik kalite, görünürlük/idle azaltma, kullanıcı “düşük efekt” seçeneği | Daha stabil INP/scroll | Orta |
| In-memory rate limiter | `lib/rateLimit.ts` içindeki `Map` | Çok instance deployment'ta tutarsız limit | Redis/Upstash benzeri paylaşımlı store | Doğru dağıtık koruma | Release öncesi |
| SQLite sınırı | Prisma SQLite | Eşzamanlı yazma ve ölçek sınırı | PostgreSQL migration planı ve load testi | Üretim dayanıklılığı | Release öncesi |

## Sayfa Geçişleri İçin Özel Plan

1. Sosyal rotaları `app/(social)/layout.tsx` altında ortak `AppShell` içine taşı.
2. Sidebar/topbar'ı layout'ta tut; route değişiminde DOM'da sabit kalsın.
3. `loading.tsx` dosyalarını en az `social`, `forum`, `profile`, `games`, `account` gruplarına ayır.
4. Navigation başlangıcında 100–160 ms sonra beliren ince route progress göstergesi kullan; çok hızlı geçişte hiç görünmesin.
5. Link prefetch'i kritik rotalarda açık tut; büyük dinamik profil/konu rotalarında hover/focus intent prefetch uygula.
6. İlk görünür veriyi server render/stream et; beğeni, takip, sekme ve sonsuz kaydırmayı client island olarak bırak.
7. Mevcut performans bütçesini daralt: sıcak route geçiş hedefi yerel production testinde `<1.5 sn`, transfer `<2 MB`; Discover, Profile ve Account'u teste ekle.
8. Production deployment sonrası Web Vitals'ı gerçek kullanıcı verisiyle topla; yerel geliştirme süresini başarı metriği olarak kullanma.

## Animasyon ve Akıcılık

- Mikro etkileşim: `100–160 ms`.
- Menü/panel açılışı: `160–220 ms`.
- Sayfa içerik girişleri: en fazla `220 ms`, yalnız opacity + transform.
- Skeleton shimmer yerine düşük maliyetli sabit pulse tercih edilmeli.
- `box-shadow`, `filter` ve `backdrop-filter` animasyonu yapılmamalı; yalnız compositor dostu `transform`/`opacity`.
- Optimistic update: beğeni, kaydetme, takip ve listeye ekleme için uygun; başarısızlıkta geri alma + toast.
- Oyun animasyonları uygulama shell animasyonlarından bağımsız kalite profiline sahip olmalı.

---

# 6. SEO ve İçerik Yapısı

## Güçlü Yönler

- Kök metadata title template, açıklama, Open Graph ve Twitter alanlarına sahip.
- Discover ve dinamik profil rotalarında canonical/metadata mevcut.
- Account, admin ve control rotaları noindex ile korunuyor.
- Manifest, robots, sitemap ve icon route'ları bulunuyor.

## Eksikler

| Problem | Kanıt | Etki | Çözüm |
| --- | --- | --- | --- |
| Forum ve Games generic başlık kullanıyor | Route layout'larında metadata yok | Arama sonucu ve sekme bağlamı zayıf | Route metadata title/description/canonical ekle |
| Forum konu metadata'sı dinamik değil | `/forum/[slug]` | Paylaşılan linkin başlık/özet kalitesi düşer | `generateMetadata`, Open Graph ve `DiscussionForumPosting` JSON-LD |
| Yapısal veri yok | JSON-LD bulunmuyor | Arama motoru içerik türünü daha zor anlar | ProfilePage, DiscussionForumPosting ve MusicRecording bağlantı şemaları; yalnız yerel veriyi temsil et |
| Sitemap dinamik içeriği kapsamıyor | Profil, konu, paylaşım ve oyun katalog rotaları eksik | Keşfedilebilirlik azalır | Yayınlanmış profiller/konular/paylaşımlar için dinamik sitemap; özel oyun odalarını ekleme |
| `/suggest` sitemap'te ama araç/özel akış | Sitemap listesi | Düşük değerli indeks sayfası | `noindex` + sitemap'ten çıkar; paylaşılabilir davet sayfası ayrıysa onu tanımla |
| Başlık hiyerarşisi profil rotasında bozuk | İki H1 | Semantik sinyal bölünüyor | Tek H1 |

SEO, sosyal ürünün ilk aşamasında ana büyüme kanalı olmayabilir; ancak forum konuları yüksek niyetli organik trafik için en güçlü içerik varlığıdır. Bu nedenle SEO yatırımı önce forum konu sayfalarına yapılmalı.

---

# 7. Rakip ve Sektör Kalıbı Kıyaslaması

Doğrudan rakip listesi verilmediği için aşağıdaki bölüm ürün kalıbı kıyasıdır.

## Güçlü Olduğu Alanlar

- Spotify benzeri salt katalog yerine topluluk tarafından oluşturulan bağlam ve forum tartışması sunması farklılaşma yaratıyor.
- Technopat türü kategorili forum ile sosyal akışı aynı hesap grafiğinde birleştirmesi güçlü bir çekirdek.
- Listeye ekleme sinyali, basit “beğeni”den daha anlamlı bir müzik kalite ölçüsü olabilir.
- Oyunlar topluluk geri dönüşü için özgün bir yardımcı döngü sunuyor.

## Zayıf Olduğu Alanlar

- Büyük sosyal uygulamalardaki kalıcı shell, anlık route geçişi ve içerik önbelleği hissi henüz yok.
- Last.fm/Spotify benzeri kişisel müzik kimliği, tutarlı ilgi grafiği ve öneri açıklanabilirliği erken aşamada.
- Forumun organik içerik keşfi için metadata, son okunana dönüş, taslak ve bildirim bağları tamamlanmalı.
- Sosyal kanıt ve onboarding olayları ölçülmediği için kullanıcı tutma varsayımları doğrulanamıyor.

---

# 8. Ortak Bileşen ve Tasarım Sistemi Analizi

## Mevcut İyi Temel

- `app/components/ui/Button.tsx`: primary/secondary/danger/ghost, boyut, loading ve aria durumu.
- Card, Field ve Checkbox primitive'leri label/error/hint ilişkisini destekliyor.
- Toast ve ConfirmDialog birçok rotada kullanılıyor.
- Token dosyası renk, radius, kontrol boyutu ve hareketi merkezileştiriyor.

## Tamamlanması Gerekenler

1. `Button`, `IconButton`, `Chip`, `Tabs`, `Field`, `Select`, `Card`, `ListRow`, `Toast`, `Dialog`, `PageHeader`, `EmptyState`, `Skeleton` tek dokümante sözleşmeye bağlanmalı.
2. Bütün sık kullanılan kontroller `sm=36`, `md=40`, `lg=44/48`, `icon=40` fiziksel yüksekliğe sahip olmalı.
3. Kart radius değeri en fazla 8–10 px; yalnız modal/hero için daha büyük değer kullanılmalı.
4. Kart içinde kart kullanımını azaltmak için `section`, `list`, `list-row` ayrımı yapılmalı.
5. `!important` sayısı azaltılmalı; specificity katmanları `@layer reset, tokens, primitives, features, utilities` ile yönetilmeli.
6. Ham renk yasaklaması yeni dosyalarda sıfır toleransla uygulanmalı; mevcut borç kademeli azaltılmalı.
7. Storybook şart değil; uygulama içi `/dev/ui` veya statik “component gallery” geliştirme ekranı daha düşük maliyetli başlangıç olabilir.

---

# 9. Kod Kalitesi ve Proje Mimarisi

## Güçlü Yönler

- App Router, API rotaları ve Prisma modeli alan bazında anlaşılır.
- Feed ve birçok sosyal liste cursor/sayfa temelli sınırlara sahip.
- Oturum, rol, forum, oyun ve bildirimler için ayrı servis/modül sınırları oluşmuş.
- Test paketi unit, smoke, API/E2E, erişilebilirlik, kontrast ve görsel kontroller içeriyor.
- Veritabanı şemasında çok sayıda anlamlı unique/index tanımı bulunuyor.

## Borçlar

- `app/discover/page.tsx`, `BackgammonBoard.tsx`, `AccountProfilePanel.tsx`, `ProfileClient.tsx`, `app/admin/page.tsx`, `app/account/page.tsx` gibi 20–33 KB bileşenler görünüm, fetch ve iş mantığını aynı yerde topluyor.
- 105 `fetch` kullanımı ortak API client/hata sözleşmesinin kısmen dağınık olduğunu gösteriyor.
- İstemci bileşen oranı sosyal ürün için yüksek; server/client sınırları yeniden çizilmeli.
- Tasarım davranışı farklı CSS dosyalarında tekrar ediyor; `!important` ve ham renk sayısı bu borcun ölçülebilir sonucu.
- Kök layout çok sayıda global stil katmanı yüklüyor.

## Önerilen Mimari Ayrım

```text
app/(social)/...        Route ve server data composition
components/ui/...       Saf tasarım primitive'leri
components/shell/...    Sidebar, topbar, page header, route progress
features/feed/...       Feed view + client actions
features/profile/...    Summary, tabs, follow actions
features/forum/...      Directory, thread, composer, moderation
features/lists/...      Personal list, suggestion, import, sync
features/games/...      Game shell ve oyun başına modül
lib/api/...             Typed response/error helpers
lib/queries/...         Prisma read models
lib/actions/...         Mutations / authorization
```

---

# 10. Veri Tabanı ve API

## Doğru Uygulamalar

- Feed cursor pagination ve `take + 1` yaklaşımı kullanıyor.
- Bildirim, bağlantı, forum ve profil listelerinde sayfa sınırları mevcut.
- Oturum, öneri, paylaşım, forum, oyun ve bildirim alanlarında indeksler bulunuyor.
- Yetki denetimi çoğunlukla sunucu tarafında ve sahip/rol tabanlı yapılıyor.

## Öncelikli İyileştirmeler

1. Discover için tek büyük yanıt yerine üç endpoint/read model: `feed`, `people`, `topics`; her biri cursor'lı.
2. Forum kategori sayaçları için `groupBy`/aggregate veya güncellenen sayaç tablosu.
3. Profil “above the fold” read model'i: kimlik, takip durumu, 3 sayaç, son 3 paylaşım. Diğer sekmeler istek üzerine.
4. API yanıt biçimi standardı: `{ data, meta, error }`; hata kodları UI mesajlarına merkezi eşlensin.
5. Kullanıcı tarafından tetiklenen dış API çağrılarında timeout, kontrollü retry ve idempotency.
6. Üretim öncesi PostgreSQL geçiş provası, eşzamanlılık ve migration rollback planı.

---

# 11. Güvenlik

## Güçlü Yönler

- Şifreler benzersiz salt ile PBKDF2-HMAC-SHA256 kullanılarak saklanıyor ve karşılaştırma timing-safe.
- Session token'ları rastgele, hash'li, veritabanı destekli; production'da `httpOnly`, `Secure`, `SameSite=Lax`.
- Oturum süresi, iptal ve aktif oturum sınırı var.
- Admin/moderatör ve kaynak sahibi yetkileri sunucuda kontrol ediliyor.
- Güvenlik başlıkları ve production HSTS yapılandırılmış.

## Release Öncesi Gerekenler

| Risk | Kanıt | Çözüm | Öncelik |
| --- | --- | --- | --- |
| PBKDF2 iterasyonu güncel OWASP düzeyinin altında | `lib/password.ts:3` 120.000 | Argon2id'e geç veya PBKDF2-SHA256 için güncel maliyete yükselt; kademeli rehash | Yüksek |
| CSP `unsafe-inline` ve `unsafe-eval` içeriyor | `next.config.mjs:28-29` | Production nonce/hash tabanlı CSP; eval'i kaldır | Yüksek |
| Rate limit tek süreçte | `lib/rateLimit.ts` Map | Paylaşımlı store | Yüksek |
| E-posta doğrulama/şifre sıfırlama ertelendi | Roadmap | Sağlayıcı, tek kullanımlık token, expiry, rate limit, audit | Release engeli |
| SQLite production ölçeği | Prisma datasource | PostgreSQL ve yedekleme/restore testi | Release engeli |
| Analitik/gizlilik sınırı tanımsız | Roadmap | Veri minimizasyonu, izin ve retention sözleşmesi | Release öncesi |

Dosya yükleme özelliği gözlenmediği için yükleme güvenliği şu an uygulanabilir bir risk değildir. Kullanıcı HTML'inin doğrudan basıldığına dair kanıt yok; `dangerouslySetInnerHTML` kullanımı tema bootstrap betiğiyle sınırlı görünüyor.

---

# 12. Önceliklendirilmiş Sorun Listesi

| Öncelik | Sayfa/Bileşen | Problem | Kullanıcıya etkisi | Önerilen çözüm |
| --- | --- | --- | --- | --- |
| Kritik | Ortak shell | Sidebar/topbar/loading route değişiminde kalıcı değil | Geçiş yavaş ve parçalı hissediyor | Sosyal route group + kalıcı AppShell + nested loading |
| Kritik | Ana düzen | `%80 zoom` ile yoğunluk | Küçük metin ve hedefler, zayıf premium hissi | Zoom'u kaldır, gerçek compact token sistemi kur |
| Kritik büyüme riski | Discover API | 250 paylaşım + 100 hesap istemciye çekiliyor | Veri büyüdükçe yavaşlama | Cursor pagination ve server ranking |
| Yüksek | Profile | İçerik hazır olma ~6 sn ve iki H1 | Yavaş ilk izlenim, semantik hata | Özet server render, sekme lazy, tek H1 |
| Yüksek | Games | İçerik hazır olma ~4 sn | Oyun keşfi ağır hissediyor | Statik katalog + canlı bölüm stream |
| Yüksek | Forum API | Sayaç için 1000 konu okunuyor | Ölçekle gecikme | Aggregate/groupBy |
| Yüksek | Tasarım sistemi | UI audit başarısız: tanımsız token, 11 px, ham renk | Tutarsızlık ve regresyon | Audit borcunu sıfırla |
| Yüksek | CSS | Büyük global ve route dışı CSS | Bakım ve stil çakışması | Route scope ve katman ayrımı |
| Yüksek | Etkileşim hedefleri | 19–30 px sık kontroller | Yanlış tıklama, erişilebilirlik | 36–44 px kontrol standardı |
| Orta | Loading | Tek generic skeleton | Layout değişimi hissi | Sayfa ailesine özel skeleton |
| Orta | SEO | Forum/game metadata ve JSON-LD eksik | Organik keşif/paylaşım kalitesi | Dinamik metadata ve yapılandırılmış veri |
| Orta | Animasyon | Global 104 notalık canvas | Zayıf cihazda gereksiz CPU | Auto quality/low effects |
| Orta | Geri navigasyon | Varsayılan `/` dönüşü | Bağlam kaybı | Context-aware back |
| Düşük/erteli | Açık tema | Görsel kalite tamamlanmadı | Kullanıcı eksik tema görebilir | Tamamlanana kadar toggle'ı gizle |
| Düşük/erteli | Mobil | İnceleme kapsamı dışında | Mobil ürün hazır değil | Masaüstü kabuk sabitlendikten sonra ayrı sprint |

---

# 13. Hızlı Kazanımlar: Bir Gün İçinde

1. **UI audit'i yeşile çevir:** 11 px metni 12 px yap, `--ui-text-faint` ve `--ui-text-base` referanslarını mevcut token'larla değiştir, `account/page.tsx` dosya bütçesini bileşen ayırarak düzelt.
2. **Açık tema düğmesini geçici olarak gizle:** açık tema tamamlanana kadar kullanıcıyı eksik görsel moda göndermemek.
3. **Profilde tek H1 kullan:** `PageTopbar` başlığını semantik olarak düşür veya hero adını tek H1 bırak.
4. **İlk route loading ayrımını ekle:** sosyal, forum, profil ve oyunlar için en az dört düzenle eşleşen skeleton.
5. **Zoom kaldırma pilotu yap:** ana akışta `%80 zoom` olmadan 720 px feed, 40 px ikon buton ve 32 px chip/tab ölçüleriyle tek masaüstü şablonu dene.

---

# 14. Önceliklendirilmiş Aksiyon Planı

## Hemen Yapılmalı

| Görev | Etki | Zorluk | İlgili alan | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| UI audit borcunu sıfırla | Yüksek | Kolay | `tokens.css`, `profile.css`, `feature-surfaces.css`, account | `npm run ui:check` geçer |
| Profil H1 ve küçük hedefleri düzelt | Yüksek | Kolay | Profile, Home, Forum | Tek H1; sık kontroller min. 36 px |
| Açık tema erişimini geçici kapat | Orta | Kolay | Theme toggle | Kullanıcı yalnız desteklenen koyu temayı görür |
| Route-specific loading sınırları | Yüksek | Orta | social/forum/games/profile | Skeleton son layout ölçülerini korur; sayaçlar yüklenirken 0 göstermez |
| `%80 zoom` pilotunu kaldır | Çok yüksek | Orta | Home shell | 1280 ve 1440 px'de taşmasız, okunaklı, 36–44 px kontroller |

## Kısa Vadede

| Görev | Etki | Zorluk | İlgili alan | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Kalıcı AppShell oluştur | Çok yüksek | Zor | Social route group | Ana sosyal rotalarda sidebar/topbar remount olmaz |
| İlk veriyi server render/stream et | Çok yüksek | Zor | Home, Forum, Discover, Profile | İlk görünür içerik client fetch beklemez |
| Discover API'yi sayfala | Çok yüksek | Orta | `/api/discover` | Yanıt sabit limitli ve cursor'lı; istemci 250 kayıt almaz |
| Forum sayaçlarını aggregate et | Yüksek | Orta | `/api/forum` | 1000 satır okuma kaldırılır |
| Profil read model'ini böl | Yüksek | Orta | `publicProfile.ts`, profile tabs | Hero/özet önce; sekmeler istek üzerine |
| CSS route-scope refactor | Yüksek | Zor | Layout/style imports | `profile.css` global değildir; ham renk ve `!important` düşer |
| CRO olay sözlüğü | Yüksek | Orta | Analytics boundary | İlk paylaşım/ekleme/takip hunileri ölçülebilir |

## Uzun Vadede

| Görev | Etki | Zorluk | İlgili alan | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| PostgreSQL geçişi | Çok yüksek | Zor | Prisma/ops | Migration, backup/restore ve concurrency testi geçer |
| E-posta doğrulama/şifre sıfırlama | Yüksek | Zor | Account/auth | Token expiry, rate limit ve audit ile uçtan uca geçer |
| CSP ve parola sertleştirme | Yüksek | Orta | Security | `unsafe-eval` yok; güncel password hash politikası |
| Gerçek RUM ve hata izleme | Çok yüksek | Orta | Production | p75 LCP/INP/CLS ve hata oranı dashboard'u |
| Mobil tasarım sprinti | Yüksek | Zor | Tüm ürün | Ayrı mobil IA, touch ve performans matrisi |
| Açık tema tamamlanması | Orta | Orta | Tokens/components | Görsel regresyon ve kontrast matrisi geçer |

---

# 15. Sayfa Sayfa Geliştirme Planı

## Ana Sayfa

1. `%80 zoom` kaldır ve gerçek desktop grid ölçülerini belirle.
2. Sidebar/topbar'ı kalıcı shell'e taşı.
3. İlk 5 feed öğesini server'da getir; sonraki sayfaları cursor ile yükle.
4. Sağ rayı iki öncelikli modüle indir; düşük değerli blokları katla.
5. Sık CTA ve sekmeleri 36–40 px yap.
6. Feed kartında yazar, şarkı ve eylem hiyerarşisini sadeleştir.

## Keşfet

1. 250/100 toplu sorguyu üç sayfalı read model'e böl.
2. Arama, ilgi alanı ve “kişiler/parçalar” modlarını netleştir.
3. Sonsuz kaydırma sentinel'ini sadece gerçekten istek sürerken göster.
4. Veri gelmeden sıfır sayaç gösterme.
5. Sonuç bulunamadı ve filtreyi temizle eylemlerini ortak EmptyState'e taşı.

## Forum

1. İlk konu listesini server render et.
2. Kategori sayaçlarını aggregate sorguya geçir.
3. Sol kategori rayını kalıcı ve tam sola hizalı shell standardına bağla.
4. Arama ve sıralama kontrollerini 36–40 px yap.
5. Konu satırlarında okunmamış/son yanıt sinyalini güçlendir.
6. Dinamik konu metadata ve JSON-LD ekle.

## Profil

1. Tek H1 düzeltmesi.
2. Hero için küçük bir server read model kullan.
3. Paylaşımlar, listeler, başarımlar ve bağlantıları lazy sekmelere böl.
4. Takip/engelle/menü eylemlerini ortak action cluster'a taşı.
5. Profil CSS'ini route kapsamına al.
6. İçerik-ready hedefini sıcak production testinde `<1.5 sn` yap.

## Hesap

1. Login/register/settings panellerini ayrı bileşenlere böl.
2. Form hata kodlarını merkezi sözlüğe bağla.
3. `next` parametresiyle işlem bağlamına geri dön.
4. Beni hatırla, oturumlar ve çıkış eylemlerini net hesap güvenliği bölümünde tut.
5. Açık tema düğmesini destek tamamlanana kadar gizle.

## Liste / Öneri / Kontrol

1. Liste, import, öneri ve Spotify senkron durumlarını tek veri bileşeniyle göster.
2. Başarısız otomatik importta manuel URL alanına kesintisiz geçiş sağla.
3. Mutasyonlarda optimistic state + geri alma kullan.
4. Giriş yönlendirmesinden sonra kod/işlem bağlamını koru.
5. Spotify'ın entegrasyon olduğunu, çekirdek verinin ListeKutusu'nda kaldığını metin ve mimaride sürdür.

## Oyunlar

1. Katalog verisini statik/server render; canlı odaları ayrı Suspense sınırına al.
2. Oyun oturumlarında tam ekran game shell kullan.
3. Arka plan canvas kalite profilini oyun esnasında azalt.
4. Polling'i yalnız görünür sayfa/aktif turda çalıştır.
5. YouTube embed uygunluğunu maç başlamadan doğrula ve güçlü fallback göster.

## Admin / Moderasyon

1. Operasyon shell'ini sosyal ekrandan görsel olarak sadeleştir.
2. Toplu karar, filtre ve audit akışlarını görev bazlı grupla.
3. Kritik işlemlerde ortak confirm ve sonuç toast sözleşmesi kullan.
4. Rol/yetki başarısızlıklarını kullanıcı dostu ama bilgi sızdırmayan mesajlarla göster.

## Yasal / Hata / Loading

1. Yasal sayfaya içerik tablosu ve güncelleme tarihi ekle.
2. Route ailesine özel loading/error dosyaları oluştur.
3. 404 sayfasında ana ürün rotalarına kısa geri dönüş seçenekleri sun.
4. Hata ekranlarında teknik mesaj yerine kullanıcı eylemi ve takip kodu göster.

---

# 16. Genel Geliştirme Yol Haritası

## Aşama 0: Ölçülebilir Taban

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Desktop-dark rota matrisi sabitle | Kolay | Yüksek | Kritik | 10 temel rotanın referans viewport listesi belgeli |
| UI audit'i yeşile çevir | Kolay | Yüksek | Kritik | Tüm statik UI kontrolleri geçer |
| Performance hedeflerini daralt | Kolay | Yüksek | Yüksek | Home/forum/games yanında discover/profile/account testte |

## Aşama 1: Tasarım Sistemi Borcu

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Density token sistemi | Orta | Çok yüksek | Kritik | `zoom` yok; compact/comfortable ölçüleri token tabanlı |
| PageHeader/PageLayout şablonları | Orta | Yüksek | Yüksek | Tüm sosyal rotalar üç şablondan birini kullanır |
| Ham renk ve specificity temizliği | Zor | Yüksek | Yüksek | Yeni CSS ham renk 0; mevcut bütçe belirgin azalır |
| Kontrol boyutu standardı | Orta | Yüksek | Yüksek | Sık kontroller min. 36 px; ikon buton 40 px |

## Aşama 2: Sayfa Geçişleri ve Kalıcı Kabuk

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Social AppShell | Zor | Çok yüksek | Kritik | Sidebar/topbar route geçişinde kalıcı |
| Nested loading/Suspense | Orta | Çok yüksek | Kritik | Her sayfa ailesi gerçek layout skeleton'ına sahip |
| Route progress ve intent prefetch | Orta | Yüksek | Yüksek | Uzun geçişte geri bildirim, kritik linkler prefetched |
| Context-aware back | Kolay | Orta | Orta | Alt sayfalar doğru kaynağa döner |

## Aşama 3: Çekirdek Kullanıcı Akışları

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Home feed server-first | Zor | Çok yüksek | Kritik | İlk feed client fetch beklemez |
| Discover ölçek refactor | Zor | Çok yüksek | Kritik | Cursor ve server ranking aktif |
| Forum server-first + aggregate | Orta | Yüksek | Yüksek | İlk konular hızlı, 1000 satır sorgusu yok |
| Profil progressive disclosure | Zor | Yüksek | Yüksek | Hero hızlı, sekmeler lazy |
| Auth dönüş bağlamı | Orta | Yüksek | Yüksek | Giriş sonrası kullanıcı başladığı işleme döner |

## Aşama 4: Performans ve Veri

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| CSS route scope | Zor | Yüksek | Yüksek | Route dışı büyük CSS yüklenmez |
| Client island küçültme | Zor | Yüksek | Yüksek | Büyük sayfalar server composition + küçük clients |
| Canvas auto-quality | Orta | Orta | Orta | Arka planda/düşük güçte FPS/nota sayısı azalır |
| API payload sözleşmesi | Orta | Yüksek | Yüksek | Liste endpoint'leri limitli, ölçümlü ve tutarlı |

## Aşama 5: CRO, SEO ve İçerik

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| Olay sözlüğü ve gizlilik sınırı | Orta | Çok yüksek | Yüksek | Dönüşüm hunisi ölçülür; kişisel veri sınırı belgeli |
| Forum metadata/JSON-LD | Orta | Yüksek | Yüksek | Konu paylaşım ve arama önizlemeleri doğru |
| Sitemap/noindex düzeltmesi | Kolay | Orta | Orta | Yalnız indeks değeri olan rotalar sitemap'te |
| Onboarding hipotez testleri | Orta | Yüksek | Orta | En az iki varyant güvenilir olaylarla ölçülür |

## Aşama 6: Güvenlik ve Üretim Hazırlığı

| Görev | Zorluk | Etki | Öncelik | Tamamlanma kriteri |
| --- | --- | --- | --- | --- |
| PostgreSQL migration | Zor | Çok yüksek | Release | Backup/restore ve load testi geçti |
| E-posta doğrulama/reset | Zor | Yüksek | Release | Güvenli token ve abuse testleri geçti |
| CSP/parola/rate limit | Orta-zor | Yüksek | Release | Güvenlik kontrol listesi geçti |
| RUM/hata izleme | Orta | Çok yüksek | Release | Gerçek p75 CWV ve hata oranı izleniyor |
| Production smoke/rollback | Orta | Çok yüksek | Release | Deployment ve rollback tatbikatı başarılı |

## Ertelenen Aşamalar

- **Mobil:** Masaüstü shell ve içerik hiyerarşisi sabitlenince ayrı IA ve touch sprinti.
- **Açık tema:** Koyu tasarım sistemi token/primitive dönüşümü bitince görsel regresyon matrisiyle.
- Bu iki alan erteleme süresince kullanıcıya “tam destekleniyor” gibi sunulmamalıdır.

---

# 17. Nihai Değerlendirme ve Puanlama

| Alan | Puan / 10 | Gerekçe |
| --- | ---: | --- |
| Kullanıcı deneyimi | 7,0 | Çekirdek akışlar zengin; geçiş, loading ve küçük hedefler bütünlüğü bozuyor |
| Görsel tasarım | 7,3 | Koyu tema yönü güçlü; yoğunluk, fazla katman ve sayfa ritmi borcu var |
| Renk kullanımı | 7,5 | Palet iyi ve kontrastlı; ham renk/token dışı sapmalar sürüyor |
| Sayfa düzeni | 6,8 | Birçok ekran güçlü; ortak shell ve header standardı tamamlanmamış |
| Mobil uyumluluk | 5,0 | Bu turda bilerek ertelendi; hazır kabul edilemez |
| Performans | 5,8 | Test altyapısı var; profil/oyun içeriği ve istemci toplu sorgular yavaşlık riski |
| Akıcılık | 6,0 | Mikro hareket temeli iyi; route geçişi kalıcı uygulama hissi vermiyor |
| Kod kalitesi | 6,8 | Güçlü modül/test temeli; büyük client bileşenler ve CSS borcu mevcut |
| Güvenlik | 7,0 | Oturum/yetki temeli iyi; production sertleştirmesi ve hesap kurtarma eksik |
| SEO | 5,5 | Temel metadata var; forum dinamik SEO ve yapısal veri eksik |
| Profesyonellik | 6,7 | Ürün vizyonu ve özellik seviyesi yüksek; son yüzde tasarım/performans standardizasyonu istiyor |
| **Genel ürün kalitesi** | **6,8** | Güçlü ve ayırt edici beta; production-grade sosyal ürün için shell, hız ve ölçek işi gerekiyor |

## En Güçlü Üç Yön

1. Sosyal müzik keşfi, kişisel liste ve forumun aynı hesap grafiğinde birleşmesi.
2. Koyu tema, ikon dili ve gelişmiş oyun/profil ekranlarının güçlü görsel potansiyeli.
3. Oturum/yetki, veri modeli, testler ve tasarım token'larıyla kurulmuş ciddi teknik temel.

## En Zayıf Üç Yön

1. Kalıcı uygulama kabuğu olmadığı için sayfa geçişlerinin parçalı ve yavaş algılanması.
2. `%80 zoom`, küçük hedefler ve birikmiş CSS katmanlarının premium hissi zayıflatması.
3. Discover, forum sayaçları ve profil read model'inin veri büyümesine hazır olmaması.

## İlk Düzeltilmesi Gereken Beş Problem

1. Kalıcı AppShell ve route-specific loading.
2. `%80 zoom` kaldırılarak gerçek yoğunluk sistemi.
3. UI audit borcunun sıfırlanması.
4. Discover sayfalama ve server-side ranking.
5. Profil/forum/ana akışın server-first ilk içeriği.

## Projeyi Profesyonel Seviyeye Taşıyacak En Önemli Değişiklik

**Özellik eklemek yerine sosyal rotaları kalıcı, hızlı ve ölçülebilir bir AppShell altında birleştirmek.** Bu değişiklik görsel tutarlılık, navigasyon, algılanan hız, erişilebilirlik ve gelecekteki mobil uyarlamanın temelini aynı anda iyileştirir.

## Kullanıcıların Daha Uzun Süre Kalması İçin

- İlgi grafiğine dayalı, açıklanabilir ve taze akış.
- Hızlı takip/listeye ekleme geri bildirimi.
- Forum ve paylaşım bildirimlerinin anlamlı bağlarla birleşmesi.
- Günlük görevlerin ana keşfi boğmadan ikincil kalması.
- İçerik kalitesini öne çıkaran editoryal seçki ve topluluk sinyalleri.

## Daha Hızlı ve Akıcı His İçin

- Kalıcı shell, nested loading ve server-rendered ilk içerik.
- Sabit boyutlu skeleton; veri gelmeden sıfır değer göstermeme.
- Daha küçük payload, cursor pagination ve route prefetch.
- `transform`/`opacity` dışındaki pahalı animasyonları sınırlama.
- Gerçek kullanıcı p75 LCP/INP/CLS ölçümü.

## Daha Modern Görünüm İçin

- `%80 zoom` yerine ferah ama yoğun tasarım token'ları.
- Daha az iç içe kart, daha fazla açık liste ritmi.
- Tek tip header/CTA/hizalama geometrisi.
- Glow ve blur'u yalnız durum/vurgu için kullanma.
- Sosyal içeriği görsel süsten daha baskın tutma.

---

# Doğrulama Sonuçları

| Kontrol | Sonuç |
| --- | --- |
| TypeScript typecheck | Geçti |
| Statik erişilebilirlik kontrolü | Geçti |
| Koyu/açık token kontrast kontrolü | Geçti |
| Sekiz ana masaüstü rotada yatay taşma | Bulunmadı |
| Sekiz ana rotada adsız buton/link veya etiketsiz form | Bulunmadı |
| İncelenen rotalarda tarayıcı konsol hatası | Bulunmadı |
| UI statik denetimi | Başarısız: 621 satırlık account dosyası, 11 px metin, iki tanımsız token, ham renk bütçesi |

Tam production build ve bütün görsel/mobil matris bu rapor turunda yeniden çalıştırılmadı. Son proje durum belgesine göre 2 Ağustos 2026'da production build, 101 unit test, 34 smoke kontrolü ve masaüstü görsel/a11y testleri geçmişti. Yeni rapor yalnız Markdown eklediği için düşük maliyetli odaklı doğrulama tercih edildi.

---

# Kaynaklar

- [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [Next.js Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [web.dev Largest Contentful Paint](https://web.dev/articles/lcp)
- [web.dev Interaction to Next Paint](https://web.dev/articles/optimize-inp)
- [web.dev Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

