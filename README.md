# ListeKutusu

ListeKutusu; muzik kesiflerinin paylasildigi, kullanicilarin birbirini takip
edebildigi ve herkesin tek bir kisisel liste yonettigi sosyal muzik uygulamasidir.
Spotify; arama, baglanti ve istege bagli playlist senkronu icin kullanilir.
Uygulama muzik oynatmaz veya Spotify dinleme deneyimini kopyalamaz.

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
