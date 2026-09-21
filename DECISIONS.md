# ListeKutusu Karar Günlüğü

## D-001: Masaüstü koyu tema aktif kapsamdır

Mobil ve açık tema silinmemiştir ancak masaüstü koyu deneyim istenen seviyeye
ulaşana kadar bu alanlarda kapsamlı çalışma ve test yapılmaz.

## D-002: Ürün çekirdeği Spotify değildir

Sosyal içerik, profiller, listeler, forum ve puanlar kendi veritabanında tutulur.
Spotify arama, bağlantı ve isteğe bağlı liste senkronu için entegrasyondur.

## D-003: Her kullanıcının tek kişisel listesi vardır

Bir kullanıcı adına sınırsız oda/listeler açılmaz. Davet koduyla öneri toplama
kişisel liste panelinde ikincil bir özellik olarak kalır.

## D-004: Oyun puanı satın alınamaz

Premium plan görsel kişiselleştirme ve reklamsız deneyim sağlayabilir; rekabetçi
puan veya oyun avantajı sağlamaz.

## D-005: Şimdilik ETag polling kullanılır

Tur tabanlı oyunlarda revision/ETag polling yeterli ve test edilmiştir. Gerçek
push/SSE ancak mevcut fallback korunarak ve ölçülmüş ihtiyaçla eklenir.

## D-006: Oyunlar ortak sözleşmeye uyar

Yeni oyun, ortak kabuk, oda sözleşmesi, hata durumları, oyuncu koltukları,
bağlantı durumu ve masaüstü ölçülerini kullanmadan yayınlanmaz.

## D-007: Eski raporlar aktif bağlam değildir

`docs/archive/` geçmiş kararları korur ancak normal geliştirmede okunmaz.
Güncel gerçekler `PROJECT_STATUS.md`, açık işler `ROADMAP.md` içindedir.
