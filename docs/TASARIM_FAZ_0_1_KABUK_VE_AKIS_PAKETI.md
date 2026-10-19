# ListeKutusu — Faz 0–1: ekran haritası, kabuk ve akış paketi

Tarih: 17 Ekim 2026
Durum: **Tasarım önerisi v1; uygulama veya kullanıcı onayı değildir.**

Dayanak: [Bütüncül denetim](TASARIM_BUTUNLUGU_VE_AKIS_DENETIMI_2026-10-17.md). Bu paket denetimi tekrarlamaz; ilk kararları ve çizilecek ekranların davranışını somutlaştırır. Uygulama kodu, veri, servis ve mevcut tasarım sistemi değiştirilmedi. Masaüstü koyu tema aktif; mobil, açık tema ve bağımsız forum geliştirmesi askıda.

## 1. Bu pakette ne var?

- Aynı içerikle karşılaştırılacak iki kabuk: **Sol menü** ve **Üst menü**.
- Ana akış, topluluk detayı, kitaplık, profil, oyun sahnesi ve kapsamı açık Keşfet örneği.
- Navigasyon, kişisel merkezler, sayfa aileleri ve rota eşlemesi.
- Girişe dönüş, taslak koruma, başvuru hedefi, modal, ağ hatası ve oyun durumları için akış sözleşmeleri.
- Ortak durum/metin örnekleri; uygulamaya geçiş için açık kabul kapıları.

Konuşmadaki örnekler yerleşim taslaklarıdır. İsimler, içerikler, sayımlar ve oyun sahnesi sentetiktir; gerçek hesap, eser kaydı veya canlı maç değildir. Örnekte bir butonun işlemesi, ürün özelliğinin uygulanmış olduğu anlamına gelmez. Görsel cila, afiş, gerçek katalog veya sağlayıcı bağlantısı bu paketin konusu değil.

## 2. Çalışma kararları ve sınırları

| Konu | İlk öneri | Gerekçe / sınır |
| --- | --- | --- |
| Ana kabuk | Sol menü yönü tercih edilsin; üst menü alternatif olarak karşılaştırılsın | İki ana navigasyon aynı anda büyütülmez; henüz onaylı karar değil |
| Ana bölümler | Ana akış / Keşfet / Topluluklar / Oyunlar / Kitaplığım | Profil ve ayarlar içerik bölümüyle yarışmaz |
| Kişisel alan | Profilim / Kaydettiklerim / Etkinliklerim / Bildirimler / Hesap | Ajandaya Topluluklar içinden de erişilir; aynı özellik ikinci adla çoğalmaz |
| Keşfet | Alanlar arası yönlendirme; ayrı kapsamlı müzik seçkisi | Birleşik global arama şu anda yok; yeni sunucu sorgusu ayrı teknik iş |
| Karma akış | Yeni ve Takip'te karma içerik; tür filtresi | Yükselen/Sana özel mevcut müzik kapsamını açıkça taşır |
| Kaydettiklerim | Tek giriş altında Müzik / Topluluk içerikleri | İlk geçişte ayrı merkezler/API'ler korunabilir; birleşik toplam, cursor ve arama vaat edilmez |
| Kitaplık | Müzik / Diziler / Filmler / Kitaplar; ana işlerin yeri sabit | Ortak kabuk, farklı veri ve durum modellerini zorla birleştirmez |
| Genel oluşturma | Müzik doğrudan; sohbet/inceleme/etkinlik önce uygun topluluk | Üye olma/rol/dağıtım kuralları değişmez |
| Profil | Çoklu ilgi vitrini; özel koleksiyon ve ajanda dışarıda | Üniversite isteğe bağlı, görünürlüğü ayrı; doğrulanmış aidiyet rozeti yok |
| Oyun | Ortak dış kabuk; sahneye en çok alan | Hedefli davet, yeni oyun veya çalışır sayaç icat edilmez |

Bu kararlar tasarım ilerleyebilsin diye seçilen varsayımlardır. Uygulamadan önce kabuk yönü, Keşfet kapsamı ve kişisel alan adları birlikte gözden geçirilmelidir. Diğer akış güvenliği işleri iki kabukta da geçerlidir.

## 3. Bilgi mimarisi

```text
Ana bölüm menüsü
├─ Ana akış
│  ├─ Yeni / Takip: karma içerik
│  ├─ İçerik türü: tümü / müzik / sohbet / inceleme / etkinlik
│  └─ Müzik keşfi araçları: Yükselen / Sana özel / Beşli Keşif
├─ Keşfet: alan seçimi, kapsamı açık keşif
├─ Topluluklar
│  ├─ Keşfet / Topluluklarım
│  ├─ Topluluk: akış / etkinlikler / yetkili yönetim
│  └─ Etkinliklerim: özel ajandaya kısayol
├─ Oyunlar: merkez → kurulum → oda → sonuç
└─ Kitaplığım: müzik / diziler / filmler / kitaplar

Kişisel alan
├─ Profilim → Profili düzenle
├─ Kaydettiklerim → Müzik / Topluluk
├─ Etkinliklerim → özel tercih/düzenleme ajandası
├─ Bildirimler
├─ Hesap → profil / güvenlik / gizlilik / veri
└─ Özel başvurular → yalnız ilgili kişi ve yetkili platform ekibi

İkincil erişim: mevcut Forum / Yardım-kullanım-gizlilik
Yetkili erişim: yerel topluluk yönetimi / platform moderasyonu / admin
```

### Rota → kabuk → aktif bölüm

Mevcut adresler korunur; önerilen yeni menü adı yeni URL zorunluluğu yaratmaz.

| Mevcut rota | Kabuk ailesi | Aktif ana bölüm / bağlam |
| --- | --- | --- |
| / | Sosyal okuma | Ana akış |
| /discover | Keşif/liste | Keşfet |
| /p/[id] | İçerik okuma | Geldiği bağlam; doğrudan girişte Paylaşım |
| /u/[slug] | Profil/vitrin | Kişisel Profilim veya ziyaret edilen kişi; yanlış ana bölüm seçilmez |
| /library | Koleksiyon | Kitaplığım; type sorgusu korunur |
| /control | Yönlendirme | Kitaplığım müzik; eski bağlantı kırılmaz |
| /suggest | Odaklı müzik aracı | Şarkı öner; kaynak profil/kitaplık dönüşü korunur |
| /account | Kişisel ayarlar / anonim kimlik doğrulama | Hesap; girişte niyet ve dönüş hedefi |
| /communities | Keşif/liste | Topluluklar |
| /communities/[slug] | Topluluk | Topluluklar; post/event/section korunur |
| /community-events | Kişisel ajanda | Etkinliklerim; Topluluklar aidiyeti |
| /community-saved | Kişisel kayıtlar | Kaydettiklerim, Topluluk kapsamı |
| /community-cases | Özel görev | Özel başvurular; hedef topluluk açık |
| /games | Oyun merkezi | Oyunlar |
| /games/backgammon/new | Oyun kurulum | Oyunlar → Tavla |
| /games/backgammon/[id] | Oyun sahnesi | Oyunlar → Tavla → oda |
| /games/elimination/new | Oyun kurulum | Oyunlar → Şarkı Düellosu |
| /games/elimination/[id] | Oyun sahnesi | Oyunlar → Şarkı Düellosu → oda |
| /forum, /forum/new, /forum/[slug] | Korunan legacy | Forum; içerik ve mevcut işlemler korunur |
| /admin | Yetkili operasyon | Yönetim; kullanıcıya dönük kabukla aynı güvenlik alanı sanılmaz |
| /admin/community-cases | Yetkili operasyon | Platform başvuruları |
| /admin/forum | Korunan operasyon | Forum moderasyonu |
| /legal | Belge/okuma | Kullanım ve gizlilik |

### Kavram ve komut sözlüğü

| Etiket | Anlam |
| --- | --- |
| Kitaplığa ekle | Bir eseri kişisel koleksiyona almak |
| Kaydet / Kaydettiklerim | Sosyal içeriği sonra bulmak için işaretlemek; kalıcı içerik kopyası değil |
| Vitrinde göster | Mevcut sınırlar içinde açık profile seçilmiş eser koymak |
| Yalnız topluluk akışında | Dağıtım tercihi; özel/gizli okuma değil |
| Genel akışta da göster | Mevcut kurallarla Yeni/Takip dağıtımı |
| Katılacağım | Niyet/RSVP; fiziksel katılım belgesi veya bilet değil |
| Listelenmeyen oda | Keşifte görünmez; bağlantıya sahip uygun kişiler katılabilir |
| Geri | Geldiği görev/konum; biliniyorsa |
| Topluluklara dön / Oyun merkezine dön | Açık hiyerarşi hedefi; tarayıcı geçmişi gibi sunulmaz |
| Kaydet ve devam et | Mevcut düzenleme kaydolursa planlanan yere git; yeni gönderim yerine kullanılamaz |

## 4. İki kabuğun farkı

### Sol menü — önerilen yön

- Tek ana menü solda; marka, bölüm listesi ve ikincil kişisel kısayollar aynı başlangıç çizgisinde.
- Üst alan yalnız kapsamı açık kişi araması, bildirim ve hesap için.
- Ana içerik: bağlam satırı → tek h1/kısa açıklama → ilgili kontrol → içerik.
- Yaklaşık masaüstü hedefleri: 208–224 px menü, 64 px üst alan, 24–32 px içerik aralığı. Bunlar taslak ölçülerdir; mevcut token ailesine sonradan eşlenecek.
- 1280 px'te sağ bağlam rayı önce sadeleşir; ana içerik ve menü gereksiz daraltılmaz. Canlı oyunda sağ ray yoktur.

### Üst menü — karşılaştırma alternatifi

- Aynı beş bölüm tek üst navigasyonda; solda ikinci bölüm menüsü yok.
- Kişisel kısayollar hesap alanında; sayfa bazlı alt navigasyon içerikte.
- Daha fazla yatay içerik alanı; uzun etiketler ve kişi araması üst alanı sıkıştırabilir.
- Düşük alışma maliyetli olabilir; kişisel merkezlerin bulunabilirliği prototipte özellikle karşılaştırılmalı.

### Seçim ölçütleri

1. Ana içerik ilk bakışta nerede başlıyor?
2. Kullanıcı kitaplık, kayıt ve ajandayı tek denemede ayırabiliyor mu?
3. Topluluk ve oyun detayında nerede olduğunu anlayabiliyor mu?
4. Kişisel alana erişim bütün sayfalarda bulunabiliyor mu?
5. Uzun Türkçe adlar ve 1280 px masaüstü sıkışmadan çalışıyor mu?

Bunlar kullanıcı testinin sonucu değil, sonraki karşılaştırmanın sorularıdır. Bu aşamada ölçülmemiş verim artışı veya tercih yüzdesi verilmez.

## 5. Altı ekran örneğinin sözleşmesi

| Şablon | Ana sıra | Baskın görev | İkincil / dışarıda |
| --- | --- | --- | --- |
| Ana akış | Başlık → Yeni/Takip → tür → kartlar | İçerik okumak; kompakt oluşturma girişi | Büyük hero, açık tam composer ve zorunlu müzik modülleri yok |
| Topluluk detayı | Kimlik/açık okuma/üyelik → Akış/Etkinlikler → içerik | Topluluk bağlamında okumak veya ilgili işlem | Kurallar kısa; yönetim yalnız yetkiliye |
| Kitaplık | Türler → türün mevcut görünürlük açıklaması → araç çubuğu → koleksiyon | Kayıt yönetimi; aynı yerde Eser ekle | Spotify/import yalnız müzik araçları; medya özel durumları ≠ açık vitrin; müzik farklı görünürlük modelinde |
| Profil | Kontrollü hero → kimlik/ilişki → vitrin/katkı/hakkında | Kişiyi ve açık seçkilerini anlamak | Özel okuma/ajanda/gizli üniversite gösterilmez |
| Canlı oyun | Bağlam → durum/oyuncular → sahne → kontroller → günlük | Kendi sırasında açık ana eylem | Sağ ray/istatistik sahneyi daraltmaz; motor çalışmaz |
| Keşfet | Başlık → alan girişleri → kapsamlı seçki | Hangi alanda keşfedeceğini seçmek | Birleşik genel arama varmış gibi boş input çizilmez |

Örnekte kitaplık türü değişebilir, profil sekmesi açılabilir, topluluk etkinlik görünümü seçilebilir ve oyunun bağlı/yeniden bağlanıyor/sonuç halleri karşılaştırılabilir. Bu yerel etkileşimler canlı ürüne yazmaz.

## 6. Kritik akışlar

### A-01 — Giriş → aynı hedef → yeniden açık onay

```text
İçerik / filtre / sekme
  → oturum isteyen işlem
  → niyeti açıklayan giriş/kayıt
  → başarılı giriş
  → aynı içerik + görünür hedef
  → kullanıcı işlemini yeniden onaylar
```

- Giriş yapmak otomatik RSVP, takip, paylaşım veya kayıt oluşturmaz.
- Giriş/kayıt geçişinde next, query ve gerekiyorsa hash korunur; gizli metin/parola URL'ye konmaz.
- İptal kaynağa döner. Hedef kaldırılmışsa açıklama + ilgili keşif; sessiz ana sayfa atlaması yok.
- Güvenli yerel dönüş hedefi ve izin kontrolü uygulama aşamasının şartıdır; dış URL yönlendirme kabul edilmez.
- Kabul örneği: kitap türünden başlayan kişi giriş sonrası müziğe değil aynı Kitaplar bağlamına döner.

### A-02 — Değişen taslak → ayrılma

```text
Düzenleme değişti
  → ana menü / hesap menüsü / sekme / geri / kapat
  → Kaydet ve devam et | Kaydetmeden ayrıl | Düzenlemeye dön
      kaydet başarılı → istenen hedef
      kaydet hata     → taslak + alan/ağ hatası, hedefe geçme
      dön             → aynı metin/seçim/odak
```

- Kaydetme işlevi olmayan yeni başvuru/yayın formunda iki seçenek: Düzenlemeye dön / Taslağı bırak. “Kaydet” altında yanlışlıkla yayın/gönderim yapılmaz.
- Escape, işlemsiz dış tıklama ve iptal düzenlemeye döner; hassas metin otomatik kalıcı depoya yazılmaz.
- beforeunload yalnız sekme kapatma/yenileme için ayrı dar emniyettir; SPA koruması yerine geçmez. Tarayıcının yerel uyarısı özel üçlü modal gibi tasarlanmaz.
- İşlem sürerken ikinci komut ve geçiş engellenir; hata taslağı silmez.
- Kabul: profil düzenlemeden hesap menüsüne gitmek de görünür Geri kadar korunur.

### A-03 — Özel başvuru → hedef değişimi

```text
Topluluk / karar
  → okunabilir hedef özeti
  → açıklama
  → hedef değiştir?
      hayır → özet → gönder
      evet  → Mevcut hedefte kal | Hedefi değiştir ve taslağı temizle
  → sonuç / özel takip kartı
```

- Topluluk adı, karar türü/tarihi ve alıcı sınırı görünür; teknik ID olayın anlaşılması için zorunlu bilgi olmaz.
- Hata taslağı korur; sonuç belirsizse önce mevcut başvuru sorgulanır, otomatik ikinci gönderim yapılmaz.
- Başvuru yalnız başvuran ve yetkili platform ekibine açıktır; yerel topluluğa otomatik gönderildiği veya kararın kalktığı söylenmez.
- Kabul: eski gerekçe yeni topluluğa sessizce taşınamaz; değişmiş karar yeniden gözden geçirilir.

### A-04 — Modal / katman / odak

```text
Açan kontrol → tek etkin üst katman → işlem veya iptal
  iptal → aynı scroll + açan kontrole odak
  gezinme → yeni içerik başlığına anlamlı odak
  hata → katman içinde kalıcı açıklama
```

- Modal bütün uygulamayı, global menü dâhil, etkileşimsiz arka plan olarak kapsar.
- Tetikleyici korunur; Tab/Shift+Tab dışarı kaçmaz, Escape tutarlı; tehlikeli onayda ilk odak iptal.
- Menü üstüne modal açılırsa menü artık etkin katman olarak kalmaz. Hassas metin global toast'a taşınmaz.
- Kapatmak gönderilmiş işlemi geri almak değildir. Gönderim sürerken kapatmanın sonucu açıkça tanımlanır.
- Katman sırası: içerik → sabit kabuk → menü/bağlamsal panel → global modal → gerekli global bildirim. Sayısal z-index listesi değil ortak portal/stacking sözleşmesi esastır.

### A-05 — Ağ hatası / boşluk / sonucu belirsiz gönderim

| Durum | Örnek metin | Davranış |
| --- | --- | --- |
| Gerçek boş koleksiyon | Henüz kitap eklemedin | Kitap ekle; sayı ancak veri geldiyse gösterilir |
| Filtre boşluğu | Bu filtrelerle kayıt bulunamadı | Filtreleri temizle; kayıt yok denmez |
| Giriş yok | Kitaplığını yönetmek için giriş yap | Normal kapı; kırmızı hata değil |
| Okuma ağı başarısız | Kayıtların yüklenemedi | Tekrar dene; varsa son liste korunur |
| Gönderim sonucu belirsiz | İşlemin sonucu doğrulanamadı | Önce durumu kontrol et; tekrar gönderme otomatik değil |
| Kısmi başarı | Gönderilenler ve bekleyenler ayrı | Yalnız kalanlar üzerinde devam |
| Sürüm çatışması | İçerik başka bir yerde güncellendi | Güncel kaydı göster, yerel metni koru |

Keşfet kişi/liste hatası sıfır sonuç olarak sunulmaz; Suggest ve düello ağ reddinde sonsuz bekleme olmaz. Bu hataları tasarlamak, kaynak hatalarının düzeltilmiş olduğu anlamına gelmez.

### A-06 — Profil düzenle → önizle → gerçek görünüm

- Kimlik / ilgi alanları / vitrin / görünüm; tek ana kaydet alanı.
- Önizleme “Henüz kaydedilmedi” durumunu taşır; gerçek eser seçimi ve sıralamayla aynı modele dayanır.
- Kaydetme başarılıysa ziyaretçi görünümüne geçiş; hata ilgili alan/bölümde.
- Gizli üniversite, özel koleksiyon durumları ve ajanda ziyaretçi önizlemesinde yok.
- Görsel modül sırası = DOM/klavye sırası. Boş profil bilinçli tercih olabilir; zorlayıcı tamamlanma yüzdesi yok.

### A-07 — Oyun → bekleme → sahne → reconnect → sonuç

```text
Merkez → Kurulum → Bekleme / katılım → Canlı → Sonuç
                                      ↕
                            Eşitleme / yeniden bağlanma
```

- Aynı oda URL'si ve sahne geometrisi korunur; oyun sunucusu otoritedir.
- Kendisi Sen, izleyen İzliyorsun, sıra/oy durumu metinle belirtilir.
- Listelenmeyen oda belirli kişiye kilitli davet değildir; opponent bağlamı gönderilmiş davet gibi çizilmez.
- Reconnect'te son doğrulanan sahne, kalıcı bilgi ve güvenilir eşitlemeye kadar işlem sınırı.
- Başarı belirsizliği “tekrar oy ver/hamle yap” çağrısına dönüşmez.
- Tavla için çalışır süre sınırı netleştirilmeden geri sayım yok. Bekleme odasının gerçek kapanma kuralı ayrıca doğru gösterilir.
- Sonuç sahneyi örtmez; Yeni oyun ana, merkez/paylaşım ikincil; son sahne incelenebilir.
- Gezinmeden ayrılma ≠ oyundan çekilme. Yeni düello kapatma veya seyirci izin modeli önerinin içine saklanmaz.

### A-08 — Etkinlik tercihi → özel ajanda → değişiklik / geri çekme

```text
Etkinlik detayı → oturum / üyelik koşulu → aynı etkinliğe dönüş
  → Katılacağım veya İlgileniyorum → doğrulanmış tercih
  → Etkinliklerim → güncelleme / iptal bildirimi → aynı etkinlik
  → tercihi geri çekme onayı → doğrulanmış yeni durum
```

- Doluluk gerçek veriden gelir. Kapasite doluysa katılım başarılı gösterilmez; İlgileniyorum uygun olduğu ölçüde ayrı niyet olarak kalır. Bekleme listesi veya rezervasyon garantisi eklenmez.
- Oturum/güncelleme hatasında eski doğrulanmış tercih ile yeni niyet ayrılır; belirsiz istek ikinci RSVP'ye çevrilmez.
- Topluluktan ayrılma onayı mevcut RSVP/koltuk etkisini işlemden önce açıklar; genel “Onayla” yeterli değil.
- İptal, arşiv, kaldırılma, geçmiş etkinlik ve üyelik kaybı aynı genel hataya dönüşmez; mevcut erişim kuralları korunur.
- Ajandadan detaya ve geri dönüşte tarih/ilişki filtresi ve konum korunur; etkinliğin özel ajandada olması onu özel etkinlik yapmaz.
- Kabul: tercih değişimi ajandada ve erişilebilir kaynakta tutarlı görünür; bildirim hedefi doğru etkinliktir; fiziksel katılım kanıtı üretilmez.

## 7. Ortak görsel/etkileşim hedefleri

- Mevcut lacivert/grafit, cyan ve semantik durum ailesi; yeni palet sistemi yok.
- 8 px kart, en fazla 10 px kabuk/modal; 36/44/50 px kontrol ailesi.
- Tek h1; bir baskın işlem grubu. İki eşdeğer oy seçeneği gibi doğal istisnalar açıklanır.
- Ana akış ve keşifte ilk içerik büyük hero veya açık formun altında kaybolmaz.
- Yeni bölümde başlık görünür; detaydan dönüşte filtre/sayfa/scroll korunur.
- Alan hatası alan yanında, ağ hatası kalıcı, başarı kısa; metinden tahmin edilen toast tonu yok.
- Kart anatomisi: bağlam/yazar/zaman → içerik → metadata → eylem. Eser türüne özel iş bütün kartlara zorla eklenmez.
- Hover/focus 100–160 ms; küçük panel 160–220 ms. Önce odak/konum, sonra hareket. Reduced-motion eşdeğer görev sağlar.
- Arka planın beş simgesi mevcut; bu aşamada sayıları artırılmaz. Wireframe sade tutulur, yeni atmosfer sistemi yapılmaz.

### İstisna kabuklar

| Aile | Bilinçli fark |
| --- | --- |
| Anonim giriş | Sade ürün çerçevesi, niyet ve dönüş hedefi; beş ana menüyü zorla formun üstüne doldurma yok |
| Odaklı editör | Daha dar görev alanı; görünür geri/çıkış koruması; global bağ kaybolmaz |
| Canlı oyun | Sahne genişliği öncelikli; sağ ray yok, menü kontrollü daralabilir |
| Admin / moderasyon | Daha yoğun kuyruk/tablo; yetki ve hedef açık, sosyal dekorasyon eklenmez |
| Legal | Okunabilir belge genişliği ve içindekiler; gerçek hukuki içerik ayrıca yetkili incelemeden geçer |
| Forum | Mevcut içerik/işlem korunur; ortak kabuk ve durum uyumu dışında yeni yatırım yok |
| Global hata | Ana CSS/layout çalışmasa da anlaşılır minimal bağımsız yüzey |

## 8. Yeni uygulama veya servis işi gerektirenler — çizimde mevcut gibi sunulmayacak

- Gerçek birleşik genel arama; birleşik bookmark toplamı/cursor/sıralama.
- Tüm türler için müzik algoritması, puanı veya Spotify benzeri senkron.
- Kitaplık içi medya arama/sıralama ve profil katkı agregasyonu: küçük görünse de uygulama işi.
- Hedefli davet, yeni seyirci izinleri, yeni oyun, tam maç tekrarı.
- Kalıcı hassas taslak deposu, ICS/harita, push/e-posta, yeni parola sıfırlama sağlayıcısı.
- Avatar/kapak upload, doğrulanmış üniversite, gizli topluluk ve yeni üyelik modeli.

## 9. Kabul ve sonraki iş sırası

### Paket durumu

Dar kontrol: örneklerin betik sözdizimi ve servissiz çalışması kontrol edildi; iki kabuk ve altı ekran tarayıcıda görüldü. Kitaplık türü, topluluk etkinlik görünümü, modal ve reconnect örnekleri açıldı. Bu, canlı uygulamanın regresyon/erişilebilirlik testi değildir; geniş test veya build çalıştırılmadı. Konuşma önizlemesinin dar alana sığması ürünün mobil tasarımına dönülmesi anlamına gelmez.

- [x] İki kabuk alternatifi ve altı ekranın tasarım örneği hazırlandı.
- [x] Mevcut 25 rota şablonunun kabuk/bağlam eşlemesi çıkarıldı.
- [x] Kritik akışlar, metinler ve görünürlük sınırları belgelendi.
- [x] Mevcut özellik ile önerilen teknik iş ayrıldı.
- [ ] Kullanıcı tercihi / kabuk yönü kesinleşti.
- [ ] Tüm durumların yüksek ayrıntılı ekranları çizildi.
- [ ] Gerçek hesaplar/roller ve klavye ile ürün kabulü yapıldı.
- [ ] T-01…T-12 kaynak sorunları uygulamada kapandı.

### Sonraki tasarım paketi

Takip paketi: [Durum ve etkileşim tasarımı](TASARIM_DURUM_VE_ETKILESIM_PAKETI.md). Aşağıdaki ilk iki adım için ilk sentetik örnekler üretildi; gerçek ürün kabulü veya bütün durumların tamamlandığı anlamına gelmez.

1. Tercih edilen kabukta Ana akış + Topluluk detay + Kitaplık için dolu/boş/hata/giriş görünümlerini ayrıntılandır.
2. Ortak menü/modal/dirty form ailesini ayrı ekranlarla çiz; giriş dönüşü ve başvuru hedefi akışını bu bileşenlere bağla.
3. Profil/editör ile oyun lobi/reconnect/sonuç hallerini aynı sözleşmeye taşı.
4. 1280/1440/1728 koyu masaüstü yerleşim, uzun metin, klavye/focus ve reduced-motion kabulünü planla.
5. Ancak bu kararlar sabitlendikten sonra uygulama paketlerini aç: önce kabuk + katman/scroll + durum güvenliği; ardından modüller.

Bu paket önceki teknik/yayın durumunu değiştirmez. Üretim, ticari sağlayıcı ve veri politikası kapıları ayrı kalır. Uygulama geliştirmeye başlandığı veya Faz 0–1'in kullanıcı tarafından onaylandığı iddia edilmez.
