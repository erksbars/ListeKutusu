# Taste tasarım yenilemesi — 23 Ekim 2026

> Bu belge ilk nötr denemenin tarihsel kaydıdır. Kullanıcının renk geri
> bildirimi sonrasında geçerli yön, mavi koyu zemin ve cyan/yeşil marka
> vurgularıdır. Güncel karar ve yedekler: `TASARIM_SURUM_YEDEKLERI.md` ve
> `DESIGN_SYSTEM.md`. Aşağıdaki nötr palet önerileri güncel talimat değildir.

## İlk paketin sınırı

Ortak kabuk, ana akış ve kitaplık. Bu tüm uygulamanın yeniden tasarımının
bittiği anlamına gelmez. Mobil, açık tema ve bağımsız forum askıda kalır.
Kurulu Taste ve Playwright kullanıldı; kurulu olmayan alternatifler
kullanılmış gibi gösterilmedi. Yeni bağımlılık/harici görsel eklenmedi.

## Ürün envanteri ve karar

- ListeKutusu: müzik yanında dizi, film, kitap, oyun ve topluluklar.
- Bir kişisel müzik listesi; diğer medya kayıtları ayrı veri modelindedir.
- Dört yönetilebilir kitaplık bölümü; oyun kitaplığı henüz yoktur.
- Karma akışta müzik, sohbet, inceleme ve etkinlik vardır.
- Spotify/TVmaze/Wikidata/Open Library kaynak bilgileri korunmalıdır.
- Yerel etkinliklerde mekân, zaman, kapasite ve üyelik şartı önemlidir.
- Üniversite bilgisi isteğe bağlıdır; doğrulanmış gibi gösterilmez.
- Uzun masaüstü oturumlarında okumak ve keşfetmek temel iştir.
- Gerçek küçük sayılar, bilinmeyende —, ayrı hata/giriş durumları korunur.
- Eski müzik merkezli dekorasyon, yeni ürün çeşitliliğini temsil etmiyor.

Dağıtılan seçenekler `data-terminal` ve `true-black-flat` idi. İkincisi medya
ve topluluk odağına uygun olduğu için seçildi; seed 1848207868. Yeniden çekim
yapılmadı. Palette/type koruma seçeneğiyle cyan marka rengi ve Windows sistem
fontu korundu; gradientli lacivert yüzeyler nötr koyuya çevrildi. Mevcut 224 px
sol menü korunarak T-frame'in yeni üst menü/switcher önerisi uygulanmadı:
üründe gerçek workspace switcher yok, ikinci gezinme oluşturmamak öncelikli.

Kimlik: katmanlı ürün işareti ve ayrı medya bölümlerinin tek kitaplıkta
buluşması. Hayalî kapaklar, kullanıcılar veya sosyal kanıt eklenmedi.
Ana akışın sorusu: “İlgi alanlarımdan yeni ne paylaşılmış?” Kitaplığın sorusu:
“Hangi medya listemi yönetiyorum?” En büyük alan gerçek kayıtların alanıdır.

## Uygulama

- Nötr yüzeyler, daha ayrık gri metin katmanları ve gerçekten mevcut font.
- Aktif sol menüde renkli kutu yerine parlak metin; etiketler yerinde kalır.
- Ana akış başlığı flat; sekmeler alt çizgili; tür filtresi kompakt.
- Keşif beşlisi sağ yardımcı akışta; paylaşım listesi öne alınır. Dar ekranda
  mevcut tek sütun davranışı nedeniyle yardımcı alan ana listenin ardından
  gelir. Ayrı mobil tasarım veya kabul çalışması yapılmadı.
- Paylaşım metni 14 px, eser adı 16 px; metadata 12 px kalır.
- Kitaplık dört bölümü gerçek aria-pressed seçimi ve URL ile yönetir.
- Müzik giriş/hata paneli daha kısa, sola hizalı; gerçek giriş hedefi korunur.
- Beş arka plan simgesi kaldırılmadı; masaüstü yoğunluğu görsel olarak azaldı.
- Genel renk/font tokenları tüm ortak tüketicilere yansır. Ekran bazlı CSS
  yalnız min-width 1024px ve koyu tema altında uygulanır.

## Ölçüm ve görsel eleştiri

Önce: ana akış 1440/1280 taramasında 4 FAIL/5 WARN; kitaplık 1440'da
2 FAIL/2 WARN. Gradient, buton gölgesi, renkli ikon kutuları ve font fallback
ana bulgulardı. Bunlar farklı veri/yükleme anlarının ölçümleridir, benchmark
veya aynı fixture üzerinde piksel karşılaştırması değildir.

Sonra: ana akış 1440 ve 1280'de 0 FAIL/1 WARN; kitaplık müzik 1440 ve kitap
1280'de 0 FAIL/0 WARN. Kalan below-fold uyarısı sonsuz/sayfalı sosyal akışın
tüm kartlarının ilk ekranda olmamasını işaretler; bir dashboard gibi tüm
kayıtları sıkıştırmak doğru değildir. Hiçbir kural --allow ile kapatılmadı.
İki genişlikte fold ve sayfa temas görüntüleri açılıp incelendi.

Son görsel eleştiri:

1. Ana soru artık gerçek eser kartlarıyla ilk ekranda cevaplanıyor; keşif
   yüklenmesi ana listeyi aşağı itmiyor. Dört tür hâlâ açık ve anlaşılır.
2. Sol/sağ kenarlar tutarlı, sağ alan bağımsız yardımcı akış. İlk 3 sorun
   (dekoratif başlık, geç başlayan kayıtlar, iri giriş paneli) düzeltildi.
3. Markada cyan korunuyor; yinelenen takip işlemi artık nötr. Başarı/hata
   renkleri hâlâ kendi anlamlarını taşır.
4. Yeni toplam veya örnek veri oluşturulmadı; puanlar/kayıtlar mevcut kaynaktan.
5. Bilinmeyen kitaplık sayısı —; oturumsuz durumda liste boş denmiyor.
6. Grafik/legend eklenmedi. Ortak token değişimi profil/oyunlar için kapsamlı
   görsel kabul sayılmaz; bu ekranların kendi stilleri ayrı tur bekler.
7. Mobil kontrol bilinçli olarak yapılmadı. Dolu oturumlu kitaplık, panel
   hata senaryoları, klavye kabul matrisi ve tam regresyon açık kalır.

## Dar doğrulama

Typecheck, değişen altı TSX dosyasında ESLint, UI/a11y statik denetimi,
dark/light token kontrast denetimi geçti. Taste kaynak lint'i AppShell,
HomeTopbar ve LibraryHub üzerinde 0 FAIL/0 WARN verdi; tüm eski CSS'nin
Taste kaynak lint'inden geçtiği iddia edilmez.

Playwright CLI / Edge: kitaplıkta müzik → dizi → film → kitap geçişi,
aktif buton/URL, dizi giriş dönüş hedefi ve yatay taşma kontrolü. Ana akışta
inceleme filtresi URL'yi ?kind=review yaptı; yatay taşma 0. Beklenen anonim
API 401 yanıtları görüldü. Gerçek veri yazma, DB/seed, snapshot güncellemesi
ve production build yapılmadı. Önceden değiştirilmiş 11 PNG korunur.

## Sonraki paketler

1. Topluluk keşfi, topluluk detay akışı, etkinlik liste/detayı; üyelik ve
   kapasite aksiyonlarını öne çıkaran aynı görsel dil.
2. Profil vitrini ve hesap panelleri; kişisel kimlik korunarak nötr kabuk.
3. Keşfet ve oyun merkezi; mevcut oyun materyalleri ayrı sisteminde kalır.
4. İzinli oturumlu fixture'larla dolu/boş/hata/menü/klavye kabulü ve geniş
   masaüstü görsel regresyon; sonra önceki işlevsel U-03/U-04 açıkları.

Görüntüler/denetim çıktıları `.taste-skill/`, CLI dosyaları `.playwright-cli/`
ve `output/playwright/` altındadır; Git dışında tutulur.
