import assert from "node:assert/strict";

import { createNewsletterPostHandler } from "@/app/(frontend)/api/newsletter/route";

const url = "https://chinainfact.com/api/newsletter";
const validBody = {
  consent: true,
  email: "reader@example.com",
  locale: "en",
  website: "",
};

function request(body: unknown, origin: string | null = "https://chinainfact.com") {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin) headers.set("origin", origin);
  return new Request(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

const subscriptions: unknown[] = [];
const enabledHandler = createNewsletterPostHandler({
  getEnvironment: () => ({ newsletterEnabled: true }),
  subscribe: async (input) => {
    subscriptions.push(input);
  },
});

assert.equal((await enabledHandler(request(validBody, null))).status, 403);
assert.equal((await enabledHandler(request(validBody, "https://attacker.example"))).status, 403);
assert.equal((await enabledHandler(request({ ...validBody, website: "bot" }))).status, 200);
assert.equal((await enabledHandler(request({ ...validBody, consent: false }))).status, 400);
assert.equal((await enabledHandler(request({ ...validBody, locale: "fr" }))).status, 400);
assert.equal((await enabledHandler(request({ ...validBody, email: "invalid" }))).status, 400);
assert.equal(
  (
    await enabledHandler(
      new Request(url, {
        body: "{",
        headers: { "content-type": "application/json", origin: "https://chinainfact.com" },
        method: "POST",
      }),
    )
  ).status,
  400,
);

const disabledHandler = createNewsletterPostHandler({
  getEnvironment: () => ({ newsletterEnabled: false }),
  subscribe: async () => {
    throw new Error("disabled handler must not reach the provider");
  },
});
assert.equal((await disabledHandler(request(validBody))).status, 503);

const failingHandler = createNewsletterPostHandler({
  getEnvironment: () => ({ newsletterEnabled: true }),
  subscribe: async () => {
    throw new Error("provider unavailable");
  },
});
const originalConsoleError = console.error;
console.error = () => undefined;
try {
  assert.equal((await failingHandler(request(validBody))).status, 502);
} finally {
  console.error = originalConsoleError;
}

assert.equal((await enabledHandler(request(validBody))).status, 200);
assert.deepEqual(subscriptions, [{ email: "reader@example.com", locale: "en" }]);

console.log("Newsletter route tests PASS.");
