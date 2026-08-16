/**
 * INFRA-PERSON-PAGE-001 permission negatives + isolation evidence.
 * Runs against the local dev database via the Payload Local API with
 * overrideAccess: false (the same enforcement path as REST).
 * Kept outside the repo on purpose: tests/ is not in the batch allowed_paths.
 * Full transcript is recorded in docs/reference/implementation/.
 */
import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "@payload-config";
import type { Person } from "@/payload-types";

const password = process.env.CMS_TEST_PASSWORD;
if (!password) throw new Error("CMS_TEST_PASSWORD is required for local fixture tests.");

function richText(text: string): NonNullable<Person["editorialBio"]> {
  return {
    root: {
      type: "root",
      children: [{
        type: "paragraph",
        children: [{ type: "text", detail: 0, format: 0, mode: "normal", style: "", text, version: 1 }],
        direction: null, format: "", indent: 0, textFormat: 0, textStyle: "", version: 1,
      }],
      direction: null, format: "", indent: 0, version: 1,
    },
  } as NonNullable<Person["editorialBio"]>;
}

async function expectRejected(action: () => Promise<unknown>, label: string) {
  let rejected = false;
  try { await action(); } catch { rejected = true; }
  assert.equal(rejected, true, label);
  console.log(`PASS (rejected): ${label}`);
}

async function main() {
  const payload = await getPayload({ config });
  const run = randomUUID().slice(0, 8);
  const cleanupUsers: (number | string)[] = [];
  const cleanupPeople: (number | string)[] = [];
  const cleanupMedia: (number | string)[] = [];

  try {
    const memberA = await payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName: `PP Member A ${run}`, email: `pp-member-a-${run}@test.invalid`, password, role: "author" },
      overrideAccess: true,
    });
    const memberB = await payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName: `PP Member B ${run}`, email: `pp-member-b-${run}@test.invalid`, password, role: "author" },
      overrideAccess: true,
    });
    const editor = await payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName: `PP Editor ${run}`, email: `pp-editor-${run}@test.invalid`, password, role: "editor" },
      overrideAccess: true,
    });
    cleanupUsers.push(memberA.id, memberB.id, editor.id);

    const personA = (await payload.find({ collection: "people", limit: 1, overrideAccess: true, where: { user: { equals: memberA.id } } })).docs[0];
    const personB = (await payload.find({ collection: "people", limit: 1, overrideAccess: true, where: { user: { equals: memberB.id } } })).docs[0];
    assert.ok(personA && personB, "Draft person profiles must exist for both members.");
    cleanupPeople.push(personA.id, personB.id);

    const portraitData = await readFile(path.resolve(process.cwd(), "public/images/fixtures/portrait-a-00.webp"));
    const portrait = await payload.create({
      collection: "media",
      data: { alt: `Person page fixture ${run}` },
      file: { data: portraitData, mimetype: "image/webp", name: `pp-fixture-${run}.webp`, size: portraitData.byteLength },
      overrideAccess: false,
      user: editor,
    });
    cleanupMedia.push(portrait.id);

    // Editor fills the profile including Editor-only fields (positive control).
    await payload.update({
      collection: "people", id: personA.id,
      data: {
        city: "Dongguan", identity: "Shovel Project Member", introduction: "First-person fallback introduction.",
        languages: ["en", "es"], name: memberA.displayName, portrait: portrait.id, slug: `pp-letter-${run}`,
        nameZh: "蔚蓝", quote: "I keep receipts.", quoteEs: "Guardo los recibos.",
        canHelpWith: [{ item: "Local government data" }, { item: "Factory visits" }],
        editorialBio: richText("A member who documents supply chains from the inside."),
        verdict: "Tests everything twice",
        links: [{ label: "Discord", type: "discord", url: "https://discord.com/users/0" }],
      },
      overrideAccess: false, user: editor,
    });
    const afterEditor = await payload.findByID({ collection: "people", id: personA.id, overrideAccess: true });
    assert.equal(afterEditor.verdict, "Tests everything twice", "Editor must be able to write the verdict.");
    assert.ok(afterEditor.editorialBio, "Editor must be able to write the editorial bio.");
    console.log("PASS: editor writes editorialBio/verdict (positive control).");

    // NEGATIVE 1: member writes someone else's Person → rejected.
    await expectRejected(() => payload.update({
      collection: "people", id: personB.id,
      data: { introduction: "hijacked" },
      overrideAccess: false, user: memberA,
    }), "Member A direct write to member B's Person is rejected.");

    // NEGATIVE 2: member writes Editor-only fields on their own Person → no effect.
    let selfEditorialWriteRejected = false;
    try {
      await payload.update({
        collection: "people", id: personA.id,
        data: {
          verdict: "Self-declared genius", verdictEs: "Genio autoproclamado",
          editorialBio: richText("Member-authored self praise."),
          editorialBioEs: richText("Autoelogio del miembro."),
        },
        overrideAccess: false, user: memberA,
      });
    } catch { selfEditorialWriteRejected = true; }
    const afterSelf = await payload.findByID({ collection: "people", id: personA.id, overrideAccess: true });
    assert.equal(afterSelf.verdict, "Tests everything twice", "Member direct write to verdict must not persist.");
    assert.equal(afterSelf.verdictEs ?? null, null, "Member direct write to verdictEs must not persist.");
    const bioText = JSON.stringify(afterSelf.editorialBio);
    assert.ok(bioText.includes("supply chains") && !bioText.includes("self praise"), "Member direct write to editorialBio must not persist.");
    assert.equal(afterSelf.editorialBioEs ?? null, null, "Member direct write to editorialBioEs must not persist.");
    console.log(`PASS: member write to verdict/editorialBio has no effect (request ${selfEditorialWriteRejected ? "rejected" : "accepted but fields stripped"}).`);

    // POSITIVE: member self-managed fields persist.
    await payload.update({
      collection: "people", id: personA.id,
      data: { nameZh: "蔚蓝二", quote: "Updated by the member.", canHelpWith: [{ item: "Member-managed entry" }] },
      overrideAccess: false, user: memberA,
    });
    const afterMember = await payload.findByID({ collection: "people", id: personA.id, overrideAccess: true });
    assert.equal(afterMember.nameZh, "蔚蓝二");
    assert.equal(afterMember.quote, "Updated by the member.");
    assert.equal(afterMember.canHelpWith?.[0]?.item, "Member-managed entry");
    console.log("PASS: member self-managed fields (nameZh/quote/canHelpWith) persist.");

    // NEGATIVE 3: unpublished Person stays invisible to anonymous readers,
    // new fields included.
    await expectRejected(() => payload.findByID({
      collection: "people", id: personB.id, overrideAccess: false,
    }), "Anonymous read of a draft Person by id is rejected.");
    const anonymousList = await payload.find({ collection: "people", limit: 300, overrideAccess: false, pagination: false });
    assert.ok(!anonymousList.docs.some((doc) => doc.id === personA.id || doc.id === personB.id), "Draft people must not appear in the anonymous list.");
    console.log("PASS: draft Person (with new fields) is not exposed to anonymous readers.");

    // NEGATIVE 4: another member cannot read the draft Person of member A.
    const memberBView = await payload.find({ collection: "people", limit: 300, overrideAccess: false, pagination: false, user: memberB });
    assert.ok(!memberBView.docs.some((doc) => doc.id === personA.id), "Member B must not see member A's draft Person.");
    console.log("PASS: draft Person is not visible to other members.");

    console.log("ALL PERMISSION CHECKS PASSED");
  } finally {
    for (const id of cleanupPeople) {
      await payload.delete({ collection: "people", id, overrideAccess: true }).catch(() => {});
    }
    for (const id of cleanupUsers) {
      await payload.delete({ collection: "users", id, overrideAccess: true }).catch(() => {});
    }
    for (const id of cleanupMedia) {
      await payload.delete({ collection: "media", id, overrideAccess: true }).catch(() => {});
    }
  }
  process.exit(0);
}

await main();
