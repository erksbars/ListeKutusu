import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000);

const profiles = [
  {
    key: "editor",
    slug: "listekutusu-editor",
    ownerName: "ListeKutusu Editör",
    playlistName: "Editörün Seçkileri",
    bio: "Albüm notları, sahneler ve tekrar dönmeye değer parçalar.",
    favoriteGenres: ["alternatif", "trip hop", "indie", "elektronik"],
    profileTheme: "aurora",
  },
  {
    key: "studio",
    slug: "studyo-notlari",
    ownerName: "Stüdyo Notları",
    playlistName: "Kayıt Odası",
    bio: "Kayıt, miks ve düzenlemede işe yarayan küçük ayrıntılar.",
    favoriteGenres: ["trip hop", "elektronik", "ambient", "soul"],
    profileTheme: "ocean",
  },
  {
    key: "stage",
    slug: "sahne-rehberi",
    ownerName: "Sahne Rehberi",
    playlistName: "Sahne Öncesi",
    bio: "Prova odasından konser çıkışına müzisyenlerin ortak not defteri.",
    favoriteGenres: ["rock", "post punk", "blues", "alternatif"],
    profileTheme: "violet",
  },
];

const tracks = [
  {
    profile: "editor",
    id: "67Hna13dNDkZvBpTXRIaOJ",
    name: "Teardrop",
    artist: "Massive Attack, Elizabeth Fraser",
    album: "Mezzanine",
    durationMs: 330773,
    note: "Katman sayısını artırmadan yoğun bir atmosfer kurulabileceğini hatırlatan bir parça.",
    tags: ["trip hop", "gece", "atmosfer"],
    hoursAgo: 2,
  },
  {
    profile: "studio",
    id: "2sW8fmnISifQTRgnRrQTYW",
    name: "Roads",
    artist: "Portishead",
    album: "Dummy",
    durationMs: 303973,
    note: "Boşluk, kırılgan vokal ve kontrollü dinamizmin prodüksiyonda nasıl birlikte çalıştığına iyi bir örnek.",
    tags: ["trip hop", "vokal", "prodüksiyon"],
    hoursAgo: 6,
  },
  {
    profile: "editor",
    id: "4wajJ1o7jWIg62YqpkHC7S",
    name: "Weird Fishes / Arpeggi",
    artist: "Radiohead",
    album: "In Rainbows",
    durationMs: 318186,
    note: "Tekrarlayan gitarların küçük değişimlerle nasıl sürekli ileri hareket hissi verdiğini dinleyin.",
    tags: ["alternatif", "gitar", "ritim"],
    hoursAgo: 11,
  },
  {
    profile: "stage",
    id: "6WK9dVrRABMkUXFLNlgWFh",
    name: "Enjoy the Silence",
    artist: "Depeche Mode",
    album: "The Singles 86-98",
    durationMs: 255133,
    note: "Güçlü bir melodinin sade düzenleme içinde ne kadar büyük duyulabileceğine dair zamansız bir ders.",
    tags: ["synth pop", "melodi", "klasik"],
    hoursAgo: 18,
  },
  {
    profile: "stage",
    id: "1lbXEepatjRVjoG8pZMtdp",
    name: "Dreams",
    artist: "Fleetwood Mac",
    album: "Greatest Hits",
    durationMs: 254453,
    note: "Ritim bölümünün şarkıyı öne çıkmadan taşıdığı, grupça çalmayı anlamak için değerli bir kayıt.",
    tags: ["rock", "ritim", "grup"],
    hoursAgo: 27,
  },
  {
    profile: "studio",
    id: "1NeLwFETswx8Fzxl2AFl91",
    name: "Something About Us",
    artist: "Daft Punk",
    album: "Discovery",
    durationMs: 232666,
    note: "Efektli vokal ve sıcak armonilerin duyguyu mekanikleştirmeden bir arada kalabildiği bir kayıt.",
    tags: ["elektronik", "soul", "prodüksiyon"],
    hoursAgo: 35,
  },
  {
    profile: "editor",
    id: "39CFOvYse9fcMhIwyS73Fl",
    name: "Into My Arms",
    artist: "Nick Cave & The Bad Seeds",
    album: "The Boatman's Call (2011 - Remaster)",
    durationMs: 256120,
    note: "Söz, yorum ve birkaç temel akorun gösterişli bir düzenlemeye ihtiyaç duymadan taşıdığı ağırlık.",
    tags: ["söz yazımı", "piyano", "ballad"],
    hoursAgo: 44,
  },
  {
    profile: "editor",
    id: "2X485T9Z5Ly0xyaghN73ed",
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    durationMs: 467586,
    note: "Uzun formda tekrarın sıkıcılığa değil dönüşüme hizmet etmesi için güçlü bir referans.",
    tags: ["psikedelik", "elektronik", "uzun form"],
    hoursAgo: 57,
  },
  {
    profile: "studio",
    id: "3yFnoUHlZhekoGsFsMFDqN",
    name: "Friday Morning",
    artist: "Khruangbin",
    album: "Con Todo El Mundo",
    durationMs: 410900,
    note: "Enstrümanların birbirine alan bıraktığı, ton kadar susmanın da düzenlemenin parçası olduğu bir kayıt.",
    tags: ["groove", "enstrümantal", "minimal"],
    hoursAgo: 70,
  },
  {
    profile: "editor",
    id: "2o49Twc3qrNMOt8gq9W06L",
    name: "Pictures Of You - Remastered",
    artist: "The Cure",
    album: "Disintegration (Deluxe Edition)",
    durationMs: 448306,
    note: "Uzun bir girişin güçlü bir kimlik ve duygusal yön taşıdığında dinleyiciyi nasıl içeride tutabildiğine iyi bir örnek.",
    tags: ["post punk", "atmosfer", "gitar"],
    hoursAgo: 84,
  },
];

const threads = [
  {
    profile: "editor",
    slug: "album-dinleme-aliskanligi-neden-geriliyor",
    category: "genel",
    title: "Albüm dinleme alışkanlığı neden tekli yayınların gerisinde kaldı?",
    body: "Tekli yayın takvimi, algoritmik listeler ve kısa içerik alışkanlığı albümü baştan sona dinleme pratiğini geri plana itti. Buna rağmen bazı kayıtlar ancak şarkı sırası, geçişler ve ortak atmosferle anlam kazanıyor. Sizce albüm formatı gerçekten zayıflıyor mu, yoksa yalnızca onu keşfetme biçimimiz mi değişti? Son dönemde baştan sona dinlediğiniz bir albümü ve sizi içeride tutan ayrıntıyı paylaşın.",
    views: 96,
    hoursAgo: 216,
  },
  {
    profile: "studio",
    slug: "ev-studyosunda-ilk-iyilestirme-akustik-mi-monitor-mu",
    category: "ev-studyosu",
    title: "Ev stüdyosunda ilk iyileştirme: akustik mi, monitör mü?",
    body: "Küçük bir odada çalışanların çoğu önce daha iyi monitör düşünürken odanın erken yansımaları ve bas birikmesi verilen kararları ciddi biçimde etkiliyor. Yaklaşık 12 metrekare bir odada temel yerleşim dışında tek bir bütçe kalemi seçilecek olsa emici paneller, bas tuzağı, ölçüm mikrofonu veya monitör yükseltmesi arasında nasıl bir sıra izlenmeli? Deneyimlerinizi oda ölçüsü ve dinleme mesafesiyle birlikte konuşalım.",
    views: 82,
    hoursAgo: 180,
  },
  {
    profile: "stage",
    slug: "gitar-tonunda-daha-az-gain-neden-ise-yariyor",
    category: "amfi-pedal",
    title: "Gitar tonunda daha az gain neden çoğu zaman daha iyi sonuç veriyor?",
    body: "Evde tek başına çalarken dolgun gelen yüksek gain, grup içinde pena atağını ve orta frekansları örterek gitarı geriye itebiliyor. Çift gitar kaydında bu etki daha da büyüyor. Tonu inceltmeden gain azaltmak için amfi, boost, gitar ses potu ve sağ el dinamiği arasında nasıl bir denge kuruyorsunuz? Özellikle prova ile kayıt arasında ayar değiştirenlerin yaklaşımını merak ediyorum.",
    views: 74,
    hoursAgo: 144,
  },
  {
    profile: "editor",
    slug: "kulak-egitimi-icin-yirmi-dakikalik-rutin",
    category: "muzik-teorisi",
    title: "Kulak eğitimi için sürdürülebilir 20 dakikalık günlük rutin",
    body: "Aralık, akor ve melodi duyma çalışmaları uzun programlar yüzünden birkaç hafta sonra bırakılabiliyor. Her gün yalnızca 20 dakika ayırabilen biri için şarkı üzerinden çıkarım, aralık tanıma, ritim tekrarı ve kısa dikte arasında nasıl bir dağılım daha sürdürülebilir olur? Uygulama skorundan çok gerçek müzik içinde duyduğunuzu fark ettiren yöntemleri ve ilerlemeyi nasıl takip ettiğinizi paylaşalım.",
    views: 61,
    hoursAgo: 110,
  },
  {
    profile: "stage",
    slug: "ilk-konser-oncesi-prova-ve-sahne-kontrol-listesi",
    category: "sahne-deneyimi",
    title: "İlk konser öncesi prova ve sahne kontrol listesi",
    body: "İlk konserlerde heyecandan çok hazırlık eksikleri sorun çıkarıyor: şarkılar arasındaki sessizlikler, yedek kablo, sahne yerleşimi, monitör talepleri ve kısa line check planı genellikle son ana kalıyor. Küçük bir mekânda 30-40 dakikalık set çalacak grup için prova haftasından sahneye çıkış anına kadar hangi kontrol listesini önerirsiniz? Özellikle gereksiz ekipman taşımadan güvenli kalmanın yollarını derleyelim.",
    views: 53,
    hoursAgo: 76,
  },
  {
    profile: "editor",
    slug: "bir-sarkiyi-ilk-otuz-saniyede-neden-birakiyoruz",
    category: "beste-soz-yazimi",
    title: "Bir şarkıyı ilk 30 saniyede bırakmamıza ne sebep oluyor?",
    body: "Girişin uzunluğu tek başına belirleyici değil; merak duygusu, ses seçimi, ritmik vaat ve vokalin ilk cümlesi de dinleyicinin kalıp kalmamasını etkiliyor. Bazı parçalar hemen nakarata ihtiyaç duymadan bizi içeri alabiliyor. Sizce güçlü bir açılış neyi doğru yapıyor? Sevdiğiniz bir şarkının ilk 30 saniyesini düzenleme, söz veya prodüksiyon açısından çözümleyerek örnekleyin.",
    views: 47,
    hoursAgo: 38,
  },
];

const replies = [
  {
    thread: "album-dinleme-aliskanligi-neden-geriliyor",
    profile: "studio",
    body: "Bence format değil, giriş kapısı değişti. Bir tekli üzerinden sanatçıyı keşfedip albüme geçen dinleyici hâlâ var; sorun platformların bu geçişi teşvik etmemesi. Albüm sayfasında şarkılar arası bağlamı ve sanatçının kısa notunu görünür kılmak dinleme niyetini güçlendirebilir.",
  },
  {
    thread: "album-dinleme-aliskanligi-neden-geriliyor",
    profile: "stage",
    body: "Canlı performans tarafında albüm sıralamasının hâlâ etkisini görüyorum. İyi kurulmuş bir kayıt, set akışını düşünmek için de referans oluyor; tempo ve tonalite geçişleri tek tek şarkılardan daha fazla şey öğretiyor.",
  },
  {
    thread: "ev-studyosunda-ilk-iyilestirme-akustik-mi-monitor-mu",
    profile: "editor",
    body: "Önce ücretsiz yerleşim denemeleri, ardından ilk yansıma noktalarına geniş bant emilim daha mantıklı. Monitör yükseltmesi oda davranışını düzeltmediği için aynı belirsizliği daha ayrıntılı duyurabiliyor. Ölçümü de kulak kararının yerine değil, sorunun yerini doğrulamak için kullanmak gerek.",
  },
  {
    thread: "gitar-tonunda-daha-az-gain-neden-ise-yariyor",
    profile: "studio",
    body: "Kayıtta iki kat gitar varsa tek başına biraz kuru gelen ton çoğu zaman toplamda doğru oluyor. Gain azaltıp orta frekansı korumak, palm mute sırasında dip gürültüsünü de ciddi biçimde azaltıyor. Tonu tek başına değil davul ve basla birlikte ayarlamak en hızlı kontrol yöntemi.",
  },
  {
    thread: "kulak-egitimi-icin-yirmi-dakikalik-rutin",
    profile: "studio",
    body: "Beş dakika ritim tekrarı, beş dakika tek sesli melodiyi enstrümanda bulma, beş dakika bas notasından akor niteliği çıkarma ve son beş dakika gerçek bir şarkıda doğrulama uygulanabilir bir dağılım. Haftada bir aynı parçaya dönmek ilerlemeyi fark etmeyi kolaylaştırıyor.",
  },
  {
    thread: "ilk-konser-oncesi-prova-ve-sahne-kontrol-listesi",
    profile: "editor",
    body: "Set listesinin yanına yalnız şarkı adlarını değil; gitar değişimi, konuşma noktası ve count-in bilgisini de yazmak sahnedeki boşlukları azaltıyor. Her müzisyenin yedek kablosu, adaptörü ve kendi sinyal zincirini tek başına doğrulayabileceği küçük bir planı olmalı.",
  },
  {
    thread: "bir-sarkiyi-ilk-otuz-saniyede-neden-birakiyoruz",
    profile: "stage",
    body: "İlk saniyelerde mutlaka büyük bir olay aramıyorum; fakat parçanın bir yön duygusu vermesi gerekiyor. Ritimde çözülmeyi bekleyen küçük bir vurgu veya sözde cevabı geciktirilen bir fikir, doğrudan nakarattan daha güçlü merak yaratabiliyor.",
  },
];

async function upsertProfiles() {
  const result = new Map();
  for (const profile of profiles) {
    const user = await prisma.userList.upsert({
      where: { slug: profile.slug },
      create: {
        ownerName: profile.ownerName,
        playlistName: profile.playlistName,
        bio: profile.bio,
        favoriteGenres: JSON.stringify(profile.favoriteGenres),
        profileTheme: profile.profileTheme,
        role: "member",
        slug: profile.slug,
        status: "active",
      },
      update: {
        ownerName: profile.ownerName,
        playlistName: profile.playlistName,
        bio: profile.bio,
        favoriteGenres: JSON.stringify(profile.favoriteGenres),
        profileTheme: profile.profileTheme,
        status: "active",
      },
    });
    result.set(profile.key, user);
  }
  return result;
}

async function upsertTracks(users) {
  const officialAuthorIds = [...users.values()].map((item) => item.id);
  await prisma.feedPost.deleteMany({
    where: {
      authorId: { in: officialAuthorIds },
      trackId: { notIn: tracks.map((item) => item.id) },
    },
  });

  for (const track of tracks) {
    const author = users.get(track.profile);
    const data = {
      authorId: author.id,
      trackId: track.id,
      trackUri: `spotify:track:${track.id}`,
      trackName: track.name,
      artistName: track.artist,
      albumName: track.album,
      durationMs: track.durationMs,
      externalUrl: `https://open.spotify.com/track/${track.id}`,
      source: "spotify",
      note: track.note,
      tags: JSON.stringify(track.tags),
      status: "published",
      createdAt: hoursAgo(track.hoursAgo),
    };
    const existing = await prisma.feedPost.findFirst({
      where: { authorId: author.id, trackId: track.id },
      select: { id: true },
    });
    if (existing) await prisma.feedPost.update({ where: { id: existing.id }, data });
    else await prisma.feedPost.create({ data });
  }
}

async function upsertThreads(users) {
  const result = new Map();
  for (const thread of threads) {
    const author = users.get(thread.profile);
    const createdAt = hoursAgo(thread.hoursAgo);
    const saved = await prisma.forumThread.upsert({
      where: { slug: thread.slug },
      create: {
        slug: thread.slug,
        authorId: author.id,
        category: thread.category,
        title: thread.title,
        body: thread.body,
        status: "published",
        views: thread.views,
        createdAt,
        approvedAt: createdAt,
        lastActivityAt: createdAt,
      },
      update: {
        authorId: author.id,
        category: thread.category,
        title: thread.title,
        body: thread.body,
        status: "published",
        views: thread.views,
        approvedAt: createdAt,
      },
    });
    result.set(thread.slug, saved);
  }
  return result;
}

async function upsertReplies(users, savedThreads) {
  for (const [index, reply] of replies.entries()) {
    const thread = savedThreads.get(reply.thread);
    const author = users.get(reply.profile);
    const existing = await prisma.forumReply.findFirst({
      where: { threadId: thread.id, authorId: author.id, body: reply.body },
      select: { id: true },
    });
    const createdAt = new Date(thread.createdAt.getTime() + (index + 4) * 3_600_000);
    if (!existing) {
      await prisma.forumReply.create({
        data: { threadId: thread.id, authorId: author.id, body: reply.body, createdAt },
      });
    }
    await prisma.forumThread.update({
      where: { id: thread.id },
      data: { lastActivityAt: createdAt },
    });
  }
}

async function main() {
  const users = await upsertProfiles();
  await upsertTracks(users);
  const savedThreads = await upsertThreads(users);
  await upsertReplies(users, savedThreads);
  await prisma.forumThread.updateMany({
    where: { title: { in: ["asfasfas"] } },
    data: { status: "removed" },
  });

  const [profileCount, postCount, threadCount, replyCount] = await Promise.all([
    prisma.userList.count({ where: { slug: { in: profiles.map((item) => item.slug) } } }),
    prisma.feedPost.count({ where: { authorId: { in: [...users.values()].map((item) => item.id) } } }),
    prisma.forumThread.count({ where: { slug: { in: threads.map((item) => item.slug) } } }),
    prisma.forumReply.count({ where: { threadId: { in: [...savedThreads.values()].map((item) => item.id) } } }),
  ]);
  console.log(`Editoryal içerik hazır: ${profileCount} profil, ${postCount} paylaşım, ${threadCount} konu, ${replyCount} yanıt.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
