"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  fieldLimits,
  isHighlight,
  validateHighlight,
  type FieldErrors,
  type Highlight,
  type HighlightInput,
} from "@/lib/highlights";

export function CreateHighlight({ onCreate }: { onCreate: (highlight: Highlight) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const previousOverflow = useRef("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");

  function open() {
    setErrors({});
    setError("");
    formRef.current?.reset();
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function close() {
    if (!submittingRef.current) dialogRef.current?.close();
  }

  function focusField(field: keyof HighlightInput) {
    const element = formRef.current?.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const validation = validateHighlight(formData);
    setErrors(validation.errors);
    setError("");

    const firstInvalid = Object.keys(validation.errors)[0] as keyof HighlightInput | undefined;
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const response = await fetch("/api/highlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.values),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          focusField(Object.keys(data.errors)[0] as keyof HighlightInput);
        } else {
          setError(data.error || "We couldn’t save your highlight. Please try again.");
        }
        return;
      }

      if (!isHighlight(data.highlight)) throw new Error("Invalid response");

      onCreate(data.highlight);
      dialogRef.current?.close();
    } catch {
      setError("We couldn’t confirm that your highlight was saved. Your text is still here. Check the page before trying again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="create-button" type="button" onClick={open} aria-haspopup="dialog">
        Create
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <dialog
        ref={dialogRef}
        className="create-dialog"
        aria-labelledby="dialog-title"
        onClose={() => { document.body.style.overflow = previousOverflow.current; }}
        onCancel={(event) => { if (submittingRef.current) event.preventDefault(); }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right ||
              event.clientY < box.top || event.clientY > box.bottom) close();
        }}
      >
        <div className="dialog-header">
          <h2 id="dialog-title">Create a highlight</h2>
          <button
            className="close-button"
            type="button"
            aria-label="Close dialog"
            disabled={submitting}
            onClick={close}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={submitting}>
          <fieldset disabled={submitting}>
            <div className="form-field">
              <label htmlFor="highlight-title">Highlight name <span aria-hidden="true">*</span></label>
              <input
                id="highlight-title"
                name="title"
                autoFocus
                required
                maxLength={fieldLimits.title}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="highlight-location">Location <span aria-hidden="true">*</span></label>
              <input
                id="highlight-location"
                name="location"
                required
                maxLength={fieldLimits.location}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "location-error" : undefined}
              />
              {errors.location && <p className="field-error" id="location-error">{errors.location}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="highlight-description">Description <span aria-hidden="true">*</span></label>
              <textarea
                id="highlight-description"
                name="description"
                required
                rows={5}
                maxLength={fieldLimits.description}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && <p className="field-error" id="description-error">{errors.description}</p>}
            </div>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button-secondary" type="button" disabled={submitting} onClick={close}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
          <p className="sr-only" role="status">{submitting ? "Saving highlight" : ""}</p>
        </form>
      </dialog>
    </>
  );
}
