import type { DefaultValue, PayloadRequest } from "payload";

import type { Person } from "@/payload-types";

import { isCMSUser } from "./roles";

type OwnPerson = Person;

const personCache = new WeakMap<PayloadRequest, Promise<OwnPerson | null>>();

async function getOwnPerson(req: PayloadRequest) {
  if (!isCMSUser(req.user) || req.user.role !== "author") return null;
  const cached = personCache.get(req);
  if (cached) return cached;

  const person = req.payload.find({
    collection: "people",
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { user: { equals: req.user.id } },
  }).then((result) => result.docs[0] ?? null);
  personCache.set(req, person);
  return person;
}

function relationID(value: unknown) {
  if (value && typeof value === "object" && "id" in value) return (value as { id: number | string }).id;
  return value ?? null;
}

export const personRevisionDefaults: Record<string, DefaultValue> = {
  person: async ({ req }) => (await getOwnPerson(req))?.id ?? null,
  proposer: ({ user }) => (isCMSUser(user) ? user.id : null),
  proposedCity: async ({ req }) => (await getOwnPerson(req))?.city ?? "",
  proposedIdentity: async ({ req }) => (await getOwnPerson(req))?.identity ?? "",
  proposedIntroduction: async ({ req }) => (await getOwnPerson(req))?.introduction ?? "",
  proposedLanguages: async ({ req }) => (await getOwnPerson(req))?.languages ?? [],
  proposedLinks: async ({ req }) => (await getOwnPerson(req))?.links ?? [],
  proposedPortrait: async ({ req }) => relationID((await getOwnPerson(req))?.portrait),
  proposedTopics: async ({ req }) =>
    (await getOwnPerson(req))?.topics?.map(relationID) ?? [],
};
