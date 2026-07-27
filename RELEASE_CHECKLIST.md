# ListeKutusu yayin kontrol listesi

## Zorunlu

- `APP_URL` ve `SPOTIFY_REDIRECT_URI` ayni HTTPS origin adresini kullanmali.
- `SESSION_SECRET` ve `ADMIN_LOGIN_KEY` farkli, rastgele degerler olmali.
- Spotify callback adresi gelistirici panelinde birebir tanimli olmali.
- `npm run deploy:check`, `npm run db:backup`, `npm run db:verify-backup` ve `npm run db:check` basarili olmali.
- Paylasilacak kaynak arsivi yalnizca `npm run package:source` ile uretilmeli; klasor dogrudan ZIP'lenmemeli.
- CI tarayici kurulumu `npm run test:browser:install` ile tamamlanmali.
- SQLite kullaniliyorsa tek uygulama sunucusu ve kalici disk kullanilmali.
- Reverse proxy HTTPS, guvenli Host basligi ve duzenli yedek aktarimi saglamali.

## Operasyon

- `npm run maintenance:cleanup` her gun calistirilmali.
- Yedekler uygulama sunucusu disinda ikinci bir konuma aktarilmali.
- `/api/health` izlenmeli; 503 durumunda alarm uretilmeli.
- Yonetici hesabi ve Spotify owner baglantisi yalnizca yetkili kiside olmali.

## Acik beta siniri

- E-posta dogrulama ve sifre sifirlama bir e-posta saglayicisi baglanana kadar yoktur.
- Bu iki ozellik tamamlanmadan uygulama kapali/acik beta olarak sunulmali; genis halka acik lansman yapilmamalidir.
- Kullaniciya destek e-postasi ve gizlilik sorumlusu iletisim bilgisi eklenmelidir.
