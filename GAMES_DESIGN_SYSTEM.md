# ListeKutusu Oyunlar Tasarım ve Ürün Standardı

Bu belge ListeKutusu içindeki bütün oyunların aynı ürüne ait görünmesini ve aynı etkileşim dilini kullanmasını sağlayan bağlayıcı sözleşmedir. Tavla ve Şarkı Düellosu mevcut referanslardır; eklenecek her yeni oyun bu kalıba uymalıdır.

Belge yalnız görsel kuralları değil; sayfa yapısını, oyun durumlarını, çok oyunculu davranışı, performans bütçesini, erişilebilirliği ve kalite kapılarını da tanımlar.

## 1. Kapsam ve güncel kararlar

- Güncel geliştirme hedefi masaüstü ve koyu temadır.
- Açık tema ile mobil oyun arayüzü silinmez; ancak masaüstü koyu tema tamamlanana kadar kabul testine dahil edilmez.
- Oyunlar bağımsız bir arcade ürünü gibi görünmemelidir. Profil, sosyal grafik, puan ve müzik keşfiyle ListeKutusu deneyimine bağlı kalmalıdır.
- Bir oyunun kendine özgü sahnesi olabilir; sayfa kabuğu, navigasyon, durum bildirimi ve kontrol dili değişemez.
- Oyun ekranlarında albüm kapağı zorunlu veya merkezi bir görsel unsur değildir. Müzik parçaları metin ve deterministik kapaksız kimlikle temsil edilir.
- Bir oyunun çalışıyor olması tasarım açısından tamamlandığı anlamına gelmez. Bu belgedeki kabul listesi karşılanmadan oyun `available: true` olamaz.

## 2. Ürün ilkeleri

1. **Oyun önce anlaşılır olmalıdır.** Kullanıcı beş saniye içinde sıranın kimde olduğunu ve yapabileceği ana işlemi görebilmelidir.
2. **Sahne, arayüzden güçlüdür.** Ana oyun alanı en geniş yüzeydir; açıklama kartları ve istatistikler sahneyi daraltamaz.
3. **Bir görünümde tek baskın işlem vardır.** Zar at, oyla, odaya katıl veya yeni masa aç gibi ana işlem yalnız bir kez birincil renkle gösterilir.
4. **Yerleşim hamle sırasında değişmez.** Buton, sayaç, oyuncu ve skor alanlarının ölçüsü dinamik metinle kaymamalıdır.
5. **Sunucu otoritedir.** İstemci yalnız niyet gönderir; zar, hamle, oy, zaman aşımı ve kazanan sunucuda doğrulanır.
6. **Hareket anlam taşır.** Animasyon yalnız seçim, taşınma, zar, tur değişimi ve sonuç geri bildirimi için kullanılır.
7. **Sosyal bağ görünürdür.** Oyuncu adı, profil bağlantısı, sıra durumu ve davet görünürlüğü ortak biçimde sunulur.
8. **Dekorasyon performansın önüne geçmez.** Sürekli çalışan efektler tek canvas veya compositor dostu dönüşümlerle sınırlıdır.

## 3. Rota ve sayfa sözleşmesi

Her oyun aşağıdaki rota modelini kullanır:

```text
/games                         Oyun merkezi ve açık odalar
/games/[game]/new              Oda kurma
/games/[game]/[sessionId]      Bekleme, canlı maç ve sonuç
```

Yeni bir oyun için farklı giriş rotası oluşturulmaz. Oyun kuralları veya öğretici gerekiyorsa kurulum sayfasındaki ikincil panelde ya da açılır yardım yüzeyinde gösterilir.

### 3.1 Oyun merkezi

Sıralama değişmez:

1. Ortak `PageTopbar`
2. Kısa oyun merkezi özeti
3. Oynanabilir oyunlar
4. Aktif herkese açık odalar
5. Kullanıcının son oturumları ve istatistikleri

Oyun kartı şu alanları içerir:

- 44 px oyun ikonu
- oyun adı
- en fazla iki satır açıklama
- oyuncu sayısı, ortalama süre ve oda türü
- küçük, gerçek arayüzü temsil eden önizleme
- tek bir ana işlem

Kart bütünü tıklanabilir yapılmazsa ana işlem sağ alt köşede sabit kalır. Aynı kartta hem “Aç” hem “Detay” hem “Nasıl oynanır?” gibi üç eşit buton kullanılmaz.

### 3.2 Oda kurma

Masaüstünde iki kolon kullanılır:

- Sol: oyun ve oda ayarları
- Sağ: seçimin canlı özeti, oyuncu kapasitesi ve görünürlük

Kurulum alanının sırası:

1. Oyun adı ve bir cümlelik amaç
2. Gerekli seçimler
3. Görünürlük: açık veya davet bağlantılı
4. Oyuncu kapasitesi, oyun destekliyorsa
5. `Odayı oluştur` ana işlemi

### 3.3 Bekleme odası

Bekleme odası ana oyun sahnesi başlamadan aynı kabuk içinde gösterilir. Şunlar görünür olmalıdır:

- dolu ve boş koltuklar
- oda görünürlüğü
- davet bağlantısını kopyalama
- oda sahibinde masayı kapatma
- otomatik kapanmaya kalan süre veya açık bir süre açıklaması
- katılabilen kullanıcıda tek bir `Katıl` işlemi

### 3.4 Canlı oyun odası

Canlı oda aşağıdaki sabit katmanlardan oluşur:

```text
PageTopbar
└─ GameShell
   ├─ GameStatusHeader
   ├─ PlayerStrip
   ├─ GameStage
   ├─ PrimaryControls
   └─ OptionalMatchLog
```

`GameStage` dışında kalan katmanlar oyunlar arasında yeniden kullanılır. Oyun sahnesi tam ekran modunda üst ve alt kontrolleri kaybetmez.

### 3.5 Sonuç görünümü

Sonuç, yeni bir sayfaya sıçramak yerine aynı oyun kabuğunda gösterilir. Şunları içerir:

- kazanan veya beraberlik
- kısa sonuç özeti
- oyuna özgü en fazla üç istatistik
- `Yeni oyun` ana işlemi
- `Oyun merkezine dön` ikincil işlemi

Sonuç katmanı tahta veya eşleşmeleri tamamen görünmez yapmamalıdır. Arka plan yalnızca hafifçe sakinleştirilir; kullanıcı son durumu inceleyebilir.

## 4. Masaüstü yerleşim ölçüleri

| Alan | Kural |
| --- | --- |
| Sayfa üst sınırı | Genel oyun merkezi `1280px`, canlı oyun `1480px` |
| Canlı sahne | Uygun olduğunda `min(100%, 1180px)` |
| Dış sayfa boşluğu | En az `24px`, geniş ekranda `32px` |
| Bölüm aralığı | `24px` veya `32px` |
| Panel iç boşluğu | `16px`, yoğun sahnede `12px` |
| Kontrol yüksekliği | Küçük `36px`, standart `44px`, ana işlem `50px` |
| Kart yarıçapı | En fazla `10px`; oyun tahtası fiziksel nesne ise özel çerçeve kullanabilir |
| Oyuncu şeridi | En az `64px`, iki taraf eşit genişlikte |
| Durum üst alanı | `64–72px`, metin değişince büyümez |

İç içe dekoratif kart kullanılmaz. `GameShell` içinde yalnız işlevsel alt yüzeyler çerçeve alabilir.

## 5. Tipografi

Oyunlar genel ürün fontlarını kullanır:

- Gövde: `var(--ui-font-sans)`
- Başlık: `var(--ui-font-display)`

| Rol | Boyut | Ağırlık | Kullanım |
| --- | ---: | ---: | --- |
| Sayfa başlığı | `32px` | 800 | Oyun merkezi veya kurulum |
| Oyun durum başlığı | `20px` | 800 | “Sıra sende”, “Rakip bekleniyor” |
| Bölüm başlığı | `18px` | 800 | Aktif odalar, son oyunlar |
| Kart başlığı | `16px` | 700 | Oyun ve oda adları |
| Gövde | `14px` | 400–600 | Açıklama ve ana bilgi |
| Meta | `12px` | 600–700 | Süre, oyuncu, skor etiketi |
| Buton | `14px` | 700 | Ana ve ikincil işlemler |

Görünür metin `12px` altına inemez. Büyük harf yalnız kısa kicker, durum veya kategori etiketlerinde kullanılabilir.

## 6. Renk ve materyal sistemi

### 6.1 Ana kural

Oyun CSS dosyalarında doğrudan HEX, RGB veya HSL yazılmaz. Renkler `app/styles/tokens.css` içindeki semantik tokenlardan gelir.

Ortak roller:

- Sayfa: `--ui-bg`, `--ui-bg-subtle`
- Panel: `--ui-surface`, `--ui-surface-raised`, `--ui-surface-muted`
- Metin: `--ui-text-strong`, `--ui-text`, `--ui-text-muted`, `--ui-text-subtle`
- Kenarlık: `--ui-border`, `--ui-border-strong`, `--ui-divider`
- Ana işlem: `--ui-primary`, `--ui-primary-hover`, `--ui-primary-soft`
- Sosyal/başarı vurgusu: `--ui-accent`, `--ui-accent-soft`
- Bilgi, başarı, uyarı, hata: ilgili `--ui-*` semantik tokenları

### 6.2 Oyuna özel tokenlar

Her oyun yalnız kendi namespace'i altında sınırlı token tanımlayabilir:

```css
:root {
  --game-example-stage: var(--ui-surface);
  --game-example-piece-a: var(--ui-primary);
  --game-example-piece-b: var(--ui-text-strong);
  --game-example-legal: var(--ui-accent);
}
```

Kurallar:

- En fazla üç vurgu ailesi kullanılır.
- Başarı, hata ve uyarı rengi yeniden tanımlanmaz.
- Oyuncular yalnız renkle ayrılmaz; biçim, ikon, etiket veya desen de kullanılır.
- Oyun materyali ürün paletinden kopuk kahverengi, altın veya neon bir mini tema oluşturamaz.
- Tavla gibi fiziksel nesne benzetiminde doku kullanılabilir; metin ve kontroller yine ana UI tokenlarına bağlı kalır.

## 7. Ortak bileşenler

Yeni oyun eklenmeden önce aşağıdaki ortak bileşenler kullanılmalı veya oluşturulmalıdır:

```text
app/games/components/
  GameShell.tsx
  GameStatusHeader.tsx
  GamePlayerStrip.tsx
  GameConnectionState.tsx
  GameRoomSeats.tsx
  GameInviteActions.tsx
  GameResultOverlay.tsx
  GameMatchLog.tsx
  GameEmptyState.tsx
```

### GameStatusHeader

- Solda kısa kicker ve tek satırlık durum
- Sağda süre, bağlantı ve tam ekran
- Süre 10 saniyenin altına indiğinde renk, ikon ve metin birlikte uyarır
- Bağlantı durumu yalnız renkli nokta değildir

### GamePlayerStrip

- Oyuncular eşit görsel ağırlıktadır
- Kullanıcının kendisi “Sen” etiketiyle belirtilir
- Aktif oyuncu outline ve “Sıra” etiketiyle gösterilir
- Uzun kullanıcı adı alanı büyütmez; güvenli biçimde kısalır

### GameResultOverlay

- Sahneye mutlak konumlanır
- Arka planı en fazla orta düzeyde karartır veya bulanıklaştırır
- Son oyun durumunu incelemeyi engellemez
- Sonuç aksiyonları sahne dışında veya alt sabit alanda kalır

## 8. Durum modeli

Her oyun aşağıdaki kullanıcı durumlarını açıkça tasarlamalıdır:

| Durum | Arayüz davranışı |
| --- | --- |
| `loading` | Boyutu sabit skeleton; boş beyaz alan yok |
| `setup` | Ayarlar ve tek ana oluşturma işlemi |
| `waiting` | Koltuklar, davet ve kapanma bilgisi |
| `active-own-turn` | Ana işlem ve yasal hedefler görünür |
| `active-rival-turn` | Kontroller pasif, rakip ve süre görünür |
| `syncing` | Mevcut state korunur, küçük bağlantı göstergesi |
| `reconnecting` | Kalıcı banner; işlem kilitlenir, sayfa kaybolmaz |
| `conflict` | Güncel state yüklenir ve kısa açıklama gösterilir |
| `completed` | Son durum + sonuç + yeniden oynama |
| `abandoned` | Neden ve yeni oda işlemi |
| `error` | Kullanıcının yapabileceği düzeltici işlem |

Yalnız “Bir hata oluştu” mesajı kabul edilmez. Oda kapanmışsa, sıra geçmişse veya bağlantı kopmuşsa farklı mesaj ve aksiyon gösterilir.

## 9. Etkileşim standardı

- Masaüstünde doğrudan sürükle-bırak desteklenebilir; tıklayarak seçme alternatifi korunur.
- Yasal hamleler sahne geometrisini değiştirmeden işaretlenir.
- İşlem gönderilirken çift tıklama ve ikinci istek engellenir.
- Başarılı küçük işlemler toast üretmek zorunda değildir; sahne değişimi yeterli geri bildirimdir.
- Kritik işlemler, örneğin odadan çekilme veya masayı kapatma, onay ister.
- Yeniden bağlanmada kullanıcının mevcut seçimi güvenilir değilse seçim temizlenir.
- Oyun kontrolü klavyeyle eksiksiz yapılabilir; sürükleme tek yol olamaz.
- Butonlar aynı sırada kalır. Bir kontrol görünmüyorsa yerine boşluk bırakılmaz; kontrol grubu sağa veya sola sıçramaz.

## 10. Hareket ve ses

| Etkileşim | Süre | Kural |
| --- | ---: | --- |
| Hover/focus | `100–160ms` | Renk ve hafif yükselme |
| Seçim | `160ms` | Outline veya ölçek en fazla `%3` |
| Taş/kart yerleşimi | `180–260ms` | Hedefe tek ve okunabilir hareket |
| Zar | `500–800ms` | Sonuç geciktirilmez, animasyon tekrarlanmaz |
| Tur değişimi | `160–220ms` | Oyuncu şeridinde sakin vurgu |
| Sonuç | `220ms` | Sahneyi kapatmayan giriş |

Sürekli pulse yalnız son 10 saniye gibi acil durumda kullanılabilir. `prefers-reduced-motion` altında zar ve yerleşim animasyonları sade geçişe dönüşür.

Ses varsayılan olarak zorunlu değildir. Eklendiğinde:

- kullanıcı tarafından tamamen kapatılabilir,
- kısa ve tek bir materyal ailesine ait olur,
- arka planda sekme açıkken çalmaz,
- sonuç veya hamle doğrulanmadan ses verilmez.

## 11. Çok oyunculu ve zaman standardı

- Aktif oyun state'i sunucuda tutulur.
- Her mutasyon beklenen `revision` ile gönderilir.
- Aynı revision üzerinde iki işlemden yalnız biri kabul edilir.
- Sıra süresi oyuna göre tanımlanır ve sunucu saatiyle hesaplanır.
- Kullanıcı süre dolunca istemci tarafından değil sunucu tarafından kaybettirilir veya turu geçirilir.
- Oyun GET rotası uzun vadede cleanup worker görevi görmez.
- Kısa vadede polling görünür sekmede adaptif, arka planda duraklatılmış olmalıdır.
- Orta vadede tur tabanlı oyunlar için SSE tercih edilir; hamleler normal POST olarak kalır.
- Her oyun yeniden bağlanma ve aynı hesabın iki sekmede açılması durumunu tanımlar.

## 12. Performans bütçesi

Her yeni oyun aşağıdaki bütçeyi korur:

- Oyun dışındaki rotalara oyun CSS'i veya ağır oyun bileşeni gönderilmez.
- Oyun listesi yalnız hafif önizleme bileşeni yükler; motor paketi yüklemez.
- Ana oyun motoru mümkünse sunucu tarafında kalır.
- Sürekli animasyonlar toplamda tek `requestAnimationFrame` döngüsünü aşmaz.
- Canvas DPR değeri en fazla `1.5` olur.
- Görünmeyen sekmede animasyon ve polling durur.
- Aynı oda için eş zamanlı gereksiz fetch başlatılmaz; önceki istek iptal edilir.
- Oyun sahnesindeki büyük listeler veya günlükler sanallaştırılır ya da sayfalanır.
- Yeni bağımlılık eklenmeden önce mevcut kodla çözüm ve bundle etkisi değerlendirilir.

İzlenecek ölçümler:

- oyun sayfası ilk JS ve CSS boyutu,
- ilk oynanabilir ana kadar süre,
- hamle POST p50/p95,
- aktif oda başına dakikalık GET/SSE mesajı,
- reconnect oranı,
- conflict oranı,
- masaüstünde animasyon sırasında uzun görev sayısı.

## 13. Erişilebilirlik

- Bütün görünür metin en az `12px` olur.
- Ana kontroller en az `44x44px` hedef alanına sahiptir.
- Focus göstergesi açık ve koyu yüzeyde görünürdür.
- Renk tek durum sinyali değildir.
- Oyun sahnesinin metin tabanlı özeti bulunur.
- Hamleler anlamlı `aria-live` cümleleriyle duyurulur; yalnız “güncellendi” denmez.
- Sayaç her saniye ekran okuyucuya bağırmaz; 10 ve 5 saniye gibi eşiklerde duyurulur.
- Video veya ses kullanılan oyunda metinsel alternatif bulunur.
- Dekoratif nota, desen ve parçacıklar `aria-hidden` kalır.
- Klavye sırası görsel sırayla aynıdır.

## 14. Dosya ve mimari kalıbı

```text
app/games/[game]/
  new/page.tsx
  [id]/page.tsx
  components/
    [Game]Stage.tsx
    [Game]Controls.tsx
    [Game]Preview.tsx

app/api/games/[game]/
  route.ts
  [id]/route.ts
  [id]/join/route.ts
  [id]/action/route.ts

lib/games/[game]/
  engine.ts
  adapter.ts
  schema.ts
  presentation.ts
  service.ts

tests/
  [game]-engine.test.mjs
  [game]-service.test.mjs
  browser/[game].spec.ts
```

Kurallar:

- React bileşeni oyun kuralı hesaplamaz.
- API route doğrudan üçüncü taraf motor internallerini değiştirmez.
- `schema.ts` kayıtlı state'i sürümlü doğrular.
- `presentation.ts` oyuncuya özel güvenli görünümü üretir.
- `service.ts` transaction ve revision kontrolünü yönetir.
- Oyuna özel CSS, `/games` layout'u altında yüklenir ve token dışında ham renk içermez.

## 15. Yeni oyun tanımı

`GAME_DEFINITIONS` yalnız sunum metni listesi olmamalıdır. Uzun vadede şu sözleşmeyi taşımalıdır:

```ts
type GameDefinition = {
  code: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  durationLabel: string;
  visibilityModes: Array<"public" | "unlisted">;
  turnMode: "simultaneous" | "sequential" | "none";
  turnDurationSeconds: number | null;
  spectatorMode: boolean;
  available: boolean;
};
```

Bu bilgi kurulum sayfası, katalog kartı ve API doğrulamasında aynı kaynaktan kullanılmalıdır.

## 16. Kalite kapıları

### Her dar değişiklikte

- ilgili unit test
- TypeScript typecheck
- değişen dosyada lint

### Birkaç oyun değişikliği biriktiğinde

- bütün oyun unit testleri
- ESLint
- UI static audit
- erişilebilirlik static audit
- masaüstü koyu tema tarayıcı senaryosu

### Oyun yayınlanmadan önce

- temiz kurulum ve production build
- iki bağımsız kullanıcı context'i
- oda açma, katılma, başlama, hamle, conflict, reconnect ve bitiş
- seyirci davranışı destekleniyorsa ayrı context
- düşük hareket tercihi
- klavye ile tamamlanabilir ana akış
- ağ gecikmesi ve kısa bağlantı kesintisi
- oyun dışı rota bundle karşılaştırması

## 17. Tamamlanma ölçütü

Bir oyun ancak aşağıdakilerin tamamı doğruysa bitmiş sayılır:

- [x] Oyun merkezi kartı ortak kalıba uyuyor.
- [x] Kurulum ve bekleme ekranları ortak kabuğu kullanıyor.
- [ ] Bütün kullanıcı durumları tasarlanmış.
- [ ] Ana sahne masaüstünde kaymıyor ve taşmıyor.
- [ ] Birincil işlem her durumda tek ve açık.
- [x] Sunucu bütün hamleleri doğruluyor.
- [x] Revision conflict güvenli biçimde çözülüyor.
- [x] Süre aşımı sunucuda uygulanıyor.
- [ ] Reconnect sonrası state kaybolmuyor.
- [x] Klavye alternatifi var.
- [x] Ham renk ve 12px altı metin yok.
- [ ] Oyun dışı rotalara ağır CSS/JS taşınmıyor.
- [ ] Unit, integration ve masaüstü E2E testleri geçiyor.
- [ ] Sonuç görünümü son oyun durumunu incelemeye izin veriyor.

## 18. Mevcut oyunlar için açık işler

### Ortak altyapı

1. Oyuncu koltukları `GamePlayerSlot`, bekleme ekranlarının ana davet/yenile eylemleri `GameInviteActions` ile ortaklaştırıldı. Oyun içindeki kompakt araç çubuğu eylemleri bağlama özel kalabilir; `GamePageShell`, süre, bağlantı, sonuç, yükleme, boş ve durum bileşenleri hazır.
2. Tamamlandı: `GameSession` integer `revision` kullanıyor; Tavla hamle conflict kontrolü timestamp yerine revision ile yapılıyor.
3. Tavla tamamlandı: yeni kayıtlar şema ve motor sürümü taşıyan envelope ile saklanıyor, eski kayıtlar geriye uyumlu okunuyor. Aynı sözleşmeyi yeni oyun motorlarında baştan uygula.
4. Tamamlandı: görünmeyen/çevrimdışı sekmede duran ortak polling hazır; süre aşımı GET rotalarından ayrıldı ve `maintenance:games` bakım sürecine taşındı.
5. Tamamlandı: genel `GameEvent` modeli ve Tavla'nın kullanıcıya dönük son hareketler günlüğü eklendi.
6. Tamamlandı: `games.css` içindeki ham renkler oyun ve ana UI tokenlarına taşındı; aynı selector/property üzerindeki 144 eski override kaldırıldı.
7. Tamamlandı: 12px altındaki oyun metinleri kaldırıldı.
8. Tamamlandı: iki bağımsız hesap oturumuyla oda açma, katılma, ilk geçerli hamle, revision ve olay eşitlemesini doğrulayan API E2E temeli ve iki ayrı masaüstü tarayıcı context akışı kuruldu.
9. Tamamlandı: katalog, API oyuncu sayısı ve oda görünürlüğü aynı `GameDefinition` sözleşmesinden besleniyor.
10. Tamamlandı: oyunların ilk yükleme hataları ortak düzeltici yüzeye taşındı; sessiz eşitleme hataları mevcut sahneyi kapatmıyor.
11. Tamamlandı: ortak polling aynı oda için üst üste istek başlatmıyor; görünmeyen veya çevrimdışı sekmede durmaya devam ediyor.

### Tavla

1. Tamamlandı: üçüncü taraf motor yalnız `backgammonEngineAdapter.ts` üzerinden çağrılıyor.
2. Tamamlandı: motor paketi doğrulanmış `1.2.5` sürümüne sabitlendi.
3. Tamamlandı: zar, hamle, pas, çekilme, oyuncu katılımı ve zaman aşımı olayları revision'a bağlı maç günlüğüne yazılıyor.
4. Sonuç katmanında tahtanın okunabilirliğini artır.
5. Tamamlandı: iki bağımsız masaüstü tarayıcı oturumuyla sürükle-bırak hamlesinin aynı servis eylemini kullandığı ve rakip ekranda aynı revision/olay kaydına ulaştığı doğrulandı.
6. Zaman aşımı, eş zamanlı hamle ve reconnect senaryolarını test et.

### Şarkı Düellosu

1. Tamamlandı: ortak oda kabuğu, oyuncu koltukları, davet eylemleri ve olay günlüğü kullanılıyor.
2. Video bulunamadığında stabil kapaksız parça kimliği kullan.
3. Birim testte tamamlandı: bütün oyuncular oy vermeden eşleşme ilerlemiyor. Gerçek dört context tarayıcı E2E aşama sonuna kaldı.
4. Eşleşme değişiminde sahne ve buton ölçülerini sabit tut.
5. YouTube sonucunun kaynak ve yerleştirilebilirlik durumunu kullanıcıya açık göster.

## 19. Raporla karşılaştırılmış uygulama durumu

30 Temmuz 2026 raporundan sonra tamamlanan veya iyileştirilen maddeler:

- Tavla hamle süresi, daha rahat oyun testi için geçici olarak sınırsız tutuluyor.
- Bekleyen ve terk edilmiş odalar temizleniyor.
- Tavlada atomik sürükle-bırak hamle eylemi bulunuyor.
- Oyun stilleri `/games` layout'una ayrıldı; oyun dışı rotalarda yüklenmiyor.
- Arka plan nota animasyonu çok sayıda DOM elemanı yerine tek canvas kullanıyor.
- Tavla kuralları ve oda yardımcıları dahil birim test paketi genişletildi.
- Dört oyun rotası aynı `GamePageShell` genişlik ve üst bar sözleşmesini kullanıyor.
- Yükleme, boş durum, oda durumu, bağlantı, hamle sayacı ve sonuç katmanı ortak bileşenlere taşındı.
- Tavla bekleme odası ve Şarkı Düellosu oyuncu koltukları erişilebilir `GamePlayerSlot` bileşeninde ortaklaştırıldı.
- Bekleme durumlarının ana davet ve yenile eylemleri `GameInviteActions` ile aynı ölçü ve metin sözleşmesine bağlandı.
- Oyun polling'i sekme görünürlüğü ve ağ bağlantısına duyarlı tek kancada birleştirildi.
- Tavla hamleleri integer revision ile atomik olarak korunuyor.
- Tavla state'i sürümlü ve geriye uyumlu bir envelope içinde saklanıyor; motor paketi tam sürüme sabitlendi.
- Tavla motoru uygulama kurallarından ayrı bir adapter sınırına taşındı.
- Oyun CSS'inde 12px altı metin kalmadı.
- Oyun CSS'inde ham renk kalmadı; bütün renkler semantik oyun veya ana UI tokenları üzerinden geliyor.
- Statik UI denetimi geçiyor; 1280x720 masaüstü oyun kataloğunda yatay taşma, 12px altı metin ve kart ölçüsü sapması bulunmuyor.
- `GameEvent` ile kalıcı maç olay günlüğü kuruldu; Tavla olayları son hareketler yüzeyinde gösteriliyor.
- Zaman aşımı yan etkileri GET rotalarından çıkarıldı ve ayrı `maintenance:games` worker sürecine taşındı.
- İki gerçek hesap oturumuyla Tavla oda kurma, katılma ve hamle eşitleme E2E senaryosu geçiyor.
- Tavla polling yanıtları revision/status tabanlı `ETag` kullanıyor; değişmeyen oda tam state yerine `304` dönüyor.
- Şarkı Düellosu oda, katılım, gizli oy ve eşleşme sonucu olayları genel `GameEvent` günlüğüne bağlandı; polling de revision/status tabanlı `ETag` kullanıyor.
- Şarkı Düellosu bağlantı kesintisinde mevcut eşleşmeyi koruyor, bağlantı durumunu gösteriyor ve yarım kalan oy/katılım isteğinden sonra güvenli biçimde yeniden eşitleniyor.
- İlk yükleme hataları bütün oyun rotalarında ortak yeniden deneme ve oyun merkezine dönüş yüzeyiyle gösteriliyor.
- Oyun tanımları oyuncu kapasitesi, görünürlük, tur tipi, süre ve seyirci desteği için ortak sözleşme taşıyor; API girişleri bu sözleşmeyle sınırlandırılıyor.

Masaüstü koyu sürüm için yayın engeli olmayan sonraki rapor maddeleri:

1. Kalan selector tekrarlarını bileşen bazında sadeleştirme
2. Revision/ETag fallback korunarak gerçek push altyapısına uygun SSE prototipi
3. Dört oyunculu Şarkı Düellosu için çoklu context tarayıcı E2E testi

## 20. Uygulama sırası

Oyun tarafındaki bir sonraki geliştirme sırası şöyledir:

1. **Görsel temel:** oyun tokenları, 12px altı metinler ve ortak kabuk
2. **Durum güvenliği:** revision, state schema ve conflict yanıtı
3. **Motor sınırı:** tavla adapter'ı ve fixture testleri
4. **Gerçek zaman:** adaptif polling, SSE prototipi ve worker timeout
5. **Deneyim:** hamle günlüğü, sonuç yüzeyi ve reconnect geri bildirimi
6. **Kalite:** iki kullanıcılı masaüstü E2E ve performans bütçesi

Bu sıra tamamlanmadan üçüncü bir oyun eklemek önerilmez. Yeni oyun fikri tanımlanabilir; ancak kodlanması ortak kalıbın oluşmasından sonra başlamalıdır.

## 21. Tavla sahnesi görsel sözleşmesi

Tavla tahtası `modern_dijital_tavla_uygulama_rehberi.md` ve Ağustos 2026 görsel referanslarının ürün içindeki uygulanabilir karşılığıdır. Oyun mantığı bu katmandan bağımsız kalır.

### 21.1 Malzeme ve oranlar

- Tahta yüzeyi gece laciverti, grafit ve kontrollü cyan vurgudan oluşur; ahşap, kahverengi veya yoğun neon tema kullanılmaz.
- Tahta çerçevesi fiziksel bir nesne derinliği verir ancak ince dekoratif çizgilerle bölünmez.
- 24 nokta uzun ve nettir. Açık noktalar sıcak fildişi, koyu noktalar mat petrol/cyan ailesindedir.
- Masaüstü pulları en fazla `44px` çapındadır. Açık pul sıcak fildişi, koyu pul grafit-laciverttir.
- Pullarda üst ışık, iç halka, alt kalınlık ve yumuşak gölge birlikte kullanılır. Düz renk disk kabul edilmez.
- Aynı noktada 1-5 pul fiziksel olarak gösterilir; 6 ve üzeri yığında üstte sayı rozeti kullanılır.

### 21.2 Etkileşim durumları

- Oynanabilir başlangıç pulunda ince cyan halka bulunur.
- Seçili pul yaklaşık `5px` yükselir ve cyan odak halkası güçlenir.
- Boş geçerli hedef cyan halka, dolu geçerli hedef pul çevresiyle gösterilir.
- Vurma hedefi coral/kırmızı halka ve çarpma işareti kullanır.
- Engelli noktalar hedef seçimi sırasında sakinleşir; yalnız renge dayalı yeni bir işaret üretilmez.
- Son hamle amber tonlu düşük yoğunluklu vurgu kullanır ve mevcut yasal hedeflerden daha baskın olamaz.
- Sürükle-bırak tek giriş yöntemi değildir; tıklayarak seçim aynı kurallarla korunur.

### 21.3 Bar, tepsiler ve zarlar

- Orta bar, tahtadan ayrı derin bir kanal gibi görünür. Kırılan pullar üst ve alt oyuncu yönüne göre burada istiflenir.
- Sağ toplama alanında iki bağımsız tepsi bulunur. Her tepsi gerçek pul istifi ve `x/15` sayımı gösterir.
- Zarlar merkezdeki boş oyun alanında, pullarla çakışmayacak sabit bölgede durur.
- Zar yüzeyi grafit, pipler cyan, boyut masaüstünde `48px` olur. Kullanılmış zar hakları görünür biçimde sakinleşir.

### 21.4 Hareket süreleri

| Etkileşim | Hedef süre |
| --- | ---: |
| Pul seçimi | `120-160ms` |
| Pul taşıma | `280-320ms` |
| Hedefe yerleşme | `300-340ms` |
| Zar atışı | `700-800ms` |
| Geçersiz hamle geri dönüşü | `180-240ms` |

Pul hareketi başlangıç ve hedef koordinatları arasında tek bir geçici pul katmanıyla gösterilir. Yerleşim sonrasında gerçek yığın kısa bir settle animasyonu yapar. `prefers-reduced-motion` altında taşıma ve zar animasyonu kapatılır.

### 21.5 Tavla kabul listesi

- [x] İki oyuncu aynı tahta durumunu kendi doğru perspektifinde görür.
- [x] Sıra değişiminde nokta sırası ve pul konumları karışmaz.
- [x] Sürüklemede yalnız üst pul taşınır; tüm sütunun yerel sürükleme hayaleti oluşmaz.
- [x] Bar, vurma, toplama ve çift zar kuralları sunucuda doğrulanır.
- [x] Kaynak, hedef, vurma, engelli ve son hamle durumları birbirinden ayırt edilir.
- [x] Tepsiler `x/15` sayımı ve gerçek istif görünümü sunar.
- [x] Tahta tam ekran modunda oranını korur ve kontroller kaybolmaz.
- [x] Masaüstü koyu tema görsel kontrolü ve iki oyunculu Playwright akışı geçer.
