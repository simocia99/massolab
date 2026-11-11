// Honeypot anti-bot (D4): campo invisibile che le persone non vedono né
// raggiungono col tab; i bot che compilano tutti i campi lo riempiono.
// Uso: const hp = useHoneypot();  ...{hp.field}...  if (hp.isBot()) { finto successo }
import { useRef } from 'react';

const HIDDEN = {
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  opacity: 0,
};

export function useHoneypot() {
  const ref = useRef(null);
  const tripped = useRef(false);
  const field = (
    <div style={HIDDEN} aria-hidden="true">
      <label>
        Lascia vuoto questo campo
        <input
          ref={ref}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) tripped.current = true;
          }}
        />
      </label>
    </div>
  );
  return { field, isBot: () => tripped.current || !!ref.current?.value };
}
