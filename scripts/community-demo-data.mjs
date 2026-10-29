export const DEMO_PREFIX = "demo-community-v1";
const people = ["Deniz", "Ece", "Arda", "Selin", "Mert", "Duru", "Bora", "İpek"];
export const demoUsers = people.map((name, index) => ({
  id: `${DEMO_PREFIX}-user-${index + 1}`, slug: `demo-topluluk-${index + 1}`,
  email: `${DEMO_PREFIX}-${index + 1}@example.invalid`, ownerName: `Demo · ${name}`,
  playlistName: `${name}'in demo listesi`, bio: "Kurgusal demo profilidir. Gerçek bir kullanıcıyı temsil etmez.",
  profileStatus: "Demo profil · Örnek içerik", favoriteGenres: JSON.stringify(index % 2 ? ["indie", "elektronik"] : ["alternatif", "caz"]),
}));

// Editorial mock copy only: no scraped reviews, live provider calls or real meetups.
const topics = [
  ["muzik", "Albüm Kulübü", "interest", "Albüm dinleme alışkanlıkları, yeni keşifler ve müzik incelemeleri.",
    ["Bir albümü baştan sona mı dinlersiniz?", "Şarkı listeleri arasında dolaşırken albüm bütünlüğünü kaçırdığımı fark ettim. Siz ilk dinlemede nasıl bir yol izliyorsunuz?"],
    ["Çalışırken sözlü müzik dikkatinizi dağıtıyor mu?", "Ben enstrümantal kayıtlarla daha rahat odaklanıyorum. Çalışma ve dinlenme listelerinizi ayrı tutuyor musunuz?"],
    ["music", "In Rainbows", 9, false, "Katmanlar arasında kaybolmadan dinlemek", "Albümün sakin bölümleriyle hareketli parçaları arasında dengeli bir geçiş var. Her dinleyişte farklı bir enstrümanı takip etmek hoşuma gidiyor."],
    ["music", "Discovery", 8, false, "Tekrar dinlenebilir bir albüm", "Melodiler ilk dinlemede akılda kalıyor. Benim için albümün güçlü yanı parçaların tek başına da bütünün içinde de çalışabilmesi."]],
  ["film", "Film Günlüğü", "interest", "İzlediğimiz filmleri, anlatım tercihlerini ve farklı yorumları konuşuyoruz.",
    ["Filmden sonra hemen yorum okuyor musunuz?", "İlk izlenimimi yazmadan başkalarının yorumlarına bakmamaya çalışıyorum. Böylece hangi ayrıntının gerçekten bana ait olduğunu daha iyi ayırabiliyorum."],
    ["Sinemada mı evde mi izlemek?", "Salon deneyimi ile evde durdurup ayrıntılara bakmak arasında kalıyorum. Türüne göre izleme tercihiniz değişiyor mu?"],
    ["movie", "Arrival", 9, false, "Bilim kurguda sakin anlatım", "Büyük bir gösteriden çok iletişim ve atmosfer üzerine kurulan anlatımı sevdim. Film bittikten sonra bazı sahnelere yeniden dönme isteği bırakıyor."],
    ["movie", "Inception", 8, true, "Final üzerine bir yorum", "Finalde kesin bir cevap aramaktan çok karakterin neye odaklandığını düşündüm. Açık uçlu bitişin filmin ana duygusunu tamamladığını düşünüyorum."]],
  ["dizi", "Dizi Molası", "interest", "Bölüm yorumları, sezon değerlendirmeleri ve izleme alışkanlıkları.",
    ["Haftalık bölüm mü, bütün sezon mu?", "Haftalık izlediğimde ayrıntıları daha çok tartışıyorum. Bütün sezonu peş peşe izlemek ise hikâyeye kapılmayı kolaylaştırıyor."],
    ["Yarım bıraktığınız dizilere dönüyor musunuz?", "Bir diziye ara verdikten sonra karakterleri unutabiliyorum. Kısa not almak veya sezon özeti izlemek sizde işe yarıyor mu?"],
    ["tv", "Dark", 9, true, "Zaman çizgilerini takip etmek", "Karakterlerin farklı zamanlardaki seçimleri yan yana gelince hikâye daha anlamlı oluyor. Bazı bağlantıları kaçırmamak için kendi küçük notlarımı tuttum."],
    ["tv", "Better Call Saul", 9, false, "Karakter odaklı anlatının gücü", "Küçük kararların birikimini izlemek dizinin en güçlü tarafı. Yavaş ilerleyen sahnelerde bile karakterler hakkında yeni bir ayrıntı fark ediliyor."]],
  ["kitap", "Kitap Arası", "interest", "Okuma günlükleri, kitap incelemeleri ve okuma rutini sohbetleri.",
    ["Okurken not alıyor musunuz?", "Sayfa kenarına yazmak yerine kısa bir okuma günlüğü tutuyorum. Yıllar sonra kitaptan bende ne kaldığını görmek güzel oluyor."],
    ["Aynı anda kaç kitap okuyorsunuz?", "Kurgu ile kurgu dışını birlikte okumak bende işe yarıyor. Benzer türde iki romana başladığımda karakterleri karıştırabiliyorum."],
    ["book", "Küçük Prens", 8, false, "Yeniden okumanın farkı", "Kısa olmasına rağmen farklı yaşlarda farklı ayrıntılar öne çıkıyor. Bu okumada özellikle yetişkin alışkanlıklarına dair bölümler dikkatimi çekti."],
    ["book", "Dune", 9, false, "Dünya kurmanın ayrıntıları", "Kültür ve çevre arasındaki bağ hikâyeye derinlik katıyor. Başlangıçtaki yoğun kavramlar biraz sabır istese de ilerledikçe birbirini tamamlıyor."]],
  ["oyun", "Oyun Defteri", "interest", "Video oyunları, oyuncu deneyimleri ve farklı oyun tasarımları.",
    ["Kısa oyunları mı uzun oyunları mı tercih ediyorsunuz?", "Son dönemde birkaç akşamda tamamlanabilen oyunlar arıyorum. Uzun oyunları seviyorum ama ara verdiğimde geri dönmek zorlaşıyor."],
    ["Zorluk ayarını değiştirmek deneyimi etkiler mi?", "Hikâyeyi görmek istediğimde ayarı düşürmekten çekinmiyorum. Bazı oyunlarda ise mekanikleri öğrenmek benim için asıl eğlence oluyor."],
    ["game", "Hades", 9, false, "Tekrarın sıkıcı olmaması", "Kısa denemeler farklı kombinasyonları keşfetmeyi teşvik ediyor. Başarısız bir denemeden sonra bile yeni bir şey öğrenmiş hissetmek motivasyonu koruyor."],
    ["game", "Stardew Valley", 8, false, "Kendi hızında oynamak", "Küçük hedefler koyarak oynamak rahatlatıcı. Her şeyi en verimli biçimde yapmaya çalışmadığımda oyunla kurduğum bağ daha keyifli oluyor."]],
  ["kutu", "Masa Etrafında", "interest", "Kutu oyunu incelemeleri, kurallar ve yeni oyuncular için öneriler.",
    ["Yeni başlayanlara hangi türleri önerirsiniz?", "İlk masada kuralları kısa sürede anlatılabilen bir oyun seçmek istiyorum. İş birliği mi rekabet mi yeni oyuncular için daha rahat bir başlangıç oluyor?"],
    ["Kuralları anlatmanın en iyi yolu", "Bütün kuralları baştan okumak yerine örnek bir tur göstermeyi tercih ediyorum. Oyun başlamadan herkesin hedefi anlaması bence daha önemli."],
    ["boardgame", "Catan", 8, false, "Masadaki pazarlığın etkisi", "Oyuncular arasındaki konuşmalar oyunun temposunu belirliyor. Kaynak dengesi kadar masadaki anlaşmaları da takip etmek gerekiyor."],
    ["boardgame", "Azul", 9, false, "Basit kurallarda zor seçimler", "Kurallar kolay öğreniliyor ama her turda anlamlı seçimler var. Kısa süreli bir oyunda plan yapmak ve rakibin ihtiyacını takip etmek güzel dengelenmiş."]],
  ["kampus", "Örnek Kampüs Kulübü", "university", "Kurgusal üniversite topluluğu. Gerçek bir kuruma bağlı değildir; yalnız demo içeriğidir.",
    ["Kampüs kulübünde hangi içerikleri konuşalım?", "Demo sohbet: film, kitap ve oyun konularını ayrı başlıklarda konuşmak katılımı kolaylaştırabilir. Siz ortak akışta nasıl bir düzen tercih ederdiniz?"],
    ["Kulüp tanışması için fikirler", "Demo sohbet: ilk tanışmada herkesin sevdiği bir eser üzerinden konuşması güzel olabilir. Bu bir gerçek etkinlik veya katılım çağrısı değildir."],
    ["movie", "Whiplash", 8, false, "Performans ve baskı", "Film başarı fikrini tartışmaya açacak güçlü bir atmosfer kuruyor. Ses ve kurgu tercihleri karakterlerin baskı altında olduğunu hissettiriyor."],
    ["book", "Dönüşüm", 8, true, "Ailenin değişen tavrı", "Karakterin durumundan çok çevresinin ona yaklaşımındaki değişim dikkatimi çekti. Son bölümlerdeki mesafe anlatının en rahatsız edici yanlarından biri."]],
  ["semt", "Örnek Semt Sohbetleri", "local", "Kurgusal yerel topluluk. Yer, kişiler ve buluşma fikirleri demo amaçlıdır; gerçek etkinlik yoktur.",
    ["Semt topluluğunda ne paylaşmak isterdiniz?", "Demo sohbet: kitap önerileri, oyun fikirleri ve kültür sohbetleri aynı toplulukta toplanabilir. Kesin konum veya kişisel adres paylaşmadan nasıl keşif yapılabilir?"],
    ["Kutu oyunu masası için başlangıç fikirleri", "Demo sohbet: küçük bir grupta kolay öğrenilen oyunlardan başlamak güzel olabilir. Etkinlik kartlarında kapasiteyi ve oyuncu deneyimini belirtmek masaya katılmayı kolaylaştırır."],
    ["boardgame", "Ticket to Ride", 8, false, "İlk masaya uygun bir oyun", "Oyuncular hedeflerini kolay anlayabiliyor. Harita üzerinde alternatif yollar düşünmek ve başkasının planını izlemek oyunu canlı tutuyor."],
    ["music", "Kind of Blue", 9, false, "Sakin bir dinleme deneyimi", "Enstrümanların birbirine alan bırakması dinlemeyi rahatlatıyor. Her parçaya ayrı odaklanınca küçük geçişler daha belirgin hale geliyor."]],
];

export const demoCommunities = topics.map(([key, name, category, description], index) => ({
  id: `${DEMO_PREFIX}-community-${key}`, slug: `demo-${key}-toplulugu`, name: `${name} (Demo)`,
  description: `${description} Kurgusal demo verisidir.`, category, ownerId: demoUsers[index].id,
  interest: ["music", "movie", "tv", "book", "game", "boardgame", "other", "other"][index],
  universityName: index === 6 ? "Örnek Üniversite (Demo)" : null,
  city: index === 6 ? "Eskişehir" : index === 7 ? "İstanbul" : null,
  rules: "Demo topluluğudur. Saygılı konuş, kişisel bilgi paylaşma; spoiler içeren incelemeleri işaretle ve başlığa spoiler yazma.",
}));
export const demoMembers = demoCommunities.flatMap((community, index) => Array.from({ length: 5 }, (_, offset) => ({
  communityId: community.id, userId: demoUsers[(index + offset) % demoUsers.length].id,
  role: offset === 0 ? "owner" : offset === 1 ? "moderator" : "member", status: "active",
})));
export const demoPosts = topics.flatMap((topic, index) => topic.slice(4).map((item, offset) => {
  const community = demoCommunities[index];
  const review = offset >= 2;
  return { id: `${DEMO_PREFIX}-post-${index + 1}-${offset + 1}`, communityId: community.id,
    authorId: demoUsers[(index + offset) % demoUsers.length].id,
    title: review ? item[4] : item[0], body: review ? item[5] : item[1],
    type: review ? "review" : "discussion", reviewKind: review ? item[0] : null,
    subjectTitle: review ? item[1] : null, rating: review ? item[2] : null, spoiler: review ? item[3] : false,
    sourceUrl: null, distribution: offset === 1 ? "community" : "general", hoursAgo: .5 + index * 4 + offset * .8,
  };
}));
export const demoComments = demoPosts.flatMap((post, index) => [
  "Bu açıdan düşünmemiştim; kendi deneyimimle karşılaştırmak güzel oldu.",
  "Bence farklı beklentilerle yaklaşınca yorumlar da değişiyor. Bu başlığı takip edeceğim.",
].map((body, offset) => ({
  id: `${DEMO_PREFIX}-comment-${index + 1}-${offset + 1}`, postId: post.id,
  authorId: demoMembers.filter(member => member.communityId === post.communityId)[(index % 4 + offset + 1) % 5].userId,
  body, hoursAgo: Math.max(1, post.hoursAgo - 2 - offset),
})));
