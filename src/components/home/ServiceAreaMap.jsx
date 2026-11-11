import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, LocateFixed, MapPin, Minus, Plus } from 'lucide-react';

const DEFAULT_LAT = 45.3252;
const DEFAULT_LNG = 9.1401;

/**
 * Google Maps embed with a draggable overlay and a red circle showing the
 * service radius (original `h3`). The iframe is twice the box size so it can
 * be panned with the pointer without exposing empty edges.
 */
export default function ServiceAreaMap({
  lat,
  lng,
  radiusKm,
  label,
  showCircle = true,
  onToggleCircle,
  className = 'h-[320px] md:h-[400px]',
}) {
  const centerLat = lat ?? DEFAULT_LAT;
  const centerLng = lng ?? DEFAULT_LNG;
  const km = radiusKm ?? 15;
  const radiusM = Math.max(1000, km * 1000);
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const metersPerPixel = (z) => (156543.03392 * cosLat) / 2 ** z;

  // Largest zoom (<=10) at which the circle radius stays within ~140px.
  const fitZoom = useMemo(() => {
    let z = 10;
    while (radiusM / metersPerPixel(z) > 140 && z > 3) z--;
    return z;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusM, cosLat]);

  const [zoom, setZoom] = useState(fitZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => {
    setZoom(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [fitZoom]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const radiusPx = useMemo(() => radiusM / metersPerPixel(zoom), [radiusM, cosLat, zoom]);

  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d) setPan({ x: d.panX + (e.clientX - d.startX), y: d.panY + (e.clientY - d.startY) });
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  const src = `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=${zoom}&hl=it&output=embed`;
  const ctrl = 'bg-white/90 backdrop-blur-md hover:bg-white text-[#1D1D1F] w-9 h-9 flex items-center justify-center transition-colors';

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-gray-100 ${className}`}>
      <div
        className="absolute"
        style={{
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        <iframe
          title="Mappa MassoLab"
          src={src}
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {showCircle && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: `${radiusPx * 2}px`,
              height: `${radiusPx * 2}px`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '9999px',
              border: '2px solid #E50914',
              background: 'rgba(229, 9, 20, 0.12)',
            }}
          />
        )}
      </div>

      <div
        className="absolute inset-0 z-[3] touch-none select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="absolute top-3 left-3 z-[4] bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-sm flex items-center gap-1.5 pointer-events-none">
        <MapPin className="w-3 h-3 text-[#E50914]" />
        {label || 'Lacchiarella (MI)'} · raggio {km} km
      </div>

      {onToggleCircle && (
        <button
          type="button"
          onClick={() => onToggleCircle(!showCircle)}
          className="absolute top-3 right-3 z-[4] bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-sm flex items-center gap-1.5 hover:bg-white transition-colors"
        >
          {showCircle ? (
            <Eye className="w-3.5 h-3.5 text-[#E50914]" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
          )}
          {showCircle ? 'Nascondi area' : 'Mostra area'}
        </button>
      )}

      <button
        type="button"
        onClick={() => setPan({ x: 0, y: 0 })}
        className="absolute left-3 bottom-3 z-[4] bg-white/90 backdrop-blur-md hover:bg-white text-[#1D1D1F] w-9 h-9 rounded-2xl shadow-sm flex items-center justify-center transition-colors"
        aria-label="Centra sul luogo"
        title="Centra sul luogo"
      >
        <LocateFixed className="w-4 h-4 text-[#E50914]" />
      </button>

      <div className="absolute right-3 bottom-3 z-[4] flex flex-col rounded-2xl overflow-hidden shadow-sm">
        <button type="button" onClick={() => setZoom((z) => Math.min(18, z + 1))} className={ctrl} aria-label="Zoom avanti">
          <Plus className="w-4 h-4" />
        </button>
        <div className="h-px bg-black/10" />
        <button type="button" onClick={() => setZoom((z) => Math.max(3, z - 1))} className={ctrl} aria-label="Zoom indietro">
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
