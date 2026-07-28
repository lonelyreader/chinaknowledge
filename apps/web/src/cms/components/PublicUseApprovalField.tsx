"use client";

import { CheckboxInput, useField } from "@payloadcms/ui";
import type { DateFieldClientComponent } from "payload";

export const PublicUseApprovalField: DateFieldClientComponent = ({ path, readOnly }) => {
  const { setValue, value } = useField<string | null>({ path });

  return (
    <div className="field-type public-use-approval">
      <CheckboxInput
        checked={Boolean(value)}
        id={`field-${path}`}
        label="Approved for public use"
        name={path}
        onToggle={(event) => {
          setValue(event.target.checked ? new Date().toISOString() : null);
        }}
        readOnly={readOnly}
      />
    </div>
  );
};
