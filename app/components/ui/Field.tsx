"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type FieldChromeProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  controlId?: string;
  labelMeta?: ReactNode;
  children: (ids: { controlId: string; descriptionId?: string }) => ReactNode;
};

function FieldChrome({ label, hint, error, required, className = "", controlId, labelMeta, children }: FieldChromeProps) {
  const generatedId = useId();
  const resolvedControlId = controlId || `field-${generatedId}`;
  const descriptionId = hint || error ? `${resolvedControlId}-description` : undefined;

  return (
    <div className={`ui-form-field ${error ? "ui-form-field-error" : ""} ${className}`.trim()}>
      <div className="ui-form-label-row">
        <label htmlFor={resolvedControlId} className="ui-form-label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        {labelMeta && <span className="ui-form-label-meta">{labelMeta}</span>}
      </div>
      {children({ controlId: resolvedControlId, descriptionId })}
      {(error || hint) && (
        <p id={descriptionId} className={error ? "ui-form-error" : "ui-form-hint"}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id?: string;
  label: string;
  labelMeta?: ReactNode;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, labelMeta, hint, error, fieldClassName, leadingIcon, trailingAction, className = "", required, ...props },
  ref
) {
  return (
    <FieldChrome controlId={id} label={label} labelMeta={labelMeta} hint={hint} error={error} required={required} className={fieldClassName}>
      {({ controlId, descriptionId }) => (
        <div className="ui-field-shell">
          {leadingIcon && <span className="ui-field-leading" aria-hidden="true">{leadingIcon}</span>}
          <input
            ref={ref}
            id={controlId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionId}
            className={`ui-field ${leadingIcon ? "ui-field-with-leading" : ""} ${trailingAction ? "ui-field-with-trailing" : ""} ${className}`.trim()}
            {...props}
          />
          {trailingAction && <span className="ui-field-trailing">{trailingAction}</span>}
        </div>
      )}
    </FieldChrome>
  );
});

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  id?: string;
  label: string;
  labelMeta?: ReactNode;
  hint?: string;
  error?: string;
  fieldClassName?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { id, label, labelMeta, hint, error, fieldClassName, className = "", required, ...props },
  ref
) {
  return (
    <FieldChrome controlId={id} label={label} labelMeta={labelMeta} hint={hint} error={error} required={required} className={fieldClassName}>
      {({ controlId, descriptionId }) => (
        <textarea
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`ui-field ui-textarea ${className}`.trim()}
          {...props}
        />
      )}
    </FieldChrome>
  );
});

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id?: string;
  label: string;
  labelMeta?: ReactNode;
  hint?: string;
  error?: string;
  fieldClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, labelMeta, hint, error, fieldClassName, className = "", required, children, ...props },
  ref
) {
  return (
    <FieldChrome controlId={id} label={label} labelMeta={labelMeta} hint={hint} error={error} required={required} className={fieldClassName}>
      {({ controlId, descriptionId }) => (
        <select
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`ui-field ui-select ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldChrome>
  );
});
