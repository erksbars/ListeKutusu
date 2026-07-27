import { Database, FileText, LockKeyhole, Music2, ShieldCheck } from "lucide-react";
import { PageTopbar } from "../components/PageTopbar";

const sections = [
  {
    title: "Uygulamanın amacı",
    body: "ListeKutusu, kullanıcıların şarkı keşiflerini paylaşması, kendi listesini yönetmesi ve isteğe bağlı olarak Spotify listesine aktarması için hazırlanmıştır. Bu uygulama müzik stream etmez.",
  },
  {
    title: "Spotify bağlantısı",
    body: "Spotify entegrasyonu arama, dış bağlantı ve liste senkronu için kullanılır. Uygulamanın ana sosyal verisi; kullanıcı, öneri, beğeni, listeye ekleme, puan ve profil kayıtlarıdır.",
  },
  {
    title: "Görseller",
    body: "Keşif akışında albüm kapağı merkezi içerik olarak kullanılmaz. Spotify'dan gelen bağlantılar varsa kullanıcıyı Spotify'a yönlendirir; uygulama Spotify içeriğini yeniden dağıtmaz.",
  },
  {
    title: "Saklanan bilgiler",
    body: "Hesap adı, e-posta, şifre özeti, liste bilgisi, şarkı önerileri, herkese açık akış paylaşımları, forum konu ve yanıtları, beğeniler ve listeye ekleme kayıtları tutulur.",
  },
  {
    title: "Verilerini indirme",
    body: "Hesap sahibi; Ayarlar bölümündeki Verilerim alanından profil, liste, öneri, paylaşım ve sosyal etkileşim kayıtlarını JSON dosyası olarak indirebilir. Şifre özeti ve dahili güvenlik bilgileri bu dosyaya eklenmez.",
  },
  {
    title: "Hesap silme",
    body: "Hesap sahibi Ayarlar bölümünden şifre ve açık onay metniyle hesabını silebilir. Profil, paylaşımlar, öneriler ve sosyal etkileşimler kaldırılır; yönetilen Spotify listesi boşaltılarak kimliksiz geri kazanım havuzuna alınır.",
  },
  {
    title: "Topluluk güvenliği",
    body: "Kullanıcılar uygunsuz paylaşımları bildirebilir. Forum konuları yayınlanmadan önce moderatör onayından geçer; konular kilitlenebilir, kaldırılabilir ve uygunsuz yanıtlar silinebilir. Şikâyet kayıtları moderasyon amacıyla tutulur.",
  },
  {
    title: "Puan ve ödül",
    body: "Aylık liderlik artık sosyal etkileşimden hesaplanır. Akış beğenileri +1 puan, başka kullanıcıların listelerine eklenen akış şarkıları +5 puan getirir. Onay/red kararları puanı etkilemez. Kendi paylaşımını kendi listene eklemek sosyal puan üretmez.",
  },
  {
    title: "Şifre ve oturum",
    body: "Şifreler düz metin olarak saklanmaz. 'Beni hatırla' seçilmediğinde oturum tarayıcı oturumu kapandığında sona erer. Hesap sahibi açık oturumlarını Ayarlar bölümünden inceleyebilir ve diğer cihazlardaki erişimleri kapatabilir.",
  },
  {
    title: "Bildirim ve engelleme tercihleri",
    body: "Kullanıcı takip, beğeni ve listeye ekleme bildirimlerini ayrı ayrı kapatabilir. Engellenen hesaplar karşılıklı akışlarda gösterilmez ve hesap sahibi engel listesini Ayarlar bölümünden yönetebilir.",
  },
  {
    title: "Sorumluluk",
    body: "Spotify marka ve servisleri Spotify AB'ye aittir. ListeKutusu, Spotify tarafından onaylanmış veya resmi olarak desteklenen bir ürün gibi sunulmamalıdır.",
  },
];

const sectionIcons = [Music2, Music2, FileText, Database, Database, Database, ShieldCheck, FileText, LockKeyhole, ShieldCheck, ShieldCheck];

export default function LegalPage() {
  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-slate-950 sm:px-6">
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Kullanım ve gizlilik"
          subtitle="Şeffaflık ve veri ilkeleri"
          icon={<ShieldCheck size={18} />}
          backLabel="Ana akışa dön"
        />

        <div className="legal-layout mt-6">
          <aside className="legal-sidebar">
            <p className="section-kicker">Bu sayfada</p>
            <nav className="mt-3 grid gap-1" aria-label="Yasal metin bölümleri">
              {sections.map((section, index) => <a key={section.title} href={`#legal-${index}`} className="legal-nav-link">{section.title}</a>)}
            </nav>
          </aside>
          <article className="legal-document">
            <div className="legal-intro">
              <p className="section-kicker">Bilgilendirme</p>
              <h2 className="mt-2 text-2xl font-black text-navy sm:text-3xl">Açık, sade ve anlaşılır kullanım çerçevesi</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">ListeKutusu müzik yayını yapmaz. Topluluk paylaşımları, kişisel listeler ve isteğe bağlı Spotify senkronu üzerinde çalışır.</p>
            </div>
            <div className="legal-sections">
              {sections.map((section, index) => {
                const Icon = sectionIcons[index];
                return <section id={`legal-${index}`} key={section.title} className="legal-section scroll-mt-24">
                  <span className="legal-section-icon"><Icon size={18} /></span>
                  <div><h3>{section.title}</h3><p>{section.body}</p></div>
                </section>;
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
