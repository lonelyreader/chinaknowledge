"use client";

import { useAuth, useDocumentInfo } from "@payloadcms/ui";
import { useEffect } from "react";

import type { User } from "@/payload-types";

function relationID(value: unknown) {
  if (value && typeof value === "object" && "id" in value) return (value as { id: unknown }).id;
  return value;
}

export function ProfileFocus() {
  const { user } = useAuth<User>();
  const { data } = useDocumentInfo();
  const self = Boolean(user?.id && String(relationID(data?.user)) === String(user.id));

  useEffect(() => {
    if (self) document.documentElement.dataset.profileMode = "self";
    return () => { delete document.documentElement.dataset.profileMode; };
  }, [self]);

  return null;
}
