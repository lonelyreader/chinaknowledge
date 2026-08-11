import assert from "node:assert/strict";
import type { Payload, PayloadRequest } from "payload";

import { Users } from "../src/collections/Users";
import {
  generatePasswordResetEmailHTML,
  PASSWORD_RESET_EXPIRATION_MS,
  passwordResetFailure,
  passwordResetTokenFromParams,
  passwordResetTokenIsActive,
  passwordResetURL,
} from "../src/cms/password-reset";

assert.equal(PASSWORD_RESET_EXPIRATION_MS, 86_400_000);
assert.equal(Users.auth && typeof Users.auth === "object" && Users.auth.forgotPassword?.expiration, 86_400_000);

const request = {
  payload: {
    config: {
      routes: { admin: "/admin" },
      serverURL: "https://chinainfact.com",
    },
  },
  url: "http://localhost:3000/api/users/forgot-password",
} as unknown as PayloadRequest;
const expectedURL = "https://chinainfact.com/admin/reset/fixture-token";
assert.equal(passwordResetURL({ req: request, token: "fixture-token" }), expectedURL);
const emailHTML = generatePasswordResetEmailHTML({ req: request, token: "fixture-token" });
assert.match(emailHTML, new RegExp(expectedURL));
assert.match(emailHTML, /24 hours/);
assert.match(emailHTML, /only the newest one works/);

assert.equal(passwordResetTokenFromParams({ segments: ["reset", "fixture-token"] }), "fixture-token");
assert.equal(passwordResetTokenFromParams({ segments: ["reset"] }), undefined);
assert.equal(passwordResetTokenFromParams({ segments: ["reset", "fixture-token", "extra"] }), undefined);
assert.equal(passwordResetTokenFromParams(), undefined);
assert.deepEqual(
  passwordResetFailure(403, { errors: [{ message: "Token is either invalid or has expired." }] }),
  { expired: true, message: "Token is either invalid or has expired." },
);
assert.deepEqual(
  passwordResetFailure(403, { errors: [{ message: "This account is paused." }] }),
  { expired: false, message: "This account is paused." },
);

let captured: Record<string, unknown> | undefined;
const activePayload = {
  find: async (args: Record<string, unknown>) => {
    captured = args;
    return { docs: [{ id: 1 }] };
  },
} as unknown as Payload;
assert.equal(await passwordResetTokenIsActive(activePayload, "fixture-token", new Date("2026-08-11T00:00:00.000Z")), true);
assert.equal(captured?.collection, "users");
assert.equal(captured?.overrideAccess, true);
assert.equal(captured?.showHiddenFields, true);
assert.deepEqual(captured?.where, {
  and: [
    { resetPasswordToken: { equals: "fixture-token" } },
    { resetPasswordExpiration: { greater_than: "2026-08-11T00:00:00.000Z" } },
  ],
});

const inactivePayload = {
  find: async () => ({ docs: [] }),
} as unknown as Payload;
assert.equal(await passwordResetTokenIsActive(inactivePayload, "stale-token"), false);

if (process.env.PASSWORD_RESET_LIVE === "1") {
  const [{ default: config }, { getPayload }] = await Promise.all([
    import("../src/payload.config"),
    import("payload"),
  ]);
  const payload = await getPayload({ config });
  const email = "auth-reset-fixture@example.invalid";
  const existing = await payload.find({
    collection: "users",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    where: { email: { equals: email } },
  });
  for (const user of existing.docs) {
    await payload.delete({ collection: "users", id: user.id, overrideAccess: true });
  }

  const user = await payload.create({
    collection: "users",
    context: { skipMemberProfile: true },
    data: {
      accountStatus: "active",
      displayName: "Auth Reset Fixture",
      email,
      password: "Fixture-password-1!",
      role: "author",
    },
    overrideAccess: true,
  });
  try {
    const generatedAt = Date.now();
    const oldToken = await payload.forgotPassword({
      collection: "users",
      data: { email },
      disableEmail: true,
      overrideAccess: true,
    });
    assert.equal(typeof oldToken, "string");
    const stored = await payload.findByID({
      collection: "users",
      id: user.id,
      overrideAccess: true,
      showHiddenFields: true,
    });
    const expirationDelta = Date.parse(stored.resetPasswordExpiration ?? "") - generatedAt;
    assert.ok(expirationDelta >= PASSWORD_RESET_EXPIRATION_MS - 2_000);
    assert.ok(expirationDelta <= PASSWORD_RESET_EXPIRATION_MS + 2_000);

    const currentToken = await payload.forgotPassword({
      collection: "users",
      data: { email },
      disableEmail: true,
      overrideAccess: true,
    });
    assert.equal(typeof currentToken, "string");
    assert.notEqual(currentToken, oldToken);
    assert.equal(await passwordResetTokenIsActive(payload, oldToken as string), false);
    assert.equal(await passwordResetTokenIsActive(payload, currentToken as string), true);
    await assert.rejects(
      payload.resetPassword({
        collection: "users",
        data: { password: "Fixture-password-2!", token: oldToken as string },
        overrideAccess: true,
      }),
      (error: unknown) => Boolean(error && typeof error === "object" && "status" in error && error.status === 403),
    );
    await payload.resetPassword({
      collection: "users",
      data: { password: "Fixture-password-2!", token: currentToken as string },
      overrideAccess: true,
    });
    assert.equal(await passwordResetTokenIsActive(payload, currentToken as string), false);
  } finally {
    try {
      await payload.delete({ collection: "users", id: user.id, overrideAccess: true });
    } finally {
      await payload.destroy();
    }
  }
}

console.log("Password reset recovery tests PASS");
process.exit(0);
