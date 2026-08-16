"use client";

import { useEffect, useMemo, useState } from "react";

import type { Locale } from "@/content";
import type { PublishedCMSPerson } from "@/content/cms";
import { ui } from "@/content";
import { PersonRosterRow } from "./person/roster-row";

export function CMSPeopleDirectory({ people, locale }: { people: PublishedCMSPerson[]; locale: Locale }) {
  const copy = ui[locale];
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [place, setPlace] = useState("");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setPageSize(media.matches ? 12 : 24);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const topics = useMemo(() => Array.from(new Set(people.flatMap((person) => person.topics))).sort(), [people]);
  const places = useMemo(() => Array.from(new Set(people.map((person) => person.city))).sort(), [people]);
  const filtered = useMemo(() => people.filter((person) => {
    const nameMatch = person.name.toLowerCase().includes(query.toLowerCase());
    const topicMatch = !topic || person.topics.includes(topic);
    const placeMatch = !place || person.city === place;
    const languageMatch = !language || person.languages.includes(language as Locale);
    return nameMatch && topicMatch && placeMatch && languageMatch;
  }), [language, people, place, query, topic]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = filtered.length ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, filtered.length);

  function resetPage() {
    setPage(1);
  }

  return (
    <section className="people-directory" aria-labelledby="all-people">
      <div className="section-heading section-heading--inline">
        <h2 id="all-people">{copy.allPeople}</h2>
        <p>{filtered.length}</p>
      </div>
      <div className="people-filters">
        <label>
          <span>{copy.search}</span>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} />
        </label>
        <label>
          <span>{copy.topic}</span>
          <select value={topic} onChange={(event) => { setTopic(event.target.value); resetPage(); }}>
            <option value="">{copy.all}</option>
            {topics.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>{copy.place}</span>
          <select value={place} onChange={(event) => { setPlace(event.target.value); resetPage(); }}>
            <option value="">{copy.all}</option>
            {places.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>{copy.language}</span>
          <select value={language} onChange={(event) => { setLanguage(event.target.value); resetPage(); }}>
            <option value="">{copy.all}</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </label>
      </div>
      <div className="people-roster">
        {visible.map((person) => <PersonRosterRow key={person.slug} person={person} locale={locale} />)}
      </div>
      <div className="pagination" aria-label={locale === "en" ? "Pagination" : "Paginación"}>
        <p>{copy.showing} {start}–{end} / {filtered.length}</p>
        <div>
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{copy.previous}</button>
          <span>{safePage} / {pageCount}</span>
          <button type="button" disabled={safePage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{copy.next}</button>
        </div>
      </div>
    </section>
  );
}
