import { requireLocale } from "@/content";

const privacy = {
  en: {
    contact: "Contact",
    contactBody: "Privacy questions: hello@chinainfact.com",
    newsletter: "Newsletter",
    newsletterBody: "We use your email address to send the newsletter and manage subscription preferences. Resend processes delivery. Every newsletter includes an unsubscribe link.",
    profiles: "Public profiles",
    profilesBody: "Author information is published after editorial review and author approval.",
    title: "Privacy",
    tracking: "Tracking",
    trackingBody: "Advertising and email open or click tracking are not enabled at launch.",
  },
  es: {
    contact: "Contacto",
    contactBody: "Consultas de privacidad: hello@chinainfact.com",
    newsletter: "Boletín",
    newsletterBody: "Usamos tu correo para enviar el boletín y gestionar tus preferencias. Resend procesa la entrega. Cada boletín incluye un enlace de baja.",
    profiles: "Perfiles públicos",
    profilesBody: "La información de cada autor se publica tras la revisión editorial y su aprobación.",
    title: "Privacidad",
    tracking: "Seguimiento",
    trackingBody: "En el lanzamiento no se habilitan publicidad ni seguimiento de aperturas o clics del correo.",
  },
} as const;

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = privacy[locale];

  return (
    <main className="newsletter-page page-shell">
      <p className="meta">China, in Fact</p>
      <h1>{copy.title}</h1>
      <section>
        <h2>{copy.newsletter}</h2>
        <p>{copy.newsletterBody}</p>
      </section>
      <section>
        <h2>{copy.profiles}</h2>
        <p>{copy.profilesBody}</p>
      </section>
      <section>
        <h2>{copy.tracking}</h2>
        <p>{copy.trackingBody}</p>
      </section>
      <section>
        <h2>{copy.contact}</h2>
        <p>{copy.contactBody}</p>
      </section>
    </main>
  );
}
