import { CMSPeopleDirectory } from "@/components/cms-people-directory";
import { PeopleDirectory } from "@/components/people-directory";
import { people, requireLocale } from "@/content";
import { cmsReadEnabled, getPublishedCMSPeople } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function PeoplePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ locale: rawLocale }, { q = "" }] = await Promise.all([params, searchParams]);
  const locale = requireLocale(rawLocale);
  if (cmsReadEnabled()) {
    const cmsPeople = await getPublishedCMSPeople(locale);
    return (
      <main className="community-page community-people-page">
        <header className="page-shell community-page-header">
          <p>{locale === "en" ? "Community" : "Comunidad"}</p>
          <h1>{locale === "en" ? "Meet people in China" : "Conoce a gente en China"}</h1>
        </header>
        <div className="page-shell">
          <CMSPeopleDirectory
            people={cmsPeople.map((person) => ({ ...person, editorialBio: null }))}
            locale={locale}
            initialQuery={q}
          />
        </div>
      </main>
    );
  }
  return (
    <main className="community-page community-people-page">
      <header className="page-shell community-page-header">
        <p>{locale === "en" ? "Community" : "Comunidad"}</p>
        <h1>{locale === "en" ? "Meet people in China" : "Conoce a gente en China"}</h1>
      </header>
      <div className="page-shell"><PeopleDirectory people={people} locale={locale} initialQuery={q} /></div>
    </main>
  );
}
