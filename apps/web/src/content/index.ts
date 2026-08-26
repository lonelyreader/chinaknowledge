import { notFound } from "next/navigation";
import { drivingGuide, guides, people, stories } from "./fixtures";
import { locales, type Locale, type LocalizedText } from "./types";

export { drivingGuide, guides, locales, people, stories };
export type { Guide, Locale, Person, Story } from "./types";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

export function localize(value: LocalizedText, locale: Locale) {
  return value[locale];
}

export function getPerson(slug: string) {
  return people.find((person) => person.slug === slug);
}

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}

export const ui = {
  en: {
    nav: ["People", "Stories", "Guides", "Places"],
    purpose: ["Understand", "Visit", "Live", "Study", "Work", "Business"],
    selected: "Selected by the editors",
    recent: "Recently updated",
    latest: "Latest",
    people: "People to know",
    allPeople: "All people",
    subscribe: "Join Discord",
    newsletter: "Letters from China, written by people who live it",
    email: "Email address",
    join: "Join the newsletter",
    joining: "Joining…",
    success: "You’re on the list.",
    invalidEmail: "Enter a valid email address.",
    consent: "I agree to receive the newsletter.",
    consentRequired: "Newsletter consent is required.",
    unsubscribe: "Unsubscribe anytime.",
    privacy: "Privacy",
    newsletterError: "Subscription unavailable.",
    again: "Another email",
    guide: "Guide",
    reviewed: "Last reviewed",
    writtenBy: "Written by",
    aboutAuthor: "About the author",
    sources: "Sources and checks",
    selectedWork: "Selected work",
    contributions: "All contributions",
    search: "Search by name",
    topic: "Topic",
    place: "Place",
    language: "Language",
    all: "All",
    showing: "Showing",
    previous: "Previous",
    next: "Next",
    menu: "Menu",
    close: "Close",
    english: "EN",
    spanish: "ES",
    connect: "Continue with China, in Fact",
  },
  es: {
    nav: ["Personas", "Historias", "Guías", "Lugares"],
    purpose: ["Comprender", "Visitar", "Vivir", "Estudiar", "Trabajar", "Negocios"],
    selected: "Selección editorial",
    recent: "Actualizadas recientemente",
    latest: "Últimas publicaciones",
    people: "Personas para conocer",
    allPeople: "Todas las personas",
    subscribe: "Unirse a Discord",
    newsletter: "Cartas desde China, escritas por quienes la viven",
    email: "Correo electrónico",
    join: "Recibir el boletín",
    joining: "Suscribiendo…",
    success: "Ya estás en la lista.",
    invalidEmail: "Introduce un correo válido.",
    consent: "Acepto recibir el boletín.",
    consentRequired: "Se requiere consentimiento.",
    unsubscribe: "Cancela cuando quieras.",
    privacy: "Privacidad",
    newsletterError: "Suscripción no disponible.",
    again: "Otro correo",
    guide: "Guía",
    reviewed: "Última revisión",
    writtenBy: "Por",
    aboutAuthor: "Sobre el autor",
    sources: "Fuentes y revisión",
    selectedWork: "Selección",
    contributions: "Todas las contribuciones",
    search: "Buscar por nombre",
    topic: "Tema",
    place: "Lugar",
    language: "Idioma",
    all: "Todos",
    showing: "Mostrando",
    previous: "Anterior",
    next: "Siguiente",
    menu: "Menú",
    close: "Cerrar",
    english: "EN",
    spanish: "ES",
    connect: "Sigue con China, in Fact",
  },
} as const;

export const kindLabels = {
  en: { Story: "Story", Guide: "Guide", Place: "Place" },
  es: { Story: "Historia", Guide: "Guía", Place: "Lugar" },
} as const;
