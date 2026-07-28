import {
  appEnvironments,
  resolveAppEnvironment,
  type AppEnvironment,
} from "../src/config/environment";

type TargetOptions = {
  apply: boolean;
  productionConfirmation: string;
  productionConfirmationVariable: string;
};

export function requireCMSOperationTarget({
  apply,
  productionConfirmation,
  productionConfirmationVariable,
}: TargetOptions): AppEnvironment {
  const environment = resolveAppEnvironment();
  if (!apply) return environment;

  const declared = process.env.APP_ENV;
  if (!declared || !appEnvironments.includes(declared as AppEnvironment)) {
    throw new Error(`--apply requires APP_ENV=${appEnvironments.join("|")}.`);
  }

  const databaseTarget = process.env.CMS_DATABASE_TARGET;
  if (databaseTarget !== environment) {
    throw new Error(`--apply requires CMS_DATABASE_TARGET=${environment}.`);
  }

  if (
    environment === "production" &&
    process.env[productionConfirmationVariable] !== productionConfirmation
  ) {
    throw new Error(
      `Production --apply requires ${productionConfirmationVariable}=${productionConfirmation}.`,
    );
  }

  return environment;
}
