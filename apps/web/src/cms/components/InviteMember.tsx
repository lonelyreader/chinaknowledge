"use client";

import { Button, toast, useAuth } from "@payloadcms/ui";
import { FormEvent, useState } from "react";

import type { User } from "@/payload-types";

type Role = "author" | "editor";

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object") return "Invitation failed.";
  const errors = (value as { errors?: { message?: string }[] }).errors;
  return errors?.[0]?.message ?? "Invitation failed.";
}

export function InviteMember() {
  const { user } = useAuth<User>();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("author");
  const [pending, setPending] = useState(false);
  if (user?.role !== "super_admin") return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, role }),
      });
      const data = await response.json() as unknown;
      if (!response.ok) throw new Error(errorMessage(data));
      toast.success("Invitation sent");
      setDisplayName("");
      setEmail("");
      setRole("author");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation failed.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (!email.trim()) return;
    setPending(true);
    try {
      const response = await fetch("/api/users/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json() as unknown;
      if (!response.ok) throw new Error(errorMessage(data));
      toast.success("Invitation sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="invite-member" onSubmit={submit}>
      <strong>Invite</strong>
      <input aria-label="Name" onChange={(event) => setDisplayName(event.target.value)} placeholder="Name" required value={displayName} />
      <input aria-label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" required type="email" value={email} />
      <select aria-label="Role" onChange={(event) => setRole(event.target.value as Role)} value={role}>
        <option value="author">Member</option>
        <option value="editor">Editor</option>
      </select>
      <Button buttonStyle="primary" disabled={pending} size="small" type="submit">Send</Button>
      <Button buttonStyle="secondary" disabled={pending || !email.trim()} onClick={() => void resend()} size="small" type="button">Resend</Button>
    </form>
  );
}
