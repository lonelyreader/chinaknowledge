import type { AdminViewServerProps } from "payload";
import { formatAdminURL } from "payload/shared";

import { PasswordSetupForm, PasswordSetupRecovery } from "@/cms/components/PasswordSetupForm";
import { passwordResetTokenFromParams, passwordResetTokenIsActive } from "@/cms/password-reset";

export async function PasswordSetup({ initPageResult, params }: AdminViewServerProps) {
  const { req } = initPageResult;
  const { config } = req.payload;
  const adminRoute = config.routes.admin;
  const forgotURL = formatAdminURL({ adminRoute, path: config.admin.routes.forgot });
  const loginURL = formatAdminURL({ adminRoute, path: config.admin.routes.login });

  if (req.user) {
    return (
      <main className="password-setup">
        <section className="password-setup__panel">
          <h1>Already signed in</h1>
          <a className="password-setup__button" href={adminRoute}>Open dashboard</a>
        </section>
      </main>
    );
  }

  const token = passwordResetTokenFromParams(params);
  const active = token ? await passwordResetTokenIsActive(req.payload, token) : false;
  const apiURL = formatAdminURL({ apiRoute: config.routes.api, path: "/users/reset-password" });

  return (
    <main className="password-setup">
      <section className="password-setup__panel">
        <h1>Set password</h1>
        {active && token ? (
          <PasswordSetupForm
            apiURL={apiURL}
            dashboardURL={adminRoute}
            forgotURL={forgotURL}
            loginURL={loginURL}
            token={token}
          />
        ) : (
          <PasswordSetupRecovery forgotURL={forgotURL} loginURL={loginURL} />
        )}
      </section>
    </main>
  );
}
