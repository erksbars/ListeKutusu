# ListeKutusu Mimari Özeti

## Uygulama katmanları

- `app/`: Next.js App Router sayfaları, route handler'lar ve rota kapsamlı stiller.
- `app/components/`: ortak arayüz bileşenleri.
- `app/hooks/`: istemci etkileşimi ve veri yükleme kancaları.
- `lib/`: iş kuralları, oturum, moderasyon, liste, Spotify ve oyun servisleri.
- `prisma/`: veri modeli ve migration'lar.
- `scripts/`: bakım, doğrulama, yedek ve içerik araçları.
- `tests/`: birim, API E2E ve Playwright masaüstü kontrolleri.

## Veri çekirdeği

Uygulamanın çekirdeği kendi veritabanıdır. Kullanıcı, profil, kişisel liste,
öneri, sosyal paylaşım, yorum, takip, bildirim, forum, moderasyon ve oyun durumu
Prisma modellerinde tutulur. Spotify kimlik doğrulaması uygulamanın ana hesap
sistemi değildir.

## Kimlik ve yetki

- Kullanıcı hesabı e-posta ve parola ile açılır.
- Oturumlar sunucu tarafında saklanan, özetlenmiş token'larla yönetilir.
- Üye, moderatör ve yönetici yetkileri sunucu rotalarında kontrol edilir.
- Mutation rotaları aynı kaynak ve oturum denetiminden geçer.

## Sosyal ve liste akışları

- Akış, forum ve keşfet sorguları sunucu tarafı servis fonksiyonları üzerinden çalışır.
- Her kullanıcının tek kişisel listesi bulunur.
- Spotify yalnız arama, dış bağlantı ve liste sahibi onaylı senkron için kullanılır.
- Toplu içe aktarmada track kimlikleri ayrıştırılır ve tekrarlar temizlenir.

## Oyun altyapısı

- Oyun kataloğu ve API sınırları `lib/games/definitions.ts` sözleşmesini kullanır.
- `GameSession`, `GamePlayer`, `GameEvent`, `GameEntry` ve `GameVote` ortak veri temelidir.
- Tavla motoru adapter sınırının arkasındadır; state sürümlü biçimde saklanır.
- İstemci eşitlemesi revision ve ETag kullanır; görünmeyen/çevrimdışı sekmede polling durur.
- Zaman aşımı yan etkileri `maintenance:games` sürecinde uygulanır.

## Stil yükleme sınırları

- Ortak token ve primitive'ler globaldir.
- Forum stilleri yalnız `/forum` ve forum moderasyonu rotalarında yüklenir.
- Oyun stilleri yalnız `/games` rotalarında yüklenir.
- Yeni ortak bileşen önce `DESIGN_SYSTEM.md` sözleşmesine uymalıdır.
