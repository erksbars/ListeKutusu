# Film, dizi ve kitap — aşamalı genişleme

23 Eylül 2026. Kullanıcı talebiyle müzik dışı içerik kapsamı açıldı.
Masaüstü koyu tema ve dar test politikası korunur. Müzik listesi, Spotify
senkronu ve oyunlar bu genişleme sırasında değiştirilmez.

## Aşama 1 — arama temeli (uygulandı)

### Son durum: yerel açılış ve yayın sınırı

25 Eylül: üç sağlayıcıda gerçek çerezli arama → kayıt → durum → vitrin →
geri alma → silme senaryosu geçti. Yerel medya anahtarı açık; önceki kapalı
durum notları aşama tarihçesidir. Üretim dağıtımı yapılmadı.

Resmî kaynak kontrolü:
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing): yapılandırılmış
  veri CC0; görseller veya başka metinler için genel izin sayılmaz.
- [TVmaze](https://www.tvmaze.com/api#licensing): atıf ve ShareAlike gerekir.
  Kaynak/lisans bağlantıları mevcut; ticari dağıtım modelindeki ShareAlike
  kapsamı ayrıca değerlendirilmelidir, yalnız bağlantı eklemek tüm yükümlülükleri çözmez.
- [Open Library](https://openlibrary.org/developers/api): insan odaklı düşük
  hacimli arama, kimlik belirten başlık ve cache yaklaşımı istenir. Yüksek
  trafikli ticari backend için tasarlanmamıştır. Ticari yayın ölçeği netleşince
  sağlayıcıyla uygunluk teyidi veya alternatif veri altyapısı kararı gerekir.

Bu teknik kontrol hukuki onay veya sınırsız ücretsiz ticari servis garantisi değildir.

### 25 Eylül güncellemesi — geçerli sağlayıcı planı

Film: Wikidata (CC0 yapılandırılmış metadata), dizi: TVmaze (CC BY-SA atfı),
kitap: Open Library. Aşağıdaki ilk uygulama notlarındaki TMDB araması artık
kullanılmıyor; yalnız eski kayıtların kaynak kimlikleri korunuyor.
TVmaze/Wikidata anahtar istemez; kitapta gerçek `OPEN_LIBRARY_CONTACT` gerekir.
Film araması Türkçe/İngilizce 30 adayı en fazla 3 sınıf turuyla doğrular;
derin/eksik sınıflı filmleri kaçırabilir. Görsel, tam metin ve oynatma yoktur.
Film toplam timeout 12 saniye; diğerleri 8 saniyedir. Metadata cache 5 dakika/
100 sorgu, eş istek birleştirme ve sağlayıcı yoğunluğunda 60 saniye bekleme vardır.
İmzalar cache'e konmaz. Normal ortamda medya anahtarı hâlâ kapalıdır.
Gerçek çerezli akış ve ticari yayın/atıf incelemesi son açılış adımıdır.

Kaynaklar:
- https://www.wikidata.org/wiki/Wikidata:Licensing
- https://www.mediawiki.org/wiki/Wikibase/API
- https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
- https://www.tvmaze.com/api#licensing

### İlk uygulama kaydı (23 Eylül; tarihsel)

- Film/dizi: TMDB; kitap: Open Library eser araması. Google Books şimdilik yok.
- `lib/mediaCatalog.ts`: sağlayıcıdan bağımsız kayıt sözleşmesi ve normalizasyon.
- Kimlikler sağlayıcı + tür + dış kimlik içerir; film/dizi ID çakışmaz.
- `GET /api/catalog/search?kind=movie|tv|book&q=...`: oturum gerektirir.
- `MEDIA_CATALOG_ENABLED=false` varsayılanıyla kapalıdır; açıkken TMDB için
  `TMDB_READ_ACCESS_TOKEN`, kitap için gerçek `OPEN_LIBRARY_CONTACT` gerekir.
- Anahtarlar yalnız sunucuda; sorgu sınırı, 8 saniye zaman aşımı ve hata kodları var.
- Kullanıcı/IP limiti ve süreç başına sağlayıcı aralığı var. Çok sunuculu yayında
  ortak limit deposu gerekir. Bu aşamada cache, sayfalama ve otomatik retry yok.
- Yalnız başlık, yıl, yazar ve kaynak bağlantısı döner. Kapak, özet, fragman,
  tam metin ve oynatma yok. Henüz UI, kayıt işlemi veya şema değişikliği yok.
- Testler sahte sağlayıcı yanıtlarıyla çalışır; gerçek anahtarlı servis doğrulaması
  ve route oturum/limit entegrasyon testi arayüz paketinde yapılacak.

## Aşama 2 — kişisel kitaplık (uygulandı)

- Mevcut tek müzik listesini bozmayan kullanıcıya bağlı ayrı medya kayıtları.
- İçerik kimliği + kullanıcı için tek kayıt; film/dizi: planlandı/izleniyor/izlendi,
  kitap: okunacak/okunuyor/okundu. Durumlar sunucuda türe göre doğrulanır.
- İlk sürüm varsayılan özel; herkese açık vitrin ayrı ve açık tercihle gelir.
- Listele/ekle/güncelle/kaldır API'leri; aynı kaynak ve sahiplik kontrolleri.
- Dizi bölüm/sezon takibi ve kitap baskısı/ISBN eşlemesi sonraya bırakılır.
- Migration öncesi mevcut DB yedeği; sıfırlama ve müzik verisi taşıma yok.

Uygulama notları:
- `MediaLibraryEntry` kullanıcı-eser tekilliği ve tür/durum SQL CHECK kuralları
  içerir. Yeni migration yerel DB'ye yedek sonrasında uygulandı.
- `/api/library` GET: isteğe bağlı `kind`, `after`; 30 sonuç + `nextCursor`.
- POST: `{ selectionToken, status }`. Arama sonuçları artık `selectionToken`
  içerir; SESSION_SECRET ile imzalanır, 30 dakika ve yalnız o kullanıcı için
  geçerlidir. İstemcinin başlık/URL/kullanıcı alanları kullanılmaz.
- PATCH: `{ id, status }`; DELETE: `{ id }`. Yazma istekleri JSON ve aynı Origin
  gerektirir. APP_URL dağıtım origin'iyle eşleşmelidir.
- Durumlar: film/dizi `to_watch | watching | watched`, kitap
  `to_read | reading | read`. İlk eklemede durum zorunlu; tekrar POST mevcut
  durumu değiştirmez. Durum değişikliği açık PATCH ile yapılır.
- Tüm kayıtlar özel. Listeleme/değiştirme/silme oturum sahibine bağlıdır;
  medya verisi profil veya herkese açık API'lere henüz eklenmez.
- 17 odaklı kontrol ve typecheck geçti. Handler testleri enjekte edilen
  oturum/limit ile gerçek geçici SQLite kullanır; tarayıcı oturumu testi değildir.

## Aşama 3 — masaüstü arama ve profil vitrini

İlk alt paket uygulandı: `/library` + ana bölüm bağlantısı, tür seçimi,
gecikmeli arama/istek iptali, kayıt kartları, durum seçimi, onaylı silme,
sayfalama ve hata/boş/yükleme durumları. Masaüstü koyu mock browser akışı geçti.
Gerçek servis yapılandırması ve çerezli uçtan uca test hâlâ bekliyor.
Profil vitrini/ziyaretçi görünümü uygulandı: onaylı paylaşım, geri alma ve son
6 seçim. `showcasedAt` varsayılan null; yalnız seçilen eser metadata'sı döner,
okuma/izleme durumu özel kalır. Engelleme ve özellik anahtarı sunucuda uygulanır.
PATCH `{ id, showcase: boolean }` durum değişikliğinden ayrı gönderilir.
Vitrinden kaldırmak kitaplık kaydını silmez. Ziyaretçinin boş vitrini gizlidir.
Gerçek yerel sunucuda geçici profil testi ile görünür/özel ayrımı ve geri alma
doğrulandı; geçici kayıtlar temizlendi. TMDB metinsel atıf mevcut;
resmi logo ve yayın uygunluğu tamamlanmadan özellik etkinleştirilmemeli.

- Tür seçimi, gecikmeli arama, sonuç kartı, kaydetme ve durum değiştirme.
- Boş/yükleniyor/eksik yapılandırma/limit/hata durumları; eski arama yanıtlarının
  yeni sorguyu ezmesini önleme. Yayın öncesi cache ve istek birleştirme değerlendir.
- Kitaplık sahibi tüm kendi kayıtlarını, ziyaretçi yalnız açık seçimleri görür.
- Profilde açıkça seçilen favoriler; mevcut müzik vitrini korunur.
- Sağlayıcı atıfları görünür; görseller ancak kullanım ve atıf incelemesinden sonra.
- Tek masaüstü koyu akış testi; mobil ve açık tema kapsam dışı.

## Aşama 4 — sosyal genişleme

- Medya paylaşımı, spoiler işaretleme, yorum ve profil/keşfet filtreleri.
- FeedPost'un müzik alanları geriye uyumlu plan olmadan genelleştirilmez.
- Puanlama, öneri algoritması ve oyunlara medya ekleme ayrı kararlar.

## Yayına çıkış kontrolü

Entegrasyon yapılması lisans onayı değildir. TMDB ticari kullanım koşulları,
atıf/logo yükümlülükleri, Open Library veri/görsel hakları ve kaldırma kanalı
yayın modeline göre incelenmeli. Açık API, tüm görsellerin serbest olduğu anlamına
gelmez. Sağlayıcı bağlantısı ve köken bilgisi kayıtla birlikte korunur.

Resmi başvuru kaynakları (23 Eylül 2026):
- https://developer.themoviedb.org/reference/search-movie
- https://developer.themoviedb.org/reference/search-tv
- https://developer.themoviedb.org/docs/faq
- https://openlibrary.org/dev/docs/api/search
- https://openlibrary.org/developers/api
- https://openlibrary.org/developers/licensing
