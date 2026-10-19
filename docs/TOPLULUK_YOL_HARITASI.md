# Topluluklar ve etkinlikler — aşamalı yol haritası

9 Ekim 2026. Aktif kapsam masaüstü koyu tema; mobil/açık tema ve bağımsız
forum geliştirmesi askıda. Mevcut kitaplık, müzik, oyunlar ve forum korunur.

## Faz 0 — ürün sınırları

Yeni sosyal içerik müzik alanlarını zorunlu tutmaz ve eski forum şemasına
sıkıştırılmaz. Topluluk ve içerik kimliği ayrı, hesap ve engelleme sistemi
ortaktır. Toplulukta gösterim ile genel akışta dağıtım ayrı kararlardır.
İlk sürüm özel/gizli topluluk vaadi vermez; herkes okuyabilir, üyeler yazabilir.
Kategori etiketleri üniversite veya konum doğrulaması değildir.

## Faz 1 — topluluk çekirdeği (yerel temel eklendi)

- Keşif: arama, ilgi alanı/üniversite/yerel filtre ve Topluluklarım.
- Oluşturma: ad, açıklama, kategori, kurallar ve atomik kurucu üyeliği.
- Katılma/ayrılma; uzaklaştırılan üyeyi yeniden katılmayla bypass edememe.
- Başlıklı metin sohbeti, yorumlar ve sayfalama.
- Kurucu/moderatör/üye; yalnız kurucu moderatör atar. Kurucuyu uzaklaştırma
  ve moderatörün başka moderatörü yönetmesi engellenir. Kurucu ayrılamaz.
- İçerik bildirimi, yönetim kuyruğu, inceleme, soft-delete ve uzaklaştırma.
- Gerçek oturum/origin/hız ve gövde sınırları, iki yönlü engelleme.

İlk teslim sınırları: düzenleme/kapak, sahiplik devri, yönetim sayfalaması,
kalıcı moderasyon günlüğü, yeni etkinlik bildirimi ve özel topluluk yoktur.
İlk yönetim görünümü son 50 üye/ilk 30 rapor; daha büyük toplulukları pilot
öncesi bu sınıra bırakmamak gerekir. Forum gelişimi donmuştur, veri taşınmamıştır.

Kabul: katılmadan yazılamaz; hedefler başka topluluktan değiştirilemez;
rol verisi istemciden alınmaz; anonim okuyucu rapor/üyelik yönetimini göremez;
kaldırılmış içerik yeniden okunamaz. Mevcut veriler migration sonrası korunur.

## Faz 2 — inceleme ve paylaşım çeşitliliği (ilk paket eklendi)

Metin sohbetinden ayrı inceleme türü: müzik/dizi/film/kitap/video oyunu/kutu
oyunu, isteğe bağlı katalog referansı veya manuel başlık, spoiler işareti,
inceleme metni ve tutarlı puan ölçeği. İlk incelemeler topluluk akışındadır.
12 Ekim teslimi: altı tür, manuel eser adı, 1–10 tam sayı puan, en az 20
karakter inceleme ve izinli kaynak hostlarından isteğe bağlı HTTPS bağlantı.
Spoiler önizlemesi server DTO'da boş; detayda metin ve yorumlar aç/kapat
kontrolüyle gösterilir. Başlık/eser adı açıktır; spoiler gizlilik sınırı değildir.
Kitaplıktan müzik/dizi/film/kitap seçimi eklendi: kullanıcıya ait kaydın
metadata'sı sunucudan snapshot alınır; özel kayıt kimliği/durumu kamuya
çıkmaz. Yalnız onaylı müzik seçilir; oyunlar manuel kalır. Seçilen eserin
adı/kaynak bağlantısının yayımlanacağı formda açıklanır. Doğrudan katalog
arama/seçim film/dizi/kitapta eklendi: kullanıcıya bağlı 30 dakikalık imza,
mevcut sağlayıcılar ve canonical kaynak snapshot'ı; kitaplığa otomatik kayıt
yoktur. Arama açık düğme/Enter ile başlar; hata/süre dolması taslağı silmez.
Müzik kitaplık/manuel, oyunlar manuel kalır.
Manuel bağlantı için metadata isteği yapılmaz.
17 Ekim: aktif yazarın başlık/metin/puan/spoiler düzenlemesi, revision CAS,
editedAt ve atomik veri-minimum audit hazır. Eser snapshot'ı/dağıtım/yazar
değişmez; rapor kapanmaz. Sohbet/inceleme ve altı alan filtresi sayfalama
öncesi sunucuda uygulanır ve URL'de korunur. Tam edit geçmişi/geri alma yoktur.
Oyun için yeni sağlayıcı entegrasyonu zorunlu tutulmaz. Manuel referanslar
sağlayıcıdan doğrulanmış metadata gibi gösterilmez. Spoiler metni varsayılan
kapalıdır; aynı içerik müzik senkronuna veya özel kitaplığa otomatik eklenmez.

## Faz 3 — etkinlik ve katılım

İlk duyuru paketi eklendi: topluluk Etkinlikler bölümü, oluşturma, yaklaşan/
başlangıcı geçmiş/iptal edilen liste, detay, iptal ve kaldırma. Türkiye saati,
açık mekân onayı ve isteğe bağlı 2–200 kapasite var. RSVP/doluluk ve son
koltuk güvenliği de eklendi; iki Prisma istemcisiyle yarış testi yapıldı.
Etkinlik düzenleme, geçerli katılım altına kapasite azaltmayı engelleme ve
uygulama içi değişiklik/iptal bildirimleri eklendi. Eski taslak yeni bilgiyi
ezemez; tarih/mekân değişimi mevcut niyetleri korur, alıcıya güncel bilgiyi
kontrol etmesi bildirilir. Sıradaki ana paket Faz 4 dağıtım tercihidir.
Düzenleyen otomatik
koltuk kullanmaz; katılacağım dediğinde kapasiteye dahil olur. İlgileniyorum
koltuk kullanmaz; bekleme listesi ilk pakette yoktur.

Başlık, açıklama, tarih/saat/saat dilimi, şehir/mekân, isteğe bağlı kapasite,
düzenleyen ve hedef topluluk. Katılacağım/ilgileniyorum/vazgeçtim ayrı
durumlar. Aynı kullanıcı tek kayıt; kapasite hesabı transaction içinde.
Etkinlik iptali/değişikliği, katılım kapanışı, düzenleyenin kendi kapasiteye
dahil olup olmadığı ve bekleme listesi uygulama öncesi sözleşmeye bağlanır.
Hassas tam konum paylaşımı uyarısı; dışarıda buluşma güvenliği ve bildirim
akışı kabul kapsamına alınır. Topluluk üyeliği ile etkinliğe katılım ayrı kayıttır.

## Faz 4 — genel ve topluluk akışı

15 Ekim ilk paket hazır: paylaşım/etkinlik distribution tercihi, eski kayıtlarda
community varsayılanı, paylaşım detayından/etkinlik düzenlemeden değiştirme.
Ana sayfanın Yeni görünümünde ayrı Topluluklardan bölümü sohbet/inceleme/
gelecek etkinlikleri birleştirir; tür filtresi ve keyset sayfalama vardır.
Devam paketi: Yeni/Takip artık müzik+topluluk tek karma sıralamasını kullanır;
beş tür filtresi ve üç kaynaklı keyset cursor vardır. Takip yalnız Follow
ilişkisidir. Ana akış Yükselen/Sana özel/Kaydedilen müziğe özel kalır.
Kaynak topluluk ve karma kartlarda aynı beğeni/özel kayıt hazırdır.
Topluluklar arası /community-saved merkezi yalnız kişinin görünür kaynak
kayıtlarını kayıt tarihine sıralar; müzik Kaydedilen ayrıdır. Öneri sıralaması
ayrı iyileştirmedir. Faz 4 yerel çekirdeği hazır.
Aktif topluluk üyeliği RSVP koşulu olarak korunur; genel keşif bunu açmaz.

İçeriğin yalnız toplulukta dağıtılması veya genel keşif akışında da görünmesi
ayrı tercih. "Yalnız topluluk akışı" gizli okuma anlamına gelmez.
Etkinlik katılımı üyelerle sınırlı mı herkese açık mı ayrıca tanımlanır.
Genel akış içerik türlerini birleştirir, kaynak topluluğu gösterir; engelleme,
kaldırma, spoiler ve erişim filtreleri tüm sorgularda aynı uygulanır.

## Faz 5 — üniversite ve yerel keşif (yerel çekirdek hazır)

15 Ekim profil parçası hazır: isteğe bağlı elle girilen üniversite adı,
ayrı açık görünürlük tercihi (varsayılan kapalı), taslak/kaydet/geri alma,
kamu DTO/HTML'inde gizli adı gizleme, engelleme, dışa aktarım ve silme.
Üniversite profil tamamlanma puanına dahil değildir; öğrencilik doğrulanmaz.
Üniversite/şehir/ilgi alanına göre topluluk ve genel dağıtımlı yaklaşan etkinlik
keşfi de hazır. Açık etiketler toplulukta girilir/düzenlenir; kişisel profil
üniversitesi sorguya katılmaz. Filtreler URL/yenileme/geri dönüşte korunur.

Profile isteğe bağlı üniversite alanı ve açık görünürlük tercihi eklenir.
Üniversite, şehir ve ilgi alanlarıyla topluluk/etkinlik keşfi. E-posta uzantısı
ve kullanıcı beyanı doğrulanmış öğrencilik etiketi oluşturmaz. GPS ve açık
adres zorunlu olmaz; gizli profil verisi keşif sonuçlarına sızmaz.

## Faz 6 — pilot sağlamlaştırma

15 Ekim ilk paket hazır: etkinlik raporları mevcut topluluk yönetimi
kuyruğuna bağlıdır. Tek hesap/hedef kaydı, özel gerekçe, aktif üyelik/engel
sınırları, incelendi ve kaldırmayla atomik kapatma vardır. İptal raporu
kapatmaz, bildirim sayısı otomatik gizleme yapmaz. Kalıcı etkinlik bildirim
outbox/işçisi de hazır: snapshot, 50'lik atomik batch, restart/retry ve
durum/kurtarma komutları. 17 Ekim: yönetim şikâyet/üye/geçmiş sayfalaması,
inceleyen/tarih ve atomik veri-minimum karar günlüğü hazır. Salt okunur
check:communities komutu 12 pilot kontrolü yapar; veri onarmaz.
Yerel işçi canlılık/ilerleme health'i ve sınırlı yeniden başlatma hazır;
üretim süreç gözetimi/dış alarm ve yük provası açık. Topluluk yönetiminden
bağımsız platforma başvuru/itiraz ve özel gerekçeli yanıt ilk paketi hazırdır;
mevcut topluluk karar günlüğü yalnız kaynak topluluğun yönetimi içindir.
Platform başvurusu kaynak yönetimine açılmaz; ilk paket yaptırımı değiştirmez.

17 Ekim devam paketi: çift onaylı devir, arşiv/restore, açık arşiv seçimiyle
hesap kapatma ve yaşam döngüsü yarış sınırları yerel olarak hazır.
Geçici kopyada SQL geri dönüş ve sınırlı sentetik servis yük provası geçti.
Staging HTTP+worker yükü ve uygulama akışlarıyla kurtarma,
üretim işçi gözetimi/dış alarm, yönetim günlüğü saklama politikası,
spam/yeni hesap sınırları, etkinlik doluluk yarışları ve iptal
bildirimleri. Temel erişilebilirlik, boş/hata/yükleme durumları, indeks ve
dar performans kontrolleri. Yayın öncesi topluluk politikası/moderasyon
sorumluluğu ve sağlayıcı ticari kullanım koşulları ayrıca değerlendirilir.

## Test ritmi

Her fazda yalnız etkilenen servis/API testleri ve bir masaüstü koyu senaryo.
Genel test matrisi her düzenlemede çalıştırılmaz. Gerçek DB testleri opt-in,
yalnız rastgele geçici hesaplarını temizler. Forum/müzik veri sıfırlama yoktur.
