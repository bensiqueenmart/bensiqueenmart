import { useRef, useState } from 'react';
import { imageSrc } from '../api';
import { isValidImageUrl, uploadImage } from '../lib/cloudinary';

const smallBtn: React.CSSProperties = {
  minHeight: 44,
  padding: '10px 14px',
  border: '1px solid #DCE8C8',
  borderRadius: 10,
  cursor: 'pointer',
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  color: '#123B26',
};

type Mode = 'upload' | 'capture' | 'url';

/**
 * Image field for product/combo forms: a 3-way Upload | Capture | Link
 * slider. File paths compress (max 1200px, WebP) then upload signed
 * direct-to-Cloudinary; Link saves a pasted https URL as-is.
 */
export default function ImageEditor({ value, onChange, kind, onError }: {
  value: string;
  onChange: (url: string) => void;
  kind: 'products' | 'combos';
  onError: (m: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('upload');
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [imgOk, setImgOk] = useState(true);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('That file is not an image');
      return;
    }
    setBusy(true);
    try {
      // uploadImage compresses (prepareImage) before the signed upload.
      const secureUrl = await uploadImage(file, kind);
      setImgOk(true);
      onChange(secureUrl);
    } catch (e) {
      onError(`Image upload failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const pick = (m: Mode) => {
    setMode(m);
    if (m === 'upload') galleryRef.current?.click();
    else if (m === 'capture') cameraRef.current?.click();
  };

  const useUrl = () => {
    const v = url.trim();
    if (!isValidImageUrl(v)) {
      onError('Enter an https:// image URL');
      return;
    }
    setImgOk(true);
    onChange(v);
    setUrl('');
  };

  const segCls = (m: Mode): string => `fkit-seg-btn${mode === m ? ' on' : ''}`;

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        {value && imgOk ? (
          <img src={imageSrc(value)} alt="" onError={() => setImgOk(false)} className="imgedit-thumb" />
        ) : (
          <div className="imgedit-placeholder">
            no photo
          </div>
        )}
        {value && (
          <>
            <div
              style={{
                position: 'absolute', top: 0, right: 0, width: 64, height: 48,
                borderRadius: '0 6px 0 0', pointerEvents: 'none',
                background: 'linear-gradient(to bottom left, rgba(0,0,0,0.45), transparent)',
              }}
            />
            <button
            title="Remove image"
            disabled={busy}
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 6, right: 6, width: 40, height: 40, borderRadius: '50%',
              border: '1px solid #ddd', background: 'rgba(255,255,255,0.92)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
          </>
        )}
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
      />
      <div className="fkit-seg" style={{ marginBottom: 8 }} role="radiogroup" aria-label="Image source">
        <button type="button" className={segCls('upload')} onClick={() => pick('upload')} aria-pressed={mode === 'upload'}>Upload</button>
        <button type="button" className={segCls('capture')} onClick={() => pick('capture')} aria-pressed={mode === 'capture'}>Capture</button>
        <button type="button" className={segCls('url')} onClick={() => pick('url')} aria-pressed={mode === 'url'}>Link</button>
      </div>
      {mode === 'url' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="fkit-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="paste image URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Image URL"
          />
          <button type="button" style={{ ...smallBtn, flexShrink: 0 }} onClick={useUrl}>Set</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="imgedit-choose" disabled={busy} onClick={() => pick(mode)}>
            {busy ? 'Uploading…' : mode === 'upload' ? 'Choose from gallery…' : 'Open camera…'}
          </button>
        </div>
      )}
    </div>
  );
}
