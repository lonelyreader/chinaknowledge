export const appEnvironments = ["local", "preview", "production"] as const;

export type AppEnvironment = (typeof appEnvironments)[number];
type EnvironmentSource = Record<string, string | undefined>;

export type ServerEnvironment = {
  blobStorageEnabled: boolean;
  environment: AppEnvironment;
  indexable: boolean;
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

function hasVercelBlobToken(value: string | undefined) {
  return Boolean(value?.match(/^vercel_blob_rw_[a-z\d]+_[a-z\d]+$/i));
}

export function validateServerEnvironment(
  env: EnvironmentSource = process.env,
): ServerEnvironment {
  const environment = resolveAppEnvironment(env);
  const errors: string[] = [];

  if (!hasPostgresURL(env.DATABASE_URL)) {
    errors.push("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (!hasValue(env.PAYLOAD_SECRET)) {
    errors.push("PAYLOAD_SECRET is required.");
  }
  if (env.CMS_READ_MODE && !["fixtures", "cms"].includes(env.CMS_READ_MODE)) {
    errors.push("CMS_READ_MODE must be fixtures or cms.");
  }

  if (environment === "preview") {
    if (env.CMS_READ_MODE !== "cms") {
      errors.push("Preview requires CMS_READ_MODE=cms.");
    }
    if (!hasVercelBlobToken(env.BLOB_READ_WRITE_TOKEN)) {
      errors.push("Preview requires a valid BLOB_READ_WRITE_TOKEN.");
    }
    if ((env.PAYLOAD_SECRET?.trim().length ?? 0) < 32) {
      errors.push("Preview PAYLOAD_SECRET must be at least 32 characters.");
    }
  }

  if (environment === "production") {
    errors.push("Production runtime is not approved by P2-PREVIEW-001.");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid ${environment} server environment: ${errors.join(" ")}`);
  }

  return {
    blobStorageEnabled: environment === "preview",
    environment,
    indexable: environment === "production",
  };
}
