# ListeKutusu Aktif Yol Haritası

Bu dosya yalnız açık işleri tutar. Tamamlanan işlerin özeti `PROJECT_STATUS.md`
dosyasındadır.

28 Ekim aktif durum: genel tasarım çalışması kullanıcı yönlendirmesine
kadar askıda; yalnız istenen sol menü geri dönüşü yapıldı. İşlevsel U-04
devamında topluluk/etkinlik detayından filtreli kaynak karta dönüş, kaynak
bağlamının yerel gezinmede temizlenmesi ve giriş hedefi tamamlandı.
Çok sayfalı kaynak dönüşü de tamamlandı: en fazla 3 ek otomatik sayfa,
manuel devam/vazgeçme, liste sonu/cursor/hata ve bağlam değişimi korunur.
Müzik yorumu istemci kabulü ve 401 sonrası açık, hesaba bağlı kısa süreli
giriş taslağı aktarımı tamamlandı. Gerçek oturumla yazma kabulü ayrıdır.
Topluluk yorum/düzenleyici/bildirim yerel çıkışları ortak onaya bağlandı;
mount kalan oluşturma taslakları bölüm/filtre/detayda korunur.
Navigation API destekli aynı belge geri/ileri koruması, hızlı tekrar ve
çoklu atlama kabulü eklendi. Profil kaydet-ve-devam/geçmiş birleşimi de
sentetik hesapla doğrulandı; yanıt doğrulaması ve temiz baseline düzeltildi.
Sıradaki: kalan oluşturma/yönetim form ailelerinin çıkışları;
gerçek oturumla yazma kabulü ayrıca açık.
Aşağıdaki tasarım yüzdeleri geçmiş
aşamanın tahminidir; güncel tüm ürün/yayın yüzdesi değildir.

## Topluluklar — aktif öncelik

Tasarım öncesi yerel teknik kapanış: şifreli yedek/doğrulama, yeni ortamda
gerçek HTTP kurtarma+işçi yeniden başlatma, izole production derlemesi ve
özel runtime/alarm adaptörü eklendi. Linux süreç/timer örnekleri yalnız
kaynak dosyalardır; host seçilmedi/servis kurulmadı. Açık üretim kapıları
ve tasarım devri: [Teknik kapanış](docs/TEKNIK_KAPANIS_VE_YAYIN.md).
Gerçek staging uzun yük, off-host aktarım, TLS/operasyon/lisans/veri
politikası onayı tamamlanmış sayılmaz. Tasarım/kozmetik sonraki ayrı pakettir.

Plan ve kabul ölçütleri: [Topluluk yol haritası](docs/TOPLULUK_YOL_HARITASI.md).
Faz 1'in yerel temeli eklendi: keşif/oluşturma, üyelik, sohbet ve yorumlar,
topluluğa özel roller, içerik bildirimi/kaldırma ve uzaklaştırma.
İlk sürüm herkese açık okunur; yazmak aktif üyelik gerektirir.
Topluluk içerikleri varsayılan olarak yalnız toplulukta dağıtılır; açık
tercihli içerikler Yeni/Takip karma akışında müzikle birlikte gösterilir.

Faz 2 ilk paketi eklendi: müzik/dizi/film/kitap/video oyunu/kutu oyunu
incelemeleri, 1–10 puan, spoiler ve manuel eser adı/kaynak bağlantısı.
Kitaplıktan müzik/dizi/film/kitap seçip incelemeye bağlama da eklendi;
metadata sunucuda sahiplik kontrolüyle alınır. Oyunlar manuel kalır.
İnceleme yazarı başlık/metin/puan/spoiler düzenleyebilir; eser snapshot'ı
korunur. Sohbet/inceleme ve altı inceleme alanı filtreleri URL'li hazırdır.
Film/dizi/kitap incelemesinde doğrudan katalog arayıp süreli imzalı seçim
hazırdır; önce kitaplığa kayıt açmak gerekmez. Kitaplıktan seçim/manuel
giriş korunur; müzik kitaplık/manuel, oyunlar manuel kalır.
Faz 3 ilk paketi hazır: etkinlik oluşturma, liste/detay, Türkiye saati,
şehir/mekân/kapasite, iptal ve kaldırma. Katılacağım/İlgileniyorum/Vazgeçtim,
doluluk ve transaction içinde kapasite kontrolü de eklendi. Etkinlik
düzenleme, kapasite azaltma ve uygulama içi değişiklik/iptal bildirimleri de
hazır. Özel /community-events ajandası kişinin tercih verdiği/düzenlediği
görünür etkinlikleri toplar; yaklaşan/geçmiş/iptal ve kendi rolü filtreleri,
onaylı tercih geri alma vardır. Fiziksel katılım kaydı veya açık profil değildir.
Faz 4 yerel çekirdeği hazır: yalnız topluluk akışı veya genel akışa da
dağıtım seçeneği, Yeni/Takip'te müzik+sohbet+inceleme+etkinlik karma sıralaması,
sunucu tür filtresi ve ortak cursor. Bu gizli topluluk/özel okuma değildir.
Ana akış Yükselen/Sana özel/Kaydedilen müziğe özeldir. Kaynak topluluk sohbet/
inceleme kartlarında beğeni ve özel Kaydettiklerim filtresi hazırdır.
Karma kart etkileşimi ve topluluklar arası özel /community-saved merkezi de
hazır; öneri sıralaması ayrı iyileştirmedir. Faz 5'in isteğe bağlı üniversite adı
ve açık görünürlük tercihi profil düzenleyicide hazır; varsayılan gizli ve
doğrulanmamış kullanıcı beyanıdır. Üniversite/şehir/ilgi alanıyla topluluk
ve genel dağıtımlı yaklaşan etkinlik keşfi de hazır. Filtreler topluluğun
açık etiketlerine bakar, kişisel profil üniversitesi sorguya katılmaz.
Faz 6 pilot sağlamlaştırma başladı: etkinlik raporları/moderasyon yerel
çekirdeği ve kalıcı bildirim outbox/işçisi hazır. Yönetim sayfalaması,
inceleme aktör/tarihi, atomik karar günlüğü ve salt okunur pilot kontrolü de
hazır. Çift onaylı sahiplik devri, salt okunur arşiv ve açık arşiv tercihli
hesap kapatma yerel çekirdeği de hazır. Bağımsız platform bildirim/itiraz
başvurusu, gerekçeli yanıt ve özel durum takibinin ilk paketi de hazır;
yerel işçi health/gözetmeni hazır. Üretim süreç yönetimi/dış alarm,
kişisel veri saklama ve gerçek yük/yayın kontrolleri açık. Geçici kopyada
tam içerikli SQL geri dönüş, 1/4/8 görevli sentetik servis ve ayrı geçici
Next+işçi ortamında gerçek HTTP ölçümü geçti. HTTP provası login/üyelik/
RSVP/etkinlik düzenleme ve bildirim görünürlüğünü kapsar; üretim kapasitesi
veya uygulama akışlarıyla staging kurtarma değildir.
Bağımsız forum geliştirmesi askıda; mevcut konular ve `/forum` korunur.
Masaüstü pilot gezinmesinde URL/geri-ileri/yenileme ve aynı sayfa içi
oluşturma taslağı koruması tamamlandı. Kalıcı taslak deposu değildir.
İnceleme düzenleme ve toplulukta içerik türü filtreleme tamamlandı.
Paylaşım/etkinlik okumaları güncel hedef/filtreye bağlıdır; eski yanıt ve
işlem onayı taşınmaz. İnceleme editörünün sayfa içi geri dön/vazgeç
komutlarında değişen taslak için onay vardır; global/kalıcı koruma değildir.
Topluluk paylaşımı beğenme/kaydetme ilk paketi hazır; müziğin sistemi ayrıdır.
Karma kartlar aynı sisteme bağlıdır; topluluklar arası özel kayıt merkezi
görünürlük filtresini korur. Katalogdan doğrudan eser seçimi tamamlandı;
kalıcı taslak kurtarma ve tam düzenleme geçmişi ayrı isteğe bağlı ürün paketleridir.
Profil V4 kalan kozmetik işleri topluluk çekirdeğinin sonrasına ertelendi.

Yaklaşık ilerleme: yeni topluluk/inceleme/etkinlik planında %95. Kaba kapsam
ağırlıkları: ürün sınırları %5, topluluk çekirdeği %25, inceleme çekirdeği
%15, etkinlik/katılım %30, genel akış dağıtımı %10, üniversite/yerel keşif
%5, pilot sağlamlaştırma %10. İlk üç çekirdek yerel olarak hazırdır; bu
oran tüm uygulamanın veya üretim/yayın hazırlığının ölçümü değildir.
Etkinlik fazının duyuru/yönetim, katılım ve düzenleme/bildirim çekirdekleri
yerel olarak hazırdır. Genel akış dağıtımının yerel çekirdeği de hazır;
üniversite profili ve etiket bazlı üniversite/yerel keşif de yerel olarak hazır.
Pilot sağlamlaştırma henüz bitmedi.
Büyük bildirim fan-out'u kalıcı outbox/işçiye taşındı; yerel sağlık ve sınırlı
yeniden başlatma hazır. Üretim süreç yöneticisi/dış alarm,
kişisel veri saklama/hesap yaşam döngüsünün ileri politikaları ve üretim/yük kontrolleri pilot
öncesi açık işlerdir. Etkinlik raporları mevcut topluluk yönetimine gider;
platforma bağımsız başvuru kanalı da vardır. Bu ilk paket kaynak kararı
değiştirmez; yaptırım/ban kaldırma/kurtarma ve yeniden açma ayrı tasarlanmalıdır.

Güncel açık iş sırası ve sınırlar: [Pilot eksikleri](docs/PILOT_EKSIKLERI.md).
Ortam/DB/migration/topluluk/işçi için salt okunur `pilot:check` ve
[manuel yayın kanıt sırası](docs/PILOT_ON_KONTROL.md) hazırdır. Yerel geçiş
yayın onayı değildir; gerçek HTTPS hedefi ve yedi manuel kapı açık kalır.

## Film, dizi ve kitap — aktif küçük paket

Kitaplık artık Müzik/Diziler/Filmler/Kitaplar ortak yönetim merkezi; müzik
taşıması tamamlandı. Eski kontrol sayfası görsel testleri sonraki toplu test
paketinde yeni rota ve başlıklara uyarlanmalı.

Plan: [Medya kataloğu yol haritası](docs/MEDYA_KATALOGU_YOL_HARITASI.md).
Arama, özel kitaplık API'leri ve `/library` masaüstü ekranı hazır; servis
yerel geliştirmede açık, örnek/dağıtım ayarında varsayılan kapalı. Açık tercihli profil vitrini de hazır. TVmaze dizi adaptörü
ve canlı arama kontrolü tamamlandı. Afişsiz Wikidata film araması, kaynak geçişi
ve sınırlı metadata önbelleği de tamamlandı. Open Library gerçek iletişim
yapılandırması doğrulandı. Üç sağlayıcıda gerçek çerezli arama/kayıt/vitrin/
geri alma/silme testi tamamlandı. Yerel kitaplık kullanılabilir.
Ticari yayın öncesi Open Library kullanım modeli ve TVmaze ShareAlike kapsamı
netleştirilmeli; üretim derlemesi ve dağıtım kontrolleri yapılmalıdır.
Müzik, Spotify ve oyun akışları korunur; mobil/açık tema askıdadır.

## Profil V4 — devam eden işler

Kapsam ve kabul ölçütleri: [Profil V4 raporu](docs/PROFIL_V4_RAPOR_VE_YOL_HARITASI.md).
Yalnız masaüstü koyu tema; küçük paketlerde dar test politikası korunur.

1. P1 kalan: uzun ad/boş profil ve sahip görünümünü yeni üst alanda kontrol et.
2. P2: kişisel vitrin ve ziyaretçiye özel boş durumlar.
3. P3: onaylı taslak iptali ve kayıt kilidi eklendi; kalan gerçek görünümle
   ortak önizleme ve seçilebilir çerçeveler.
4. P4: profil kartlarından etkileşim, rozet ayrıntısı ve sekme tutarlılığı.
5. İlk teslim sonrasında P5 rozet/oyun vitrinleri; davet, XP ve ziyaretçi defteri
   ayrı sonraki aşamalardır.

## Genel masaüstü deneyim aşaması

Tasarım önceliği: [Faz 0–1 kabuk ve akış önerisi](docs/TASARIM_FAZ_0_1_KABUK_VE_AKIS_PAKETI.md).
İlk karşılaştırılabilir ekranlar, [durum/etkileşim örnekleri](docs/TASARIM_DURUM_VE_ETKILESIM_PAKETI.md)
ve [ileri ekranlar / tek uygulama devri](docs/TASARIM_ILERI_EKRANLAR_VE_UYGULAMA_DEVRI.md)
hazırdır. Uzun içerik/rol sınırları ve 25 rota için son kabul listesi aynı
devir belgesinin 10. bölümündedir. Tasarım hazırlığı 82,50/100, yaklaşık %85
(±5 puan). Kullanıcının devam onayıyla sol menü yönünde U-01/U-02 uygulaması
başladı; yeni tasarımın uygulaması yaklaşık %30 (10 eşit devir paketi,
U-01 ~0,75 + U-02 ~0,70 + U-03 ~0,70 + U-04 ~0,60 = 27,5/100; kaba yuvarlama).
Bu tüm ürünün veya yayının oranı değildir.
Kalan: son kabuk/yoğunluk tercihi, gerçek profil ve yetkili akışlarla
eşleşme, aileye özgü ayrıntılar ve bütünleşik kullanıcı kabulü. İlk taslak
devredilebilir; yeni genel rapor veya özellik eklemek önkoşul değildir.
İlk uygulama: tek ortak sol menü, başlık başlangıcı, body modal/inert/odak,
kitaplık giriş-hata-boş ayrımı ve hesap taslağında menüden çıkış koruması.
İkinci dilimde tek taslak kayıt otoritesi, iç link/beforeunload koruması,
kişisel merkezlerde HTTP tabanlı durum ayrımı, özel kuyruk tazeliği ve
başvuruda onaylı/doğrulanan topluluk hedefi eklendi. Son 7 browser + 13 birim
kontrolü geçti; geniş kabul/build henüz yapılmadı.
Sıradaki: U-03 kayıt sonrası devam/giriş, aynı belge geri/ileri ve yerel
düğme/filtre çıkışları; kalan U-02 durumları, sonra U-04 akış/kart.
Üçüncü dilimde profil kaydet-ve-devam-et, hesap yerel çıkışları ve yetkili
kuyruk filtre/sayfa/yenileme koruması geldi. Son 8 browser senaryosu geçti.
Dördüncü dilimde başvuru türü/rapor hedefi onay ve güncel bağlamla doğrulanır;
Keşfet kullanıcı/liste aramasında hata-boş ayrımı ve bilinmeyen sayaçlar geldi.
Son 10 odaklı browser senaryosu geçti. Güncel kapsam/kanıt devir belgesinin
14. bölümünde önceki dilim izlenir. Beşinci dilimde bildirim paneli ortak
durumları, oturum/yetki kaybında temizleme, geç poll/mutation sınırı ve U-04
müzik kartı klavye/not etkileşimleri eklendi; son 6 seçilmiş senaryo geçti.
Altıncı dilimde karma kart hiyerarşisi ve yorum okuma/taslak/silme onayı geldi.
Son 3 browser + 2 mantık testi geçti; oturumlu yorumun tam browser kabulü açık.
Yedinci dilimde filtre URL sözleşmesi, müzik detayından kaynak karta dönüş
ve girişte aynı yol eklendi; 5 browser + 3 saf test geçti. Güncel kanıt 17.
bölümde. Topluluk/etkinlik kaynak dönüşü 27 Ekim'de eklendi; sıradaki U-04
çok sayfalı konum da tamamlandı. Müzik yorumunun sentetik viewer ile istemci
kabulü ve 401 giriş taslağı aktarımı eklendi; gerçek oturumla uçtan uca
yazma kabulü, diğer U-03 geçmiş/yerel çıkışlar, U-02 yönetim/oyun açık.

1. Ana akış ve Keşfet'in ilk görünür içeriğini server-first veri sınırına taşı;
   etkileşimli filtre ve aksiyonları küçük client bileşenlerinde bırak.
2. Topluluk, profil ve oyun merkezi sayfalarında ortak içerik başlangıç çizgisi,
   maksimum genişlik ve bölüm boşluğu tokenlarını tamamla.
3. Büyük istemci sayfalarını sorumluluklarına göre bölerek rota JavaScript yükünü azalt.
4. Dört ila altı masaüstü geliştirme paketi sonunda production build, koyu tema
   görsel rotalar ve performans bütçesini toplu doğrula.

## Sonraki ürün aşaması

1. Gerçek kullanıcı yüküyle ürün analitiği olaylarını ve gizlilik sınırlarını tasarla.
2. ETag polling korunarak SSE veya başka bir push taşıma katmanını prototiple.
3. PostgreSQL geçiş planı ve veri taşıma provasını hazırla.
4. E-posta doğrulama ve parola sıfırlama sağlayıcısını seç.

## Ertelendi

1. Açık tema yeniden tasarımı ve kontrast matrisi.
2. Mobil yerleşim, mobil navigasyon ve dokunma testleri.
3. Üretim anahtarlarını yenileme, HTTPS ve dağıtım ortamı operasyonları.

## Görev kabul ölçütü

- Kullanıcı akışı çalışır; hata, boş ve yükleme durumları görünürdür.
- İlgili dar test geçer.
- UI değişikliğinde yalnız etkilenen masaüstü koyu rota görsel olarak kontrol edilir.
- Büyük aşama sonunda `TESTING.md` içindeki toplu kontrol uygulanır.
- Güncel durum değişmişse `PROJECT_STATUS.md` tek seferde güncellenir.
