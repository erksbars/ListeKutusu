# Kaynak paket oluşturma

Projeyi paylaşırken klasörü Dosya Gezgini üzerinden doğrudan ZIP'leme. Bu yöntem `.env`, yerel veritabanı, eski `.next` çıktısı, Windows için üretilmiş `node_modules`, log ve test sonuçlarını pakete taşıyabilir.

Proje kökünde şu komutu çalıştır:

```powershell
npm run package:source
```

Komut proje klasörünün yanında zaman damgalı bir `playlist-app-source-*.zip` üretir. Paket yalnız kaynak kodunu, Prisma şemasını, testleri, genel belgeleri ve `.env.example` dosyasını içerir.

Paket özellikle şunları içermez:

- `.env` ve gerçek anahtarlar
- `node_modules`
- `.next`
- SQLite veritabanları
- `backups`
- loglar
- Playwright rapor ve test çıktıları

Paketi alan kişi temiz kurulum yapmalıdır:

```powershell
npm ci
npm run build
```

`npm ci` sonundaki `postinstall` komutu Prisma istemcisini paketin açıldığı işletim sistemi için yeniden üretir.
