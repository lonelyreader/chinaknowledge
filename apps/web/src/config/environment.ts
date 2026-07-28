export const appEnvironments = ["local", "preview", "production"] as const;

export type AppEnvironment = (typeof appEnvironments)[number];
type EnvironmentSource = Record<string, string | undefined>;

export type ServerEnvironment = {
  blobStorageEnabled: boolean;
  cmsReadMode: "cms" | "fixtures";
  environment: AppEnvironment;
  indexable: boolean;
  newsletterEnabled: boolean;
  transactionalEmailEnabled: boolean;
};

function isAppEnvironment(value: string): value is AppEnvironment {
  return appEnvironments.includes(value as AppEnvironment);
}

function inferVercelEnvironment(value: string | undefined): AppEnvironment | null {
  if (value === "preview") return "preview";
  if (value === "production") return "production";
  if (value === "development") return "local";
  return null;
}

export function resolveAppEnvironment(env: EnvironmentSource = process.env): AppEnvironment {
  const declared = env.APP_ENV;
  if (declared && !isAppEnvironment(declared)) {
    throw new Error(`APP_ENV must be one of: ${appEnvironments.join(", ")}.`);
  }

  const vercelEnvironment = inferVercelEnvironment(env.VERCEL_ENV);
  const environment: AppEnvironment =
    declared && isAppEnvironment(declared)
      ? declared
      : (vercelEnvironment ?? "local");

  if (vercelEnvironment && environment !== vercelEnvironment) {
    throw new Error("APP_ENV conflicts with VERCEL_ENV.");
  }

  return environment;
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function hasPostgresURL(value: string | undefined) {
  if (!value) return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

export function normalizePostgresConnectionString(value: string) {
  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

function hasVercelBlobToken(value: string | undefined) {
  return Boolean(value?.match(/^vercel_blob_rw_[a-z\d]+_[a-z\d]+$/i));
}

function hasResendKey(value: string | undefined) {
  return Boolean(value?.match(/^re_[A-Za-z\d_-]{16,}$/));
}

function hasUuid(value: string | undefined) {
  return Boolean(value?.match(/^[a-f\d]{8}-[a-f\d]{4}-[1-5][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i));
}

function isEmailAddress(value: string | undefined) {
  return Boolean(value?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
}

function isHttpsOrigin(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function validateServerEnvironment(
  env: EnvironmentSource = process.env,
): ServerEnvironment {
  const environment = resolveAppEnvironment(env);
  const errors: string[] = [];
  const cmsReadMode = env.CMS_READ_MODE;

  if (!hasPostgresURL(env.DATABASE_URL)) {
    errors.push("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (!hasValue(env.PAYLOAD_SECRET)) {
    errors.push("PAYLOAD_SECRET is required.");
  }
  if (cmsReadMode && !["fixtures", "cms"].includes(cmsReadMode)) {
    errors.push("CMS_READ_MODE must be fixtures or cms.");
  }

  if (environment === "preview") {
    if (!cmsReadMode || !["fixtures", "cms"].includes(cmsReadMode)) {
      errors.push("Preview requires CMS_READ_MODE=cms or fixtures.");
    }
    if (!hasVercelBlobToken(env.BLOB_READ_WRITE_TOKEN)) {
      errors.push("Preview requires a valid BLOB_READ_WRITE_TOKEN.");
    }
    if ((env.PAYLOAD_SECRET?.trim().length ?? 0) < 32) {
      errors.push("Preview PAYLOAD_SECRET must be at least 32 characters.");
    }
  }

  if (environment === "production") {
    if (cmsReadMode !== "cms") {
      errors.push("Production requires CMS_READ_MODE=cms.");
    }
    if (!hasVercelBlobToken(env.BLOB_READ_WRITE_TOKEN)) {
      errors.push("Production requires a valid BLOB_READ_WRITE_TOKEN.");
    }
    if ((env.PAYLOAD_SECRET?.trim().length ?? 0) < 32) {
      errors.push("Production PAYLOAD_SECRET must be at least 32 characters.");
    }
    if (!hasResendKey(env.RESEND_TRANSACTIONAL_API_KEY)) {
      errors.push("Production requires RESEND_TRANSACTIONAL_API_KEY.");
    }
    if (!hasResendKey(env.RESEND_CONTACTS_API_KEY)) {
      errors.push("Production requires RESEND_CONTACTS_API_KEY.");
    }
    if (!hasUuid(env.RESEND_NEWSLETTER_TOPIC_ID)) {
      errors.push("Production requires RESEND_NEWSLETTER_TOPIC_ID.");
    }
    if (!isEmailAddress(env.PAYLOAD_EMAIL_FROM)) {
      errors.push("Production requires PAYLOAD_EMAIL_FROM.");
    }
    if (!hasValue(env.PAYLOAD_EMAIL_FROM_NAME)) {
      errors.push("Production requires PAYLOAD_EMAIL_FROM_NAME.");
    }
    if (!isEmailAddress(env.NEWSLETTER_EMAIL_FROM)) {
      errors.push("Production requires NEWSLETTER_EMAIL_FROM.");
    }
    if (!isEmailAddress(env.EMAIL_REPLY_TO)) {
      errors.push("Production requires EMAIL_REPLY_TO.");
    }
    if (!isHttpsOrigin(env.PAYLOAD_PUBLIC_SERVER_URL)) {
      errors.push("Production requires PAYLOAD_PUBLIC_SERVER_URL as an HTTPS origin.");
    }
    if (env.PUBLIC_INDEXING_ENABLED && !["true", "false"].includes(env.PUBLIC_INDEXING_ENABLED)) {
      errors.push("PUBLIC_INDEXING_ENABLED must be true or false.");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid ${environment} server environment: ${errors.join(" ")}`);
  }

  return {
    blobStorageEnabled: environment !== "local",
    cmsReadMode: cmsReadMode === "cms" ? "cms" : "fixtures",
    environment,
    indexable: environment === "production" && env.PUBLIC_INDEXING_ENABLED === "true",
    newsletterEnabled: environment === "production",
    transactionalEmailEnabled: environment === "production",
  };
}
