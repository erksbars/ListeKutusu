# ListeKutusu Doğrulama Politikası

Amaç, hatayı erken yakalarken her küçük değişiklikte pahalı test matrisini
çalıştırmamaktır.

## Değişiklik türüne göre kontrol

### Metin veya küçük CSS değişikliği

- Yalnız ilgili dosyayı incele.
- Gerekliyse `npm run typecheck` çalıştır.
- Görsel kontrol yalnız yerleşim gerçekten değiştiyse yapılır.

### Dar bileşen değişikliği

- İlgili birim veya Playwright testini çalıştır.
- İlgili rotada masaüstü koyu tema kontrolü yap.

### API veya iş mantığı değişikliği

- İlgili birim testini ve `npm run typecheck` komutunu çalıştır.
- Oturum veya veri akışı değiştiyse ilgili E2E senaryosunu çalıştır.

### Dört ila altı birikmiş geliştirme adımı

- `npm run lint`
- `npm run typecheck`
- Etkilenen birim ve browser testleri

### Büyük aşama sonu

- `npm run build`
- `npm test`
- `npm run ui:check`
- `npm run a11y:check`
- Masaüstü koyu tema Axe ve görsel baseline kontrolleri

## Masaüstü performans bütçesi

`npm run test:browser:performance` ana akış, forum ve oyunlar rotalarını koyu
tema masaüstü projesinde ölçer. Yatay taşma, CLS, DOM düğümü, kaynak sayısı ve
boyutu, uzun ana iş parçacığı görevleri ile ısınmış gezinme süresi sınırlandırılır.
Geliştirme derlemesi sonucu etkilemesin diye rota önce bir kez ısıtılır.

`npm run test:browser:games` iki oturumlu Tavla ile dört oturumlu Şarkı Düellosu
senaryolarını birlikte çalıştırır.

Production sunucusu yerel HTTP üzerinde test edilirken güvenli oturum çerezi
tarayıcı tarafından otomatik saklanmaz. Oyun browser testleri kayıt yanıtındaki
çerezi yalnız test bağlamına yükler; ürünün `Secure` çerez politikası değiştirilmez.

## Şimdilik çalıştırılmayacak matrisler

- Mobil Playwright projeleri.
- Açık tema görsel baseline ve kapsamlı kontrast matrisi.

## Çalışma ilkeleri

- Çalışan geliştirme sunucusunu gereksiz yere yeniden başlatma.
- Production build'i küçük CSS veya metin değişikliklerinde çalıştırma.
- Tam repo taramasını yalnız mimari veya güvenlik incelemesinde yap.
- Ekran görüntüsünü yalnız tasarım kararı vermek gerektiğinde üret.
- Hata görülürse toplu doğrulama zamanını beklemeden ilgili dar testi çalıştır.
