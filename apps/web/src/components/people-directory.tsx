"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale, Person } from "@/content";
import { localize, ui } from "@/content";
import { PersonRow } from "./person-row";

export function PeopleDirectory({ people, locale, initialQuery = "" }: { people: Person[]; locale: Locale; initialQuery?: string }) {
  const copy = ui[locale];
  const [query, setQuery] = useState(initialQuery);
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
    const searchText = [
      person.name,
      localize(person.identity, locale),
      localize(person.city, locale),
      ...person.topics.map((value) => localize(value, locale)),
    ].join(" ").toLowerCase();
    const nameMatch = searchText.includes(query.trim().toLowerCase());
    const topicMatch = !topic || person.topics.some((value) => localize(value, locale) === topic);
    const placeMatch = !place || localize(person.city, locale) === place;
    return nameMatch && topicMatch && placeMatch;
  }), [people, locale, place, query, topic]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  function resetPage() {
    setPage(1);
  }

  return (
    <section className="people-directory community-directory" aria-labelledby="all-people">
      <h2 className="community-directory__title" id="all-people">{copy.allPeople}</h2>
      <div className="people-filters">
        <label>
          <span className="sr-only">{copy.search}</span>
          <input aria-label={copy.search} placeholder={copy.search} type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} />
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
      </div>
      <div className="people-roster community-person-list">
        {visible.map((person) => <PersonRow key={person.slug} person={person} locale={locale} />)}
      </div>
      {pageCount > 1 ? (
        <div className="pagination" aria-label={locale === "en" ? "Pagination" : "Paginación"}>
          <div>
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{copy.previous}</button>
          <span>{safePage} / {pageCount}</span>
          <button type="button" disabled={safePage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{copy.next}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
