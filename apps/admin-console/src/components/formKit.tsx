import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shared chrome + form primitives for the product/combo editor dialogs.
 * Visual language mirrors src/edit/components.tsx (green labels, sage
 * inputs, dark-green primary) so both consoles read as one app.
 *
 * Layout contract: single column, sticky header + footer, everything
 * reachable on a 375px phone with no horizontal scroll. All interactive
 * targets are >= 44px; inputs use 16px text so iOS won't auto-zoom.
 */

export function PopupShell({ eyebrow, title, sub, badge, dirty, onClose, children, footer }: {
  eyebrow: string;
  title: string;
  sub?: string;
  badge?: React.ReactNode;
  dirty: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer: (close: () => void) => React.ReactNode;
}) {
  function requestClose() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  return (
    <div
      className="bqm-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        className="bqm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${eyebrow}: ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bqm-modal-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="bqm-modal-eyebrow">{eyebrow}</div>
            <div className="bqm-modal-titlerow">
              <h2>{title}</h2>
              {badge}
            </div>
            {sub && <div className="bqm-modal-sub">{sub}</div>}
          </div>
          <button type="button" className="bqm-modal-x" onClick={requestClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <div className="bqm-modal-body">{children}</div>
        <div className="bqm-modal-foot">{footer(requestClose)}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="fkit-section" aria-label={title}>
      <h3 className="fkit-section-title">{title}</h3>
      {children}
    </section>
  );
}

export function Field({ label, required, hint, error, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fkit-field">
      <span className="fkit-label">
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error ? <div className="fkit-error" role="alert">{error}</div> : hint ? <div className="fkit-hint">{hint}</div> : null}
    </div>
  );
}

/** Read-only context strip — on-hand stock, notices. Never an input. */
export function ContextStrip({ children }: { children: React.ReactNode }) {
  return <div className="fkit-context">{children}</div>;
}

export function PrimaryButton({ busy, busyLabel, children, disabled, onClick }: {
  busy?: boolean;
  busyLabel?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="fkit-btn-primary" disabled={disabled || busy} onClick={onClick}>
      {busy ? busyLabel ?? 'Saving…' : children}
    </button>
  );
}

export function GhostButton({ children, disabled, onClick }: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="fkit-btn-ghost" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
