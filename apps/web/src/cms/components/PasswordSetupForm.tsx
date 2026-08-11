"use client";

import { Button } from "@payloadcms/ui";
import { type FormEvent, useState } from "react";

import { passwordResetFailure } from "@/cms/password-reset";

type Props = {
  apiURL: string;
  dashboardURL: string;
  forgotURL: string;
  loginURL: string;
  token: string;
};

export function PasswordSetupForm({ apiURL, dashboardURL, forgotURL, loginURL, token }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [expired, setExpired] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(undefined);
    setPending(true);
    try {
      const response = await fetch(apiURL, {
        body: JSON.stringify({ password, token }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json().catch(() => undefined) as unknown;
      const failure = passwordResetFailure(response.status, data);
      if (failure.expired) {
        setExpired(true);
        return;
      }
      if (!response.ok) {
        setError(failure.message);
        return;
      }
      window.location.assign(dashboardURL);
    } catch {
      setError("Password could not be changed.");
    } finally {
      setPending(false);
    }
  }

  if (expired) {
    return <PasswordSetupRecovery forgotURL={forgotURL} loginURL={loginURL} />;
  }

  return (
    <>
      <form className="password-setup__form" onSubmit={submit}>
        <label>
          <span>New password</span>
          <input
            autoComplete="new-password"
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label>
          <span>Confirm password</span>
          <input
            autoComplete="new-password"
            disabled={pending}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        {error ? <p className="password-setup__error" role="alert">{error}</p> : null}
        <Button buttonStyle="primary" disabled={pending} size="large" type="submit">
          Set password
        </Button>
      </form>
      <a className="password-setup__link" href={loginURL}>Back to login</a>
    </>
  );
}

export function PasswordSetupRecovery({ forgotURL, loginURL }: Pick<Props, "forgotURL" | "loginURL">) {
  return (
    <div className="password-setup__recovery">
      <p className="password-setup__error" role="alert">
        This link has expired or was replaced by a newer email.
      </p>
      <div className="password-setup__actions">
        <Button buttonStyle="primary" el="anchor" size="large" url={forgotURL}>
          Request a new link
        </Button>
        <a className="password-setup__link" href={loginURL}>Back to login</a>
      </div>
    </div>
  );
}
