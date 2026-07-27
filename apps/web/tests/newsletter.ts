import assert from "node:assert/strict";

import type { Resend } from "resend";

import {
  isNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeNewsletterContact,
} from "@/lib/newsletter";

assert.equal(normalizeNewsletterEmail(" Reader@Example.COM "), "reader@example.com");
assert.equal(isNewsletterEmail("reader@example.com"), true);
assert.equal(isNewsletterEmail("reader@example"), false);

const createdCalls: unknown[] = [];
const newContactClient = {
  contacts: {
    create: async (input: unknown) => {
      createdCalls.push(input);
      return { data: { id: "contact-new", object: "contact" }, error: null, headers: null };
    },
    get: async () => ({
      data: null,
      error: { message: "not found", name: "not_found", statusCode: 404 },
      headers: null,
    }),
    topics: { update: async () => ({ data: { id: "unused" }, error: null, headers: null }) },
    update: async () => ({ data: { id: "unused", object: "contact" }, error: null, headers: null }),
  },
} as unknown as Resend;

await subscribeNewsletterContact(newContactClient, {
  email: "reader@example.com",
  locale: "en",
  topicId: "topic-newsletter",
});
assert.deepEqual(createdCalls, [
  {
    email: "reader@example.com",
    properties: { locale: "en" },
    topics: [{ id: "topic-newsletter", subscription: "opt_in" }],
    unsubscribed: false,
  },
]);

const updatedCalls: unknown[] = [];
const existingContactClient = {
  contacts: {
    create: async () => ({ data: { id: "unused", object: "contact" }, error: null, headers: null }),
    get: async () => ({
      data: { id: "contact-existing", object: "contact" },
      error: null,
      headers: null,
    }),
    topics: { update: async () => ({ data: { id: "unused" }, error: null, headers: null }) },
    update: async (input: unknown) => {
      updatedCalls.push(input);
      return { data: { id: "contact-existing", object: "contact" }, error: null, headers: null };
    },
  },
} as unknown as Resend;

await subscribeNewsletterContact(existingContactClient, {
  email: "reader@example.com",
  locale: "es",
  topicId: "topic-newsletter",
});
assert.deepEqual(updatedCalls, [
  { email: "reader@example.com", properties: { locale: "es" } },
]);

const raceUpdates: unknown[] = [];
const raceClient = {
  contacts: {
    create: async () => ({
      data: null,
      error: { message: "already exists", name: "conflict", statusCode: 409 },
      headers: null,
    }),
    get: async () => ({
      data: null,
      error: { message: "not found", name: "not_found", statusCode: 404 },
      headers: null,
    }),
    topics: { update: async () => ({ data: { id: "unused" }, error: null, headers: null }) },
    update: async (input: unknown) => {
      raceUpdates.push(input);
      return { data: { id: "contact-race", object: "contact" }, error: null, headers: null };
    },
  },
} as unknown as Resend;

await subscribeNewsletterContact(raceClient, {
  email: "race@example.com",
  locale: "en",
  topicId: "topic-newsletter",
});
assert.deepEqual(raceUpdates, [
  { email: "race@example.com", properties: { locale: "en" } },
]);

console.log("Newsletter subscription tests PASS.");
