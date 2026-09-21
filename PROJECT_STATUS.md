# ListeKutusu Güncel Durum

Son doğrulama: 11 Ağustos 2026

## 21 Eylül 2026 — ortak sosyal kabuk

- Ana akış, Keşfet, forum, profil, paylaşım ayrıntısı ve oyun rotaları
  `app/(social)` grubuna taşındı; dış URL'ler korundu.
- Masaüstü bölüm navigasyonu ortak layout'ta kalıcıdır; sayfaya özgü başlıklar
  ve işlemler içerik katmanında kalır. Mobil kapsam askıdadır.
- Bu paket yalnız typecheck, statik UI kontrolü ve tek masaüstü navigasyon
  senaryosuyla doğrulanır; aşağıdaki geniş test sonuçları tarihsel kayıttır.

## Aktif ürün kapsamı

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
