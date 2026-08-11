"use client";

import { Button, SelectInput, TextInput, toast, useAuth } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { type ChangeEvent, FormEvent, useState } from "react";

import type { User } from "@/payload-types";

type Role = "author" | "editor";

function selectedRole(option: unknown): Role {
  if (option && !Array.isArray(option) && typeof option === "object" && "value" in option) {
    return (option as { value: Role }).value;
  }
  return "author";
}

function errorMessage(value: unknown) {
  if (!value || typeof value !== "object") return "Invitation failed.";
  const errors = (value as { errors?: { message?: string }[] }).errors;
  return errors?.[0]?.message ?? "Invitation failed.";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function InviteMember() {
  const { user } = useAuth<User>();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("author");
  const [pending, setPending] = useState(false);
  if (user?.role !== "super_admin") return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    const address = email.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }
    if (!validEmail(address)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, email: address, role }),
      });
      const data = await response.json() as unknown;
      if (!response.ok) throw new Error(errorMessage(data));
      toast.success("Invitation sent. Valid for 24 hours; only the newest link works.");
      setDisplayName("");
      setEmail("");
      setRole("author");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation failed.");
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    const address = email.trim();
    if (!validEmail(address)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/users/invite/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const data = await response.json() as unknown;
      if (!response.ok) throw new Error(errorMessage(data));
      toast.success("Invitation sent. Valid for 24 hours; only the newest link works.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="invite-member">
      <h2>Invite member</h2>
      <form className="invite-member__form" onSubmit={submit}>
        <TextInput
          htmlAttributes={{ autoComplete: "name" }}
          label="Name"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)}
          path="invite-display-name"
          required
          value={displayName}
        />
        <TextInput
          htmlAttributes={{ autoComplete: "email" }}
          label="Email"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
          path="invite-email"
          required
          value={email}
        />
        <SelectInput
          isClearable={false}
          label="Role"
          name="invite-role"
          onChange={(option) => setRole(selectedRole(option))}
          options={[
            { label: "Member", value: "author" },
            { label: "Editor", value: "editor" },
          ]}
          path="invite-role"
          required
          value={role}
        />
        <div className="invite-member__actions">
          <Button buttonStyle="primary" disabled={pending} size="small" type="submit">Send</Button>
          <Button buttonStyle="secondary" disabled={pending || !email.trim()} onClick={() => void resend()} size="small" type="button">Resend</Button>
        </div>
      </form>
    </section>
  );
}
