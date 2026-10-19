# SQLite kurtarma ve sınırlı yük provası

Bu araçlar yerel pilot kanıtıdır; üretim kapasitesi, RPO/RTO, yayın onayı
veya canlı veritabanını değiştirme yetkisi değildir. Sunucu ve işçi açık kalabilir.
Node 24 ve repodaki üretilmiş Prisma istemcisi kullanılır. Mobil/UI değişmez.

## Güvenli geri yükleme provası

Repo kökünde:

```powershell
npm run db:rehearse-restore
```

Sade SQLite `file:` DATABASE_URL, Prisma şemasının klasörüne göre çözülür.
Kaynak read-only açılır; `VACUUM INTO` tutarlı bağımsız snapshot oluşturur.
Bu WAL'daki commit'leri de içerir; çalışan DB'nin yalnız ana dosyasını ham
kopyalama yaklaşımı kullanılmaz. Yeni `backups/rehearsal-<uuid>.db` korunur;
eski yedekler budanmaz, kaynak değiştirilmez ve hedef üzerine yazılmaz.

Önceden alınmış yedek için:

```powershell
npm run db:rehearse-restore -- --backup backups/rehearsal-YEDEK_KIMLIGI.db
```

Bu argüman kapatılmış, bağımsız bir yedek dosyası olmalıdır; canlı/WAL kullanan
DB'yi `--backup` ile vermek yerine argümansız snapshot yolunu kullan.
Araç otomatik en yeni dosyayı tahmin etmez. Query parametreli DATABASE_URL
desteklenmez; hata verir, bağlantı seçeneğini sessizce atmaz.

Her koşu yalnız kendi `tmp/restore-rehearsal-*` klasörünü açar:

1. Yedeği read-only `integrity_check` ve `foreign_key_check` ile sınar.
2. Şema ve tüm normal tabloların (migration metadata'sı dahil) satırlarını
   sıralı SHA-256 parmak iziyle karşılaştırır. Unicode, BLOB ve büyük integer
   korunur; aynı satır sayısına güvenilmez. İçerik ve parmak izleri loglanmaz.
3. Mevcut olmayan geçici hedefe exclusive kopyalar; aynı kaynak/hedef veya
   mevcut/boş hedef üzerine yazmaz. Kopya içeriği yedekle eşleşmelidir.
4. Yalnız kopyada transaction açıp geçici tablo/insert dener, rollback yapar;
   ardından içerik/şemayı tekrar karşılaştırır.
5. Prisma schema diff ile kopyanın mevcut uygulama şemasına uyumunu sınar.
   Sağlam ama eski şemalı yedek `compatibleSchema=false` ve kod 1 verir.
   Otomatik migration veya canlı geri yükleme yapmaz.
6. Kendi geçici kopyasını temizler. Yedek dosyasını ve canlı DB'yi korur.

JSON sayılar, doğrulama sonuçları, süre ve yedek dosya adını verir. Kod 0
tüm adımlar başarılı; 1 hata/uyumsuzluk. Kopya kaynakla eşit olsa bile şema
uyumsuzluğu başarı değildir. Büyük DB'de tüm tablo taraması/sıralaması disk
ve CPU kullanır; küçük yerel kanıt sınırsız veri için süre garantisi değildir.
Yedekler oturum/sır/kişisel veri içerir: ignored olmak şifreleme değildir;
dosya ACL, şifreleme, dış ortama yedekleme ve saklama politikası ayrıca gerekir.

## Sentetik servis yükü

```powershell
npm run db:probe-load
```

Veritabanı hedefi/argüman kabul etmez. DATABASE_URL'e bağlanmaz; yalnız yeni
`tmp/sqlite-load-*` içinde kendi migration'lı DB'sini oluşturur. Gerçek veri
kopyalanmaz. Sabit kapsam: 81 sentetik hesap, 200 paylaşım, üç etkinlik;
1/4/8 eşzamanlı görev ve sekiz ayrı Prisma istemcisi (istemci başına tek bağlantı).
Her aşamada 24 koltuğa 80 farklı katılım denemesi ve araya serpiştirilmiş
40 topluluk/etkinlik detay okuması vardır. İş kuralları gerçek servislerdir.

24 kabul/56 kapasite reddi, DB'de 24 kayıt ve beklenmedik hata olmaması
zorunludur. 409 kapasite reddi beklenen sonuçtur; hata diye saklanmaz.
Tüm mutation denemeleri, kabul edilenler, kapasite retleri ve okumalar ayrı
p50/p95/max ölçülür. Ölçüm aktif görevin içindeki süreyi (servis retry dahil)
kapsar; henüz başlamamış görevin kuyrukta beklemesini kapsamaz. Servis çağrısı
sayısı/saniye HTTP QPS veya eşzamanlı gerçek kullanıcı sayısı değildir.

Okuma yolları ölçüm öncesi ısıtılır. Sonunda 12 topluluk bütünlük kontrolü
çalışır; tutarsızlık/beklenmedik hata kod 1 yapar. Süreler bilgi amaçlıdır;
bu makineye göre keyfî bir p95 eşiği yayın engeli olarak konmadı. Yalnız
bu koşunun sentetik DB'si sonunda temizlenir. Dış sağlayıcı çağrısı yoktur.

## 17 Ekim 2026 yerel ölçüm

Windows, Node v24.18.0, i7-13620H; SQLite journal_mode=delete. Tek kısa
koşu, tek Node süreci; HTTP/auth/ağ/SSR, outbox teslimi ve uzun süreli yük yok.

| Eşzamanlı görev | Okuma p95 | Tüm RSVP denemeleri p95 | Kabul edilen RSVP p95 | Toplam aşama |
| --- | ---: | ---: | ---: | ---: |
| 1 | 3,39 ms | 5,36 ms | 5,83 ms | 443 ms |
| 4 | 3,92 ms | 153,73 ms | 32,17 ms | 497 ms |
| 8 | 5,55 ms | 325,73 ms | 48,84 ms | 541 ms |

Üçünde de kapasite tam 24, ret 56, beklenmedik hata ve bütünlük uyarısı 0.
8 görevde en uzun mutation denemesi 541,02 ms; retler de kilit alır/rollback
yapar. Eşzamanlılık arttıkça kuyruk/kilit gecikmesi artıyor; daha çok bağlantı
otomatik daha çok kapasite sağlamıyor. Küçük örneklemden pilot kullanıcı
sayısı veya üretim SLA'sı çıkarılmaz. Journal ayarı bu ölçüm için değiştirilmedi.

Güncel snapshot geri dönüşünde 39 tablo/920 satır eşleşti, FK/bütünlük ve
yazma rollback temiz, mevcut şema uyumlu. İlk snapshot+prova 445 ms; aynı
yedekten ikinci bağımsız prova 425 ms. Süre gerçek kesinti RTO'su değildir.

## Üretime geçmeden önce

- Beklenen trafik/hedef gecikme ve veri büyüklüğünü belirle; ayrı staging'de
  tekrarlı, daha uzun HTTP + worker ve burst ölçümü yap. Canlı DB'yi yük hedefi yapma.
- WAL/PostgreSQL seçimini ayrı ölçümle değerlendir. Bu paket gerçek DB'de
  journal modu, indeks, timeout veya sağlayıcı değiştirmez.
- Uygulama açılışı, kimlik doğrulama ve ilgili kullanıcı akışlarını geri
  yüklenmiş staging üzerinde ayrıca doğrula; SQL içerik eşitliği E2E değildir.
- Gerçek kurtarmada yazıcıları/işçileri durdurma, tutarlı son yedek,
  migration sürümü, geri dönüş noktası ve yeniden başlatma sırasını ayrıca
  planla. Canlı dosyayı değiştirmek ayrı açık kullanıcı yetkisi gerektirir.
- Off-host şifreli yedek, düzenli prova, kabul edilen veri kaybı süresi,
  saklama/silme politikası ve üretim süreç gözetimi/dış alarm hâlâ açık işlerdir.
