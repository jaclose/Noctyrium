import React, { useEffect } from "react";
import { X } from "lucide-react";
import { GhostButton } from "./primitives";

export function Modal({
  title, onClose, children, footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="spread">
          <h3>{title}</h3>
          <GhostButton onClick={onClose} aria-label="Close"><X size={18} /></GhostButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label, ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="stack gap6">
      <span className="field-label">{label}</span>
      <input className="field" {...rest} />
    </label>
  );
}

export function TextAreaField({
  label, ...rest
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="stack gap6">
      <span className="field-label">{label}</span>
      <textarea className="field" {...rest} />
    </label>
  );
}

export function SelectField({
  label, children, ...rest
}: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="stack gap6">
      <span className="field-label">{label}</span>
      <select className="field" aria-label={label} {...rest}>{children}</select>
    </label>
  );
}
