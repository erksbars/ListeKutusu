import { DEMO_PREFIX, demoUsers, demoCommunities, demoMembers } from "./community-demo-data.mjs";
import { communityEventInput } from "../lib/communityEvents.ts";

// Static track references already used by the editorial fixture; no provider requests.
const tracks = [
  ["67Hna13dNDkZvBpTXRIaOJ", "Teardrop", "Massive Attack, Elizabeth Fraser", "Mezzanine", "Akşam yürüyüşüne eşlik eden o parça. Siz bugün ne dinliyorsunuz?", ["trip hop", "gece"]],
  ["2sW8fmnISifQTRgnRrQTYW", "Roads", "Portishead", "Dummy", "Kulaklıkla dinleyince arka planda yeni ayrıntılar yakalıyorum.", ["trip hop", "vokal"]],
  ["4wajJ1o7jWIg62YqpkHC7S", "Weird Fishes / Arpeggi", "Radiohead", "In Rainbows", "Gitarların birbirine karıştığı bölüm için her seferinde geri sarıyorum.", ["alternatif", "gitar"]],
  ["6WK9dVrRABMkUXFLNlgWFh", "Enjoy the Silence", "Depeche Mode", "The Singles 86-98", "Bugünün yolculuk şarkısı. Listeye eski bir favori geri döndü.", ["synth pop", "klasik"]],
  ["1lbXEepatjRVjoG8pZMtdp", "Dreams", "Fleetwood Mac", "Greatest Hits", "Sabah kahvesi ve sakin bir başlangıç için bıraktım buraya.", ["rock", "sabah"]],
  ["1NeLwFETswx8Fzxl2AFl91", "Something About Us", "Daft Punk", "Discovery", "Albümün en sakin anlarından biri; çalışma arasına iyi geliyor.", ["elektronik", "soul"]],
  ["39CFOvYse9fcMhIwyS73Fl", "Into My Arms", "Nick Cave & The Bad Seeds", "The Boatman's Call", "Az enstrümanla bu kadar duygu taşımak... Piyano odaklı önerilere açığım.", ["piyano", "ballad"]],
  ["2X485T9Z5Ly0xyaghN73ed", "Let It Happen", "Tame Impala", "Currents", "Uzun parçaları sevenlere. Ortasındaki geçiş günün enerjisini değiştirdi.", ["psikedelik", "elektronik"]],
  ["3yFnoUHlZhekoGsFsMFDqN", "Friday Morning", "Khruangbin", "Con Todo El Mundo", "Kitap okurken arka planda dönüyor. Sözsüz keşif listeme yeni bir ek.", ["enstrümantal", "groove"]],
  ["2o49Twc3qrNMOt8gq9W06L", "Pictures Of You - Remastered", "The Cure", "Disintegration", "Giriş bölümü bile tek başına bir yolculuk. Yağmurlu gün favorim.", ["post punk", "atmosfer"]],
];
export const demoMusicPosts = tracks.map(([trackId, trackName, artistName, albumName, note, tags], index) => ({
  id: `${DEMO_PREFIX}-music-${index + 1}`, authorId: demoUsers[index % demoUsers.length].id,
  trackId, trackUri: `spotify:track:${trackId}`, trackName, artistName, albumName,
  externalUrl: `https://open.spotify.com/track/${trackId}`, source: "spotify", note: `Demo paylaşım · ${note}`, tags: JSON.stringify(tags), hoursAgo: .2 + index * 2.6,
}));
export const demoMusicComments = demoMusicPosts.flatMap((post, index) => [
  "Demo yorum · Bu parçadan sonra aynı albümün kalanını da dinlemek istedim.",
  "Demo yorum · Benim de favorilerimden. Buna benzeyen başka önerileriniz var mı?",
].map((body, offset) => ({ id: `${DEMO_PREFIX}-music-comment-${index + 1}-${offset + 1}`, postId: post.id, authorId: demoUsers[(index + offset + 1) % demoUsers.length].id, body, hoursAgo: Math.max(.05, post.hoursAgo - .1 - offset * .03) })));

const gatherings = [
  [5, "Kutu oyunu tanışma masası", "İstanbul", "Örnek Oyun Kafe (kurgusal)", 6, 2],
  [1, "Film sonrası sohbet: Arrival", "İzmir", "Örnek Kültür Alanı (kurgusal)", 12, 3],
  [3, "Kitap kahvesi: Dune üzerine", "Ankara", "Örnek Kitap Kafe (kurgusal)", 8, 4],
  [6, "Kampüste tanışma ve oyun akşamı", "Eskişehir", "Örnek Kampüs Salonu (kurgusal)", 16, 5],
  [0, "Birlikte albüm dinleyelim", "İstanbul", "Örnek Dinleme Odası (kurgusal)", 10, 6],
  [4, "Bağımsız oyunlar üzerine sohbet", "Bursa", "Örnek Ortak Alan (kurgusal)", 8, 7],
];
export const demoEvents = gatherings.map(([communityIndex, title, city, venue, capacity, daysAhead], index) => ({
  id: `${DEMO_PREFIX}-event-${index + 1}`, communityId: demoCommunities[communityIndex].id, organizerId: demoCommunities[communityIndex].ownerId,
  title: `${title} (Demo)`, description: "Kurgusal demo etkinliğidir; gerçek bir buluşma veya rezervasyon değildir. Etkinlik kartı, kapasite ve katılım görünümünü denemek için hazırlanmıştır. Ortak ilgi alanlarımız üzerine sohbet edip tanışmayı örnekliyoruz.",
  city, venue, capacity, daysAhead, hoursAgo: 1 + index * 4,
}));
export const demoResponses = demoEvents.flatMap(event => demoMembers.filter(member => member.communityId === event.communityId).slice(0, 4).map((member, index) => ({ eventId: event.id, userId: member.userId, status: index < 3 ? "attending" : "interested" })));

export async function seedDemoFeed(tx, now) {
  const ago = hours => new Date(now.getTime() - hours * 3_600_000);
  for (const [postIndex, { hoursAgo, ...post }] of demoMusicPosts.entries()) {
    const existing = await tx.feedPost.findUnique({ where: { id: post.id }, select: { authorId: true, trackId: true } });
    if (existing && (existing.authorId !== post.authorId || existing.trackId !== post.trackId)) throw new Error("Demo müzik kimliği çakışıyor; hiçbir veri değiştirilmedi.");
    await tx.feedPost.upsert({ where: { id: post.id }, create: { ...post, createdAt: ago(hoursAgo) }, update: {} });
    for (let index = 1; index <= 3; index++) {
      const userId = demoUsers[(postIndex + index) % demoUsers.length].id;
      await tx.feedLike.upsert({ where: { postId_userId: { postId: post.id, userId } }, create: { postId: post.id, userId, createdAt: ago(Math.max(.01, hoursAgo - .05)) }, update: {} });
    }
  }
  for (const { hoursAgo, ...comment } of demoMusicComments) {
    const existing = await tx.feedComment.findUnique({ where: { id: comment.id }, select: { authorId: true, postId: true } });
    if (existing && (existing.authorId !== comment.authorId || existing.postId !== comment.postId)) throw new Error("Demo müzik yorum kimliği çakışıyor; hiçbir veri değiştirilmedi.");
    await tx.feedComment.upsert({ where: { id: comment.id }, create: { ...comment, createdAt: ago(hoursAgo) }, update: {} });
  }
  for (const { daysAhead, hoursAgo, ...event } of demoEvents) {
    const existing = await tx.communityEvent.findUnique({ where: { id: event.id }, select: { organizerId: true, communityId: true } });
    if (existing && (existing.organizerId !== event.organizerId || existing.communityId !== event.communityId)) throw new Error("Demo etkinlik kimliği çakışıyor; hiçbir veri değiştirilmedi.");
    const startsAt = new Date(now.getTime() + daysAhead * 86_400_000);
    const localStart = new Date(startsAt.getTime() + 3 * 3_600_000).toISOString().slice(0, 11) + "19:00";
    const input = communityEventInput({ ...event, localStart, publicLocationConfirmed: true }, now);
    await tx.communityEvent.upsert({ where: { id: event.id }, create: { ...event, ...input, distribution: "general", createdAt: ago(hoursAgo) }, update: {} });
  }
  for (const response of demoResponses) await tx.communityEventRsvp.upsert({ where: { eventId_userId: { eventId: response.eventId, userId: response.userId } }, create: response, update: {} });
}
