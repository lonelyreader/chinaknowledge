import { PeopleDirectory } from "@/components/people-directory";
import { PersonRow } from "@/components/person-row";
import { people, requireLocale } from "@/content";

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return (
    <main className="page-shell people-page">
      <header className="people-header">
        <p className="meta">{locale === "en" ? "People" : "Personas"}</p>
        <h1>{locale === "en" ? "China, through the people who know it closely" : "China, a través de quienes la conocen de cerca"}</h1>
      </header>
      <section className="spotlight" aria-labelledby="spotlight-title">
        <div className="section-heading"><h2 id="spotlight-title">{locale === "en" ? "This week’s spotlight" : "Selección de la semana"}</h2></div>
        <div className="spotlight-grid">
          {people.slice(0, 3).map((person, index) => <PersonRow key={person.slug} person={person} locale={locale} featured={index === 0} />)}
        </div>
      </section>
      <PeopleDirectory people={people} locale={locale} />
    </main>
  );
}
