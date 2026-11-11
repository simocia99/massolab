import { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from './shared';

// New tab (not in the original): the owner shares the site only by link / QR code.
export default function ShareSiteTab() {
  const siteUrl = window.location.origin + import.meta.env.BASE_URL;
  const wrapRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
    } catch {
      // Fallback for browsers without async clipboard (older iOS / http)
      const ta = document.createElement('textarea');
      ta.value = siteUrl;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (!ok) return toast.error('Copia non riuscita');
    }
    setCopied(true);
    toast.success('Link copiato');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'massolab-qr.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Condividi sito" subtitle="Fai conoscere MassoLab con un link o un QR code" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-md">
        <div ref={wrapRef} className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl border border-gray-100">
            <QRCodeCanvas value={siteUrl} size={512} level="M" marginSize={2} style={{ width: 220, height: 220 }} aria-label="QR code del sito" />
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-gray-600 break-all select-all">{siteUrl}</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={copy}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 text-sm font-bold transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiato!' : 'Copia link'}
          </button>
          <button
            onClick={download}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            Scarica QR (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
