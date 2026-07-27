export const FORUM_CATEGORY_GROUPS = [
  {
    id: "muzik",
    label: "Müzik gündemi ve kültürü",
    description: "Yeni yayınlar, etkinlikler, keşifler ve müzik dünyası",
    categories: [
      { id: "genel", label: "Genel müzik", description: "Müzik kültürü, gündem ve genel sorular" },
      { id: "yeni-yayinlar", label: "Yeni çıkanlar", description: "Single, albüm ve yeni sanatçı keşifleri" },
      { id: "muzik-haberleri", label: "Müzik haberleri", description: "Sektör, sanatçı ve platform gelişmeleri" },
      { id: "konser-festival", label: "Konser ve festivaller", description: "Etkinlik duyuruları ve konser deneyimleri" },
      { id: "turler-akimlar", label: "Türler ve akımlar", description: "Rock, caz, metal, elektronik ve diğer sahneler" },
    ],
  },
  {
    id: "enstrumanlar",
    label: "Enstrümanlar",
    description: "Çalım teknikleri, bakım, ton ve enstrüman seçimi",
    categories: [
      { id: "gitar", label: "Elektro gitar", description: "Gitar seçimi, ton, teknik ve bakım" },
      { id: "akustik-klasik-gitar", label: "Akustik ve klasik gitar", description: "Akustik ton, repertuvar ve çalım teknikleri" },
      { id: "bas-gitar", label: "Bas gitar", description: "Bas ekipmanı, ton ve çalım teknikleri" },
      { id: "davul", label: "Davul ve perküsyon", description: "Ritim, akustik ve elektronik davul" },
      { id: "tuslular", label: "Piyano ve tuşlular", description: "Piyano, klavye ve synthesizer" },
      { id: "yayli-calgilar", label: "Yaylı çalgılar", description: "Keman, viyola, çello ve kontrbas" },
      { id: "nefesli-calgilar", label: "Nefesli çalgılar", description: "Saksafon, flüt, klarnet ve bakır üflemeliler" },
      { id: "vokal", label: "Vokal ve şan", description: "Şan tekniği, mikrofon ve sahne pratiği" },
    ],
  },
  {
    id: "produksiyon",
    label: "Kayıt ve prodüksiyon",
    description: "Ev stüdyosu, yazılım, kayıt, miks ve mastering",
    categories: [
      { id: "produksiyon", label: "Prodüksiyon genel", description: "Üretim süreci, düzenleme ve çalışma yöntemleri" },
      { id: "daw-yazilimlari", label: "DAW ve yazılımlar", description: "Ableton, FL Studio, Logic, Cubase ve eklentiler" },
      { id: "ev-studyosu", label: "Ev stüdyosu", description: "Oda düzeni, akustik ve kayıt zinciri" },
      { id: "kayit-teknikleri", label: "Kayıt teknikleri", description: "Mikrofonlama, gain yapısı ve performans kaydı" },
      { id: "miks-mastering", label: "Miks ve mastering", description: "Denge, dinamik, frekans ve sonlandırma" },
      { id: "beste-soz-yazimi", label: "Beste ve söz yazımı", description: "Fikir geliştirme, düzenleme ve söz yazarlığı" },
    ],
  },
  {
    id: "ekipman",
    label: "Ekipman ve satın alma",
    description: "Ses sistemleri, kayıt donanımı ve ürün karşılaştırmaları",
    categories: [
      { id: "ekipman", label: "Ekipman önerileri", description: "Bütçe ve kullanım amacına göre genel tavsiyeler" },
      { id: "ses-kartlari", label: "Ses kartları", description: "Giriş, çıkış, sürücü ve gecikme sorunları" },
      { id: "mikrofonlar", label: "Mikrofonlar", description: "Vokal, enstrüman ve yayın mikrofonları" },
      { id: "kulaklik-monitor", label: "Kulaklık ve monitör", description: "Referans dinleme ve oda sistemleri" },
      { id: "amfi-pedal", label: "Amfi, pedal ve efekt", description: "Sinyal zinciri, ton ve efekt çözümleri" },
      { id: "bakim-onarim", label: "Bakım ve onarım", description: "Kurulum, temizlik, parça değişimi ve arızalar" },
    ],
  },
  {
    id: "ogrenme",
    label: "Müzik öğrenimi",
    description: "Teori, pratik, eğitim kaynakları ve kariyer",
    categories: [
      { id: "muzik-teorisi", label: "Müzik teorisi", description: "Armoni, ritim, analiz ve kulak eğitimi" },
      { id: "teknik-egzersiz", label: "Teknik ve egzersiz", description: "Çalışma rutini, hız, koordinasyon ve disiplin" },
      { id: "egitim-kaynaklari", label: "Eğitim kaynakları", description: "Kurs, kitap, kanal ve öğretmen önerileri" },
      { id: "konservatuvar-kariyer", label: "Okul ve kariyer", description: "Konservatuvar, sınavlar ve müzik meslekleri" },
      { id: "nota-tabulatur", label: "Nota ve tablatür", description: "Nota okuma, yazım ve eser çözümleme" },
    ],
  },
  {
    id: "topluluk",
    label: "Topluluk ve sahne",
    description: "Müzisyen buluşmaları, projeler ve sahne deneyimleri",
    categories: [
      { id: "grup-arkadasi", label: "Grup ve müzisyen arayanlar", description: "Proje, grup ve birlikte üretim ilanları" },
      { id: "calismalarinizi-paylasin", label: "Çalışmalarınızı paylaşın", description: "Kayıt, beste ve performans geri bildirimi" },
      { id: "sahne-deneyimi", label: "Sahne ve performans", description: "Canlı ses, hazırlık ve sahne tecrübeleri" },
      { id: "etkinlikler", label: "Topluluk etkinlikleri", description: "Buluşma, atölye ve çevrim içi etkinlikler" },
      { id: "soru-cevap", label: "Hızlı soru ve cevap", description: "Kısa, doğrudan ve tek konuya odaklı sorular" },
    ],
  },
] as const;

export const FORUM_CATEGORIES = FORUM_CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({ ...category, groupId: group.id, groupLabel: group.label }))
);

export type ForumCategoryId = (typeof FORUM_CATEGORIES)[number]["id"];
export type ForumCategoryGroupId = (typeof FORUM_CATEGORY_GROUPS)[number]["id"];

const CATEGORY_IDS = new Set<string>(FORUM_CATEGORIES.map((category) => category.id));

export function isForumCategory(value: string): value is ForumCategoryId {
  return CATEGORY_IDS.has(value);
}

export function forumCategory(value: string) {
  return FORUM_CATEGORIES.find((category) => category.id === value) ?? FORUM_CATEGORIES[0];
}

export function forumCategoryLabel(value: string) {
  return forumCategory(value).label;
}

export function forumCategoryGroup(value: string) {
  return FORUM_CATEGORY_GROUPS.find((group) => group.categories.some((category) => category.id === value))
    ?? FORUM_CATEGORY_GROUPS[0];
}

export function forumCategoryIdsForFilter(value: string) {
  const group = FORUM_CATEGORY_GROUPS.find((item) => item.id === value);
  return group ? group.categories.map((category) => category.id) : isForumCategory(value) ? [value] : [];
}

const FORUM_GROUP_GUIDANCE = {
  muzik: {
    titlePlaceholder: "Örn. Bu ay keşfettiğiniz en iyi albüm hangisi?",
    bodyPlaceholder: "Konuyu neden açtığını, kendi görüşünü ve tartışılmasını istediğin noktaları yaz...",
    checklist: [
      "Başlık tartışmanın odağını açıkça anlatıyor.",
      "Kendi görüşün veya başlangıç noktan belirtiliyor.",
      "Topluluğun yanıtlayabileceği net bir soru var.",
    ],
  },
  enstrumanlar: {
    titlePlaceholder: "Örn. Başlangıç için elektro gitar ve amfi önerisi",
    bodyPlaceholder: "Enstrümanı, seviyeni, bütçeni, kullandığın ekipmanı ve yaşadığın sorunu ayrıntılı yaz...",
    checklist: [
      "Enstrüman, seviye ve hedef bilgisi var.",
      "Varsa model, ekipman ve bütçe belirtiliyor.",
      "Denediklerin ve aldığın sonuç açıklanıyor.",
    ],
  },
  produksiyon: {
    titlePlaceholder: "Örn. Vokal kaydında dip gürültüsünü nasıl azaltabilirim?",
    bodyPlaceholder: "DAW, ses kartı, mikrofon, kayıt zinciri ve denediğin ayarlarla birlikte sorunu yaz...",
    checklist: [
      "DAW ve kayıt zinciri belirtiliyor.",
      "Sorunun hangi aşamada oluştuğu açıklanıyor.",
      "Denenen ayarlar veya yöntemler yazılıyor.",
    ],
  },
  ekipman: {
    titlePlaceholder: "Örn. 10.000 TL bütçeyle ev kaydı için ses kartı",
    bodyPlaceholder: "Bütçeni, kullanım amacını, mevcut sistemini ve karşılaştırdığın modelleri yaz...",
    checklist: [
      "Bütçe ve kullanım amacı net.",
      "Mevcut sistem ve bağlantılar belirtiliyor.",
      "Karşılaştırılan modeller veya beklentiler yazılıyor.",
    ],
  },
  ogrenme: {
    titlePlaceholder: "Örn. Armoni çalışırken nasıl bir sıra izlemeliyim?",
    bodyPlaceholder: "Mevcut seviyeni, hedefini, kullandığın kaynakları ve zorlandığın noktayı anlat...",
    checklist: [
      "Mevcut seviye ve hedef belirtiliyor.",
      "Kullanılan kaynak veya çalışma yöntemi yazılıyor.",
      "Yanıtlanması istenen nokta açık.",
    ],
  },
  topluluk: {
    titlePlaceholder: "Örn. İstanbul'da alternatif rock projesi için bas gitarist",
    bodyPlaceholder: "Şehir, müzik tarzı, deneyim beklentisi, çalışma biçimi ve iletişim tercihlerini yaz...",
    checklist: [
      "Şehir veya çevrim içi çalışma durumu belirtiliyor.",
      "Tarz, hedef ve deneyim beklentisi açık.",
      "Kişisel veya hassas bilgi paylaşılmıyor.",
    ],
  },
} as const;

export function forumThreadGuidance(category: string) {
  return FORUM_GROUP_GUIDANCE[forumCategoryGroup(category).id];
}

export function createForumSlug(title: string, suffix: string) {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 72);
  return `${base || "konu"}-${suffix.toLowerCase()}`;
}

export function validateForumThread(input: { title: string; body: string; category: string }) {
  if (!isForumCategory(input.category)) return "Geçerli bir kategori ve alt forum seç.";
  if (input.title.length < 8) return "Konu başlığı en az 8 karakter olmalı.";
  if (input.title.length > 120) return "Konu başlığı en fazla 120 karakter olabilir.";
  if (input.body.length < 30) return "Konu içeriği en az 30 karakter olmalı.";
  if (input.body.length > 5000) return "Konu içeriği en fazla 5000 karakter olabilir.";
  return null;
}

export function validateForumReply(body: string) {
  if (body.length < 2) return "Yanıt en az 2 karakter olmalı.";
  if (body.length > 3000) return "Yanıt en fazla 3000 karakter olabilir.";
  return null;
}
