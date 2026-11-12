import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Calendar, ChevronRight, Menu, User, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BUSINESS } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

const LOGO_ALT = 'MassoLab — Simone Ciacchi';
const EASE = [0.28, 0.11, 0.32, 1];

// Apple-style glass: translucent tint + blur + extra saturation, so text stays readable
// on any photo (dark glass) or page background (light glass).
const GLASS_DARK = 'bg-[rgba(25,26,23,0.32)] border-white/15 backdrop-blur-[20px] backdrop-saturate-[1.8]';
const GLASS_LIGHT =
  'bg-[rgba(250,248,245,0.78)] border-black/[0.07] backdrop-blur-[20px] backdrop-saturate-[1.8] shadow-[0_1px_0_rgba(25,26,23,0.04),0_8px_30px_-14px_rgba(25,26,23,0.25)]';
const TAP_SPRING = { type: 'spring', stiffness: 500, damping: 30 };

// ── Luce della barra ("filo di luce", scelta dell'utente) ─────────────────────
// Luce naturale (bianco caldo, come luce del giorno) che esce dal bordo inferiore.
// È un livello con la STESSA forma della barra (rounded-[inherit]): il filo è il suo
// bordo inferiore, quindi da pillola segue le curve degli angoli e sfuma verso i lati;
// da barra agganciata è dritto a tutta larghezza. Il riflesso sotto è un'ombra chiara
// che ha la forma della barra e ne segue larghezza e curve durante l'animazione.
// Prestazioni: niente filter/backdrop-filter né livelli grandi; l'ombra si ridisegna solo
// durante i 500ms del cambio di stato, non mentre si scorre.
const LUCE = {
  // sopra la foto scura: filo più luminoso e riflesso caldo visibile
  dark: {
    borderBottomColor: 'rgba(255, 247, 232, 0.6)',
    boxShadow: '0 16px 34px -18px rgba(255, 240, 214, 0.55), 0 34px 70px -36px rgba(255, 236, 205, 0.4)',
  },
  // su sfondo chiaro: stesso bianco caldo, appena dorato perché si veda sul crema
  light: {
    borderBottomColor: 'rgba(255, 252, 244, 1)',
    boxShadow: '0 14px 32px -18px rgba(214, 176, 120, 0.32), 0 30px 64px -34px rgba(240, 214, 170, 0.45)',
  },
};

/** Luce che esce dal bordo inferiore della barra (stessa forma della barra). */
function NavLight({ dark }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-b transition-[box-shadow,border-color] duration-500 ease-apple"
      style={dark ? LUCE.dark : LUCE.light}
    />
  );
}

const menuItem = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.28, 0.11, 0.32, 1] } },
};

/** Mobile menu row (original `J9`). */
function MobileNavLink({ to, label }) {
  return (
    <motion.div variants={menuItem} whileTap={{ scale: 0.97 }} transition={TAP_SPRING}>
      <Link
        to={to}
        className="flex items-center justify-between px-4 py-3.5 text-[#191A17] font-semibold rounded-2xl hover:bg-[#F3F0EA] active:bg-[#e8e8ed] transition-colors text-[15px] touch-manipulation"
      >
        {label}
        <ChevronRight className="w-4 h-4 text-[#C7C7CC]" />
      </Link>
    </motion.div>
  );
}

/** Site chrome: fixed header, mobile menu, footer (original `tne`). */
export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = currentPageName === 'Home';
  const isTherapistPage = currentPageName === 'TherapistDashboard' || currentPageName === 'TherapistLogin';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu on navigation.
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // The therapist area has its own full-screen chrome.
  if (isTherapistPage) return <>{children}</>;

  // "transparent" = the bar sits over the dark hero photo, so it uses dark glass + white text.
  const transparent = isHome && !scrolled;
  // Pill that docks (user's choice "B"): a floating glass pill at the top of the page,
  // it widens into a full-width light-glass bar pinned to the top as soon as you scroll.
  const navPos = scrolled ? 'top-0 left-0 right-0' : 'top-3 left-3 right-3 sm:top-5 sm:left-8 sm:right-8';
  const barCls = scrolled
    ? `max-w-full mx-auto rounded-none border-b ${GLASS_LIGHT}`
    : `max-w-6xl mx-auto rounded-[28px] border ${transparent ? GLASS_DARK : GLASS_LIGHT}`;
  const linkColor = transparent ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-ink';
  const brandColor = transparent ? 'text-white' : 'text-gray-900';
  const logoStyle = transparent ? { borderRadius: '9999px', boxShadow: '0 0 0 1px rgba(255,255,255,0.35)' } : { mixBlendMode: 'multiply' };
  const navLink = `inline-flex items-center min-h-[44px] text-sm font-medium transition-colors ${linkColor}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col min-h-screen bg-[#F3F0EA]">
        <nav className={`fixed z-50 transition-[top,left,right] duration-500 ease-apple ${navPos}`}>
          <div className={`relative transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-500 ease-apple ${barCls}`}>
          <NavLight dark={transparent} />
          <div className="max-w-6xl mx-auto pl-4 pr-2 sm:pl-5 h-14 flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 flex-shrink-0 min-h-[44px]">
              <img
                src={BUSINESS.logo}
                alt={LOGO_ALT}
                width={36}
                height={36}
                className="h-8 w-8 md:h-9 md:w-9 transition-all duration-300"
                style={logoStyle}
              />
              <span className="flex flex-col leading-none">
                <span
                  className={`text-base font-bold tracking-tight transition-colors ${brandColor}`}
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Masso Lab
                </span>
                <span className={`hidden min-[420px]:block text-[13px] font-[400] mt-0.5 transition-colors ${transparent ? 'text-white/80' : 'text-gray-600'}`} style={{ letterSpacing: '-0.01em' }}>Simone Ciacchi</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-5 lg:gap-7">
              <Link to={createPageUrl('Blog')} className={navLink}>
                Blog
              </Link>
              <Link to={createPageUrl('ClientLogin')} className={navLink}>
                Area Clienti
              </Link>
              <Link
                to={createPageUrl('GuestBooking')}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 min-h-[44px] text-sm font-medium transition-all duration-300 hover:scale-[1.02] whitespace-nowrap ${transparent ? 'bg-white text-ink hover:bg-white/90' : 'bg-ink text-white hover:bg-gray-800'}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Prenota ora
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <motion.div whileTap={{ scale: 0.94 }} transition={TAP_SPRING}>
                <Link
                  to={createPageUrl('GuestBooking')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 min-h-[44px] text-sm font-medium transition-colors touch-manipulation ${transparent ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="max-[359px]:sr-only">Prenota</span>
                </Link>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                whileTap={{ scale: 0.9 }}
                transition={TAP_SPRING}
                className={`p-3 rounded-full transition-colors touch-manipulation ${
                  transparent ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={menuOpen ? 'Chiudi menu' : 'Menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  key="menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.25 }}
                  className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] -z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  key="menu-panel"
                  id="mobile-menu"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 34, stiffness: 380, mass: 0.9 }}
                  className="md:hidden absolute left-0 right-0 top-16 z-50 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[28px] shadow-[0_8px_30px_-10px_rgba(25,26,23,0.18)] overflow-hidden"
                >
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } } }}
                    className="px-4 pt-4 pb-6 space-y-1"
                  >
                    <MobileNavLink to={createPageUrl('Blog')} label="Blog" />
                    <motion.div variants={menuItem} whileTap={{ scale: 0.97 }} transition={TAP_SPRING}>
                      <Link
                        to={createPageUrl('ClientLogin')}
                        className="mt-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#F3F0EA] hover:bg-black/[0.05] active:bg-black/[0.06] transition-colors touch-manipulation"
                      >
                        <span className="w-9 h-9 rounded-full bg-[#56695C]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#56695C]" />
                        </span>
                        <div className="flex-1">
                          <p className="text-[#191A17] text-[15px] font-bold" style={{ letterSpacing: '-0.02em' }}>
                            Area Clienti
                          </p>
                          <p className="text-[#6A685F] text-xs">Accedi al tuo percorso</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6A685F]" />
                      </Link>
                    </motion.div>
                    <motion.div
                      variants={menuItem}
                      className="pt-2"
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    >
                      <Link
                        to={createPageUrl('GuestBooking')}
                        className="w-full flex items-center justify-center gap-2 bg-[#56695C] hover:bg-[#46574B] active:bg-[#46574B] text-white rounded-2xl px-5 py-4 text-[15px] font-bold transition-colors touch-manipulation"
                      >
                        <Calendar className="w-4 h-4" />
                        Prenota Appuntamento
                      </Link>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </nav>

        <main className={`flex-1 min-h-screen ${isHome ? '' : 'pt-24'}`}>
          {/* Page change: only the content fades in, the navbar stays still. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {children}
          </motion.div>
        </main>

        <footer className={`bg-ink text-gray-300 py-10 px-4 sm:px-6 md:pb-10 ${isHome ? 'pb-24' : 'pb-10'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <img
                  src={BUSINESS.logo}
                  alt={LOGO_ALT}
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-20 mb-2"
                  style={{ borderRadius: '9999px', boxShadow: '0 0 0 1px rgba(255,255,255,0.35)' }}
                />
                <p className="text-sm text-gray-400">Massoterapia Professionale</p>
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Navigazione</p>
                <div className="space-y-2 text-sm">
                  <Link to={createPageUrl('Home')} className="block py-3 hover:text-white transition-colors">
                    Home
                  </Link>
                  <Link to={createPageUrl('Blog')} className="block py-3 hover:text-white transition-colors">
                    Blog
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Servizi</p>
                <div className="space-y-2 text-sm">
                  <Link to={createPageUrl('GuestBooking')} className="block py-3 hover:text-white transition-colors">
                    Prenota
                  </Link>
                  <Link to={createPageUrl('ClientLogin')} className="block py-3 hover:text-white transition-colors">
                    Area Clienti
                  </Link>
                  <Link to={createPageUrl('LeaveReview')} className="block py-3 hover:text-white transition-colors">
                    Lascia recensione
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG value={window.location.origin + import.meta.env.BASE_URL} size={70} />
                </div>
                <p className="text-xs text-gray-400 text-center">Scansiona per visitare</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-xs text-gray-400">© {new Date().getFullYear()} MassoLab — Tutti i diritti riservati.</p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
