import assert from "node:assert/strict";

import type { AgentArticleBodyV1 } from "@/agent/contracts";
import {
  COLD_START_TRANSLATION_VERSION,
  parseTranslationJSONL,
  validateTranslationBundle,
} from "../scripts/cold-start-translation-contract";

const sourceBody: AgentArticleBodyV1 = {
  version: "AgentArticleBodyV1",
  blocks: [
    { type: "heading", level: 2, children: [{ type: "text", text: "先核对 240 小时条件" }] },
    { type: "paragraph", children: [{ type: "text", text: "行程必须经过中国前往第三国，停留不超过 240 小时。" }] },
    { type: "list", style: "number", items: [
      { children: [{ type: "text", text: "核对 1 份有效护照。" }] },
      { children: [{ type: "text", text: "保存 240 小时内离境的客票。" }] },
    ] },
  ],
};

const englishBody: AgentArticleBodyV1 = {
  version: "AgentArticleBodyV1",
  blocks: [
    { type: "heading", level: 2, children: [{ type: "text", text: "Check the 240-hour conditions first" }] },
    { type: "paragraph", children: [{ type: "text", text: "Your itinerary must continue through China to a third country, with a stay no longer than 240 hours." }] },
    { type: "list", style: "number", items: [
      { children: [{ type: "text", text: "Check 1 valid passport." }] },
      { children: [{ type: "text", text: "Keep a confirmed ticket leaving within 240 hours." }] },
    ] },
  ],
};

const spanishBody: AgentArticleBodyV1 = {
  version: "AgentArticleBodyV1",
  blocks: [
    { type: "heading", level: 2, children: [{ type: "text", text: "Comprueba primero las condiciones de 240 horas" }] },
    { type: "paragraph", children: [{ type: "text", text: "El itinerario debe continuar por China hacia un tercer país y la estancia no puede superar 240 horas." }] },
    { type: "list", style: "number", items: [
      { children: [{ type: "text", text: "Comprueba 1 pasaporte válido." }] },
      { children: [{ type: "text", text: "Guarda un billete confirmado de salida dentro de 240 horas." }] },
    ] },
  ],
};

function fixture() {
  return {
    version: COLD_START_TRANSLATION_VERSION,
    batchId: "test-wave",
    contentKey: "wave-test-transit",
    sourceContentHash: "a".repeat(64),
    sourceMasterId: 1,
    translationGroup: "site:wave-test-transit",
    source: { titleZh: "过境免签", summaryZh: "先核对完整行程。", bodyZh: structuredClone(sourceBody) },
    translations: {
      en: {
        title: "China's 240-hour visa-free transit",
        summary: "Check the complete itinerary before relying on visa-free transit.",
        slug: "china-240-hour-visa-free-transit",
        seoTitle: "China's 240-hour visa-free transit",
        seoDescription: "Check eligibility, ports, onward tickets and timing before using China's 240-hour visa-free transit policy.",
        body: structuredClone(englishBody),
      },
      es: {
        title: "Tránsito sin visado de 240 horas en China",
        summary: "Comprueba el itinerario completo antes de usar el tránsito sin visado.",
        slug: "transito-sin-visado-240-horas-china",
        seoTitle: "Tránsito sin visado de 240 horas en China",
        seoDescription: "Comprueba requisitos, puertos, billetes de salida y plazos antes de usar el tránsito sin visado de 240 horas en China.",
        body: structuredClone(spanishBody),
      },
    },
  };
}

const valid = fixture();
assert.equal(validateTranslationBundle(valid).contentKey, "wave-test-transit");
assert.equal(parseTranslationJSONL(`${JSON.stringify(valid)}\n`).length, 1);

const missingNumber = fixture();
missingNumber.translations.en.body.blocks[1] = {
  type: "paragraph",
  children: [{ type: "text", text: "Your itinerary must continue through China to a third country." }],
};
assert.throws(() => validateTranslationBundle(missingNumber), /changes numeric tokens/);

const collapsedList = fixture();
collapsedList.translations.es.body.blocks[2] = {
  type: "list",
  style: "number",
  items: [{ children: [{ type: "text", text: "Comprueba 1 pasaporte válido y un billete de salida dentro de 240 horas." }] }],
};
assert.throws(() => validateTranslationBundle(collapsedList), /does not preserve type, heading level, list style, or item count/);

const filler = fixture();
filler.translations.en.summary = "In conclusion, check the complete itinerary before relying on visa-free transit.";
assert.throws(() => validateTranslationBundle(filler), /template filler/);

console.log("Cold-start translation contract PASS");
