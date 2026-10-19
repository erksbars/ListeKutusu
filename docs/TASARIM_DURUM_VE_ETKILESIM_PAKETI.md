# ListeKutusu — durum ve etkileşim tasarım paketi

Tarih: 17 Ekim 2026
Durum: **Tasarım önerisi v2; uygulama kodu değişikliği değildir.**

Dayanak: [Faz 0–1 kabuk ve akış paketi](TASARIM_FAZ_0_1_KABUK_VE_AKIS_PAKETI.md).

Sol menü bu pakette çalışma yönüdür; kullanıcının nihai kabuk onayı olarak kaydedilmez. Aynı hiyerarşi üst menü alternatifine de taşınabilir. Masaüstü koyu tema sürer; mobil/açık tema/bağımsız forum askıda kalır.

## 1. Teslim kapsamı ve kanıt sınırı

- Ana akış, topluluk detayı ve kitaplık için dolu, gerçek boş, okuma hatası, giriş gereksinimi, filtre boşluğu ve yükleme görünümleri.
- Yeni inceleme ve mevcut profil düzenleme için birbirinden farklı taslak çıkışları.
- Ortak modal/odak, güvenli giriş dönüşü ve kayıt hatasının taslağı koruması.
- Etkinlik doluluk/katılım tercihi ve özel ajanda sınırları için metin/karar sözleşmesi.
- İlk uygulama paketleri için tasarım bağımlılıkları ve kabul listesi.

Konuşmadaki etkileşimler sentetik örneklerdir. Gerçek giriş, üyelik, eser arama, RSVP, paylaşım veya kayıt isteği gönderilmez; parola veya gerçek kişisel bilgi girilmesi istenmez. Form metni yalnız örneğin açık belleğinde kalır, widget state/URL/localStorage içine yazılmaz. Uygulama kodu/CSS/veri/servis değiştirilmez.

Bu paket yeni tasarımın bütün durumlarını bitirmiş sayılmaz. Profilin tam düzenleyicisi, özel başvuru hedef seçimi, dolu bildirim geçmişi, yönetici rolleri ve oyun lobi/sonuçları sonraki ayrıntı paketindedir. Önceki rapordaki T-01…T-12 kaynak sorunları düzeltilmiş değildir.

## 2. Durum ailesi

| Kod | Anlam | Kaçınılacak yanlış mesaj |
| --- | --- | --- |
| D | Doğrulanmış dolu veri | Örnek sayımı gerçek toplam gibi sunmak |
| B | Veri geldi, görünür kayıt gerçekten yok | Ağ hatasını veya oturum eksikliğini sıfır kayıt saymak |
| H | Okuma isteği başarısız | “Henüz içerik yok”, otomatik yetkisiz ilanı |
| G | Seçilmiş görev için oturum gerekli | Anonim okunabilir tüm sayfayı kapatmak |
| F | Seçili filtrede sonuç yok | “İlk şarkını paylaş” gibi bağlam dışı oluşturma |
| Y | İlk yükleme sürüyor | Sıfır sayaç, kesin başarı veya boş sonuç |

İşlem durumları ayrıca ele alınır: değişmedi → değişti → gönderiliyor → doğrulanmış başarı / hata / sonucu belirsiz. Okuma hatası ve sonucu belirsiz yazma aynı “Tekrar dene” komutuna indirgenmez.

### Renk / yerleşim sözleşmesi

- Normal giriş kapısı nötr yüzeydir; kullanıcı hata yapmış gibi kırmızı gösterilmez.
- Okuma hatası kalıcı banner ve açıklamalı komut taşır. Son doğrulanmış veri varsa korunur ve güncelliği belirsiz olduğu söylenir.
- Veri hiç alınamadıysa banner + yeniden dene; eski liste varmış gibi hayalî içerik gösterilmez. Örnekte hata görünümü bu ikinci ilk-yükleme halini temsil eder.
- Boş ve filtre boşluğu aynı ölçü ailesini kullanır; başlık, gerekçe ve çözüm farklıdır.
- Yükleme başlık/sekme yerini değiştirmez; dekoratif skeleton duyurulmaz, tek “... yükleniyor” durumu vardır.
- Veri gelmeden 0 gösterilmez; dış katalog ve kişisel koleksiyon durumları ayrı kalır.

## 3. Ana akış — AK ailesi

| Ekran | Başlık / bilgi | Baskın adım | Korunan bağlam |
| --- | --- | --- | --- |
| AK-D | Yeni/Takip karma kartlar; tür ve yazar/tarih | Kompakt Oluştur; ilgili kart eylemi | Kapsam/tür/konum |
| AK-B | Henüz görünür paylaşım yok | Toplulukları keşfet | Seçilen içerik türü; müziğe zorlamaz |
| AK-H | Akış yüklenemedi | Yeniden dene | Filtreler; varsa önceki doğrulanmış liste |
| AK-G | Yeni akış okunur; paylaşım/kaydetme için giriş açıklaması | Giriş yap ve buraya dön | Kaynak kart veya seçilmiş görev |
| AK-F | Bu filtrelerle paylaşım bulunamadı | Filtreleri temizle | Ana akış kapsamı |
| AK-Y | Akış yükleniyor | İşlem sunulmaz | Başlık ve kontrol yerleri |

- Yeni/Takip karma; Yükselen/Sana özel mevcut müzik kapsamını taşır. Bu paket öneri algoritmasını genişletmez.
- Anonim okuma açık kalır. Takip veya kişisel kayıtlara geçiş gerekiyorsa yalnız o görev için giriş kapısı açılır.
- Kartta Kaydet eseri kitaplığa eklemez; müzik/topluluk yer imlerinin mevcut sistem sınırları korunur.
- Yeni paylaşım/yorum oluşturan kullanıcıdan önce uygun bağlam/üyelik istenir; genel Oluştur tüm türleri serbestçe her yere yayınlamaz.

## 4. Topluluk detayı — TP ailesi

| Ekran | Başlık / bilgi | Baskın adım | Korunan bağlam |
| --- | --- | --- | --- |
| TP-D | Ad, açık okuma, üyelik; Akış/Etkinlikler | Aktif üyeye paylaşım; üyeye değilse katılma yolu | slug/section/post/event |
| TP-B | Henüz görünür paylaşım yok | Aktif üyeye sohbet/inceleme başlatma | Topluluk; arşiv durumunu aşmaz |
| TP-H | Bu görünüm yüklenemedi | Yeniden dene | Topluluk kimliği, bölüm ve hedef |
| TP-G | İçerik okunur; giriş/aktif üyelik nedeni işlem yanında | Giriş yap ve aynı hedefe dön | Post/event dahil tam görev |
| TP-F | Seçili türde içerik yok | Tür filtresini temizle | Topluluk ve bölüm |
| TP-Y | Topluluk içeriği yükleniyor | İşlem sunulmaz | Bilinen başlık ve bölüm |

- Giriş yapmak üyelik değildir; üyelik de RSVP değildir. Üçü ayrı açık işlemdir.
- “Yalnız topluluk akışında” dağıtımdır, gizli/özel okuma vaadi değildir.
- Arşiv, iptal, kaldırılma ve erişim kaybı ağ hatası gibi sunulmaz. Arşivde yeni paylaşım/üyelik CTA'sı önerilmez.
- Üyelikten ayrılma ayrı tehlikeli onaydır: hedef adı ve mevcut etkinlik tercihlerine etkisi önce görünür.

### Etkinlik detay metinleri

| Hal | Metin / işlem | Sınır |
| --- | --- | --- |
| Katılabilir | Tarih, saat, şehir, mekân, doluluk → Katılacağım / İlgileniyorum | Niyet bildirimi; fiziksel katılım garantisi değil |
| Dolu | Yer kalmadı → uygun kişiye İlgileniyorum | Bekleme listesi veya koltuk sözü verilmez |
| Mevcut attending | Tercihin: Katılacağım → tercihi geri çek | Dolu olsa da mevcut tercih kaybolmaz |
| Geri çekme | Katılım tercihini geri çekmek istiyor musun? | Yeniden katılım o andaki kapasiteye bağlı |
| Topluluktan ayrılma | Topluluktan ayrıl ve katılım tercihlerimi geri çek | Genel Onayla altında RSVP etkisi gizlenmez |
| İptal / geçmiş / arşiv | Nedene özel açıklama → ilgili keşif/ajandaya dönüş | Yeni katılım veya otomatik canlanma yok |

Ajanda özeldir; etkinliğin kendisi sırf ajandada diye özel olmaz. Konum/katılımcı gösterimi mevcut yetki sınırını genişletmez. Etkinlik detayından ajandaya dönüşte tarih/ilişki filtresi korunur.

## 5. Kitaplık — KT ailesi

| Ekran | Başlık / bilgi | Baskın adım | Korunan bağlam |
| --- | --- | --- | --- |
| KT-D | Seçilen türün koleksiyonu; aynı yerleşim | Şarkı/Dizi/Film/Kitap ekle | type ve liste konumu |
| KT-B | Henüz [bu türde] eser eklemedin | Aynı türde ilk eser ekle | Katalog seçimi ayrı açılır |
| KT-H | [Seçilen tür] yüklenemedi | Yeniden dene | Tür; kayıt silindi denmez |
| KT-G | Koleksiyonunu yönetmek için giriş yap | Giriş yap; ikincil keşfe dön | Aynı type; pasif/kırmızı arama formu yok |
| KT-F | Bu filtrelerle eser bulunamadı | Filtreleri temizle | Seçili tür; koleksiyon gerçekten boş denmez |
| KT-Y | Koleksiyon yükleniyor | İşlem sunulmaz | Tür sekmeleri; sıfır adet yok |

- Müzik listesi yönetimi hesap sahibine aittir; mevcut profil/liste/Spotify görünürlüğü bu tasarımla değiştirilmez.
- Dizi/film/kitap kaydı ve okuma/izleme durumu özel; açık vitrin seçimi ayrıca isteğe bağlıdır. Dört türe ortak “Her şey sadece sana özel” etiketi yok.
- Koleksiyon ana alanda, ekleme aynı konumda. Spotify/import/öneri yalnız müziğin ikincil araçlarıdır.
- “Koleksiyonumda ara” ile “Katalogda ara” aynı input değildir. Medyada yeni koleksiyon arama/sıralama ayrı uygulama işidir; örnekteki filtre boşluğu hedef durumu temsil eder, hazır servis iddiası değildir.
- Katalog kapalı ise “Bu katalog şu anda kullanıma açık değil”; boş arama veya ağ arızası gibi gösterilmez. Bu, kullanıcının saklı kayıtlarının kaybolması anlamına gelmez.

## 6. Ortak giriş dönüşü örneği

1. Anonim kişi açık içeriği okur veya özel koleksiyona ulaşır.
2. Oturum gerektiren açık eylem seçilir; modal neden ve dönüş hedefini söyler.
3. Örnekte gerçek hesap/parola formu yok; yalnız girişin tamamlandığı hal yerel olarak canlandırılır.
4. Aynı ekran/tür/hedefe dönülür. Görev otomatik uygulanmaz; “Aynı yere döndün, işlemi yeniden seç” bilgisi görünür.
5. Hedef artık yoksa sessiz ana sayfa yönlendirmesi yerine uygun açıklama ve çıkış sunulmalıdır.

Uygulama aşamasında güvenli yerel dönüş URL'si, oturum/üyelik/izin yeniden kontrolü, query/hash ve browser geçmişi kapsamı test edilecek. Örnek gerçek oturum güvenliğini doğrulamaz.

## 7. Taslak koruma — iki ayrı sözleşme

### Yeni inceleme: iki seçenek

- Son eylem **Yayınla**; taslak kaydetme özelliği varmış gibi **Kaydet** sunulmaz.
- Değişiklik varsa menü/geri/çıkış aynı korumayı açar.
- Başlık: “İncelemeyi bırakmak istiyor musun?”
- Açıklama: “Yayınlamadığın değişiklikler silinecek. Taslak olarak kaydedilmez.”
- Eylemler: **Düzenlemeye dön** / **Taslağı bırak ve ayrıl**.
- Onay ekranında yayınlama yok. Escape ve dış alana tıklama düzenlemeye döner.

### Mevcut profil düzenleme: üç seçenek

- Başlık: “Profil değişiklikleri kaydedilmedi”.
- Açıklama: “Değişikliklerini kaydedebilir veya son kayıtlı profilini koruyarak ayrılabilirsin.”
- Eylemler: **Düzenlemeye dön** / **Kaydetmeden ayrıl** / **Kaydet ve ayrıl**.
- Kaydet ve ayrıl yalnız doğrulanmış başarıda hedefe geçer.
- Hata: “Profil kaydedilemedi. Değişikliklerin bu ekranda duruyor.”
- Hata modal içinde kalır; editör metni korunur. Yeniden deneme veya düzenlemeye dönme vardır.
- Alan hatası alanın yanında; ilgili alana odaklanılır. Değişiklik yoksa gereksiz onay açılmaz.

### Ortak kurallar

- İlk odak güvenli seçenek; iptal açan kontrole döner. Dialog açıkken global menü de etkileşimsizdir.
- Aynı anda tek etkin modal; onay üstüne ikinci onay yığılmaz.
- Kaydetme sürerken ikinci komut, çıkış ve istemsiz kapatma engellenir.
- Ayrılma onayını kapatmak metni silmez. Bilinçli bırakma yalnız mevcut taslağı bırakır; daha önce kaydedilmiş veriyi silmez.
- Form metni kalıcı tarayıcı deposu, URL veya konuşma durumuna aktarılmaz. Yenileme/sekme kapamada geri geleceği söylenmez.
- Örnekte asenkron kayıt bir yerel gecikmeyle canlandırılır; gerçek sunucu sonucu ve idempotency doğrulanmış değildir.

## 8. Ortak bileşen sözlüğü

| Aile | Varyantlar | Tasarım kabulü |
| --- | --- | --- |
| Sayfa başlığı | Liste / okuma / özel yönetim | Tek h1; bağlam ve ana görev açık |
| İçerik kartı | Müzik / sohbet / inceleme / etkinlik | Yazar ve tarih → içerik → ilgili aksiyon; tür farkı korunur |
| Durum yüzeyi | Boş / filtre boş / giriş / ağ hatası | Başlık, neden ve gerçek sonraki adım farklı |
| Skeleton | Akış kartı / topluluk / koleksiyon | Son yerleşime yakın, sabit sayı iddiası yok |
| Form geri bildirimi | Dirty / alan hatası / ağ hatası / başarı | Renge veya geçici toast'a bağımlı değil |
| Modal | Bilgi / karar / giriş dönüşü | Tek katman, odak ve güvenli kapatma |
| Onay | İki seçenek / üç seçenek / tehlikeli etki | Hedef ve kesin fiil; genel Onayla yok |

## 9. Uygulama sınırı ve bağımlılıklar

Bu pakette hiçbir aşağıdaki iş uygulanmış sayılmaz:

1. Global kabuk/scroll ve modal portal hatalarının kapanışı.
2. SPA genelinde taslak geçiş koruması.
3. URL/giriş dönüşü ve kaynak hedeflerin taşınması.
4. Medyada kayıt içi filtre/arama; birleşik bookmark API'si.
5. Ağ reddi/sonuç belirsizliği ve tekrar gönderim güvenliği.
6. Gerçek profil önizleme modeli veya özel başvuru hedef temizliği.

Görsel uygulama sırası: ortak durum ailesi + modal/odak → kabuk/scroll → taslak/giriş dönüşü → ana akış/topluluk/kitaplık. P1 davranışlar bütün modüller boyandıktan sonraya bırakılmaz. İş mantığı/izin/dağıtım değişikliği gerekirse ayrıca adlandırılır; CSS işi içinde gizlenmez.

## 10. Tasarım kabul listesi

Dar doğrulama: betik sözdizimi, ağ isteği ve kalıcı taslak deposu içermemesi kontrol edildi. Seçilmiş ekranlar ve kitaplık boş/hata/giriş halleri; iki/üç seçenekli ayrılma, Escape, kayıt hatasında metin koruma ve girişten aynı etkinliğe dönüş tarayıcıda denendi. 1024 px konuşma önizlemesindeki kitaplık hata görünümünde yatay taşma yok ve tek görünür h1 var. Bu, 18 durumun tamamı için görsel/klavye kabulü veya canlı uygulama regresyonu değildir. Geniş test/build, gerçek oturum ve mobil/açık tema matrisi çalıştırılmadı.

- [x] Üç ekran ailesinin altı ana durumu örneklendi.
- [x] Yeni inceleme ile profil düzenlemenin çıkış dili ayrıldı.
- [x] Giriş sonrası aynı hedef ve yeniden açık işlem örneklendi.
- [x] Hata, gerçek boş, filtre boş ve oturum eksikliği metinleri ayrıldı.
- [x] Etkinlik kapasite/niyet ve müzik/medya gizlilik sınırları belgelendi.
- [ ] Kullanıcı kabuk ve ayrıntı yönünü nihai olarak onayladı.
- [ ] Her modülde gerçek hesap/rol/veri ile uygulama doğrulandı.
- [ ] Bütün uzun içerik/klavye/odak/reduced-motion matrisi tamamlandı.
- [ ] Gerçek API kayıt hatası, oturum kaybı ve tekrar gönderim güvenliği sınandı.

Sonraki tasarım paketi: profil/editörün gerçekçi önizleme ve görünürlükleri; özel başvuruda hedef değişimi; bildirim ve yönetim aileleri; oyun lobi/reconnect/sonuç. Ardından bütün ekranlar için tasarımdan uygulamaya geçiş listesi tekleştirilecek. Teknik/yayın kapıları bu çalışma ile kapanmaz.

Takip çıktısı: [İleri ekranlar ve uygulama devri](TASARIM_ILERI_EKRANLAR_VE_UYGULAMA_DEVRI.md). Bu ailelerin ilk ayrıntı/etkileşim örnekleri ve tek iş sırası hazırlandı; bütün görsel/ürün kabullerinin tamamlandığı anlamına gelmez.
