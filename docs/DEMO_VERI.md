# Yerel topluluk demo verisi

`npm run demo:seed` yalnız yerel SQLite geliştirme ortamına demo verisi
ekler. Önce ayrı SQLite yedeği alır ve dosya imzasını doğrular. Üretim
NODE_ENV, uzak APP_URL veya SQLite dışı veritabanı varsa işlem reddedilir.

İçerik: 8 kurgusal profil, 8 topluluk, 40 üyelik, 32 paylaşım (16 sohbet +
16 inceleme) ve 64 yorum. Müzik/film/dizi/kitap/video oyunu/kutu oyunu,
kurgusal kampüs ve yerel topluluk örnekleri vardır. İncelemeler altı türü
ve spoiler açık/kapalı durumlarını içerir. Yerel/kampüs sohbetleri gerçek
kurum, mekân veya buluşma duyurusu değildir.

Profiller `Demo ·` adı ve açıklamasıyla, topluluklar `(Demo)` adıyla
etiketlidir. Kimlikler `demo-community-v1-` önekiyle sabittir; e-postalar
`example.invalid` alanındadır. Parola, oturum, global admin rolü, Spotify
bağlantısı veya dış servis isteği eklenmez. Bu profillerle giriş yapılamaz;
kendi hesabınla demo topluluklara katılıp içerik yazabilirsin.

Mevcut kullanıcılar, müzik, ana akış ve forum içerikleri değiştirilmez.
Topluluk içerikleri yalnız `/communities` akışındadır; genel akışa otomatik
dağıtılmaz. Henüz uygulanmamış etkinlik sistemi varmış gibi kayıt oluşturulmaz.

Tekrar çalıştırma kayıt çoğaltmaz. Var olan demo kaydındaki kişisel
düzenleme, kaldırma veya uzaklaştırmayı geri almaz (`update: {}`). Ayrılmış
kimlik/slug/e-posta başka kayda aitse transaction bütünüyle geri alınır.
Şema migration'ı gerekmez. Temizleme komutu bu pakette yoktur; daha sonra
yalnız manifestteki kayıtlar hedeflenmeli, gerçek katılımcıların yeni
paylaşımları/yorumları kontrol edilmeden cascade silme yapılmamalıdır.

Yazmadan plan görmek:

`node --env-file=.env --experimental-strip-types scripts/seed-community-demo.mjs`

Dar test: `tests/community-demo.test.mjs` geçici SQLite üzerinde üretim
koruması, çakışma rollback, idempotans ve mevcut kayıtların korunmasını
sınar. `tests/browser/community-demo.spec.ts` yalnız
`COMMUNITY_DEMO_E2E=1`, yerel base URL ve desktop projesinde çalıştırılır;
kalıcı demo verisini sadece okur, ekleme/silme yapmaz.
