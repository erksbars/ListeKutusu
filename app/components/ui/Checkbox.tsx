"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export type CheckboxVariant = "checkbox" | "switch";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
  description?: ReactNode;
  variant?: CheckboxVariant;
  containerClassName?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    id,
    label,
    description,
    variant = "checkbox",
    containerClassName = "",
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const controlId = id || `checkbox-${generatedId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const control = (
    <input
      ref={ref}
      id={controlId}
      type="checkbox"
      disabled={disabled}
      aria-describedby={descriptionId}
      className={`ui-checkbox ${variant === "switch" ? "ui-checkbox-switch" : ""} ${className}`.trim()}
      {...props}
    />
  );

  if (label == null) return control;

  const copy = (
    <span className="ui-check-copy">
      <span className="ui-check-label">{label}</span>
      {description && <span id={descriptionId} className="ui-check-description">{description}</span>}
    </span>
  );

  return (
    <label
      htmlFor={controlId}
      className={`ui-check-field ${variant === "switch" ? "ui-check-field-switch" : ""} ${disabled ? "ui-check-field-disabled" : ""} ${containerClassName}`.trim()}
    >
      {variant === "switch" ? <>{copy}{control}</> : <>{control}{copy}</>}
    </label>
  );
});
