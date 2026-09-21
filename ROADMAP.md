# ListeKutusu Aktif Yol Haritası

Bu dosya yalnız açık işleri tutar. Tamamlanan işlerin özeti `PROJECT_STATUS.md`
dosyasındadır.

## Aktif masaüstü deneyim aşaması

1. Ana akış ve Keşfet'in ilk görünür içeriğini server-first veri sınırına taşı;
   etkileşimli filtre ve aksiyonları küçük client bileşenlerinde bırak.
2. Forum, profil ve oyun merkezi sayfalarında ortak içerik başlangıç çizgisi,
   maksimum genişlik ve bölüm boşluğu tokenlarını tamamla.
3. Büyük istemci sayfalarını sorumluluklarına göre bölerek rota JavaScript yükünü azalt.
4. Dört ila altı masaüstü geliştirme paketi sonunda production build, koyu tema
   görsel rotalar ve performans bütçesini toplu doğrula.

## Sonraki ürün aşaması

1. Gerçek kullanıcı yüküyle ürün analitiği olaylarını ve gizlilik sınırlarını tasarla.
2. ETag polling korunarak SSE veya başka bir push taşıma katmanını prototiple.
3. PostgreSQL geçiş planı ve veri taşıma provasını hazırla.
4. E-posta doğrulama ve parola sıfırlama sağlayıcısını seç.

## Ertelendi

1. Açık tema yeniden tasarımı ve kontrast matrisi.
2. Mobil yerleşim, mobil navigasyon ve dokunma testleri.
3. Üretim anahtarlarını yenileme, HTTPS ve dağıtım ortamı operasyonları.

## Görev kabul ölçütü

- Kullanıcı akışı çalışır; hata, boş ve yükleme durumları görünürdür.
- İlgili dar test geçer.
- UI değişikliğinde yalnız etkilenen masaüstü koyu rota görsel olarak kontrol edilir.
- Büyük aşama sonunda `TESTING.md` içindeki toplu kontrol uygulanır.
- Güncel durum değişmişse `PROJECT_STATUS.md` tek seferde güncellenir.
