# ListeKutusu

İlgi alanlarını keşif, kişisel kitaplık ve topluluk buluşmalarıyla birleştiren
masaüstü öncelikli bir sosyal uygulama. Müzik, dizi, film ve kitap listeleri;
incelemeler, topluluk akışı ve etkinlik katılımı aynı ürün içinde geliştirilir.

> Geliştirme aşamasındaki portföy projesidir; canlıya hazır ürün veya tamamlanmış
> güvenlik/erişilebilirlik kabulü iddiası değildir. Aktif çalışma koyu masaüstü
> deneyimidir; mobil, açık tema ve bağımsız forum geliştirmesi ertelenmiştir.

## Teknik özet

- **Arayüz:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS ve ortak tasarım tokenları.
- **Veri:** Prisma ve SQLite; sunucuda oturum, yetki ve içerik görünürlüğü kontrolleri.
- **Entegrasyonlar:** Spotify, YouTube, TVmaze, Wikidata ve Open Library.
- **Kalite:** Node.js birim testleri, Playwright + Axe, tip/lint ve statik UI denetimleri.

Spotify arama, dış bağlantı ve isteğe bağlı liste senkronu içindir; uygulama
müzik akışı sunmaz. Dizi/film/kitap katalogları metadata içindir; eserlerin
tam içeriği sunulmaz. Sağlayıcı erişimi, atıf ve yayın koşulları ayrı değerlendirilir.

## Ürün akışları

- Müzik, sohbet, inceleme ve etkinlikleri ayıran karma akış ve filtreli keşif.
- Müzik/dizi/film/kitap bölümleriyle kişisel kitaplık ve seçime bağlı profil vitrini.
- Topluluk üyeliği, inceleme puanı/spoiler, etkinlik konumu/kapasitesi ve katılım niyeti.
- Bildirim gruplaması, içerik moderasyonu ve özel platform başvuruları.
- Ortak masaüstü menüsü, hata/boş/yükleme durumları ve desteklenen formlarda taslak koruması.

Güncel tamamlanan ve açık işler [proje durumunda](PROJECT_STATUS.md), tasarım
uygulamasının kabul sınırları [devir belgesinde](docs/TASARIM_ILERI_EKRANLAR_VE_UYGULAMA_DEVRI.md).
Önizleme ekranları henüz canlı demo değildir; yayın adresi mevcutsa ayrıca belirtilir.

## GitHub ve geliştirme geçmişi

Doğrulanan, anlamlı iş paketleri ayrı commit edilir. Sahte tarihli veya yalnız
katkı grafiğini doldurmak için boş commit üretilmez. Gizli anahtarlar, yerel
veritabanları, loglar ve test çıktıları yayımlanmaz.
[Commit ve yayın düzeni](docs/GITHUB_CALISMA_DUZENI.md).

## Proje belgeleri

Günlük geliştirmede bütün raporları okumak yerine şu sıra kullanılır:

1. `PROJECT_STATUS.md`: çalışan kapsam ve son doğrulama durumu
2. `ROADMAP.md`: yalnız açık ve ertelenen işler
3. `DESIGN_SYSTEM.md`: ortak arayüz sözleşmesi
4. `GAMES_DESIGN_SYSTEM.md`: oyun arayüzü ve ürün standardı
5. `ARCHITECTURE.md`: veri, API ve servis sınırları
6. `DECISIONS.md`: değiştirilmeden önce bilinmesi gereken kararlar
7. `TESTING.md`: değişiklik büyüklüğüne göre kontrol sıklığı

`docs/archive/` altındaki belgeler tarihsel referanstır ve normal geliştirme
bağlamına yüklenmez.

Pilot öncesi salt okunur toplu kontrol: `npm run pilot:check`.

Gerçek veriye dokunmadan ayrı yerel HTTP+worker provası:
`npm run pilot:rehearse-http`. [Kapsam ve sınırlar](docs/HTTP_ISCI_PROVASI.md).
Otomatik kontrollerin geçmesi yayın onayı değildir; üretim yapılandırması ve
manuel kanıt kapıları ayrı tutulur. [Pilot ön kontrol kılavuzu](docs/PILOT_ON_KONTROL.md).

Tasarım öncesi teknik kapanış: `pilot:rehearse-recovery`,
`pilot:build-isolated`, şifreli yedek/doğrulama, `runtime:check` ve
kurulmamış süreç örnekleri hazırdır. [Komutlar ve gerçek yayın sınırları](docs/TEKNIK_KAPANIS_VE_YAYIN.md).

## Mevcut kapsam

- E-posta ve sifreyle tek kullanici hesabi
- Sosyal sarki akisi, notlar, etiketler, begeniler ve takip
- Aylik kullanici ve liste liderligi
- Kisisel profil ve tema ayarlari
- Kisisel liste, istek onayi ve liste kontrolu
- Spotify playlist senkronu ve harici kopyalama baglantisi
- Bildirimler, sikayet ve yonetici moderasyonu
- Bildirim tercihleri, engellenen hesaplar ve acik oturum yonetimi
- Kisisellestirilmis akis, Kesfet merkezi, basarimlar ve gunluk hedefler
- Rate limit, oturum korumasi ve temel guvenlik basliklari

## Kurulum

Önkoşul: Node.js 24 ve npm. `.env.example` yalnız örnek değerler içerir;
gerçek değerleri yerel `.env` dosyasına gir. Migration komutu hedef veritabanını
değiştirir; canlı veya mevcut veri üzerinde çalıştırmadan önce yedek al.

```bash
npm install
copy .env.example .env
npx prisma migrate deploy
npm run dev
```

Uygulama `http://127.0.0.1:3000` adresinde acilir. Spotify owner baglantisi
icin `/admin` sayfasini kullan.

## Kontroller

```bash
npm run typecheck
npm run lint
npm run check:env
npm run check:env:production
npm test
npm run test:unit
npm run test:smoke
npm run test:browser
npm run build
```

`test:smoke`; ana rotalari, API erisimini, oturum korumasini, 404 ekranini,
veritabani sagligini ve guvenlik basliklarini kontrol eder.

`test:browser`; dokuz ana rotayi acik/koyu tema ve masaustu/mobil boyutlarda
Playwright + Axe ile denetler. Yerelde Edge kullanilir. CI kurulumu icin once
`npm run test:browser:install` calistirilir; CI'da tasinabilir Chromium kullanilir.

## Kaynak paketi

Projeyi `.env`, yerel veritabani, `node_modules`, `.next`, log veya yedeklerle
birlikte ZIP'lememek icin:

```bash
npm run package:source
```

Komut proje klasorunun yaninda temiz bir `playlist-app-source-*.zip` uretir.
Ayrintili kullanim ve paketi alan kisinin temiz kurulum adimlari
`SOURCE_PACKAGE.md` dosyasindadir.

## Veritabani yedegi

SQLite veritabaninin tutarli bir anlik yedegini almak icin:

```bash
npm run db:backup
npm run db:verify-backup
npm run maintenance:cleanup
```

Yedekler `backups/` altina yazilir ve en yeni 20 yedek tutulur. `backups/`
dizini uygulama kodundan ayri, erisim kontrollu bir depoya da aktarilmalidir.
Yedek komutu dosya boyutunu ve SQLite imzasini dogrulamadan basarili sayilmaz.
`db:verify-backup` en yeni yedegi ayri veritabani olarak acar, SQLite butunluk
kontrolunu ve temel tablo okumalarini gerceklestirir.

`maintenance:cleanup`, suresi dolmus/iptal edilmis oturumlari ve 180 gunden eski
okunmus bildirimleri temizler. Tek sunuculu kurulumda bu komut gunluk zamanlanabilir.

Canli oyunlarda 30 saniyelik hamle suresini sayfa goruntuleme isteklerinden bagimsiz
uygulamak icin web sunucusunun yaninda ayri bir bakim sureci calistirilir:

```bash
npm run maintenance:games
```

Bu surec varsayilan olarak 20 saniyede bir zaman asimlarini kontrol eder. Process
manager kullaniliyorsa web ve `maintenance:games` iki ayri, yeniden baslatilabilir
surec olarak tanimlanmalidir. Kontrol araligi `GAME_MAINTENANCE_INTERVAL_MS` ile
degistirilebilir; 5000 ms altindaki degerler kabul edilmez.

## Uretim notlari

Yayin oncesi zorunlu kontroller:

```bash
npm run deploy:check
npm run db:backup
npm run start:production
```

`deploy:check` uretim ortam degerlerini, tipleri, lint kurallarini, birim
testlerini ve production build'i kontrol eder. `start:production` bekleyen Prisma
migration'larini uyguladiktan sonra Next.js sunucusunu baslatir.

- `.env` degerlerini kaynak kod deposuna ekleme.
- `SESSION_SECRET` ve `ADMIN_LOGIN_KEY` icin uzun, rastgele degerler kullan.
- Uygulamayi HTTPS arkasinda calistir.
- Duzenli yedek ve geri yukleme testi planla.
- Buyume basladiginda SQLite yerine yonetilen PostgreSQL kullan.
- E-posta dogrulama ve sifre sifirlama uretim acilisindan once eklenmelidir.

Yayin kontrol listesi icin `RELEASE_CHECKLIST.md` dosyasini kullan.
