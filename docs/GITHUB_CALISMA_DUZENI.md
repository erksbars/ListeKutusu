# GitHub ve portföy çalışma düzeni

İstenen hesap: `erksbars`. Eski yerel origin `Moooncake020/ListeKutusu` idi;
hedef hesap doğrulanmadan ona push yapılmaz. Git kimlik yöneticisi ile sohbet
GitHub bağlantısı farklı hesaplar kullanabilir; ikisi birbirinin kanıtı değildir.

19 Ekim 2026: kullanıcı tercihi **private**, hedef depo
[erksbars/ListeKutusu](https://github.com/erksbars/ListeKutusu).
Git kimlik yöneticisinde erksbars doğrulandı; Moooncake020 yerel kaydı
kaldırıldı. Sohbet eklentisi ayrı oturumdur. Private deponun kaynak kodu
ziyaretçilere açık değildir; herkese açık portföy vitrini ayrıca planlanabilir.

İlk aktarım `f6b04bb` kaynak anlık kaydıyla yapıldı; önceki dört commit korunur.
GitHub repository owner/private durumu ve `main` uzak SHA eşleşmesi doğrulandı.
`origin` yeni hedef, `previous-origin` yalnız eski adresin korunan kaydıdır.
Kaynak aktarımında 11 değiştirilmiş PNG baseline dışarıda bırakıldı;
çalışma alanından silinmedi. Bu commit'in geçmesi üretim yayını değildir.

## Commit yaklaşımı

1. Bir iş paketini tamamla; riskine göre ilgili test ve tip/lint kontrolünü yap.
2. Diff ve dosya listesini incele. Sırlar, gerçek kullanıcı verisi, DB, log,
   yedek ve üretilen ekran görüntülerini dışarıda bırak.
3. Yalnız doğrulanan dosyaları açık yollarla stage et; önceki kullanıcı
   değişikliklerini ilgisiz bir commit'e katma.
4. Gerçek kapsamı anlatan `feat:`, `fix:`, `refactor:`, `test:` veya `docs:`
   mesajı kullan. Geçmişi yapay günlere bölme, boş katkı üretme.
5. Commit sonrası yalnız doğrulanmış hedefe push et. Force-push veya geçmişi
   yeniden yazma kullanıcı açıkça istemedikçe yapılmaz.

İlk aktarım mevcut geliştirme birikiminin dürüst bir anlık kaydı olabilir;
bu kaydı geriye tarihli çok sayıda commit'e çevirmek geliştirme kanıtı değildir.
Sonraki geliştirmeler tamamlanan gerçek paketlere göre ayrılır. Bu bir günlük
otomasyon veya gözetimsiz çalışma taahhüdü değildir.

## Yayımlama sınırı

Public/private tercihi kullanıcıdan alınır. Public kaynak deposu, uygulamayı
internette çalıştırmak değildir; hosting, production sırları, manuel yayın
kapıları ve sağlayıcı koşulları ayrı kalır. Lisans seçilmediyse açık kaynak
lisansı varmış gibi sunulmaz. Bir kontrolün geçmesi sır içermediğini bütünüyle
garanti etmez; Git geçmişi de ilk push'tan önce incelenmelidir.

Parola/PAT/token sohbet mesajına veya Git remote URL'sine yazılmaz. Hesap
değişimi işletim sisteminin kimlik yöneticisi üzerinden yapılır.
