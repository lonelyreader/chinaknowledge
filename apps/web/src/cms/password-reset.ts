import type { Payload, PayloadRequest } from "payload";
import { formatAdminURL } from "payload/shared";

export const PASSWORD_RESET_EXPIRATION_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_ROUTE = "/reset";
const INVALID_RESET_TOKEN_MESSAGE = "Token is either invalid or has expired.";

type ForgotPasswordEmailArgs = {
  req?: PayloadRequest;
  token?: string;
};

function escapeHTML(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function passwordResetURL({ req, token }: ForgotPasswordEmailArgs) {
  if (!req || !token) throw new Error("Password reset email requires a request and token.");
  const requestOrigin = req.url ? new URL(req.url).origin : undefined;
  const serverURL = req.payload.config.serverURL || requestOrigin;
  if (!serverURL) throw new Error("Password reset email requires a server URL.");
  const resetPath = formatAdminURL({
    adminRoute: req.payload.config.routes.admin,
    path: `${PASSWORD_RESET_ROUTE}/${encodeURIComponent(token)}`,
  });
  return new URL(resetPath, serverURL).toString();
}

export function generatePasswordResetEmailSubject() {
  return "Set your China, in Fact password";
}

export function generatePasswordResetEmailHTML(args?: ForgotPasswordEmailArgs) {
  const resetURL = escapeHTML(passwordResetURL(args ?? {}));
  return [
    "<p>Set your China, in Fact password:</p>",
    `<p><a href="${resetURL}">Set password</a></p>`,
    "<p>This link expires in 24 hours. If another link is sent, only the newest one works.</p>",
  ].join("");
}

export function passwordResetTokenFromParams(params?: {
  [key: string]: string | string[] | undefined;
}) {
  const segments = params?.segments;
  if (!Array.isArray(segments) || segments.length !== 2 || segments[0] !== "reset") return undefined;
  const token = segments.at(-1);
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

export function passwordResetFailure(status: number, value: unknown) {
  let message = "Password could not be changed.";
  if (value && typeof value === "object") {
    const errors = (value as { errors?: { message?: string }[] }).errors;
    message = errors?.[0]?.message ?? message;
  }
  return {
    expired: status === 403 && message === INVALID_RESET_TOKEN_MESSAGE,
    message,
  };
}

export async function passwordResetTokenIsActive(
  payload: Payload,
  token: string,
  now = new Date(),
) {
  const result = await payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: {},
    showHiddenFields: true,
    where: {
      and: [
        { resetPasswordToken: { equals: token } },
        { resetPasswordExpiration: { greater_than: now.toISOString() } },
      ],
    },
  });
  return result.docs.length === 1;
}
