/**
 * INFRA-PERSON-PAGE-001 read-path evidence: byline single-field mapping
 * (hanziName/epithet/bioThirdPerson/discordLine), EN→ES fallback, and
 * draft-person isolation through the public read functions in content/cms.ts.
 * Run with: node --import tsx --conditions react-server <file>
 */
import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";

import config from "@payload-config";
import { collectRichTextUploadMediaIDs } from "@/cms/rich-text-media";
import type { Person } from "@/payload-types";
import { getPublishedCMSPeople, getPublishedCMSPerson } from "@/content/cms";

const password = process.env.CMS_TEST_PASSWORD;
if (!password) throw new Error("CMS_TEST_PASSWORD is required for local fixture tests.");

function richText(text: string, mediaID?: number): NonNullable<Person["editorialBio"]> {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", detail: 0, format: 0, mode: "normal", style: "", text, version: 1 }],
          direction: null, format: "", indent: 0, textFormat: 0, textStyle: "", version: 1,
        },
        ...(mediaID ? [{ fields: { caption: "Private fixture" }, relationTo: "media", type: "upload", value: mediaID, version: 3 }] : []),
      ],
      direction: null, format: "", indent: 0, version: 1,
    },
  } as NonNullable<Person["editorialBio"]>;
}

async function main() {
  const payload = await getPayload({ config });
  const run = randomUUID().slice(0, 8);
  const slug = `pp-read-${run}`;
  const cleanup: { collection: "media" | "people" | "users"; id: number | string }[] = [];

  try {
    const member = await payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName: `PP Reader ${run}`, email: `pp-reader-${run}@test.invalid`, password, role: "author" },
      overrideAccess: true,
    });
    const editor = await payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName: `PP Reader Editor ${run}`, email: `pp-reader-editor-${run}@test.invalid`, password, role: "editor" },
      overrideAccess: true,
    });
    cleanup.push({ collection: "users", id: member.id }, { collection: "users", id: editor.id });

    const person = (await payload.find({ collection: "people", limit: 1, overrideAccess: true, where: { user: { equals: member.id } } })).docs[0];
    assert.ok(person, "Draft person must exist.");
    cleanup.push({ collection: "people", id: person.id });

    const portraitData = await readFile(path.resolve(process.cwd(), "public/images/fixtures/portrait-a-00.webp"));
    const portrait = await payload.create({
      collection: "media",
      data: { alt: `PP read fixture ${run}` },
      file: { data: portraitData, mimetype: "image/webp", name: `pp-read-${run}.webp`, size: portraitData.byteLength },
      overrideAccess: false,
      user: editor,
    });
    cleanup.push({ collection: "media", id: portrait.id });
    const privateMedia = await payload.create({
      collection: "media",
      data: { alt: `Private Person bio fixture ${run}` },
      file: { data: portraitData, mimetype: "image/webp", name: `pp-private-${run}.webp`, size: portraitData.byteLength },
      overrideAccess: false,
      user: editor,
    });
    cleanup.push({ collection: "media", id: privateMedia.id });

    await payload.update({
      collection: "people", id: person.id,
      data: {
        city: "Dongguan", identity: "Shovel Project Member", introduction: "First-person fallback introduction.",
        languages: ["en", "es"], name: member.displayName, portrait: portrait.id, slug,
        nameZh: "蔚蓝", quote: "I keep receipts.", quoteEs: "Guardo los recibos.",
        canHelpWith: [{ item: "Local government data" }],
        editorialBio: richText("A member who documents supply chains from the inside.", privateMedia.id),
        verdict: "Tests everything twice",
        links: [
          { label: "Discord", type: "discord", url: "https://discord.com/users/0" },
          { label: "Site", type: "personal_site", url: "https://example.com" },
        ],
      },
      overrideAccess: false, user: editor,
    });

    // Draft person must be invisible to the public read path before publish.
    assert.equal(await getPublishedCMSPerson("en", slug), null, "Draft person must not resolve on the public read path.");
    const draftList = await getPublishedCMSPeople("en");
    assert.ok(!draftList.some((entry) => entry.slug === slug), "Draft person must not appear in the public index.");
    console.log("PASS: draft person invisible on public read path (new fields included).");

    await payload.update({
      collection: "people", id: person.id,
      context: { profileTransitionConfirmed: true },
      data: { profileStatus: "public" },
      overrideAccess: false, user: editor,
    });

    const en = await getPublishedCMSPerson("en", slug);
    assert.ok(en, "Published person must resolve in EN.");
    assert.equal(en.hanziName, "蔚蓝");
    assert.equal(en.epithet, "Tests everything twice");
    assert.equal(en.bioThirdPerson, "A member who documents supply chains from the inside.");
    assert.equal(en.quote, "I keep receipts.");
    assert.deepEqual(en.canHelpWith, ["Local government data"]);
    assert.equal(en.discordLine, `${member.displayName} answers questions on Discord.`);
    assert.ok(en.editorialBio, "RichText editorial bio must be exposed for the person page.");
    assert.deepEqual(collectRichTextUploadMediaIDs(en.editorialBio), [], "Unapproved bio media must not enter the public read model.");
    console.log("PASS: EN mapping — hanziName/epithet/bioThirdPerson/quote/canHelpWith/discordLine.");

    await payload.update({
      collection: "media", id: privateMedia.id,
      data: { publicUseApprovedAt: new Date().toISOString() },
      overrideAccess: false, user: editor,
    });
    const enApprovedMedia = await getPublishedCMSPerson("en", slug);
    assert.ok(enApprovedMedia?.editorialBio, "Approved bio media fixture must keep the editorial biography.");
    assert.deepEqual(collectRichTextUploadMediaIDs(enApprovedMedia.editorialBio), [privateMedia.id], "Approved bio media must enter the public read model.");
    const publicBioJSON = JSON.stringify(enApprovedMedia.editorialBio);
    assert.ok(!publicBioJSON.includes("uploadedBy"), "Public richText must not serialize the media owner relation.");
    assert.ok(!publicBioJSON.includes("publicUseApprovedAt"), "Public richText must not serialize media approval fields.");
    assert.ok(!publicBioJSON.includes(editor.email), "Public richText must not serialize nested user data.");
    console.log("PASS: unapproved editorial-bio media is hidden; approved media is retained.");

    const es = await getPublishedCMSPerson("es", slug);
    assert.ok(es, "Published person must resolve in ES.");
    assert.equal(es.quote, "Guardo los recibos.", "ES quote must use the ES value.");
    assert.equal(es.epithet, "Tests everything twice", "ES epithet must fall back to EN when verdictEs is empty.");
    assert.equal(es.bioThirdPerson, "A member who documents supply chains from the inside.", "ES bio must fall back to EN when editorialBioEs is empty.");
    assert.deepEqual(es.canHelpWith, ["Local government data"], "ES canHelpWith must fall back to EN rows.");
    assert.equal(es.discordLine, `${member.displayName} responde preguntas en Discord.`);
    console.log("PASS: ES fallback — es-first with EN fallback, localized discord line.");

    await payload.update({
      collection: "people", id: person.id,
      data: {
        canHelpWithEs: [{ item: "   " }],
        quoteEs: "   ",
        verdictEs: "   ",
      },
      overrideAccess: false, user: editor,
    });
    const esWhitespace = await getPublishedCMSPerson("es", slug);
    assert.ok(esWhitespace, "Published person must still resolve when ES fields contain whitespace.");
    assert.equal(esWhitespace.quote, "I keep receipts.", "Whitespace-only ES quote must fall back to EN.");
    assert.equal(esWhitespace.epithet, "Tests everything twice", "Whitespace-only ES epithet must fall back to EN.");
    assert.deepEqual(esWhitespace.canHelpWith, ["Local government data"], "Whitespace-only ES rows must fall back to EN.");
    console.log("PASS: whitespace-only ES strings and rows fall back to EN.");

    console.log("ALL READ-PATH CHECKS PASSED");
  } finally {
    for (const entry of cleanup.filter((item) => item.collection === "people")) {
      await payload.delete({ collection: "people", id: entry.id, overrideAccess: true }).catch(() => {});
    }
    for (const entry of cleanup.filter((item) => item.collection === "users")) {
      await payload.delete({ collection: "users", id: entry.id, overrideAccess: true }).catch(() => {});
    }
    for (const entry of cleanup.filter((item) => item.collection === "media")) {
      await payload.delete({ collection: "media", id: entry.id, overrideAccess: true }).catch(() => {});
    }
  }
  process.exit(0);
}

await main();
