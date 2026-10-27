# ListeKutusu Güncel Durum

Son dar doğrulama: 27 Ekim 2026

## 27 Ekim 2026 — yalnız sol menü eski görünüme döndü

- Kullanıcı isteğiyle Taste öncesi `acbfb53` sürümünün metin logosu,
  15 px / 2,2 stroke ikonları ve mevcut eski navigasyon CSS'i geri geldi.
  Yeni sidebar override'ları kaldırıldı; iki TSX kaynağı eski sürümle eşleşir.
  Diğer ekran düzenleri ve renk tokenları değiştirilmedi.
- Typecheck, iki TSX ESLint ve diff kontrolü geçti. 1440 koyu masaüstünde
  logo 22 px, simgesiz; tek ana menü, aktif kitaplık ve yatay taşma 0
  doğrulandı; ekran görüntüsü incelendi. Tam test matrisi çalıştırılmadı.
- Görsel kontrol sırasında ikinci Next süreci port 3001'e düştü; kapatıldı.
  3000'deki manifest hatası, bu projeye ait geliştirme sunucusunun tek süreç
  yeniden başlatılmasıyla giderildi; `/library` 200 döndü. DB/seed yok.
- Genel tasarım çalışması hâlâ askıda; yalnız kullanıcının yönlendirdiği
  bu menü düzeltmesi uygulandı. Önceki yedekler ve 11 kirli PNG korunur.

## 23 Ekim 2026 — sürüm yedekleri ve marka renginin kontrollü dönüşü

- Kullanıcı nötr tasarımın fazla renksiz kaldığını belirtti. Yeni yerleşim,
  tipografi ve kitaplık yapısı korunarak mavi tonlu koyu yüzeyler, cyan
  birincil işlemler/seçimler ve sınırlı yeşil vurgular geri getirildi.
  Yeni özellik/API/yerleşim veya mobil çalışma eklenmedi.
- Eski renkli kaynak `design/colorful-before-taste-2026-10-23` (acbfb53),
  nötr kaynak `design/neutral-before-color-restore-2026-10-23` (e8ca339)
  etiketleriyle korundu. Yerel Git bundle tam geçmiş olarak doğrulandı;
  commit dışındaki 11 PNG'nin kopyası dosya hash'leriyle doğrulandı.
  Bu kaynak/görsel yedeğidir; DB/.env ve oturum yedeği değildir.
- Yedek dizini: `../work/design-backups/2026-10-23-before-color-restore/`.
  Ayrıntı ve sınırlar: `docs/TASARIM_SURUM_YEDEKLERI.md`.
- AGENTS ve tasarım sistemi: skill tercihleri kullanıcı marka tercihinin
  önüne geçmez; geniş değişim öncesi sürüm koruma ve görsel karşılaştırma.
- Kontrast, UI/a11y statik denetimi ve diff kontrolü geçti. 1440 koyu
  masaüstü görsel denetiminde akış/kitaplık 0 FAIL; akışta marka tint'leri
  ve uzun akış için 2 WARN, kitaplıkta 0 WARN. Görseller açılıp incelendi.
  Bu CSS paketi için full build, yeni oturumlu yazma ve mobil matris yok.

## 23 Ekim 2026 — Taste ile ilk görsel yenileme

- `true-black-flat` yönüyle nötr koyu yüzeyler, gerçek sistem fontu,
  katmanlı ürün işareti ve sakin sol menü uygulandı. Ana akıştaki gradient,
  parlayan kenarlar ve tekrarlanan renkli avatarlar sadeleştirildi.
- Akış filtreleri daha kompakt; keşif beşlisi yardımcı sağ alanda. İlk
  paylaşım keşif modülünün yüklenmesini beklemeden ilk ekranda görünür.
  Paylaşım metni 14 px, eser adı 16 px. Filtre/dönüş/işlem mantığı korunur.
- Kitaplıkta dört bölüm aynı alt çizgili seçim dilinde. Müzik giriş/hata
  paneli kompakt ve sola hizalı. Sayı, veri, katalog veya yetki uydurulmadı.
- Taste tarayıcı denetimi: 1440 ve 1280 koyu masaüstünde ana akış 0 FAIL,
  kitaplık 0 FAIL/0 WARN. Akışta kalan below-fold uyarısı uzun, sayfalı sosyal
  akışın tüm kayıtlarının ilk ekranda olmamasıdır; dashboard değildir.
- Typecheck, değişen TSX ESLint, UI/a11y statik ve tema kontrastı geçti.
  Gerçek tarayıcıda dört kitaplık seçimi, URL/aktif seçim, giriş dönüşü ve
  inceleme filtresi kontrol edildi. Oturumlu yazma/full build/tam regresyon
  yapılmadı. DB/seed/baseline değişmedi; mevcut 11 PNG korunur.
- Genel tema tokenları ortak tüketicilere yansır; ekran bazlı düzenleme
  masaüstü koyuya sınırlı. Mobil/açık tema/forum geliştirmesi askıda.
- Devam: topluluk/etkinlik keşfi ve detayları, sonra profil/hesap; gerçek
  dolu ve hata durumlarıyla ekran bazında aynı görsel dili genişletmek.
  Önceki işlevsel U-03/U-04 açıkları kapanmış sayılmaz.
- Karar ve görsel inceleme: `docs/TASTE_TASARIM_YENILEME.md`.

## 19 Ekim 2026 — GitHub portföy aktarım hazırlığı

- İstenen hedef hesap `erksbars`; yerel Git kimliği GitHub API ile doğrulandı.
  Git kimlik yöneticisinden yalnız `Moooncake020` kaydı kaldırıldı. Sohbetin
  GitHub eklentisi ayrı bağlantıdır; onun hesabı otomatik değişmiş sayılmaz.
- `erksbars/ListeKutusu` kullanıcı tercihiyle private oluşturuldu. Mevcut
  dört commit korundu; kaynak anlık kaydı `f6b04bb` ile main'e gönderildi.
  GitHub sahibi/private durumu ve uzak SHA'nın yerel SHA ile eşleşmesi
  doğrulandı. Origin yeni hesaba gider, eski adres previous-origin olarak
  saklanır; eski uzak depoya yazılmadı.
- README güncel kapsam, stack ve dürüst geliştirme/yayın sınırlarıyla
  portföye hazırlandı. AGENTS ve GitHub çalışma belgesine doğrulanan gerçek
  iş paketleriyle commit düzeni eklendi; tarih/katkı grafiği taklidi yoktur.
- Git'in görebildiği 681 aday dosya ve 4 commit geçmişinde 1103 metin/dosya
  sürümü bilinen sır kalıpları ve yasak dosya adlarıyla tarandı. İki bulgu
  example.org alanındaki kasıtlı negatif test URL'leriydi; gerçek sır
  saptanmadı. Bu dar tarama kapsamlı güvenlik denetimi garantisi değildir.
- `.gitignore` SQLite yan dosyaları, özel anahtarlar ve oturum/test çıktıları
  için genişletildi. Mevcut değiştirilmiş PNG baseline'ları yeni commit
  kapsamına alınmaz; dosyalar kullanıcının çalışma alanında korunur.
- Typecheck, tam ESLint, UI/a11y ve 14 odaklı birim testi geçti. DB, seed,
  uygulama sunucusu ve üretim ayarları değişmedi; geniş build yapılmadı.

## 17 Ekim 2026 — akış filtreleri ve müzik detayından dönüş

- Kapsam, içerik türü ve müzik konusu URL'den birlikte okunur; yenilemede
  korunur. Uyuşmayan gizli filtre temizlenir. URL hazır olmadan varsayılan
  akış isteği atılmaz; hesap değişince taze veri okunur.
- Müzik başlık/tarih/yorum linkleri kaynak yolunu taşır. Detaydaki Akışa dön
  ve normal linkten sonra tarayıcı geri dönüşü, yeniden yüklenen listede
  bulunan kaynak kartı görünür/odaklı getirir. Dönüş yalnız root filtreleri
  ve geçerli kart işaretidir; dış adres/başka yol/ek token taşınmaz.
- Ana akış/detay/yorum giriş bağlantıları bağlamı korur; taslak aktarılmaz,
  işlem otomatik gönderilmez. Next history metadatası korunur; History API
  patch edilmez. Bu U-03 geçmişte taslak korumasının bittiği anlamına gelmez.
- 5 dar koyu masaüstü browser + 3 saf dönüş yolu testi, TypeScript, kaynak
  ESLint ve UI/a11y geçti. Public paylaşım yalnız okunur; istemci API'si
  mock, yazma/DB/seed/baseline/sunucu değişimi yok. Geniş build/matris yok.
- Açık: yüklenen listede bulunmayan kaynak için çok sayfalı konum, topluluk/
  etkinlik detayından dönüş, oturumlu yorum kabulü ve U-03 geçmiş/girişte
  taslak devamı. Sınırsız arka plan sayfalama veya özel içerik cache'i yok.
- Sonraki bu U-04 uçları. Hazırlık ~%85; uygulama ~%30 (U-01 0,75 +
  U-02 0,70 + U-03 0,70 + U-04 0,60 = 27,5/100; beşliğe yuvarlak).
  Tüm ürün/yayın oranı değil; mobil/açık tema/forum askıda kalır.

## 17 Ekim 2026 — karma kart hiyerarşisi ve yorum güvenliği

- Müzik/inceleme/sohbet/etkinlik ortak kart kabuğu, yazar-tarih, tür etiketi
  ve başlık bandı kullanıyor. Topluluk kaynağı, puan/spoiler ve TVmaze atfı
  korunuyor. Etkinlik tarih/mekân/kapasite/iptal bilgisini ayırır; otomatik
  RSVP veya üyelik yoktur.
- Yorumlarda ortak yükleme/HTTP hata/boş yüzey, bilinmeyen sayıda —,
  eski okumayı iptal ve gönderim hatasını formda gösterme eklendi. Yanıt
  hedefini değiştirme/vazgeçme metin varsa onay ister; iptal korur.
  Taslak ortak iç-link/beforeunload korumasında; gönderim tekrarı kilitli.
- Kaldırma onayı bağlı yanıtları açıklar; hata onayı açık tutar. Silinen
  yanıt hedefinin metni kök yoruma sessizce taşınmaz. Anonim kullanıcıya
  çalışmayan Yanıtla düğmesi sunulmaz. Sunucu izinleri değişmedi.
- 3 odaklı koyu masaüstü browser + 2 mantık testi geçti. Kartta dar Axe/
  taşma/görüntü incelemesi, TypeScript, kaynak ESLint, UI/a11y geçti.
  Yorum okuması mevcut public paylaşımı salt okunur açar; API yanıtları mock.
  DB/seed/baseline/sunucu değişmedi. Oturumlu yorum gönderme/silme/hedef
  değişiminin tam browser kabulü yapılmadı; geçiş/silme hesabı birim testlidir.
- Sonraki: U-04 filtre/detay/geri dönüş ve oturumlu yorum kabulü. Geniş build,
  görsel matris, U-03 geçmiş/giriş devamı açık. Hazırlık ~%85, uygulama ~%25
  (U-01 0,75 + U-02 0,70 + U-03 0,70 + U-04 0,40 = 25,5/100; beşliğe yuvarlak).
  Tüm ürün/yayın oranı değil; mobil/açık tema/forum askıda kalır.

## 17 Ekim 2026 — bildirim durumları ve ilk kart etkileşim dilimi

- Bildirim paneli ortak yükleme/giriş/403/503/hata/boş kartlarını kullanır.
  Bilinmeyen okunmamış sayısı sıfır değil — gösterir; veri yokken tercihler
  değiştirilemez. Giriş hedefi açık sayfanın yolunu ve sorgusunu korur.
- Okuma/yazma akışı `useNotifications` içine ayrıldı. Ana okuma, geçmiş
  yüklemesi veya yazmada 401/403 eski bildirimleri, sayacı ve tercih yüzeyini
  kapatır. Geçmiş sayfasının ağ/5xx hatası ilk sayfayı silmez.
- Yazma başlarken eski okuma iptal edilir; geç poll sonucu okundu/tercih
  değişimini geri alamaz. Tercih hatası önceki değere döner; okundu hatası
  sayacı düşürmez. Sayfa içi gezinmede başlamış PATCH tamamlanabilir, unmount
  olmuş panele durum yazılmaz. API yetki/iş kuralları değiştirilmedi.
- U-04 ilk dilimi: müzik kartı menüsünde ilk odak, ok tuşları/Home/End,
  Escape ile tetikleyiciye dönüş ve Tab ile kapanma var. Uzun not düğmesi
  aria-expanded/controls ilişkisini taşır. Karma kartların görsel yeniden
  düzeni veya bütün yorum paketi tamamlanmış değildir.
- Son 6 seçilmiş koyu masaüstü senaryosu geçti: bildirim durumları, gecikmiş
  poll, mutation hataları/geri alma, sayfa değişiminde PATCH, geçmişte yetki
  kaybı, kart klavyesi ve eski bildirim gruplaması. Panel/kartta dar Axe,
  TypeScript, değişen kaynaklarda ESLint, UI/a11y kapıları geçti. Mutasyonlar
  mock; DB/seed/baseline/sunucu değişmedi. Tam matris/build çalıştırılmadı.
- Sıradaki: U-04 karma kart hiyerarşisi, içerik türü aksiyonları ve yorum
  akışı. Kalan U-02 yönetim/oyun; U-03 geçmiş/girişte taslak devamlılığı açık.
- Tasarım hazırlığı ~%85; yeni tasarım uygulaması ~%25
  (U-01 0,75 + U-02 0,70 + U-03 0,70 + U-04 0,15 = 23/100; beşliğe yuvarlak).
  Ürün/yayın oranı değildir; mobil/açık tema/forum geliştirmesi askıda.

## 17 Ekim 2026 — başvuru konusu koruması ve Keşfet durumları

- Başvuru türü/tekil şikâyet değişiminde metin veya şikâyet seçimi varsa
  onay istenir. Yeni konu güncel salt okunur bağlamda doğrulanmadan eski
  seçim/metin temizlenmez. Ağ/503 veya kaldırılmış rapor/itiraz hakkı eski
  taslağı korur. Onaylı geçiş açıklamayı temizler; başka konuya taşımaz.
- Rapora bağlı olmayan başvuru eski rapor kimliği göndermez. Başarılı yeni
  kayıt metin/tür/rapor seçimini temizler; hata ve duplicate taslağı korur.
- Keşfet ortak yükleme/401/403/503/hata yüzeyine geçti. Kullanıcı ve liste
  aramalarında da hata görünür; hata artık sonuç yok diye gösterilmez.
  Yüklenmeyen sayaçlar sıfır değil bilinmiyor. Bozuk başarı yanıtı boş sayılmaz;
  iptal edilen/eski okuma sonucu yeni isteği ezmez. API iş kuralları değişmedi.
- 10 odaklı koyu masaüstü browser senaryosu; dar boş kart Axe, TypeScript,
  değişen kaynaklarda ESLint ve UI/a11y kapıları geçti. Mutasyonlar mock;
  DB/seed/baseline/sunucu değişmedi. Tam matris/build çalıştırılmadı.
- Açık U-03: aynı belge geri/ileri, giriş boyunca kimliğe bağlı güvenli
  taslak devamı ve diğer form çıkışları. Geçmiş API'sine patch veya metinleri
  kalıcı depoya aktarma eklenmedi. Kalan U-02: bildirim/yönetim/oyun yüzeyleri;
  ardından U-04 akış/kart/yorum bütünlüğü.
- Tahmin: tasarım hazırlığı ~%85, yeni tasarım uygulaması ~%20
  (U-01 0,75 + U-02 0,60 + U-03 0,70 = 20,5/100; beşliğe yuvarlak).
  Ürün/yayın oranı değil. Mobil/açık tema/forum geliştirmesi askıda kalır.

## 17 Ekim 2026 — profil kaydı sonrası devam ve yerel çıkışlar

- Profil çıkış penceresinde kal / kaydetmeden çık / kaydet ve devam et var.
  Başarı seçilen hedefe gider; 401/ağ hatası taslağı ve hedefi korur. Pending
  sırasında tekrar kayıt, Escape ve çıkış kilitli. Girişte taslak aktarımı yok.
- Kaydet seçeneği yalnız tek dirty, desteklenen profil düzenlemesinde açılır;
  birleşik liste kaydı veya yeni paylaşım/etkinlik/başvuru yayımlamaz.
- Hesap bölüm/ana akış düğmeleri ve yetkili kuyruk filtre/sayfa/yenilemesi
  ortak korumada. İptal mevcut metni ve filtreyi korur.
- 8 odaklı koyu masaüstü browser senaryosu, TypeScript, değişen kaynaklarda
  ESLint ve UI/a11y statik kapıları geçti. Yazmalar mock; DB/seed/baseline/
  sunucu süreci değişmedi, geniş build yapılmadı.
- Sonraki: başvuru türü/tekil rapor hedefi, aynı belge geri/ileri ve güvenli
  girişte devam; ardından kalan U-02 ve U-04 akış/kart paketi.
- Tasarım hazırlığı ~%85; yeni tasarım uygulaması yuvarlak ~%20 kalır
  (U-01 0,75 + U-02 0,50 + U-03 0,65 = 19/100, on eşit kaba paket).
  Bu tüm ürünün veya yayının tamamlanma oranı değildir.

## 17 Ekim 2026 — kişisel merkezler ve ortak taslak koruması

- `DraftNavigationProvider` hesap, sohbet/inceleme, etkinlik oluşturma/
  düzenleme ve başvuru/yanıt taslaklarını yalnız dirty/busy bayraklarıyla
  kaydeder. Ortak menüyle sınırlı olmayan iç linklerde tek çıkış onayı;
  birden fazla taslakta iptal hepsini korur. Pending işlemde gezinme durur.
  Metin, parola, katalog token'ı veya konum kalıcı depoya yazılmaz.
- Yenileme/belgeden ayrılma için ortak beforeunload uyarısı var; aynı belge
  içi geri/ileri, bütün programatik düğmeler ve kaydet-devam-et henüz yok.
  Bu tur geçmiş monkeypatch'i veya sunucuya otomatik taslak kaydı eklenmedi.
- Topluluk kayıtları, kişisel ajanda ve kendi/yetkili platform başvurularına
  ortak giriş/yetki/hata/yükleme/boş yüzeyleri yayıldı. 401 giriş gerektirir;
  ağ/500 giriş gereksinimi sayılmaz. Giriş dönüşü ilgili filtreleri korur.
- HTTP durum kodu artık JSON olmayan hatada da korunur. URL/yenileme nesli
  değişince önceki özel kuyruk ve erişim bilgisi çizilmez; 403 eski kayıtları
  göstermeye devam etmez. API'nin gerçek yetki/iş kuralı değiştirilmedi.
- Başvuruda topluluk hedefi değişimi onay ve salt okunur ön doğrulama ister.
  İptal, doğrulanamayan hedef veya hata eski hedef/metni korur; doğrulanan
  yeni hedefe onaylı geçiş metin/itiraz seçimini temizler. Yazma hatası yeni
  hedefin metnini korur. Tür/tekil rapor değişimleri ayrıca gözden geçirilecek.
- Ek düzeltme: modal tüm düğmeleri pasifken odağı kaybetse de Escape/busy
  sınırı doğru; bitince odak geri içeride. Birincil link butonunun metin
  rengi topluluk link stiliyle ezilmiyor. Güvenli dönüşte literal ters eğik
  çizgi/kontrol karakterleri reddediliyor.
- Son 7 odaklı browser senaryosu + 13 birim kontrolü geçti. Typecheck,
  değişen kaynaklarda ESLint, UI/a11y statik kapıları ve bir giriş kartında
  dar Axe kontrolü geçti. Yazmalar mock; DB/seed/baseline/sunucu değişmedi.
- Tasarım hazırlığı **~%85**; yeni tasarım uygulaması **~%20** (kaba eşit
  10 pakette U-01 0,75 + U-02 0,50 + U-03 0,50 = 17,5/100; beşliğe yuvarlak).
  Önceki %10 ilk dilimdir; oran yayın veya tüm uygulamanın tamamlanması değil.
- Sonraki: U-03 kayıt sonrası devam/giriş dönüşü ve yerel düğme/filtre
  çıkışları; U-02'nin kalan ekranları, ardından U-04 akış/kart düzeni.
  Mobil/açık tema/forum özel geliştirmesi ve manuel yayın kapıları değişmedi.

## 17 Ekim 2026 — yeni tasarımın ilk uygulama paketi

- Kullanıcının kodlamaya geçiş sorusuna “Devam edelim” yanıtıyla U-01/U-02
  uygulaması başladı. Aşağıdaki %0 ifadeleri önceki tasarım aşamasına aittir.
- Root `AppShell`: koyu masaüstünde tek 224 px sol menü; sosyal/hesap/hukuk/
  yönetim aynı kabukta. Ana akışın yinelenen menüsü kaldırıldı; aylık özet ve
  rozet erişimi sağ bağlam alanında korundu. Mevcut URL ve yetkiler değişmedi.
- Sayfa üst alanı akışta; başlık global menünün altında kalmıyor. Uzun iç
  başlık/açıklama sarılıyor. Ana akışın h1'i ürün markası yerine görev adı.
- `ModalPortal`: onay, takipçi, müzik paylaşımı düzenleme/rapor ve yorum
  raporu body katmanına taşındı; arka alan inert, scroll kilidi, odak çevrimi,
  Escape/busy ve kapanış odağı ortak. Mevcut demo takipçi penceresi görüldü.
- `ContentState`: kitaplıkta giriş/servis kapalı/hata/gerçek boş/yükleme ve
  akış hatasına bağlandı. Bilinmeyen kitaplık sayısı 0 değil “—”; açık Toast
  tonu artık metin tahminiyle ezilmiyor. Diğer ailelere yayılım henüz bitmedi.
- İnisiyatif: yeni ortak menüde hesap taslağı kaybolmasın diye dar çıkış
  koruması eklendi. İptal metni korur; kayıt sürerken geçiş durur; onaylı
  çıkış seçilen hedefe gider. Bütün formlar/geri-ileri için U-03 hâlâ açık.
- Doğrulama: 8 odaklı koyu masaüstü browser senaryosu + 1 navigasyon birim
  testi geçti; typecheck, değişen dosyalarda ESLint, UI ve a11y statik kontrol
  geçti. 1280/1440/1728 yalnız seçilen yolculuklar; tüm rota/rol matrisi değil.
  Demo profil kontrolü mevcut yerel fixture'ı salt okur; kayıt mutasyonları
  tarayıcı testinde mock. DB, sağlayıcı, sunucu süreci ve baseline değişmedi.
- Tasarım hazırlığı yaklaşık **%85**. Yeni tasarım uygulaması yaklaşık **%10**
  (eşit kabul edilen 10 devir paketinde U-01 ~0,75 + U-02 ~0,25; diğerleri 0).
  Bu yaklaşık yön göstergesidir; tüm uygulama/yayın yüzdesi değildir.
- Sonraki: U-03 taslak/giriş dönüşünü genelleştirmek ve U-02 durumlarını
  kişisel/topluluk merkezlerine yaymak; ardından U-04 kart/akış düzeni.
  Mobil/açık tema/forum özel geliştirmesi ve yedi manuel yayın kapısı askıda/açık.

## 17 Ekim 2026 — uzun içerik ve son tasarım kabul listesi

- İleri ekranlar/devir belgesinin 10. bölümünde 25 rota, ortak uzun metin,
  yoğun liste, spoiler, modal/odak ve değişen rol kabulü birleştirildi.
- Ayrı sentetik örnekte uzun topluluk/kitap/inceleme, moderatörlük kaybı,
  arşiv, oturum ve kaynak/ağ ayrımı dar kontrol edildi. Sayfalama odağı
  yalnız örnekte düzeltildi; gerçek uygulama yetki/odak testi yapılmadı.
- Güncel tasarım hazırlığı 82,50/100, beşlik dilime yuvarlak **%85**
  (yaklaşık ±5 puan). Artış yalnız ortak bileşen kabulünden; diğer aileler
  yeni örnek çizildi diye tamamlanmış sayılmadı. Aşağıdaki %80 önceki aşama.
- İlk kapsamlı taslak devredilebilir; nihai kullanıcı/kabuk onayı bekliyor.
  Açık kodlama talimatıyla önce U-01/U-02. Yeni tasarım uygulaması **%0**;
  uygulama kodu/CSS/DB değişmedi. Mobil/açık tema/forum askıda kalır.

## 17 Ekim 2026 — ileri ekranlar ve tek tasarım devri

- `docs/TASARIM_ILERI_EKRANLAR_VE_UYGULAMA_DEVRI.md`: profil/önizleme,
  özel başvuru, bildirim, yönetim ve oyun durumları ayrıntılandırıldı;
  U-01…U-10 uygulama bağımlılık/kabul sırası tekleştirildi.
- Sentetik örnekte gizli üniversite, DOM vitrin sırası, hedef değişiminde
  taslak onayı, okundu hatası, 403 özel kuyruk sınırı ve oyun kesinti/sonuç
  halleri dar kontrol edildi. Gerçek API/rol/oyun veya yayın testi değil.
- Kapsam ağırlıklı tasarım hazırlığı tahmini 78,75/100, yuvarlak **%80**
  (yaklaşık ±5 puan). Yeni tasarımın uygulamaya aktarımı **%0**; uygulama
  kodu/CSS/DB değiştirilmedi. Eski yerel topluluk %95 tahmini farklı kapsam.
- Kalan: uzun/dolu veri ve özel rol/hata görselleri, son tasarım kabulü ve
  açık uygulama başlangıcı. Sol menü çalışma yönü, nihai kullanıcı onayı
  değil; mobil/açık tema/forum askıda ve yedi manuel yayın kapısı açık.

## 17 Ekim 2026 — durum ve etkileşim tasarım paketi

- `docs/TASARIM_DURUM_VE_ETKILESIM_PAKETI.md`: ana akış/topluluk/kitaplık
  için altışar ana durum; ortak modal, giriş dönüşü, yeni incelemede iki,
  profil düzenlemede üç seçenekli taslak çıkışı örneklendi.
- Ayrı servissiz konuşma örneğinde kayıt hatasında metin korunması, Escape,
  aynı etkinliğe giriş dönüşü ve kitaplık boş/hata/giriş durumları dar
  kontrol edildi. Gerçek hesap/API, tüm durum matrisi veya yayın kabulü değil.
- Sol menü çalışma yönüdür; nihai kullanıcı onayı sayılmaz. Uygulama
  kodu/CSS/DB değişmedi; geniş build/test ve mobil/açık tema yapılmadı.
- Sonraki tasarım işi profil/önizleme, özel başvuru, bildirim/yönetim ve
  oyun lobi/bağlantı/sonuç ayrıntıları; sonra uygulama devri tekleştirilecek.

## 17 Ekim 2026 — tasarım Faz 0–1 öneri paketi

- Bütüncül tasarım denetimi ve ilk kabuk/akış paketi hazır:
  `docs/TASARIM_BUTUNLUGU_VE_AKIS_DENETIMI_2026-10-17.md` ve
  `docs/TASARIM_FAZ_0_1_KABUK_VE_AKIS_PAKETI.md`.
- İki kabuk alternatifi, altı ekran örneği, 25 rota eşlemesi ve sekiz
  kritik akış tasarlandı. Ayrı konuşma önizlemesi sentetik ve servissizdir.
- Uygulama kodu/CSS/DB değiştirilmedi; tasarım önerisi kullanıcı onayı,
  kaynak sorunlarının kapanışı veya yayın kabulü değildir. Sonraki tasarım
  işi seçilen kabukta dolu/boş/hata/giriş ve ortak modal/taslak durumlarıdır.
- Masaüstü koyu tema kapsamı sürer; mobil/açık tema/bağımsız forum askıda.

## 17 Ekim 2026 — tasarım öncesi teknik kapanış paketi

- Tasarım/kozmetik değiştirilmedi. Şifreli yedek/doğrulama, yeni ortamda
  HTTP kurtarma, özel runtime/alarm adaptörü ve izole production build
  tamamlandı. Teknik/operatör devri docs/TEKNIK_KAPANIS_VE_YAYIN.md içinde.
- `db:backup-encrypted`: native readOnly snapshot, streaming AES-256-GCM /
  scrypt, dosya başına salt/IV; doğrulanmış tam dosya exclusive yayımlanır.
  Yanlış parola/tamper/kesik dosya plaintext hedef bırakmaz; overwrite yok.
  Snapshot yeniden açılıp tüm içerikle karşılaştırılır. Eski yedekler budanmaz.
  `db:verify-encrypted -- --backup <dosya>` yalnız geçici kopyada SQLite/FK ve
  güncel Prisma şema uyumunu doğrular; sağlam eski şema bile kod 1'dir.
  Gerçek DB için yeni şifreleme anahtarı atanmadı veya yedek hedefi seçilmedi.
- `pilot:rehearse-recovery`: sentetik HTTP hesap/üyelik/inceleme/etkinlik/
  RSVP ve bekleyen outbox işi şifreli yedekten yeni Next/Prisma ortamına
  döndü. Eski oturum ve yeni parolalı giriş, HTTP inceleme görünürlüğü,
  üye/anonim sınırı, teslim ve yeni yazma geçti. Worker restart sonrası tek
  bildirim/readAt korunur. Kaynak bayt/tam içerik eşitliği ve health temiz.
  Son restore+akış gözlemi 9468 ms; gerçek RPO/RTO veya host kanıtı değildir.
- `runtime:check` production ortamı/DB/topluluk/worker ve gerçek HTTP health
  kontrolüdür; --development yerelde sağlıklı geçti. --notify ayrı opt-in:
  operatör HTTPS endpoint'ine dar kodlu JSON; redirect yok, arıza/geçiş/30 dk
  hatırlatma, başarısız teslimde state ilerlemez. Bozuk state fail-closed.
  Gerçek webhook tanımlanmadı veya mesaj gönderilmedi; dış uptime/OS oyun
  ve yedek servisi/yaş/disk izleme kurulmuş sayılmaz.
- deploy/systemd altında web/event/game ve runtime+backup timer'ları için
  yedi kurulmamış, root olmayan örnek var. Production'da açık development
  NODE_ENV reddedilir. Host/Linux seçilmedi, servis/cron/otomasyon kurulmadı.
- İzole production build başarıyla geçti; mevcut .next/sunucu/DB korunur.
  38 odaklı kontrol geçti: şifreleme/auth/tamper/CLI şema, runtime alarm
  mock/geçiş/hata, env, dizin/junction/hedef reddi, unit/timer sözleşmesi,
  pilot ve SQLite kurtarma regresyonları. İlgili lint ve typecheck temiz.
  Browser/mobil/açık tema/tüm repo matrisi tekrar edilmedi.
- Yedi gerçek yayın kapısı hâlâ unverified: host/TLS/sırlar, süreç/dış alarm,
  off-host yedek+saklama, uzun staging yük ve hedef RPO/RTO, ticari sağlayıcı
  incelemesi, veri/moderasyon sorumluluğu ve yayın onayı. Bu dış kararlar
  kullanıcı adına verilmedi. Tasarım paketi başlayabilir; uygulama yayınlanmadı.

## 17 Ekim 2026 — izole gerçek HTTP ve işçi provası

- `npm run pilot:rehearse-http` eklendi: gerçek DB/.env yerine yeni geçici
  kaynak kopyası ve sentetik SQLite; ayrı loopback portu ve kendi .next'iyle
  Next development + gerçek bildirim işçisi birlikte çalışır. Mevcut 3000
  sunucusu veya çalışan işçi durdurulmadı. Ücretli servis/dağıtım yoktur.
- 13 sentetik hesap gerçek HTTP login yapar; topluluk oluşturma/üyelik,
  anonim 401 ve yanlış origin 403 sınırları doğrulanır. 1/4/8 görevde her
  aşama 12 RSVP +12 detay okuması; tam 8 kabul/4 kapasite 409 ve 8 kalıcı
  attending kaydı geçti. Hız sınırları veya üretim Secure çerezi gevşetilmedi.
- Üç etkinliğin HTTP PATCH değişikliğiyle 24 bildirim gerçek worker'dan
  teslim edildi. Tüm hesapların özel/no-store bildirim API'sinde alıcılara
  birer, kapasite nedeniyle reddedilenlere/düzenleyene sıfır görünürlük geçti.
  SQLite quick_check/FK, 12 topluluk kontrolü, boş/failed olmayan kuyruk ve
  sağlıklı gerçek worker doğrulandı. Son örnekte 8 görev kabul p95 358 ms,
  detay p95 218 ms; teslim gözlemi 278–1514 ms. Bunlar SLA/eşik değildir.
- Sistem env'i dar izin listeli; gerçek DB/URL/sağlayıcı sırları, proxy ve
  NODE_OPTIONS devralınmaz. Kaynak kopyası .env*/DB/yedek/günlük içermez;
  symlink/junction hedefleri reddedilir. Yalnız sahipli çocuklar IPC ile
  kapatılır; zorunlu sonlandırmada tmp korunarak hata verilir. Normal kapanışta
  kendi doğrulanmış geçici dizini kaldırılır; gerçek veri/yedek silinmez.
- İzolasyon + sınırlı görev ölçümü toplam 6 odaklı test, ilgili lint ve
  typecheck geçti; gerçek HTTP/worker provası başarılı. Arayüz değişmediği
  için genel build/browser/mobil/açık tema matrisi tekrar çalıştırılmadı.
- Kılavuz docs/HTTP_ISCI_PROVASI.md; plan/kararlar/ön kontrol belgeleri
  güncellendi. Bu development provası production build/TLS/proxy, uzun
  staging yük, crash/replay veya uygulama akışlarıyla kurtarma değildir.
  Yedi manuel yayın kapısı açık; yaklaşık %95 yerel kapsam tahmini değişmedi.

## 17 Ekim 2026 — salt okunur pilot ön kontrolü

- Yeni `npm run pilot:check` ve `--production --json`: ortam, SQLite
  quick_check/FK, migration history/checksum, mevcut 12 topluluk denetimi ve
  yerel işçi heartbeat/ilerleme/kuyruk sonuçlarını tek özel raporda toplar.
  Native readOnly+query_only; eksik DB yaratılmaz, veri/sır/iş/süreç değiştirmez.
  Kod 0 otomatik geçiş, 1 hata/okunamama, 2 uyarı; yayın izni değildir.
- releaseApproved daima false, yedi manuel kapı unverified. Süreç/dış alarm,
  off-host şifreli yedek, staging HTTP/worker yük ve kurtarma, sağlayıcı lisansı,
  gizlilik/saklama/moderasyon sorumlusu ve gerçek TLS/sır/yayın onayı ayrı kalır.
  Hedef host/ücretli servis seçilmedi; gerçek dağıtım veya üretim sırrı değişmedi.
- check-env saf environment-check ile ortaklaştırıldı: örnek/basit/aynı sır,
  URL protokol/credentials/path/query/hash, production yerel/özel origin ve
  callback eşleşmesi, mevcut SQLite adresi, limit/bakım ve katalog iletişim
  alanı doğrulanır. Bu gerçek entropi, DNS/TLS veya sağlayıcı hesabı testi değildir.
  Rapor yalnız sabit kod/alan/mesaj/sayıdır; değer, kişi, path veya SQL sızmaz.
- Geçmişte eksik/fazla/yarım/yinelenen migration ya da değiştirilmiş SQL
  checksum'ı fail-closed'dur. Bağımlı denetim okunamazsa null/unknown kalır;
  sıfır sorun gibi gösterilmez. Bu tam fiziksel Prisma schema-diff değildir.
- environment-check/pilot-preflight/worker-operations toplam 26 odaklı test
  geçti: fixture DB hash eşitliği, eksik DB yaratmama, FK/şema/geçmiş arızası,
  gerçek kuyruk timestamp, eksik/sağlıklı worker, yerel/production ayrımı,
  CLI seçenekleri ve sır sızmaması. Typecheck ve ilgili lint temiz.
- Gerçek development raporu geçti: 53/53 migration tamam, checksum uyumlu,
  quick_check/FK ve 12 topluluk kontrolü temiz; tek sağlıklı işçi, boş kuyruk.
  Gerçek DB'nin kontrol öncesi/sonrası dosya özeti eşit. Production raporu
  APP_URL ve SPOTIFY_REDIRECT_URI yerel HTTP adresleri olduğu için beklenen
  kod 1; SQLite operasyon uyarısı da var. Bunlar düzeltilmiş varsayılmadı.
- README/aktif plan/kararlar ve docs/PILOT_ON_KONTROL.md komutlar, çıkış
  kodları, sınırlar, yedi kapı/kanıt ve güvenli hedef hazırlık sırasını açıklar.
  Doküman yayın onayı veya lisans değerlendirmesi değildir.
- Arayüz değişmedi; genel/mobil/açık tema/browser/build matrisi tekrar edilmedi.
  Çalışan geliştirme sunucusu ve gerçek işçi yeniden başlatılmadı; HTTP 200.
  Yerel plan yaklaşık %95; gerçek hedef ve manuel üretim engelleri açık.

## 17 Ekim 2026 — özel Etkinliklerim ajandası

- /community-events ve private/no-store GET /api/communities/agenda eklendi.
  Kişinin RSVP verdiği veya düzenlediği görünür etkinlikleri bir arada sunar;
  topluluk dizini ve masaüstü ana menüden erişilir. Başkasının ID'siyle okuma
  yoktur; yalnız aktif oturum. Yeni tablo/migration veya sağlayıcı yoktur.
- Yaklaşan/geçmiş/iptal ve tümü/tercih verdiklerim/düzenlediklerim filtreleri
  URL/geri/yenilemede korunur. Filtreler count+sayfalama öncesi; 20 kayıt/
  100 sayfa, startsAt+id deterministik. Düzenleyen+RSVP çakışması çoğalmaz.
  Count ve kayıtlar aynı read transaction'da, sorgu sayısı kartla artmaz.
- Yaklaşanlarda active kaynak+scheduled/gelecek ve kişinin aktif RSVP'si
  veya düzenleyenliği gerekir. Geçmiş/iptalde varsa withdrawn ilişkisi de
  görülebilir; fiziksel katılım kanıtı değildir. Düzenleyen otomatik attending
  sayılmaz. Arşivde görünür geçmiş/iptal kaynaklar korunur; kaldırılmış,
  deaktif organizer ve iki yönlü engelli kaynaklar kapanır. Genel dağıtım
  koşulu yoktur: kişinin zaten ilişkili community dağıtımlı içeriği de gelir.
- DTO yalnız kaynak özeti ve own viewerStatus/isOrganizer/canWithdraw;
  description, diğer RSVP/katılımcı listesi, özel kullanıcı kimlikleri yok.
  Ajanda kamu profiline taşınmaz; okuma yeni tercih/bildirim üretmez.
- Kendi tercihini geri alma açık onayla mevcut source RSVP servisini kullanır.
  Hata sahte durum üretmez; organizer RSVP'sini çekmek etkinliği iptal etmez.
  Son sayfanın son tercihi çıkınca önceki sayfa açılır. Geç yanıt değişmiş
  URL'yi eski filtre/sayfaya taşımaz; eski kart/onay ortak read key ile gizlenir.
  Yeni katılım/yönetim kaynak detayında kalır; takvim/hatırlatma eklenmedi.
- Yeni ajanda 8 kontrol dahil attendance/lifecycle/read-state toplam 32
  odaklı kontrol geçti. Yeni iki oturumlu browser gizlilik/anonim/forged-user,
  no-store, dizin linki, filtre/geri/reload, 21 tercih/sayfalama, onay/Escape/
  hata/başarı, source detay ve engel/boş durumu doğruladı. Attendance browser'ı
  da geçti (2 ilgili desktop senaryo). Detay geçişinde test URL commit'ini
  bekleyip assertion'ı kaynak paneline daralttı; ürün kuralı gevşetilmedi.
- Next route typegen sonrası typecheck, ilgili lint, UI/a11y statik ve
  uyarısız build geçti. 1280px koyu ekran incelendi; baseline yenilenmedi.
  Genel/mobil/açık tema/üretim yük matrisi çalıştırılmadı. Büyük organizer
  sorgularında gerçek hacim/indeks ölçümü staging işidir.
- 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/7 forum konusu
  korundu; gerçek beğeni/kayıt/test etkinlik/audit/outbox 0. Yalnız kesin
  fixture'lar temizlendi. quick_check=ok, FK ihlali yok, pilot 12/12 temiz;
  işçi sağlıklı. Build sonrası 127.0.0.1:3000 yeniden açık.
- Yerel plan yaklaşık %95; üretim engelleri ve kalıcı taslak/geçmiş gibi
  ayrı ürün kapsamları açık. Mobil/açık tema ve bağımsız forum askıda.

## 17 Ekim 2026 — güncel okuma ve inceleme taslağından çıkış güvenliği

- Paylaşım detayı ve etkinlik liste/detayında ortak useCommunityRead,
  URL+yenileme nesline bağlı başarı/hata kullanır. Filtre/sayfa/hedef
  değişimindeki ilk render eski içerik, katılımcı veya işlem düğmesini
  göstermez; geç yanıt abort/signal ile yok sayılır. Eski hata yeni hedefe
  taşınmaz. Pasif etkinlik paneli ve detaydayken liste gereksiz okunmaz.
- İptal/kaldırma onayı güncel hedefin detayıyla eşlenir; hedef değişimi
  eski onayı kapatır. API/üyelik/roller/veritabanı şeması değişmedi.
- İnceleme editöründe başlık/metin/puan/spoiler farkı izlenir. Değişiklik
  varsa Akışa dön ve Düzenlemeden vazgeç, silinecek taslak için ortak modal
  onayı ister. İptal/Escape metni korur; değişmeyen form ve başarılı save
  gereksiz onay istemez. Koruma yalnız bu iki sayfa içi komuttadır; tarayıcı
  geri/yenileme/dış link/sekme kapatma veya okuma/yetki hatasında kurtarma
  değildir. Kalıcı taslak/beforeunload/global gezinme engeli eklenmedi.
- Yeni read-state 5 kontrol dahil navigation/review-edit/event-update/
  attendance toplam 34 odaklı kontrol geçti. Yeni browser geciktirilmiş
  liste/detay/hedef değişimi, eski onay/yanıt, retry ve taslak onayı/iptal/
  Escape/değişmeyen formu doğruladı. Önceki navigation/review-edit/attendance/
  event-update ile toplam 5 ilgili koyu desktop senaryo geçti.
- Eski event-update browser testi çalışan işçinin hiç teslim etmediğini
  varsayıyordu. İşçiyi durdurmadan kalıcı iş sayısı, kesin eventual teslim,
  boş kuyruk ve ikinci çalıştırmada çoğalmama doğrulamasına düzeltildi;
  yeniden koşu geçti. Bu ürün bildirim hatası veya garanti gevşetmesi değildir.
- Typecheck, ilgili lint, UI/a11y statik ve uyarısız üretim build geçti.
  Yeni onay modalının 1280px koyu görüntüsü incelendi. Genel/mobil/açık tema
  veya üretim yük matrisi çalıştırılmadı; baseline yenilenmedi.
- 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/7 forum konusu
  korundu; gerçek beğeni/kayıt/test etkinlik/audit/outbox 0. Yalnız kesin
  fixture'lar temizlendi. quick_check=ok, FK ihlali yok, pilot 12/12 temiz;
  gözetmen altında tek sağlıklı işçi. Build sonrası 127.0.0.1:3000 açık.
- Yaklaşık yerel plan %95; bu yayın hazırlığı oranı değildir. Üretim süreç
  yönetimi/dış alarm/staging yük-kurtarma ve veri saklama politikaları açık;
  mobil/açık tema ve bağımsız forum askıda.

## 17 Ekim 2026 — incelemede doğrudan katalog seçimi

- İnceleme oluşturma artık film/dizi/kitap için Elle gir / Kitaplığımdan seç /
  Katalogda ara yollarını sunar. Mevcut Wikidata/TVmaze/Open Library araması
  kullanılır; kitaplığa önceden eser ekleme zorunluluğu yoktur. Müzik
  kitaplık/manuel, video/kutu oyunları manuel kalır. Yeni sağlayıcı/DB alanı yok.
- Katalog araması yalnız Ara/Enter ile başlar, tuş başına sorgu yoktur.
  En fazla 20 sonuç; tür/query değişiminde eski istek iptal edilir. Başarılı
  yeniden arama seçimi boşaltır; aynı eserde yeni token açıkça seçilebilir.
  Arama hatası ve geçersiz/süresi dolan seçim inceleme metnini silmez.
- create-post catalogSelection mevcut kullanıcıya bağlı 30 dakikalık imzayı
  üyelik/aktif hesap/arşiv transaction'ında doğrular. reference ile birlikte,
  sohbet/müzik/oyun, başkasının/eski/değiştirilmiş veya yanlış tür/sağlayıcı
  seçimi reddedilir. Özellik kapalıysa yeni katalog yayını 503; manuel/
  kitaplık/eski yayınlar korunur. Canonical URL provider/externalId'den alınır.
- Yayında dış istek, kitaplığa/müzik listesine otomatik ekleme yoktur.
  Public snapshot eser adı/kaynak/provider'dır; token/query/özel kimlik yoktur.
  Edit eseri değiştirmez. UI artık bütün kaynaklı eserleri kitaplıktanmış gibi
  etiketlemez; TVmaze atfı korunur. Katalog hataları da private/no-store'dur.
- Yeni 8 kontrol dahil katalog/kitaplık/cache/references/edit/communities
  toplam 56 odaklı kontrol geçti. Yeni browser gerçek oturum+yayın API'si ve
  imzalı sentetik arama ile süre hatası/taslak/yeni seçim, kesinti/boş/Enter,
  public spoiler/no-library-write, eski tür sorgusu, TVmaze ve müzik/oyun
  sınırlarını doğruladı. Önceki kitaplıktan seçim de aynı browser'da yayımlandı;
  özel kayıt durumu değişmedi. Manuel review ve edit browser'ları dahil
  3 ilgili desktop senaryo geçti; dış sağlayıcıya canlı test isteği yapılmadı.
- Typecheck, ilgili lint, UI/a11y statik ve uyarısız üretim build geçti.
  Koyu 1280px ekran incelendi; baseline yenilenmedi. Genel/mobil/açık tema,
  canlı sağlayıcı, ticari lisans veya üretim yük doğrulaması değildir.
- 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/7 forum konusu
  korundu. Gerçek beğeni/kayıt/test etkinlik/audit/outbox 0; yalnız kesin test
  fixture'ları temizlendi. quick_check=ok, FK ihlali yok, pilot 12/12 temiz;
  bildirim işçisi sağlıklı. Build sonrası sunucu 127.0.0.1:3000'de açık.
- Yaklaşık yerel plan %95; üretim engelleri açık, mobil/açık tema/bağımsız
  forum askıda. Sonraki masaüstü pilot iyileştirmeleri kullanım/hata akışları;
  kalıcı taslak, tam edit geçmişi ve üretim operasyonu ayrı kapsamdır.

## 17 Ekim 2026 — karma kart etkileşimleri ve topluluk kayıt merkezi

- Yeni/Takip karma akışındaki sohbet/inceleme kartlarına kaynak toplulukla
  aynı beğeni/kayıt bağlandı. Etkinlik RSVP'si, müzik FeedLike/Save ve müzik
  Kaydedilen/Yükselen/Sana özel değişmedi; bildirim/puan/öneri eklenmedi.
- /community-saved ve private/no-store GET /api/communities/saved yalnız
  aktif oturumun görünür kayıtlarını toplar. Kayıt zamanı/post ID azalan,
  20 kayıt/100 sayfa; tür/altı alan filtreleri URL/geri/reload ve sunucu
  sayfalaması öncesi where ile çalışır. Son sayfanın son kaydı öncekiye döner.
  Ana sayfa masaüstü menüsü ve topluluk dizininden erişilir; müzik linki ayrıdır.
- Arşiv/community dağıtım özel okuma değildir: görünür kayıt listede kalır.
  Kaldırılmış/deaktif yazarlı/iki yönlü engelli kaynak kapanır; snapshot yok.
  Spoiler excerpt boş, TVmaze atfı korunur. Başkasının kayıt ID'si/query
  userId'si yetki vermez; kaydedenler/sayı/özel kimlikler DTO'ya taşınmaz.
- Karma kaynak metrikleri tek groupBy ve bounded üyelik koşulları kullanır;
  kaynak başına/kart başına sorgu yok. Yeni tercih aktif kaynak üyeliği ve
  aktif topluluk; feed bağlamında ayrıca güncel general dağıtımı gerektirir.
  Aynı transaction'da minimal güncel tercih yanıtı gelir. Hata sahte sayı/
  tercih üretmez; eski yanıt yeni kartı ezmez. Feed'den çekilen eski kartın
  başarılı geri alması kaynak metni göstermeyen duruma geçer. Push vaadi yoktur.
- Yeni saved-center 8 kontrol dahil reactions/mixed/distribution/communities/
  lifecycle toplam 55 odaklı kontrol geçti. Yeni merkez, eski karma akış ve
  kaynak beğeni/kayıt olmak üzere 3 ilgili desktop browser senaryosu geçti.
  URL commit'i ve oturum refetch'i için test beklemeleri düzeltildi; ürün
  gizlilik kontrolü zayıflatılmadı, kör bekleme/baseline yenileme yapılmadı.
- Typecheck, ilgili lint, UI/a11y statik ve uyarısız üretim build geçti.
  Yeni ekranın 1280px koyu görüntüsü incelendi. Genel/mobil/açık tema ve
  gerçek üretim yük matrisi çalıştırılmadı. Yeni migration veya DB ayarı yok.
- Gerçek 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/7 forum
  konusu korundu; gerçek beğeni/kayıt/test etkinlik/audit/outbox 0. Yalnız
  kesin test fixture'ları temizlendi. quick_check=ok, FK ihlali yok, pilot
  12/12 temiz; gözetmen altında tek sağlıklı bildirim işçisi. Build sonrası
  geliştirme sunucusu 127.0.0.1:3000'de yeniden açıldı.
- Yaklaşık yerel plan %95; üretim engelleri açık. Sonraki isteğe bağlı ürün
  adımı inceleme formundan doğrudan katalog seçimiyle kitaplığa gitme
  zorunluluğunu azaltmak. Mobil/açık tema ve bağımsız forum hâlâ askıda.

## 17 Ekim 2026 — topluluk beğenisi ve özel kayıt

- Kaynak topluluk sohbet/inceleme liste ve detayına beğeni sayısı, Beğen/
  geri al ve Kaydet/geri al eklendi. Müzik FeedLike/Save ve ana akış müzik
  Kaydedilen/Yükselen/Sana özel değişmedi. İlk paket karma kartlarda yeni
  buton, bildirim, puan veya öneri sıralaması uygulamaz.
- CommunityPostLike/Save ve 53. migration: userId+postId primary key ve
  cascade/indexler. Açık boolean tercih idempotent; iki bağlantılı tekrar
  kayıt çoğaltmaz, post revision/editedAt/dağıtımı veya kayıt tarihini ezmez.
- Yeni tercih aktif hesap+aktif kaynak üyeliği, açık topluluk ve görünür
  published kaynak gerektirir. Kendi paylaşımına beğeni yok, kendi kaydı var.
  Kendi geri alması üyelik/arşiv/engel/removed sınırında açık; yalnız own+
  post+source kaydını siler, eksik/gizli hedefin varlığını yanıtla açıklamaz.
- Ban/ayrılma beğeniyi transaction içinde siler; yeniden katılım diriltmez.
  Kayıt kişiye özel kalır ama kaldırılan/deaktif yazarlı/engelli kaynak
  listelenmez. Aktif hesap/üyelik ve görüntüleyenin engel filtresi beğeni
  sayısını daraltır. Liker/saver listesi veya saveCount DTO'ya taşınmaz;
  viewerLiked/viewerSaved yalnız kişinin kendi bitleridir.
- Topluluk içi Kaydettiklerim özel filtresi URL/geri/yenileme ve içerik türüyle
  birleşir; 20 kayıt/en fazla 100 sayfa, sıra paylaşım tarihine göredir.
  Son sayfanın son kaydını geri almak önceki sayfaya döner. Yazım formu bu
  görünümde gizli kalır, aynı sayfadaki taslak mount korunur. Kayıt metin
  kopyası değildir; topluluklar arası merkez/gizli kayıt toplu temizleme yok.
- Account export yalnız own tercih zamanı+post id/community slug; kaynak
  metni veya başka kişinin tercihleri yok. Hesap kapanışı own iki tabloyu
  temizler; diğer kullanıcının tercihi korunur. Fiziksel silme cascade.
- 43 odaklı reaction/lifecycle/communities/edit/navigation kontrolü geçti.
  İki oturumlu yeni browser; hata/tekrar, özel filtre/yazar/anonim/forged user,
  export, URL/geri/reload, 21 kayıt sayfalaması ve arşivde geri alma geçti.
  Önceki navigation/edit browser'ları da geçti (3 ilgili senaryo). Test
  yardımcısının eksik APIRequestContext tipi düzeltildikten sonra typecheck
  yeniden temiz geçti; ürün runtime hatası olarak sunulmadı.
- Typecheck, ilgili lint, UI/a11y statik ve uyarısız build geçti. Ekran
  incelendi; genel/mobil/açık tema ve gerçek üretim yük matrisi çalışmadı.
- Önce doğrulanmış backups/pre-community-reactions-5e56ffa4-5d7e-4944-bc1f-9da6ed4eb2b2.db
  alındı; SQL bellek SQLite'ta doğrulandı. 53 migration güncel, şema farkı yok.
  Yalnız repo kimliği doğrulanan süreçler motor üretimi için durdurulup açıldı;
  son derleme sonrası sunucu 3000'de, gözetmen altında tek sağlıklı işçi açık.
- 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/7 forum konusu
  korundu. Gerçek beğeni/kayıt ve test etkinlik/audit/outbox işi 0;
  quick_check=ok, FK ihlali yok, pilot 12/12 temiz. Yalnız test fixture'ları silindi.
- Yerel plan yaklaşık %95; üretim engelleri açık. Sonraki ürün paketi karma
  kartlarda topluluk etkileşimi ve topluluklar arası özel kayıt merkezi.
  Mobil/açık tema ve bağımsız forum askıda.

## 17 Ekim 2026 — inceleme düzenleme ve içerik filtresi

- Topluluk listesinde Tümü/Sohbet/İnceleme ve incelemede altı alan filtresi
  eklendi. Sunucu where+count+pagination öncesi süzer; engel/aktif yazar ve
  rapor gizliliği değişmez. URL/geri-ileri/reload korunur; tür değişince
  alan/sayfa sıfırlanır. Yanlış filtre API'de 400, URL'de güvenli varsayılandır.
- Yeni isteğin sonucuna ait olmayan eski kartlar filtre geçişinde gösterilmez.
  Boş sonuç açıklaması ve temizle butonu var. Yeni paylaşım filtreye uymuyorsa
  filtre temizlenerek başarılı paylaşımın görünmez kalması önlenir.
- Aktif kaynak üyesi yazar kendi incelemesinin başlık/metin/puan/spoiler
  tercihini düzenler. Kurucu/global admin başkasını düzenleyemez; arşiv/ban/
  removed/deaktif hesap yazamaz. Eser/kaynak/provider/tür/yazar/dağıtım korunur;
  istemci bunları değişiklik payload'ıyla ezemez. Kitaplık kaydı tekrar aranmaz.
- CommunityPost revision/editedAt ve 52. migration eklendi. Eski sohbetler
  revision=0/editedAt=null; hayalî düzenleme tarihi backfill yok. CAS ve ilk
  aktif hesap kilidi eski formu 409 ile reddeder. Gerçek no-op değişmez.
  Edit+veri-minimum audit atomik; kayıt hatası rollback, rapor açık kalır.
  Eski metin audit'e kopyalanmaz. Tam edit geçmişi/geri alma bu pakette yoktur.
- Düzenleme formu geçici hata ve eski sürümde metni korur. Kullanıcı açıkça
  taslağı kapatıp güncel kaydı yükleyebilir. Spoiler metni kayıt sonrası tekrar
  gizlenir; liste/detay Düzenlendi tarihini gösterir. Reload/ayrılma için kalıcı
  taslak yok; form bunu açıklar. Yorum ve dağıtım işlemleri edit sırasında kapalı.
- 35 odaklı edit/filtre/navigation/references/distribution/communities kontrolü
  geçti. Eski sabit migration listesini kullanan communities testi yeni kolon
  eksikliğinden ilk turda kalmıştı; fixture'a 52. migration ve legacy varsayılan
  assertion'ları eklenerek tekrar geçti. Test düzeltmesi ürün hatası diye sunulmadı.
- Üç gerçek masaüstü koyu browser senaryosu geçti: yeni iki oturumlu edit/
  filtre, önceki navigation ve reviews. Hata/stale taslağı, yeniden yükle/save,
  sabit kaynak/şikâyet, yöneticiye kapatma, arşiv, filtre sayfası/geri-ileri ve
  yeni sohbetin filtrede kaybolmaması sınandı. İlk turdaki eski liste/selector
  yarışı kartları güncel sorguyla eşleme ve bekleme seçicisiyle giderildi.
- Typecheck/ilgili lint/UI-a11y statik ve uyarısız build geçti; ekran incelendi.
  Genel/mobil/açık tema matrisi veya üretim yükü çalıştırılmadı.
- Önce yedek doğrulandı: backups/pre-review-edits-b5d776b4-caf1-4d77-ab99-163ea425f540.db.
  SQL bellek SQLite'ta doğrulandı; 52 migration güncel, şema farkı yok.
  Motor kilidi için yalnız doğrulanmış repo işçi/gözetmen ve sunucusu durdu;
  üretim servis kurulumu yapılmadı. Sunucu 3000'de/gözetmen altında tek işçi açık.
- Mevcut sayılar 19 profil/8 topluluk/32 paylaşım/64 yorum/468 müzik/12 akış/
  7 forum konusu olarak korundu. Gerçek edited post, fixture etkinliği/audit/
  outbox işi 0. quick_check=ok, FK ihlali yok, pilot 12/12 temiz.
- Yaklaşık yerel plan %95; üretim engelleri açık kalır. Sonraki etkileşim
  paketi topluluk paylaşımı beğenme/kaydetme; müzik sistemi ayrı korunur.
  Mobil/açık tema/bağımsız forum askıda.

## 17 Ekim 2026 — masaüstü gezinme ve sayfa içi taslaklar

- Pilot taramasında topluluk içi detay/sekme/sayfalama yalnız yerel state'te
  kalıyordu; yenileme ve geri tuşu konumu korumuyordu. Artık paylaşım,
  yorum sayfası, etkinlik, etkinlik filtresi ve liste sayfası URL'dedir.
  Geri/ileri/reload aynı konumu açar. Eski event/post bağlantıları korunur;
  paylaşım/etkinlik detayında alınabilir doğrudan bağlantı vardır.
- Saf parser/serializer kimlik ve 1–100 sayfa sınırını doğrular; çakışan
  hedefleri temizler. Sonraki sayfa butonları 100'de kapanır. Server query,
  history ve aynı rota Link geçişi eşlenir. Aynı slug'da query değişiminde
  tüm client yeniden kurulmaz. Aktif sekme görsel ve aria-pressed ile belirgin.
- Sohbet/inceleme oluşturucu detay açınca, etkinlik oluşturma formu detay
  veya sekme değişince unmount edilmez; aynı sayfadaki taslak korunur.
  Etkinlik paneli ilk açılıştan sonra mount kalır, gizliyken yeni okuma yapmaz.
  Bu kalıcı taslak kaydı değildir: reload, başka sayfaya geçiş veya kaynak
  yetki/okuma hatasından sonra kurtarma garantisi yok. Metin/konum URL veya
  localStorage'a taşınmaz. Spoiler tercihi yenilemede yeniden kapalıdır.
- 4 navigation + 9 RSVP kontrolü (13) geçti. Gerçek masaüstü koyu browser'da
  21 paylaşım/41 yorum/21 etkinlik ile URL, sayfa2 dönüşü, yorum sayfası,
  geri/ileri/reload, aynı rota Link, spoiler, okuma hatası/yeniden dene ve
  oluşturma taslakları geçti. Mevcut etkinlik ve inceleme browser'ları da
  geçti (toplam 3 ilgili senaryo). Ekran incelendi; yatay taşma/runtime hata yok.
- Typecheck, ilgili lint, UI/a11y statik denetim ve uyarısız production
  build geçti. Genel/mobil/açık tema matrisi çalıştırılmadı; DB migration yok.
  API/yetki/üyelik ve içerik dağıtım sözleşmeleri değişmedi.
- Yalnız kendi test fixture'ları temizlendi. 19 profil/8 topluluk/32 paylaşım/
  64 yorum/468 müzik/12 akış/7 forum konusu aynı; etkinlik/audit/outbox işi 0.
  quick_check=ok, FK ihlali yok, pilot kontrolü 12/12 temiz. İşçi gözetmeni
  durdurulmadı; sunucu derleme sonrasında 3000'de yeniden başlatıldı.
- Topluluk planı yaklaşık %95 kalır; bu paket üretim engellerini kapatmaz.
  Sonraki ürün iyileştirmeleri: inceleme düzenleme ve topluluk içerik türü
  filtreleme. Kalıcı taslak kurtarma ayrıca gizlilik/hesap sınırıyla tasarlanmalı.
  Mobil/açık tema ve bağımsız forum askıda; üretim/yayın kararları açık.

## 17 Ekim 2026 — güvenli kurtarma ve sınırlı SQLite ölçümü

- `db:rehearse-restore`: canlı kaynağı read-only açıp yeni bağımsız snapshot
  veya açık seçilen yedeği kendi tmp alanına geri okur. 39 tablo/920 satır
  içerik eşleşmesi, integrity/FK, yalnız kopyada yazma/rollback ve mevcut
  Prisma şema uyumu geçti. İlk prova 445 ms; aynı yedekten tekrar 425 ms.
  Yeni `backups/rehearsal-6f69fb75-41cf-4f0b-ad17-0847de2037a0.db` korunur.
  Eski yedek budama veya canlıya restore/migration yoktur.
- Unicode/BLOB/büyük integer, aynı sayıda değişmiş içerik, bozuk/FK ihlalli
  dosya, mevcut/boş hedefi koruma ve WAL commit'inin snapshot'a alınması
  sınandı. Sağlam ama uygulamaya farklı şemalı test yedeği kod 1 verir;
  bütünlük tek başına uygulama uyumu sayılmaz. İçerik/hash loglanmaz.
- `db:probe-load`: DB hedefi kabul etmez, yalnız yeni sentetik SQLite.
  81 hesap/200 paylaşım/3 etkinlik, sekiz ayrı Prisma istemcisi ve 1/4/8
  eşzamanlı görev. Her aşama 80 RSVP + 40 okuma; 24 koltuk tam doldu,
  56 beklenen kapasite reddi, beklenmedik hata ve bütünlük sorunu 0.
- Son yerel koşuda tüm RSVP denemeleri p95 5,36/153,73/325,73 ms;
  kabul edilenler ayrı p95 5,83/32,17/48,84 ms. Okuma p95 3,39/3,92/5,55 ms.
  Artan eşzamanlılık yazıcı beklemesini büyütüyor. Windows/Node24,
  journal_mode=delete; gerçek journal/timeout/indeks değiştirilmedi.
  Kısa servis ölçümü HTTP QPS, kullanıcı kapasitesi, RTO veya SLA değildir.
- 11 yeni koruma/hesaplama kontrolü + 9 RSVP kontrolü toplam 20 geçti.
  Gerçek iki komut da çalıştırıldı; typecheck/ilgili lint temiz. UI/uygulama
  kodu değişmediğinden browser/full build/genel/mobil matris tekrarlanmadı.
- Kendi geçici restore/sentetik kopyaları temizlendi; yeni ve eski yedekler
  korundu. Sunucu ve gözetmen durdurulmadı. İşçi health temiz, kuyruk 0;
  gerçek topluluk bütünlük kontrolü 12/12 temiz.
- Yaklaşık %95 oranı korunur: yerel operasyon kanıtı arttı ama üretimde
  süreç yöneticisi/dış alarm, off-host şifreli yedek, beklenen hacimde staging
  HTTP+worker testi, gerçek kurtarma planı ve kişisel veri politikası açık.
  Sonraki uygulama içi paket masaüstü pilot akışlarındaki eksik/hata taraması;
  ücretli servis/yayın kararı kendiliğinden alınmaz. Mobil/forum askıda.

## 17 Ekim 2026 — işçi canlılığı ve yerel gözetmen

- `worker:events:health`: salt okunur, kod 0/1 ve özel sayısal JSON. Boş
  kuyruk tek başına başarı değil; canlı işçi ve ilk başarılı tick gerekli.
  35 saniye eski kalp atışı, beş dakika ilerlememe/kuyruk gecikmesi, tick
  hatası, failed iş ve bozuk kayıt ayrı sorun kodlarıdır. Kamu health API'si
  değişmedi; PID/DB adresi/kullanıcı/SQL veya içerik loglanmaz.
- İşçi git-ignored tmp alanına süreç başına atomik/seri sağlık kaydı yazar.
  Workspace+DB özeti alanları ayırır; işçiler birbirinin dosyasını ezmez.
  Düzgün kapanış yalnız kendi kaydını kaldırır. Eski crash kaydı varken yeni
  sağlıklı işçi kabul edilir. Tek seferlik komutlar canlı işçi kaydı üretmez.
- `worker:events:supervise`: isteğe bağlı yerel Node çocuk gözetmeni. Yalnız
  kendi çocuğunu başlatır/durdurur; artan bekleme ve bir dakikada beş kapanışta
  devre kesici. Kararlı bir dakika bütçeyi sıfırlar. Dış süreç tarama/öldürme,
  otomatik failed replay, OS servis/ücretli servis kurulumu yoktur.
- Node sinyal handler'ı yeni tick'i durdurup devam eden tick'i bitirir.
  Windows programatik SIGTERM handler'ı atlayabilir: ani kapanışta batch
  rollback sınırı geçerli; graceful garantisi verilmez. Gözetmenin kendisini
  yeniden açma, takılı çocuğu öldürme ve dış alarm bağlantısı üretim işidir.
- 11 yeni operasyon kontrolü (üst test dahil) + 8 mevcut outbox kontrolü,
  toplam 19 geçti. Gerçek geçici SQLite işçisi/CLI canlılığı ve gerçek çocuk
  kapanışı/yeniden başlatma sınandı. Beş dakika sınırındaki yuvarlama testte
  yakalanıp milisaniye karşılaştırmasıyla düzeltildi. Typecheck ve ilgili lint
  temiz. UI değişmediği için browser/production build/genel matris tekrarlanmadı.
- Yalnız bu repoya ait olduğu motor modülüyle doğrulanan eski işçi durduruldu;
  yeni gözetmen ve tek sağlıklı işçi çalışıyor. Sunucu yeniden başlatılmadı.
  Yerel health ok, kuyruk 0/failed 0; pilot bütünlük denetimi 12/12 temiz.
  DB migration veya gerçek kullanıcı verisinde değişiklik yapılmadı.
- İlerleme yaklaşık %95 olarak korunur; yerel gözetmen üretim hazırlığının
  tamamlandığı anlamına gelmez. Sıradaki güvenli paket yedekten dönüşün geçici
  kopyada provası ve ölçülü SQLite yük ölçümü; yayın/servis/ileri kişisel veri
  saklama kararı ayrı kalır. Mobil/açık tema/forum askıda.

## 17 Ekim 2026 — bağımsız platform başvurusu ve itiraz

- `/community-cases`: genel topluluk bildirimi, kendi incelenmiş şikâyetine
  ve güncel uzaklaştırmasına itiraz; özel liste/yanıt/durum takibi eklendi.
  Topluluk detayında ve Topluluklarım ekranında giriş bağlantıları var.
  Üyelik zorunlu değil; arşiv veya ban başvuruyu kapatmaz.
- `/admin/community-cases`: yalnız root veya aktif global admin. Yerel
  yönetici/global moderator yeterli değil. Hesaba bağlı admin kendi
  başvurusunu, yönettiği topluluğu ve kendi kaynak kararına itirazı inceleyemez.
  Root hesapsız güvenilen operatördür; gerçek kişi çıkar çatışması bu sınırda
  teknik tespit edilmez. Kaynak topluluk yönetimine başvuru/yanıt açılmaz.
- İlk paket yalnız gerekçeli yanıt ve kapanış; ban kaldırmaz, içerik geri
  getirmez veya sahiplik değiştirmez. Yeniden açma/yanıt süresi garantisi yok.
  Tekrar kayıt açıklamayı ezmez; kapalı genel konuda yeni başvuru mümkün,
  aynı kaynak rapor/ban için tek itiraz var. Kullanıcı DTO'suna inceleyen
  kimliği veya iç denetim geçmişi taşınmaz.
- PlatformCommunityCase/Event ve 51. migration eklendi. Kimlik kilidi,
  pending+version CAS, aynı transaction'da audit, ayrı rate limit/origin,
  sınırlı JSON ve private/no-store var. Kendi başvuruları export'a dahil;
  hesap kapanışı kendi başvuru ve audit'ini temizler. Başkasının kaydı korunur.
- Başvuru/yanıt hatasında taslak, tekrar gönderimde açıklama korunur.
  Masaüstü koyu ekran incelendi. 9 yeni odaklı kontrol ve önceki 19 lifecycle/
  yönetim kontrolü geçti; iki bağlantılı gerçek eşzamanlı karar da sınandı.
  Gerçek iki oturumlu tek browser akışı geçti: özel başvuru, geçici hatalar,
  yanıt, yetki geri alımı, origin/anonim sınır, stale 409 ve export.
  İlk browser koşusundaki son assertion Next'in ikinci alert'i yüzünden
  belirsizdi; yalnız seçici daraltılıp aynı senaryo yeniden geçti.
- Typecheck, ilgili lint, UI/a11y statik kontrol ve uyarısız production build
  geçti. Tam test matrisi, mobil/açık tema, gerçek yük/yayın yapılmadı.
- Migration öncesi yerel yedek doğrulandı; SQL bellek SQLite'ta sınandı.
  Şema farkı yok, quick_check=ok, foreign_key_check boş; pilot 12/12 temiz.
  19 profil, 8 topluluk, 32 paylaşım, 64 yorum, 468 müzik, 12 akış kaydı aynı.
  Test başvurusu/audit/etkinlik/devir kalmadı; yalnız geçici fixture'lar temizlendi.
  Sunucu 3000'de ve ayrı etkinlik işçisi yeniden çalışıyor.
- Topluluk/inceleme/etkinlik planında yaklaşık %95; bu yayın hazırlığı oranı
  değildir. Sıradaki teknik paket işçi gözetimi/sağlık sinyalleri ve güvenli
  operatör akışı; veri saklama politikası, gerçek yük/yedekten dönüş ve yayın
  kontrolleri açık. Mobil, açık tema ve bağımsız forum askıda kalır.

## 17 Ekim 2026 — sahiplik devri, arşiv ve hesap kapatma

- Aktif sahip başka aktif/engellenmemiş üyeye yedi günlük sahiplik teklifi
  gönderir. Teklif yetki vermez; hedefin ayrı açık kabulü ownerId ve iki rolü
  atomik değiştirir. Eski sahip member kalır; kendi içeriğinin yazar hakları
  devam eder. Reddet/geri çek, eski teklif ID'si/süre, ayrılma/ban ve hesap
  kapanışı sınırları var. Gelen teklifler /communities içinde görünür;
  özel endpoint'ler kaynak/hedef dışına teklif kimliği/hedefi döndürmez.
- Community active/archived, archivedAt ve lifecycleRevision eklendi.
  Arşiv herkese açık okuma kurallarını koruyan salt okunur durumdur;
  yeni katılım/paylaşım/etkinlik yönetimi sunucuda kapalıdır. Üye ayrılması
  ve kendi vazgeçmesi açık kalır. Genel keşif/karma akış arşivi süzer;
  Topluluklarım işaretli arşivleri gösterir. Yönetim geçmişi okunabilir.
- Arşivde yaklaşan scheduled etkinlikler iptal edilir; RSVP çekilmeden iki
  set-based SQL ile bildirim snapshot'ı alınır. Status/RSVP/offer/audit
  transaction'dadır; log hatasında hepsi rollback olur. Yeniden açma iptal
  veya eski katılımları canlandırmaz. Eski içerik fiziksel silinmez.
- Hesap silme aktif owned toplulukta devir veya varsayılan kapalı ayrı
  arşiv checkbox'ı ister. Onaysız eski istemci 409 alır; parola/onay taslağı
  korunur. Onaylı kapanış hâlâ sahip olduğu aktif toplulukları arşivler,
  tek üyeli topluluk dahil. Devredilmiş topluluk ve başkasının içeriği
  korunur. Silinen hesabın topluluk içeriği aktif yazar filtresiyle gizlenir;
  kişisel veri saklama/anonimleştirme politikasının tamamlandığı iddia edilmez.
- Silme ayrıca sahiplik teklifleri/kendi RSVP'leri ve kendi yaklaşan
  etkinliklerini kapatır; başka toplulukta iptal edilen kendi etkinliğinin
  audit'i yazılır. Silinen aktör/düzenleyenden bildirim teslimi verilmez;
  mevcut gizlilik filtresi kaynak bildirimlerini kapatır. Güvenli sistem
  kaynaklı iptal bildirimi ayrı açık iyileştirmedir.
- SQLite ilk-write kimlik kilidi devir/arşiv/silme ile create/join'i sıralar;
  profil updatedAt'ını değiştirmez. Önceden doğrulanmış parola hash'i kilit
  altında tekrar kontrol edilir. DELETE origin, JSON/16KB, strict bool,
  confirmation/no-store ve mevcut rate limit ile sertleştirildi.
- 55 odaklı lifecycle/topluluk/dağıtım/keşif/etkinlik/sağlık kontrolü ve
  ayrıca 8 outbox kontrolü geçti. İki gerçek oturumlu tek dar masaüstü koyu
  browser akışı geçti: hatada hedef taslağı, inbox/kabul, eski rol kaybı,
  arşiv/restore/audit, korunan içerik ve gerçek onaylı hesap kapatma. Şifre
  alanı test seçicisi düzeltilerek son senaryo yeniden geçti; ürün hata
  düzeltmesi gibi sunulmadı. Typecheck, ilgili lint, UI/a11y statik kontrol
  ve uyarısız production build geçti. Genel matris, mobil/açık tema ve gerçek
  kullanıcı yük testi çalıştırılmadı; ekran incelendi.
- SQL önce bellek SQLite'ta doğrulandı, yerel yedek doğrulandı. 50 migration
  güncel, şema farkı yok. Windows motor kilidi nedeniyle yalnız bu repoya
  ait sunucu/işçi doğrulanıp istemci üretimi için durduruldu; mevcut kullanıcı
  verisi sıfırlanmadı. Üretim süreç yöneticisi veya yayın işlemi yapılmadı.
  Sonunda 3000 portundaki geliştirme sunucusu ve ayrı etkinlik işçisi
  yeniden başlatıldı; yerel kullanım açık.
- Önce/sonra: 19 profil, 8 topluluk, 32 paylaşım, 64 yorum, 468 müzik,
  12 akış paylaşımı, 7 forum konusu aynı. Etkinlik, devir teklifi, testten
  kalan audit/outbox işi 0. quick_check=ok, foreign_key_check boş; pilot
  kontrolü 12/12 temiz. Sıradaki platform bildirim/itiraz paketidir.

## 17 Ekim 2026 — sayfalı yönetim, karar geçmişi ve pilot kontrolü

- Yönetim artık ayrı /api/communities/[slug]/management endpoint'iyle
  Bildirimler/Üyeler/Karar geçmişi görünümlerini yükler. 20 kayıt, en fazla
  100 sayfa; bekleyen/incelenen/tümü ve hedef türü, aktif/uzaklaştırılmış
  üye filtresi, ad/slug araması var. Eski detay DTO'su uyumluluk için korunur;
  yeni panel yalnız açıldığında okur ve eski filtre isteklerini iptal eder.
- Aktif hesap + aktif kaynak topluluk kurucu/moderatörü zorunlu. Başka
  topluluk yöneticisi, normal üye, anonim/deaktif hesap okuyamaz. Eski rolü
  bulunan deaktif hesabın detay yönetim DTO'su görmesi de kapatıldı.
- CommunityReport reviewedAt/reviewedById ve CommunityModerationLog eklendi.
  İnceleme, üyelik/rol, kaldırma/etkinlik kararı ve değişen keşif etiketleri
  işlemle aynı transaction'da kaydedilir; log hatası kararı da geri alır.
  No-op rol/durum ve değişmeyen keşif kaydı log çoğaltmaz. Kaldırılan metin
  veya reporter kimliği kopyalanmaz; opsiyonel not tek satır/en fazla 300
  karakter. Eski raporlara hayalî inceleyen/tarih atanmadı; pasif/silinmiş
  aktörün adı DTO'da gösterilmez. Günlük UI'da değiştirilemez/silinemez;
  kriptografik değişmezlik veya üretim saklama politikası iddiası yoktur.
- Başarısız inceleme/üye kararında not taslağı korunur. Üye rol/katılım
  değişikliği açık onay alır. Şikâyet incelendi olması içeriği kaldırmaz.
- İnisiyatif: check:communities komutu 12 salt okunur sahiplik/rol, etkinlik/
  RSVP, rapor ve kuyruk kontrolü ekler. Yalnız sayılar; otomatik sahip atama,
  silme, rapor kapama veya replay yok. Yerel sonuç 12/12 temizdir. Kamu
  health API'sine yönetim/kuyruk verisi taşınmadı.
- İnisiyatif: üretim derlemesi alındı ve başarılı oldu. Çıkan üç uyarı
  (kitaplık effect ref temizliği, kullanılmayan sidebar değişkeni ve kitaplık
  DTO destructuring'i) ardından küçük düzeltmelerle temizlendi; ilgili lint,
  typecheck ve kitaplık testleri geçti. Son küçük temizlikten sonra ikinci
  tam build yapılmadı. Kitaplık DTO'su açık alan listesi kullanır.
- 36 yönetim/topluluk/etkinlik odaklı kontrol, ek 1 salt okunur sağlık ve
  12 kitaplık kontrolü geçti. İki gerçek oturumlu tek dar masaüstü koyu
  browser: 31 rapor/24 üye, sayfalama, hatada not, inceleme/karar geçmişi,
  ban/unban onayı ve yetki kaldırma sonrası 403/UI kapanışı. Ekran incelendi;
  typecheck, ilgili lint, UI/statik erişilebilirlik geçti. Genel test matrisi,
  mobil/açık tema ve gerçek kullanıcı yük provası çalıştırılmadı.
- Migration önce bellek SQLite'ta doğrulandı, yerel yedek doğrulandı;
  49 migration güncel ve şema farkı yok. Uygulama 3000 portunda ve ayrı
  etkinlik işçisi yerelde tekrar açık. İşletim servis yöneticisi/alarm
  kurulmadı. Kalan iş sırası docs/PILOT_EKSIKLERI.md'de somutlaştırıldı.
- Daha uzun, rutin onay beklemeyen bağlantılı oturum tercihi AGENTS.md'ye
  işlendi. Ücretli işlem/yayın/veri sıfırlama yetkisi bundan türetilmedi.
- Son yerel sayılar: 19 profil, 8 topluluk, 32 paylaşım, 64 yorum, 468 müzik,
  12 akış paylaşımı, 7 forum konusu. Etkinlik/RSVP, testten kalan karar
  günlüğü ve outbox işi/alıcı 0; quick_check=ok, foreign_key_check boş.
  Bu sayılar 15 Ekim'deki tarihsel sayımla aynı değildir; yeni kullanıcı
  verisi silinerek eski sayıya döndürülmedi. Geçici yönetim test hesapları
  temizlendi; 17 Ekim başı için ayrı sayım olmadığı için tam öncesi/sonrası
  eşitlik iddiası yapılmaz.

## 15 Ekim 2026 — kalıcı etkinlik bildirim kuyruğu

- Etkinlik değişiklik/iptal/kaldırma, alıcı başına bildirim yazmak yerine
  aynı transaction içinde CommunityEventNotificationJob ve alıcı snapshot'ı
  kaydeder. SQLite parametreli INSERT SELECT uygulama belleğine sınırsız
  alıcı listesi çekmez. İptal/kaldırma snapshot'ı RSVP temizliğinden önce alır.
- Ayrı işçi 50 alıcılık atomik batch'ler halinde teslim eder. Bildirim
  event/version/type/user kimliği sabit; tekrar readAt/tarihi ezmez.
  SQLite writer lock ve revision CAS iki işçiyi sıralar; başarısız batch
  rollback olur. Restart sonrası kaldığı kuyruktan devam eder.
- Teslimde aktif hesap/üyelik, aktör+düzenleyen ve iki yönlü engel tekrar
  kontrol edilir. Sonradan katılanlar snapshot'a eklenmez; geçersiz alıcı
  atlanınca rejoin eski bildirimi diriltmez. Sadece uygulama içi bildirim;
  müzik/forum ve kamu bildirim DTO'su değişmedi.
- Kalıcı backoff, beş hatadan sonra failed ayırma, sınırlı hata kodu,
  durum/tek seferlik çalışma/manuel failed retry komutları var. Hesap silme
  bekleyen kişiyi ve kendi aktör/düzenleyen işlerini temizler; fiziksel
  silmede cascade var. Başarılı alıcı anında, completed iş metadata'sı
  maintenance:cleanup ile 30 günden sonra temizlenir; pending/failed kalır.
- SQL önce bellekte doğrulandı; yerel yedek doğrulandı. 48 migration güncel,
  şema farkı yok. Prisma istemci üretimi için yalnız bu repo sunucusu kısa
  süre durduruldu ve 3000 portunda yeniden açıldı. İşçi uygulamadan ayrı
  çalışır; üretim servis yöneticisi/alarm dağıtımı bu pakette yapılmadı.
- 30 odaklı kontrol geçti: 123 alıcı/batch sınırı, rollback, restart,
  iki işçi yarışı, gizlilik, tekrar/readAt, backoff/failed kurtarma ve mevcut
  etkinlik/rapor/kapasite akışı. İki gerçek oturumlu tek dar masaüstü koyu
  browser senaryosu gerçek CLI işçisiyle geçti: kuyrukta bekleme, düzenleme,
  bildirim merkezi/doğru detay ve iptal. Typecheck ve ilgili lint geçti.
  UI değişmedi; genel matris, mobil/açık tema ve production build çalışmadı.
- Yeni topluluk yol haritasında kaba kapsam yaklaşık %94; yayın hazırlığı
  değildir. Sıradaki yönetim sayfalaması/karar günlüğü, ardından sahiplik ve
  hesap kapatma politikaları, platform itirazı ve yük/yayın kontrolleridir.
  İşçi kullanım/kurtarma notları: docs/ETKINLIK_BILDIRIM_ISCISI.md.
- Son veri kontrolü: 18 profil, 8 topluluk, 32 paylaşım, 64 yorum, 467 müzik,
  12 akış paylaşımı, 7 forum konusu korundu. Etkinlik/RSVP ve testten kalan
  kuyruk işi/alıcı 0; quick_check=ok, foreign_key_check boş.

## 15 Ekim 2026 — etkinlik bildirimi ve topluluk moderasyonu

- Aktif topluluk üyesi başkasının scheduled/cancelled etkinliğini, başlangıcı
  geçmiş olsa da 3–300 karakter gerekçeyle bildirebilir. Kendi etkinliği,
  başka topluluk hedefi, iki yönlü engel, deaktif düzenleyen, kaldırılmış
  duyuru ve üye olmayan/uzaklaştırılan/deaktif hesap yazmaları reddedilir.
- Mevcut CommunityReport targetType=event kullanılır; yeni migration yok,
  47 migration korunur. Hesap/hedef başına tek kayıt; tekrar gerekçeyi ezmez
  ve incelenmiş kaydı yeniden açmaz. Bildirim otomatik gizleme yapmaz;
  içerik sürümü, dağıtım, kapasite, RSVP veya katılımcı bildirimi değişmez.
  Event revision writer lock, bildirim yazmasını kaldırmayla sıralar.
- Topluluğun aktif kurucu/moderatörü mevcut ilk 30 bekleyen bildirim
  kuyruğunda etkinlik gerekçesini ve doğru detay bağlantısını görür. Bildiren
  kimliği kuyruk DTO'sunda yoktur; normal üye/düzenleyen/kamu kuyruğu göremez.
  Kişi yalnız kendi pending/reviewed durumunu etkinlik detayında görür.
- İncelendi yalnız kuyruğu kapatır. İptal, görünür duyurunun raporlarını
  kapatmaz. Kaldırma mevcut yetki kontrolü/soft-delete/katılımcı bildirimi ve
  RSVP çekilmesiyle aynı transaction'da hedefin bekleyen raporlarını kapatır.
  Genel platforma itiraz/escalation, işlem günlüğü ve yönetim sayfalaması yok;
  bunlar pilotun kalan işleridir. Bildirim acil yardım kanalı değildir.
- Form hata halinde gerekçeyi korur, gönderirken kilitlenir. Yönetimde
  etkinlikten paylaşım raporuna geçiş doğru sohbet bölümünü açar. Yeni CSS,
  mobil, açık tema veya forum işi yapılmadı; çalışan sunucu yeniden başlamadı.
- 22 odaklı servis kontrolü + iki gerçek oturumlu tek masaüstü koyu senaryo
  geçti: oturum/origin, form hatası/taslak, özel kuyruk, inceleme bağlantısı,
  incelendi/kaldırma, RSVP ve katılımcı bildirimi. Typecheck, ilgili lint,
  UI ve statik erişilebilirlik geçti; masaüstü ekranı incelendi. Genel test
  matrisi ve production build çalıştırılmadı.
- Testler geçici veritabanı veya benzersiz geçici hesaplarını kullandı ve
  temizledi. 18 profil, 8 topluluk, 32 paylaşım, 64 yorum, 467 müzik,
  12 akış paylaşımı ve 7 forum konusu korundu; etkinlik/RSVP 0, quick_check=ok.
- Yeni topluluk yol haritası kaba kapsamı yaklaşık %92; yayın hazırlığı
  değildir. Faz 6 başladı; sıradaki paket büyük etkinlik bildirimleri için
  kalıcı outbox/işçi. Yönetim/pilot politikaları ve yük/yayın kontrolleri açık.

## 15 Ekim 2026 — üniversite/şehir/ilgi alanıyla keşif

- /communities içinde Toplulukları keşfet / Etkinlikleri keşfet görünümü var.
  Üniversite, şehir, ilgi alanı, kategori, metin ve Topluluklarım filtreleri
  birlikte sunucuda uygulanır. 20 kayıtlık sayfalama; URL, yenileme ve geri
  dönüş filtreleri korur. Türkçe/ASCII etiket araması normalize anahtarlarla
  yapılır; resmî kurum kataloğu/alias/fuzzy eşleştirme değildir.
- Topluluğun açık universityName/city/interest etiketleri oluştururken girilir;
  aktif kurucu/moderatör detaydan düzenler. Eski topluluklar boş etiketle
  korunur; profil üniversitesinden, üyelerden veya demo adlarından türetilmez.
  Gizli veya açık kişisel üniversite alanı keşif sorgusuna katılmaz. Etiketler
  topluluk beyanıdır; kurum bağlantısı veya öğrencilik doğrulanmaz.
- Etkinlik keşfi yalnız genel dağıtımlı, scheduled, gelecekteki duyuruları
  başlangıç tarihine göre gösterir. Üniversite/ilgi alanı kaynak topluluktan,
  şehir etkinliğin kendi şehrinden gelir. İptal/kaldırma/geçmiş/topluluk-only
  duyurular çıkmaz; aktif düzenleyen/iki yönlü engel sınırları vardır. Detay
  bağlantısı doğru etkinliği açar; RSVP hâlâ aktif üyelik gerektirir. Kişi
  listeleri veya özel profil alanları keşif DTO'suna eklenmedi.
- Hata/yeniden dene ve boş/sayfa dışı durumları var. Okuma hatası yaratma
  formundaki taslağı düşürmez; eski filtre yanıtları iptal edilir. Arama hızı
  ve no-store mevcut ortak sınırı kullanır. Genel akış/müzik/forum değişmedi.
- Migration SQL'i önce bellek içi SQLite üzerinde doğrulandı, yerel yedek
  doğrulandı. 47 migration güncel, şema farkı yok. Etkinlik şehir anahtarı
  mevcut şehirlerden backfill edilir ve oluşturma/düzenlemede yenilenir.
  18 profil, 8 topluluk, 32 paylaşım, 64 yorum, 467 müzik, 12 akış paylaşımı,
  7 forum konusu korundu; quick_check=ok. Test verisi temiz; kalıcı buluşma
  veya mevcut demo topluluklara üniversite/şehir etiketi eklenmedi.
- 26 odaklı kontrol ve iki gerçek oturumlu tek dar masaüstü koyu senaryo
  geçti: UI oluşturma/düzenleme, birleşik filtre, Türkçe arama, URL/geri,
  dağıtım/üyelik/engel, özel üniversiteyle eşleşmeme ve okuma hatasında taslak.
  Typecheck, ilgili lint, UI ve statik erişilebilirlik geçti; ekran incelendi.
  Genel test matrisi, production build, mobil/açık tema çalıştırılmadı.
- Yeni topluluk yol haritasında kaba kapsam %90; yayın hazırlığı değildir.
  Faz 5 yerel çekirdeği hazır. Sıradaki Faz 6 pilot sağlamlaştırma: etkinlik
  raporları/moderasyon, büyük bildirimler için outbox/işçi ve yük/yayın kontrolleri.

## 15 Ekim 2026 — isteğe bağlı üniversite profili

- Profil düzenleyicinin Kimlik bölümünde isteğe bağlı, elle girilen 2–120
  karakterlik üniversite adı ve ayrı Herkese açık profilimde göster tercihi var.
  Varsayılan kapalı; üniversite profil tamamlanma puanına dahil değildir.
  Kullanıcı beyanıdır, öğrencilik/kurum bağlantısı/e-posta doğrulaması yoktur.
- Aynı kaydetme/taslak/geri alma/kayıt kilidi akışına bağlıdır. Önizleme açık
  tercihli adı veya gizli olduğunu gösterir. Hatalı ad alanda açıklanır.
  Üniversite değişmediyse profil kaydı bu alanları göndermez; başka sekmede
  değişen görünürlüğü sırf eski biyografi formu açık diye tekrar yazmaz.
- UserList.universityName/universityPublic ayrı saklanır. Eski istemcide alan
  yoksa veri korunur; boşaltma adı siler ve görünürlüğü kapatır. Görünürlük
  string coercion kabul etmez, sunucu Unicode/tek satır/uzunluğu doğrular.
- Hesap sahibi ayarlar ve özel dışa aktarımda her iki alanı görür. Kamu profil
  DTO/RSC çıktısına gizli ad veya iç görünürlük bayrağı çıkmaz; iki yönlü engel
  açık adı da gizler. Kamu profil API'si private/no-store'dur. Hesap silme
  adı ve görünürlüğü temizler. Arama, keşif ve diğer public DTO'lara eklenmedi.
- Yedek doğrulandı ve 46. migration uygulandı; şema farkı yok. 18 profil,
  8 topluluk, 32 paylaşım, 64 yorum, 467 müzik, 12 akış paylaşımı ve 7 forum
  konusu korundu; quick_check=ok. Test hesapları temizlendi; mevcut profillere
  üniversite atanmadı. Yerel sunucu tekrar 3000 portunda açık.
- 6 odaklı kontrol ve iki dar masaüstü koyu browser senaryosu geçti. İki gerçek
  oturum/anonim okumayla gizli ve açık DTO/HTML, varsayılan, taslak geri alma,
  eski istemci/hedef kullanıcı sınırı, hatalı giriş, iki yönlü engel, dışa
  aktarım ve hesap silme doğrulandı. Önceki profil kayıt hatası/taslak/kilit
  senaryosu da geçti; üniversite alanının kayıt sırasında kilidi kontrol edildi.
  Typecheck, ilgili lint ve UI kontrolü geçti; kamu profil görüntüsü incelendi.
  Genel matris, production build, mobil ve açık tema çalıştırılmadı.
- Yeni yol haritasında kaba kapsam %87. Faz 5'in profil parçası hazır;
  üniversite/şehir/ilgi alanıyla topluluk ve etkinlik keşfi sıradadır.
  Üniversite adları şimdilik serbest metindir; resmi kurum kataloğu değildir.

## 15 Ekim 2026 — Yeni/Takip karma akışı

- Ana sayfada ayrı Topluluklardan bölümü yerine müzik, genel dağıtımlı sohbet/
  inceleme ve yaklaşan etkinlikler tek Yeni akışında oluşturulma tarihine göre
  sıralanır. Takip aynı karmayı yalnız Follow edilen yazar/düzenleyenlerle kurar;
  topluluk üyeliği otomatik takip değildir. Tümü/Müzik/Sohbetler/İncelemeler/
  Etkinlikler sunucu filtresi vardır. Gizlilik/RSVP koşulları değişmedi.
- GET /api/feed/mixed üç kaynaklı ortak keyset cursor ile toplam 10 kayıt
  döndürür. Aynı tarih/ID üç tabloda türle ayrılır; tekrar/kayıp kontrol edildi.
  Eski topluluk cursor'ları da okunur. Yeni API private/no-store ve okuma hız
  sınırındadır. Aktif yazar/engel/kaldırma, müzikte gizleme, incelemede spoiler
  ve kaynak atfı korunur. Müzik metadata'sı için yeni dış sağlayıcı çağrısı yoktur.
- Beğeni/kaydet/listeye ekleme ve müzik DTO'su korunur; eski müzik API'si de
  aynı sunum fonksiyonunu kullanır. Topluluk kartları kendi detayına gider.
  Yükselen/Sana özel/Kaydedilen şimdilik açıkça yalnız müziktir; topluluklara
  ortak arşiv/beğeni/öneri ayrı iyileştirmedir. Etiket filtresi yalnız müzikte.
- useHomeFeed veri yüklemeyi ayırdı, ana sayfa 440/520 satır. Kapsam/tür/oturum
  değişince eski istek iptal edilir. Browser'da yakalanan eski observer cursor'u
  ile yeni türü boş gösterme hatası kapsam/tür/oturum+cursor/loading doğrulaması
  ve ilk yükleme sırasında kaydırma kilidiyle düzeltildi. Hata/yeniden dene ve
  devam sayfasında kayıtları koruma var; yayın sonrası geçerli kapsam yenilenir.
- 16 odaklı kontrol geçti. İki dar masaüstü koyu tarayıcı senaryosu: dağıtım/
  detay/spoiler/geri çekme ve iki gerçek oturumla karma sıra, müzik beğeni/
  kaydetme kalıcılığı, türler, gecikmiş yanıt, Follow ve müziğe özel Kaydedilen.
  Typecheck, ilgili lint, UI ve statik erişilebilirlik geçti. Genel matris,
  görsel baseline güncellemesi, mobil/açık tema ve production build yapılmadı.
- Şema değişmedi; 45 migration korunur. 18 profil, 8 topluluk, 32 paylaşım,
  64 yorum, 467 müzik, 12 müzik akış paylaşımı ve 7 forum konusu korunuyor;
  quick_check=ok, geçici hesap/topluluk/müzik kayıtları temiz. Yerel sunucu açık.
- Kaba yol haritası kapsamı %85; yayın hazırlığı değildir. Sıradaki Faz 5:
  isteğe bağlı üniversite alanı ve açık görünürlük tercihi, sonra üniversite/
  şehir/ilgi alanıyla keşif. Pilot sağlamlaştırma ve ticari sağlayıcı koşulları
  hâlâ açık işlerdir; mobil/açık tema ve bağımsız forum geliştirmesi askıdadır.

## 15 Ekim 2026 — genel akış dağıtımı ilk paket

- Sohbet/inceleme ve etkinlik oluştururken Yalnız topluluk akışında / Genel
  akışta da göster seçimi var. Eski ve tercihsiz kayıtlar community olarak
  kalır; demo içerikler otomatik açılmadı. Bu gizli okuma değildir.
- Ana sayfanın Yeni görünümünde Topluluklardan bölümü, açık tercihle genel
  dağıtıma açılan sohbet/inceleme/gelecek etkinlikleri oluşturulma tarihine
  göre birleştirir. Tür filtresi ve 10 kayıtlık birleşik keyset sayfalama var.
  Kaynak topluluk/yazar ve doğru paylaşım/etkinlik detay bağlantısı gösterilir.
  Müzik akışı/işlemleri/sıralaması ayrı korunur; tek karma müzik+topluluk
  sıralaması ve takip/sana özel/kaydedilen entegrasyonu henüz yapılmadı.
- Paylaşım detayından yazar/aktif topluluk yönetimi dağıtımı değiştirebilir.
  Etkinlikte sürümlü düzenleme kullanılır; eski istemci tercih göndermiyorsa
  mevcut değer korunur. Yalnız dağıtım değişikliği katılımcı bildirimi üretmez.
  Genel keşif katılım yetkisini değiştirmez; RSVP aktif üyelik gerektirir.
- API her okumada aktif yazar/düzenleyen, iki yönlü engelleme ve kaldırma
  filtrelerini uygular. Spoiler gövdesi/önizlemesi gönderilmez. Gelecek iptal
  duyuruları etiketli kalır, başlangıcı geçen etkinlik keşiften çıkar.
  Özel kitaplık alanları/RSVP kişi listesi genel DTO'ya çıkmaz; TVmaze atfı korunur.
- Yedek doğrulandı; 45 migration güncel ve şema farkı yok. Mevcut 18 profil,
  8 topluluk, 32 paylaşım, 64 yorum, 467 müzik, 12 müzik akış paylaşımı ve
  7 forum konusu korunuyor; quick_check=ok. Geçici test topluluğu/hesabı
  temizlendi. Yerel sunucu 3000 portunda çalışıyor.
- 27 odaklı kontrol ve tek gerçek oturum + anonim ziyaretçi masaüstü koyu
  tarayıcı testi geçti: UI'dan yayınlama, ana sayfa, spoiler, detay bağlantıları,
  genel dağıtımdan geri çekme ve bağlantıyla okumaya devam etme. Typecheck,
  ilgili lint ve UI kalite denetimi geçti. Mobil/açık tema, genel test matrisi
  ve üretim derlemesi çalıştırılmadı.
- Yeni yol haritasında kaba kapsam %80. Faz 4 henüz tamamen bitmedi:
  mevcut müzikle tek karma sıralama ve akış filtrelerinin kapsamı sıradaki paket.
  Üniversite/yerel keşif ve pilot sağlamlaştırma daha sonra gelir.

## 15 Ekim 2026 — etkinlik düzenleme ve uygulama içi bildirimler

- Gelecekteki açık etkinliklerde başlık/açıklama/tarih/şehir/mekân/kapasite
  düzenleme var. Düzenleyen/aktif kurucu/moderatör yetkisi sunucuda kontrol
  edilir. Geçerli katılımın altına kapasite indirilemez; RSVP ile aynı writer
  lock kullanılır. contentVersion eski formun yeni içeriği ezmesini engeller;
  çatışmada form korunur, kullanıcı açıkça kapatıp güncel veriyi yükleyebilir.
- Tarih/mekân değişiminde niyetler korunur, yeniden onay zorunlu değildir.
  Aktif katılacak/ilgilenenlere ve moderatör değiştirirse düzenleyene uygulama
  içi bildirim gider; aktör/engellenen/ayrılmış/vazgeçmiş diğer kişiler hariç.
  Değişiklik/iptal/doğrudan kaldırma ile bildirimler atomik yazılır. Değişmeyen
  kayıt ve tekrar iptal bildirim çoğaltmaz. E-posta/push yoktur.
- Mevcut bildirim merkezi etkinlik tiplerini gruplar; topluluk üst alanında
  erişilebilir. Bildirime tıklamak ilgili Etkinlikler detayını açar, kaldırılmış
  duyuru listeye gider. GET bildirim görünürlüğünü yeniden kontrol eder ve
  kaldırılmış etkinliğin başlığını gizler; yanıt private/no-store'dur.
- Yedek doğrulandı; contentVersion ve Notification.communityEventId migration'ı
  uygulandı. 44 migration sonrası şema farkı yok, quick_check=ok. Windows
  Prisma DLL kilidi için yalnız proje dev sunucusu generate sırasında kısa
  durduruldu ve yeniden açıldı. 18 profil, 8 topluluk, 32 paylaşım, 64 yorum,
  467 müzik, 12 ana akış paylaşımı ve 7 forum konusu korundu; test verisi temiz.
- 25 odaklı servis/sunum kontrolü ve iki gerçek oturumlu tek masaüstü koyu
  senaryo geçti. Kapasite/edit yarışı, no-op/sürüm/alıcı tekilliği, taslak
  koruma, başarılı edit ve bildirimden etkinliğe/iptale geçiş doğrulandı.
  Typecheck, UI kalite ve ilgili lint geçti; ekran görüntüsü incelendi.
  Genel test matrisi, üretim derlemesi ve mobil/açık tema çalıştırılmadı.
- Kaba yol haritası kapsamı %75; yayın hazırlığı oranı değildir. Sıradaki
  Faz 4 yalnız toplulukta veya genel akışta da dağıtım tercihi. Büyük bildirim
  fan-out'u/outbox, etkinlik raporları ve yük kontrolleri pilot öncesi açık işlerdir.

## 12 Ekim 2026 — etkinlik katılımı ve kapasite

- Katılacağım/İlgileniyorum/Vazgeçtim, kendi tercihinin kalıcılığı ve doluluk
  göstergesi eklendi. Katılacağım koltuk kullanır, ilgileniyorum kullanmaz;
  düzenleyen otomatik dahil değildir. Katılacakların ilk 200 profil listesi
  yalnız aktif düzenleyen/kurucu/moderatöre gider; ziyaretçide yalnız sayılar.
  Profil adının kimlere gösterileceği arayüzde açıklanır.
- CommunityEventRsvp tek eventId/userId kaydıdır. İlk write sorgusuyla SQLite
  writer lock alınıp açıklık/üyelik/kapasite transaction içinde doğrulanır.
  İki ayrı istemciden üç talep iki koltuğu aşmadı. Bounded busy retry vardır.
  İptal/kaldırma, ayrılma/yasak aktif tercihleri atomik withdraw eder; rejoin
  eski koltuğu diriltmez. Deaktif hesabın niyeti yazmada temizlenir; okuma
  sayaçları aktif hesap/üyelik filtresiyle gelir. Engelleme eski koltuğu kendi
  başına salmaz; yeni kayıt/görünürlük kısıtlanır, kendi vazgeçme mümkündür.
- Yedek doğrulandı ve RSVP migration'ı uygulandı. Windows DLL kilidi nedeniyle
  yalnız proje sunucusu generate için kısa durdurulup yeniden açıldı. 43
  migration güncel; quick_check=ok. 18 profil, 8 topluluk, 32 paylaşım,
  64 yorum, 467 müzik, 12 ana akış paylaşımı ve 7 forum konusu korunuyor.
  Geçici test etkinlik/RSVP/kullanıcıları temizlendi; kalıcı buluşma eklenmedi.
- 26 odaklı kontrol ve üç gerçek oturumlu tek masaüstü koyu senaryo geçti:
  doluluk, ilgileniyorum, vazgeçip yer açma, kalıcılık, yönetici listesi,
  iptal/yeni katılıma kapanma. Typecheck, UI denetimi ve ilgili lint geçti;
  ekran görüntüsü incelendi. Genel test matrisi, üretim derlemesi ve
  mobil/açık tema çalıştırılmadı.
- Kaba yol haritası kapsamı %65; yayına hazırlık oranı değildir. Sıradaki
  etkinlik düzenleme/kapasite azaltma ve değişiklik/iptal bildirimleri.
  Bekleme listesi, bitiş saati, doğrulanmış fiziksel katılım, rezervasyon,
  etkinlik raporları ve yönetim listesi sayfalaması henüz yoktur.

## 12 Ekim 2026 — etkinlik duyuruları ilk paket

- Toplulukta Sohbet ve incelemeler/Etkinlikler bölüm seçimi var. Etkinlik
  oluşturma, yaklaşan/başlangıcı geçmiş/iptal edilen listeleri ve detay eklendi.
  Başlık, açıklama, tarih/saat, şehir, mekân ve isteğe bağlı 2–200 kapasite.
  Tarihler UTC saklanır, Europe/Istanbul ile gösterilir; geçmiş/bozuk takvim
  ve bir yıldan uzak başlangıç reddedilir. Açık mekân onayı zorunludur.
- Aktif üyeler oluşturur; düzenleyen ve topluluk yöneticileri iptal/kaldırma
  yapar. İptal görünür, kaldırma soft-delete'dir. Aynı topluluk/aktif hesap/
  üyelik kontrolü transaction içindedir; organizer/status istemciden alınmaz.
  Okumada iki yönlü engelleme ve aktif organizer filtresi vardır. Duyurular
  genel ana akışa karışmaz; katılım ve doluluk takibi henüz yoktur.
- CommunityEvent tablosu yedekten sonra migration ile eklendi; 42 migration
  güncel, quick_check=ok. Windows DLL kilidi için yalnız bu proje sunucusu
  durdurulup client generate sonrası yeniden başlatıldı. Mevcut 18 profil,
  8 topluluk, 32 paylaşım, 64 yorum, 467 müzik, 12 akış paylaşımı ve 7 forum
  konusu korunuyor. Test etkinliği temizlendi; kalıcı/sahte buluşma eklenmedi.
- 6 odaklı etkinlik testi ve tek gerçek oturumlu masaüstü koyu browser
  senaryosu geçti. Oluşturma/kalıcılık/iptal/kaldırma, anonim okuma ve
  oturumsuz yazma sınırı doğrulandı. Typecheck, UI denetimi ve ilgili lint
  geçti; etkinlik detay ekranı görsel incelendi. Genel test matrisi,
  üretim derlemesi ve mobil/açık tema çalıştırılmadı.
- Yeni yol haritasında kaba kapsam tahmini %55. Sıradaki Katılacağım/
  İlgileniyorum/Vazgeçtim, tek kullanıcı kaydı ve yarış güvenli kapasite.
  Organizer katılacağım dediğinde kapasite kullanacak, ilgileniyorum
  koltuk tüketmeyecek; bekleme listesi ilk pakette yoktur. Düzenleme,
  iptal/değişiklik bildirimleri ve etkinlik raporları henüz açık işlerdir.

## 12 Ekim 2026 — kitaplıktan incelemeye eser bağlama

- İnceleme formuna Elle gir/Kitaplığımdan seç eklendi. Müzik, dizi, film ve
  kitap kayıtları aranıp seçilir; ilk 20 sonuç. Müzikte yalnız onaylı parçalar,
  oyunlarda manuel giriş vardır. Boş/yükleniyor/hata/yeniden dene durumları
  ve yayımlanan eser bilgisinin herkese açık olacağı uyarısı vardır.
- Referans listesi yalnız oturum sahibine aittir. Yayın transaction'ında
  sahiplik/tür yeniden kontrol edilir; metadata sunucudan alınır ve kaynak
  provider/externalId ile canonical HTTPS URL olarak oluşturulur. İstemcinin
  sahte başlık/provider/bağlantısı kayda taşınmaz. Özel kitaplık ID/durumu
  kamuya veya CommunityPost kaydına aktarılmaz; kitaplık değiştirilmez.
- CommunityPost.referenceProvider snapshot alanı migration ile eklendi;
  eski sohbet/manuel incelemelerde null'dır. Kitaplıkta kaynak silinse de
  inceleme kalır; kullanıcı bunu ayrıca kaldırabilir. Yeni dış istek yoktur.
  TVmaze için mevcut atıf bileşeni kullanılır; eski TMDB snapshot'ları korunur.
- Yedek doğrulandı, migration uygulandı. Windows Prisma DLL kilidi nedeniyle
  yalnız bu projeye ait geliştirme sunucusu durdurulup istemci üretildikten
  sonra yeniden başlatıldı; veri resetlenmedi.
- Son kontrolde 41 migration güncel, quick_check=ok. 18 profil, 8 topluluk,
  32 topluluk paylaşımı, 64 yorum, 467 müzik kaydı, 12 ana akış paylaşımı
  ve 7 forum konusu korunuyor; demo verisi değişmedi.
- 15 odaklı servis/girdi kontrolü ve tek gerçek oturumlu masaüstü koyu
  tarayıcı senaryosu geçti. Browser kitaplık metadata'sı yerel fixture'dır;
  canlı sağlayıcı kullanılmadı. Seçim/yayın/özel durumun korunması/kaynak
  silindikten sonra kalıcılık doğrulandı; geçici kayıtlar temizlendi.
  Typecheck, UI denetimi ve ilgili dosyalarda lint geçti; görsel kontrol yapıldı.
  Genel test matrisi, üretim derlemesi ve mobil/açık tema çalıştırılmadı.
- Yeni topluluk/inceleme/etkinlik yol haritası için kaba kapsam tahmini %45;
  bu bütün uygulamanın veya yayına hazırlığın oranı değildir. Sıradaki paket
  Faz 3: etkinlik alanları, oluşturma/liste/detay; ardından kapasite güvenli
  katılacağım/ilgileniyorum/vazgeçtim akışı. Genel akış, üniversite ve pilot
  sağlamlaştırma henüz açık işlerdir.

## 12 Ekim 2026 — kalıcı yerel topluluk demo verisi

- Kullanıcı isteğiyle 8 kurgusal profil, 8 topluluk, 40 üyelik, 32 paylaşım
  (16 sohbet/16 inceleme) ve 64 yorum eklendi. Altı inceleme türü, spoiler,
  ilgi alanı/kurgusal kampüs/yerel kategoriler dolu görünür. Profiller ve
  topluluklar demo olarak etiketlidir; gerçek kurum veya etkinlik iddiası yoktur.
- `npm run demo:seed` yerel SQLite/APP_URL ve üretim korumasına sahiptir.
  Önce doğrulanmış yedek alır; sabit manifest kimlikleriyle transaction
  içinde ekler. Tekrar çalıştırma çoğaltmaz veya mevcut düzenlemeleri/
  uzaklaştırmaları geri almaz. Çakışma tüm işlemi geri alır.
- Demo hesaplarda parola/oturum/admin yetkisi yoktur. Gerçek hesabınla
  katılım mümkündür; demo profillere giriş kapalıdır. Dış istek/Spotify
  senkronu, müzik kaydı veya genel akış paylaşımı oluşturulmadı.
- Ekleme sonrasında toplam 18 profil vardır: yedekteki mevcut 10 hesabın
  bütün alanları birebir korunmuş, yalnız 8 demo eklenmiştir. 467 müzik
  kaydı, 12 ana akış paylaşımı ve 7 forum konusu değişmedi; quick_check=ok.
- 5 odaklı seed kontrolü, typecheck ve ilgili script/test lint'i geçti.
  Yeniden çalıştırma ve veri koruma geçici SQLite üzerinde sınandı.
  Doküman/komut: `docs/DEMO_VERI.md`. Yalnız demo rotalarını okuyan tek
  masaüstü koyu tarayıcı testi geçti: 8 topluluk, üye/paylaşım sayıları,
  demo yazarlar, inceleme/spoiler/yorumlar, taşma ve JS hatası kontrolü.
  Dolu keşif ve film incelemesi görüntüleri incelendi. Mobil/açık tema ve
  genel test matrisi çalıştırılmadı. Yerel sunucu 3000 portunda çalışıyor.

## 12 Ekim 2026 — topluluk incelemeleri ilk paket

- Topluluk paylaşımında Sohbet/İnceleme seçimi var. İnceleme türleri müzik,
  dizi, film, kitap, video oyunu ve kutu oyunu. Eser adı, 1–10 tam sayı puan,
  inceleme metni, spoiler ve isteğe bağlı HTTPS kaynak bağlantısı eklendi.
- Eser seçimi manuel/kullanıcı beyanı olarak etiketlenir. Kaynak yalnız
  izinli Spotify/TVmaze/Wikidata/Open Library/Steam/BoardGameGeek hostlarına
  gider; metadata isteği/doğrulaması yapılmaz. Özel kitaplığa veya müzik
  senkronuna otomatik kayıt yoktur. Katalog/kitaplık seçimi bağlama sıradadır.
- Spoiler metni akış DTO'suna önizleme olarak gönderilmez; detayda metin ve
  yorumlar kullanıcı açana kadar render edilmez, yeniden gizlenebilir.
  Başlık/eser adı görünürdür ve form bunu uyarır. Bu gizlilik/erişim kontrolü
  değildir; detay API'si kamuya açıktır. Normal sohbet davranışı korunur.
- SQLite yedeği alınıp imzası doğrulandı. 20261012120000 migration'ı altı
  alan ekler, eski kayıtları discussion/spoiler=false olarak korur. Reset
  yoktur. Mevcut 9 hesap, 467 müzik kaydı, 12 paylaşım ve 7 forum konusu korunur.
- 11 odaklı girdi/SQLite kontrolü ve tek gerçek oturumlu masaüstü koyu
  Playwright senaryosu geçti. Migration geriye uyumluluğu, tür/puan/bağlantı
  doğrulama, spoiler önizlemesi, erişim kuralları, hatada taslak koruma,
  kalıcılık ve ziyaretçi aç/gizle akışı doğrulandı. Test verileri temizlendi.
  Typecheck, UI denetimi ve ilgili dosyalarda lint geçti; görsel kontrol yapıldı.
  Genel test matrisi, mobil/açık tema ve üretim derlemesi çalıştırılmadı.
- Yerel sunucu http://127.0.0.1:3000 üzerinde başlatıldı. Etkinlik/kapasite/
  katılım, genel akış görünürlüğü ve üniversite profil alanı henüz yapılmadı.

## 9 Ekim 2026 — topluluklar ilk yerel teslim

- Ürün yönü genişledi: ilgi alanı, üniversite ve yerel topluluklar aktif
  öncelik. Bağımsız forum geliştirmesi askıda; eski içerikler, rota ve
  mevcut yazma davranışı korunur. Ana masaüstü menü Topluluklar'a gider;
  topluluk keşfinde eski foruma bağlantı vardır. Profil V4 kozmetik kalanları
  ertelendi; mobil/açık tema kapsamı açılmadı.
- `/communities`: arama/kategori/Topluluklarım ve oluşturma. Topluluk
  sayfasında katılma/ayrılma, başlıklı metin paylaşımı, yorum ve sayfalama.
  Herkes okuyabilir; yazma aktif üyelik gerektirir. İçerik ana akışa karışmaz.
- Topluluğa özel kurucu/moderatör/üye; rol atama, uzaklaştırma/geri alma,
  paylaşım/yorum bildirimi, yönetim kuyruğu ve soft-delete. Kurucu ayrılamaz;
  moderatör kurucuyu/başka moderatörü yönetemez. Yeniden katılım yasağı aşmaz.
  Kaldırılan konunun yorum raporları da kapatılır. İki yönlü engelleme
  görünürlüğe uygulanır; özel yönetim verileri anonim/normal üyeye sızmaz.
- 5 yeni tablo migration ile eklendi, sıfırlama yapılmadı. Önce SQLite
  yedeği alındı. Migration çıktısına karışan CLI duyurusu SQL'den temizlendi;
  oluşturulan tablo/indeksler ve şema farkı doğrulanıp migration kaydı
  düzeltildi. 39 migration güncel; `quick_check=ok`. Önce/sonra sayıları:
  9 hesap, 467 Suggestion, 12 FeedPost, 7 ForumThread.
- Doğrulama: 8 odaklı SQLite/girdi kontrolü; gerçek kayıt API'sinden iki
  oturumla tek masaüstü koyu Playwright senaryosu geçti (mock yok).
  Oluşturma, katılım, paylaşım/yorum, rapor, kaldırma, yasak ve HTTP
  oturumsuz/origin/bozuk JSON/büyük gövde kontrolleri yapıldı. Test
  hesapları/topluluğu finally içinde temizlendi; mevcut kayıtlar değiştirilmedi.
  Görsel kontrol yapıldı; typecheck ve UI denetimi geçti. İlgili dosyalarda
  lint: 0 hata; HomeSidebar'ın önceden kalan kullanılmayan `accountHref`
  değişkeni için 1 uyarı var (bu teslimde değiştirilmedi).
  Genel test matrisi ve üretim derlemesi bu dar yerel teslimde çalıştırılmadı.
- Sıradaki: Faz 2 inceleme türleri/spoiler/referans; Faz 3 etkinlik/kapasite/
  katılım; Faz 4 genel akış görünürlüğü; Faz 5 isteğe bağlı üniversite;
  Faz 6 pilot. İlk yönetim ekranı 50 üye/30 raporla sınırlıdır; yönetim
  sayfalaması, sahiplik devri ve kalıcı işlem günlüğü pilot öncesi açık işlerdir.
  Ayrıntı: `docs/TOPLULUK_YOL_HARITASI.md`.

## 25 Eylül 2026 — profil taslağı güvenli kaydet/iptal

- Profil editörünün kayıt paneline onaylı değişiklikleri geri alma eklendi;
  profil sekmesindeki eski genel geri alma düğmesi gizlendi. İptal ağ isteği
  göndermez, kayıtlı değerleri geri yükler; onaydan vazgeçmek taslağı korur.
- Kayıt sürerken form alanları, geri alma ve hesap bölümü değiştirme kilitlenir.
  Aynı anda ikinci profil kaydına ref kilidi var. Ağ hatası Türkçe mesajla
  bildirilir; taslak kaybolmaz, kontroller yeniden açılır.
- Typecheck, UI kalite kontrolü ve tek masaüstü koyu browser senaryosu geçti:
  iptal/onay, ağ hatası, taslak koruma, kayıt kilidi ve yeniden yükleme.
  Browser API'si mock; gerçek DB kaydı testi değildir. Ekran görüntüsü incelendi.
- P3 bitmedi: gerçek profil bileşenleriyle ortak önizleme ve çerçeve seçimi
  sonraki paket. Şema, mobil/açık tema ve medya sağlayıcıları değiştirilmedi.

## 25 Eylül 2026 — gerçek oturumlu kitaplık ve yerel açılış

- Yerel `.env` içinde `MEDIA_CATALOG_ENABLED=true` açıldı; `.env.example`
  varsayılanı kapalı kalır. Bu bir üretim dağıtımı/ticari yayın onayı değildir.
- `tests/browser/media-live.spec.ts`: gerçek kayıt API'sinden alınan oturum
  çereziyle TVmaze, Open Library ve Wikidata üzerinde birer canlı arama yapıldı.
  Her türde ekleme, durum değişikliği, yeniden yüklemede kalıcılık, özel kayıt,
  açık vitrin, oturumsuz ziyaretçi görünümü, geri alma ve silme doğrulandı.
  API/mock veya elle üretilmiş seçim imzası kullanılmadı. Oturumsuz kitaplık 401,
  ziyaretçi verisinde durum ve kullanıcı kimliğinin bulunmaması da kontrol edildi.
- Opt-in tek masaüstü senaryosu (3 sağlayıcı adımı) ve typecheck geçti.
  Geçici hesap/kayıtlar temizlendi; mevcut kullanıcı hesapları değiştirilmedi.
- Ticari yayın öncesi kalan: Open Library kullanım modelinin uygunluğu
  (yüksek trafikli ticari backend için tasarlanmamıştır), TVmaze ShareAlike
  yükümlülüklerinin dağıtım modeline uygulanması, üretim derlemesi/operasyonları.
  Kaynak notları `docs/MEDYA_KATALOGU_YOL_HARITASI.md` içindedir.

## 25 Eylül 2026 — Open Library iletişim ayarı

- Kullanıcının verdiği gerçek iletişim adresi yalnız Git dışında kalan `.env`
  içindeki `OPEN_LIBRARY_CONTACT` alanına eklendi; adres dokümana taşınmadı.
- Tek canlı `Crime and Punishment` araması 20 sonuç döndürdü; ilk eser
  `OL166894W`, 1866. Kaynak başlıkları farklı dilde gelebilir.
- Genel medya anahtarı kapalı tutuldu. Bu kontrol sunucu adaptörünü doğrular;
  çerezli arama/kayıt/vitrin uçtan uca kontrolü sıradaki adımdır.

## 25 Eylül 2026 — Wikidata film geçişi

- Yeni film aramaları anahtarsız Wikidata kullanır; TMDB arama/token bağımlılığı kaldırıldı.
  Türkçe/İngilizce ad araması, P31/P279 ile sınırlı film sınıfı doğrulaması,
  Türkçe başlık önceliği, en erken yayın yılı ve güvenli kaynak bağlantısı var.
  Kapak/özet/oynatma yok. Derin veya eksik sınıflanmış eserler çıkmayabilir;
  yetişkin içerik filtresi ve eksiksiz katalog garantisi yok.
- En fazla 30 aday, 3 sınıflandırma turu, 20 sonuç ve toplam 12 saniye sınırı.
  Süreç içi 5 dakikalık/100 sorguluk metadata önbelleği, aynı isteği birleştirme,
  sağlayıcı başına tek aktif sorgu ve yoğunlukta 60 saniye bekleme eklendi.
  Kullanıcıya bağlı seçim imzaları önbellekten sonra üretilir.
- Eski TMDB kimlikleri/durumları/vitrin tercihleri korunur. Migration yedekten
  sonra uygulandı: `backups/pre-wikidata-2026-09-25T19-01-09-329Z.db`.
  SQLite quick_check başarılı; 9 kullanıcı ve 0 mevcut medya kaydı korunuyor.
- 25 odaklı kontrol, typecheck, UI kalite kontrolü geçti. İki masaüstü koyu
  mock browser senaryosu geçti; film ekran görüntüsü gözle kontrol edildi.
  Dar lint: 0 hata, mevcut LibraryClient effect cleanup ref kullanımı için 1 uyarı.
  Canlı Wikidata Inception araması Başlangıç (2010) döndürdü; ikinci sorguda
  sağlayıcı hız sınırı görüldü. Gerçek çerezli arama/kayıt akışı henüz doğrulanmadı.
- Sunucu 127.0.0.1:3000 üzerinde çalışıyor. `.env` değiştirilmedi; genel medya
  anahtarı kapalı, Open Library gerçek iletişim bilgisi eksik. Mobil/açık tema
  ve geniş test/build matrisi çalıştırılmadı.

## 24 Eylül 2026 — TVmaze dizi geçişi

- Yeni dizi aramaları TMDB yerine anahtarsız TVmaze kullanır. Yalnız başlık,
  yıl ve kaynak bağlantısı alınır; görsel/özet/oynatma yok.
- TVmaze ve CC BY-SA 4.0 atfı kitaplık/profilde eklendi; kaynak kimlikleri
  `tvmaze:tv:ID` şeklinde ayrı tutulur. Eski TMDB kayıtları dönüştürülmez/silinmez.
- Veritabanı sağlayıcı kısıtı yedek sonrası genişletildi; yedek
  `backups/pre-tvmaze-2026-09-24T18-48-55-285Z.db`.
- 20 odaklı kontrol ve typecheck geçti. Tek canlı TVmaze araması başarılı:
  Breaking Bad (2008) dahil 8 sonuç. Bu, oturumlu UI uçtan uca testi değildir.
- Genel özellik anahtarı hâlâ kapalı. Film TMDB adaptörü geçici olarak duruyor;
  sıradaki paket Wikidata film geçişi. Open Library bağlantısı korunur.

## 24 Eylül 2026 — birleşik kitaplık yönetimi

- `/library` artık varsayılan müzik listesi; `type=music|tv|movie|book` ile
  Müzik, Diziler, Filmler ve Kitaplar ayrı yönetilir. URL ve geri/ileri gezinme
  seçili bölümü korur; medya servisinin kapalı olması müziği kapatmaz.
- Eski kontrol ekranı `MusicLibraryPanel` olarak taşındı: şarkı arama,
  ekleme/çıkarma, tür/sanatçı gruplama ve filtre korunur. Spotify senkronu,
  liste adı, toplu içe aktarma ve davet araçları müzik bölümündeki açılır panelde.
- `/control`, hesap liste sekmesi ve ilgili menü bağlantıları kitaplığa gider.
  Arkadaş önerilerinin moderasyonu hesap İstekler bölümünde kalır.
- DB taşıması yapılmadı; UserList/Suggestion ve Spotify/oyun veri akışı aynı.
- Typecheck/UI kontrolü ve 2 dar masaüstü browser senaryosu geçti (mock API):
  dört bölüm, eski URL, liste adı, geri gezinme ve mevcut medya kayıt akışı.
  Müzik araç çubuğu çakışması düzeltildi; ekran görüntüsü gözle incelendi.
- Canlı Spotify/TMDB/Open Library dış servis işlemleri bu pakette test edilmedi.
  Mobil/açık tema ve geniş test matrisi çalıştırılmadı.

## 23 Eylül 2026 — açık tercihli medya vitrini

- Kitaplık kartlarında onaylı "Profil vitrinine ekle" ve "Vitrinden kaldır"
  işlemleri var. Yeni/eski kayıtlar varsayılan özel (`showcasedAt = null`).
- Profil Vitrin sekmesi son 6 seçilen eseri gösterir. Ziyaretçide boş bölüm
  gizlenir, sahibinde yönetim bağlantısı vardır. Engellenmiş profilde ve özellik
  kapalıyken medya döndürülmez. Okuma/izleme durumu ve kullanıcı kimliği kamuya
  açık yanıta dahil edilmez.
- Yedek: `backups/pre-media-showcase-2026-09-23T20-46-38-402Z.db`.
  Eklemeli migration uygulandı; mevcut kayıtların görünürlüğü değiştirilmedi.
- 10 odaklı kitaplık kontrolü, typecheck ve UI kontrolü geçti. 2 masaüstü koyu
  browser testi geçti: mock kitaplık tercih akışı ve gerçek yerel sunucuda
  geçici profil ile kamuya açık veri/geri alma kontrolü. Test profili silindi.
- Canlı TMDB/Open Library araması ve gerçek oturumlu kayıt testi hâlâ açık.
  Test için 3001'de açılan servis kapatıldı; normal 3000 sunucusu geri açıldı.
  `.env` ve özellik anahtarı değiştirilmedi; yayın/atıf kontrolü bekliyor.

## 23 Eylül 2026 — masaüstü özel kitaplık ekranı

- `/library` ekranı ve ana bölüm navigasyonunda Kitaplığım bağlantısı eklendi.
- Film/dizi/kitap seçimi, 500 ms gecikmeli/iptal edilebilir arama, kaydetme,
  durum değiştirme, onaylı kaldırma ve daha fazla yükleme arayüzü hazır.
- Kayıtlar özel kalır. Kapalı servis/giriş gereksinimi, boş/yükleme ve hata
  durumları gösterilir. Başarısız yazma eski değeri korur ve kilidi açar.
- Typecheck, statik UI kontrolü ve tek masaüstü koyu browser senaryosu geçti.
  Arama/ekleme/durum değişikliği/ağ hatasından toparlanma/silme ve yatay taşma
  kontrol edildi; ekran görüntüsü gözle incelendi. Browser API yanıtları mock'tur;
  canlı sağlayıcı ve gerçek oturumlu uçtan uca doğrulama yapılmış sayılmaz.
- Özellik anahtarı açılmadı, sağlayıcı anahtarı eklenmedi. Sayfa erişilebilir
  fakat servis kapalı bildirimi verir. TMDB logo/atıf ve yayın koşulları kontrolü
  tamamlanmadan canlı kullanım açılmamalı.
- Sıradaki paket açık tercihli profil vitrini; mobil/açık tema askıda.

## 23 Eylül 2026 — kişisel medya kitaplığı API paketi

- Ayrı `MediaLibraryEntry` modeli ve eklemeli migration yerel DB'ye uygulandı.
  Öncesinde `backups/pre-media-library-2026-09-23T20-30-12-790Z.db` yedeği
  alındı ve SQLite başlığı doğrulandı; DB sıfırlanmadı.
- `/api/library`: kullanıcıya özel listeleme, ekleme, durum değiştirme ve silme.
  Tür filtresi/30 kayıtlık sayfalama; tekil kullanıcı-eser kaydı; tekrar ekleme
  mevcut durumu sıfırlamaz. Henüz herkese açık okuma/vitrin yok.
- Sunucudan gelen arama seçimleri kullanıcıya bağlı 30 dakikalık HMAC imzasıyla
  kaydedilir. SESSION_SECRET en az 32 karakter olmalı. Değiştirme işlemlerinde
  oturum, aynı kaynak, gövde boyutu ve türe uygun durum denetimi var.
- 17 odaklı kontrol geçti: katalog testleri, HTTP handler + geçici SQLite
  entegrasyonu, sahiplik, imza, geçersiz istek, sayfalama. Typecheck temiz.
  Gerçek tarayıcı/oturum çerezi ve canlı sağlayıcı testi henüz yapılmadı.
- Özellik kapalı kalır; sıradaki paket masaüstü kitaplık arayüzü ve profil vitrini.
  Mobil/açık tema ve kapsamlı testler çalıştırılmadı.

## 23 Eylül 2026 — film/dizi/kitap arama temeli

- TMDB film/dizi ve Open Library kitap adaptörleri, ortak katalog sözleşmesi
  ve oturum gerektiren `/api/catalog/search` eklendi.
- Özellik varsayılan kapalı; sunucu yapılandırması `.env.example` içinde.
  Gerçek anahtar eklenmedi, canlı sağlayıcı entegrasyonu henüz doğrulanmadı.
- Kaynak bağlantıları korunur; kapak/özet/oynatma henüz yok. Mevcut müzik,
  Spotify, düello, veritabanı ve kullanıcı arayüzü değiştirilmedi.
- 8 odaklı birim testi ve typecheck geçti. Build/geniş test çalıştırılmadı.
- Sıradaki aşama ayrı kişisel kitaplık modeli ve kayıt API'leri; sonra profil
  vitrini. Plan: `docs/MEDYA_KATALOGU_YOL_HARITASI.md`.

## 21 Eylül 2026 — ortak sosyal kabuk

- Ana akış, Keşfet, forum, profil, paylaşım ayrıntısı ve oyun rotaları
  `app/(social)` grubuna taşındı; dış URL'ler korundu.
- Masaüstü bölüm navigasyonu ortak layout'ta kalıcıdır; sayfaya özgü başlıklar
  ve işlemler içerik katmanında kalır. Mobil kapsam askıdadır.
- Bu paket yalnız typecheck, statik UI kontrolü ve tek masaüstü navigasyon
  senaryosuyla doğrulanır; aşağıdaki geniş test sonuçları tarihsel kayıttır.

## Aktif ürün kapsamı

### Profil V4 ilk paketi — 21 Eylül 2026

- Takip ve engellemede ağ hatası mesajı ve işlem kilidini açan `finally` eklendi.
- Oyun geçmişi sahip veya oyuncu katılımını kapsar; ziyaretçi toplamları yalnız
  açık oyunları içerir. Tavla ve Düello doğru ad ve rotayla gösterilir.
- Forum/oyun toplamları kısa liste uzunluğundan ayrıldı; paylaşım sayıları
  yayınlanmış kayıtlarla sınırlandı. Düello rozetleri katılım esaslı ve oyun türüne
  göre hesaplanır; profil, hesap ve rozet API'leri aynı kuralı kullanır.
- Masaüstü üst alana plak motifi, çerçeveli avatar ve rozet sayısı eklendi;
  bilgi sütunu sağa alındı. Tema gradyanları editör ve profilde ortak preset'ten gelir.
- Typecheck, 9 ilgili birim testi ve gerçek yerel profilde 1 masaüstü koyu
  senaryo geçti: takip ağ hatası sonrası toparlanma, sekmeler ve yatay taşma.
- Sahip/boş/uzun ad varyantları, seçilebilir çerçeveler ve yeni vitrin etkileşimleri
  sonraki pakette; geniş build/test matrisi bu pakette çalıştırılmadı.

## Aktif ürün kapsamı (genel)

- Masaüstü öncelikli, koyu temalı sosyal müzik keşif deneyimi.
- Tek kullanıcı hesabı, sosyal akış, profiller, takip, bildirimler ve başarımlar.
- Kişisel liste, Spotify arama/bağlantı/senkronu ve toplu bağlantı içe aktarma.
- Moderasyon onaylı müzik forumu.
- Ortak oyun merkezi, 2 veya 4 oyunculu Şarkı Düellosu ve 2 oyunculu Türk Tavlası.

## Doğrulanmış durum

- Production build geçti; 47 statik sayfa üretildi ve ortak ilk yük 103 kB.
- 101 birim testi, 34 smoke kontrolü ve tam oturumlu API/E2E akışı geçti.
- Masaüstü koyu temada 10 ana rota Axe/yerleşim ve 10 görsel baseline testi geçti.
- İki bağımsız tarayıcı hesabıyla Tavla oda, katılım, hamle, tek pul sürükle-bırak,
  perspektif ve sıra değişimi eşitlemesi geçti; hamle zaman aşımı geçici olarak kaldırıldı.
- Tavlada yalnız yasal haneler etkileşimli; zar kullanım hakları görünür ve vurulan
  pul doğru renkle bara animasyonla taşınıyor.
- Dört bağımsız tarayıcı oturumuyla 4 oyunculu Şarkı Düellosunun 15 eşleşme ve 60
  oy içeren tam turnuvası, yeniden bağlanma, ortak sonuç ve oda kapanması geçti.
- Ana akış, forum ve oyunlar için masaüstü koyu tema performans bütçesi eklendi ve
  yatay taşma, CLS, DOM, kaynak, uzun görev ve gezinme eşikleri geçti.
- Hover/focus sırasında yüzeyi ham beyaza çeviren CSS kuralları statik denetimle
  engelleniyor.
- Eski `%80 zoom` yoğunluk hilesi kaldırıldı; masaüstü grid, sidebar, topbar ve
  kontrol ölçüleri merkezi tokenlarla gerçek piksel ölçülerinde çalışıyor.
- Keşfet, Forum, profiller, paylaşım ayrıntısı ve Oyunlar aynı masaüstü bölüm
  navigasyonunu kullanıyor; 1280 px koyu görünümde taşma ve eylem çakışması yok.
- Hesap özeti istekleri ortak istemci oturum katmanında birleştiriliyor ve kısa
  süreli önbelleğe alınıyor; giriş, çıkış, parola değişimi ve hesap silme cache'i temizliyor.
- Route bazlı iskelet yükleme ekranları ve dahili sayfa geçiş ilerleme göstergesi eklendi.

## Çalışan servis sözleşmesi

- Web uygulaması: Next.js App Router.
- Yerel veri: Prisma ve SQLite; üretim büyümesinde PostgreSQL planlanmalı.
- Canlı oyun zaman aşımı: ayrı `maintenance:games` worker ve normal oda sorgusunda
  atomik çözüm yapan güvenlik ağı.
- Oyun eşitleme: revision/ETag tabanlı, görünürlük duyarlı polling.
- Spotify: veri çekirdeği değil; arama, bağlantı ve liste senkronu entegrasyonu.

## Bilerek ertelenen kapsam

- Mobil yerleşim ve mobil test matrisi.
- Açık tema görsel kalite çalışması.
- E-posta doğrulama ve parola sıfırlama sağlayıcısı.
- PostgreSQL geçişi, gerçek push/SSE ve ürün analitiği.
- Son dağıtım öncesi anahtar yenileme ve üretim güvenlik operasyonları.

Aktif iş sırası için yalnızca `ROADMAP.md` kullanılmalıdır.
