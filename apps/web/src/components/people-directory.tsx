"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale, Person } from "@/content";
import { localize, ui } from "@/content";
import { PersonRow } from "./person-row";

export function PeopleDirectory({ people, locale }: { people: Person[]; locale: Locale }) {
  const copy = ui[locale];
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [place, setPlace] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setPageSize(media.matches ? 12 : 24);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const topics = useMemo(() => Array.from(new Set(people.flatMap((person) => person.topics.map((value) => localize(value, locale))))).sort(), [people, locale]);
  const places = useMemo(() => Array.from(new Set(people.map((person) => localize(person.city, locale)))).sort(), [people, locale]);
  const filtered = useMemo(() => people.filter((person) => {
    const nameMatch = person.name.toLowerCase().includes(query.toLowerCase());
    const topicMatch = !topic || person.topics.some((value) => localize(value, locale) === topic);
    const placeMatch = !place || localize(person.city, locale) === place;
    return nameMatch && topicMatch && placeMatch;
  }), [people, locale, place, query, topic]);

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
          <select defaultValue={locale.toUpperCase()}>
            <option>EN</option>
            <option>ES</option>
          </select>
        </label>
      </div>
      <div className="people-results">
        {visible.map((person) => <PersonRow key={person.slug} person={person} locale={locale} />)}
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
