"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AutoSubmitSelect({
  name,
  defaultValue,
  label,
  options,
  hiddenFields,
}: {
  name: string;
  defaultValue: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  hiddenFields: Array<{ name: string; value: string }>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();

    for (const field of hiddenFields) {
      if (field.name !== name && field.value.length > 0) {
        params.set(field.name, field.value);
      }
    }

    params.set(name, event.target.value);
    params.delete("page");

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-slate-600">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        onChange={handleChange}
        className="field min-w-40 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
