import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { Calendar, ChevronRight, Menu, User, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BUSINESS } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

const LOGO_ALT = 'MassoLab — Simone Ciacchi';
const TAP_SPRING = { type: 'spring', stiffness: 500, damping: 30 };

const menuItem = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};

/** Mobile menu row (original `J9`). */
function MobileNavLink({ to, label }) {
  return (
    <motion.div variants={menuItem} whileTap={{ scale: 0.97 }} transition={TAP_SPRING}>
      <Link
        to={to}
        className="flex items-center justify-between px-4 py-3.5 text-[#1D1D1F] font-semibold rounded-2xl hover:bg-[#f5f5f7] active:bg-[#e8e8ed] transition-colors text-[15px] touch-manipulation"
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

  const transparent = isHome && !scrolled;
  const navBg = transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-2xl border-b border-white/20 shadow-sm';
  const linkColor = transparent ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const brandColor = transparent ? 'text-white' : 'text-gray-900';
  const logoStyle = transparent ? { filter: 'invert(1)', mixBlendMode: 'screen' } : { mixBlendMode: 'multiply' };
  const navLink = `text-sm font-medium transition-colors ${linkColor}`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col min-h-screen bg-[#f5f5f7]">
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 flex-shrink-0">
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
                <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-red-500 mt-0.5">Simone Ciacchi</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-5 lg:gap-7">
              <Link to={createPageUrl('Percorsi')} className={navLink}>
                Percorsi
              </Link>
              <Link to={createPageUrl('Blog')} className={navLink}>
                Blog
              </Link>
              <Link to={createPageUrl('ClientLogin')} className={navLink}>
                Area Clienti
              </Link>
              <Link to={createPageUrl('TherapistLogin')} className={navLink}>
                Area Terapista
              </Link>
              <Link
                to={createPageUrl('GuestBooking')}
                className="inline-flex items-center gap-1.5 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                Prenota ora
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <motion.div whileTap={{ scale: 0.94 }} transition={TAP_SPRING}>
                <Link
                  to={createPageUrl('GuestBooking')}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors touch-manipulation"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Prenota
                </Link>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                whileTap={{ scale: 0.9 }}
                transition={TAP_SPRING}
                className={`p-2 rounded-xl transition-colors touch-manipulation ${
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

          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  key="menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="md:hidden fixed inset-0 top-12 bg-black/30 backdrop-blur-[2px] z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  key="menu-panel"
                  id="mobile-menu"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 34, stiffness: 380, mass: 0.9 }}
                  className="md:hidden absolute left-0 right-0 top-12 z-50 bg-white/90 backdrop-blur-2xl border-b border-black/[0.06] overflow-hidden"
                >
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } } }}
                    className="px-4 pt-4 pb-6 space-y-1"
                  >
                    <MobileNavLink to={createPageUrl('Percorsi')} label="Percorsi" />
                    <MobileNavLink to={createPageUrl('Blog')} label="Blog" />
                    <MobileNavLink to={createPageUrl('TherapistLogin')} label="Area Terapista" />
                    <motion.div variants={menuItem} whileTap={{ scale: 0.97 }} transition={TAP_SPRING}>
                      <Link
                        to={createPageUrl('ClientLogin')}
                        className="mt-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#f5f5f7] hover:bg-black/[0.05] active:bg-black/[0.06] transition-colors touch-manipulation"
                      >
                        <span className="w-9 h-9 rounded-full bg-[#E50914]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#E50914]" />
                        </span>
                        <div className="flex-1">
                          <p className="text-[#1D1D1F] text-[15px] font-bold" style={{ letterSpacing: '-0.02em' }}>
                            Area Clienti
                          </p>
                          <p className="text-[#86868B] text-xs">Accedi al tuo percorso</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#86868B]" />
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
                        className="w-full flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#cc0812] active:bg-[#cc0812] text-white rounded-2xl px-5 py-4 text-[15px] font-bold transition-colors touch-manipulation"
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

        <main className={`flex-1 ${isHome ? '' : 'pt-16'}`}>{children}</main>

        <footer className={`bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 md:pb-10 ${isHome ? 'pb-24' : 'pb-10'}`}>
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
                  style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
                />
                <p className="text-sm text-gray-500">Massoterapia Professionale</p>
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Navigazione</p>
                <div className="space-y-2 text-sm">
                  <Link to={createPageUrl('Home')} className="block hover:text-white transition-colors">
                    Home
                  </Link>
                  <Link to={createPageUrl('Percorsi')} className="block hover:text-white transition-colors">
                    Percorsi
                  </Link>
                  <Link to={createPageUrl('Blog')} className="block hover:text-white transition-colors">
                    Blog
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Servizi</p>
                <div className="space-y-2 text-sm">
                  <Link to={createPageUrl('GuestBooking')} className="block hover:text-white transition-colors">
                    Prenota
                  </Link>
                  <Link to={createPageUrl('ClientLogin')} className="block hover:text-white transition-colors">
                    Area Clienti
                  </Link>
                  <Link to={createPageUrl('LeaveReview')} className="block hover:text-white transition-colors">
                    Lascia recensione
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG value={window.location.origin + import.meta.env.BASE_URL} size={70} />
                </div>
                <p className="text-xs text-gray-600 text-center">Scansiona per visitare</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-xs text-gray-600">© {new Date().getFullYear()} MassoLab — Tutti i diritti riservati.</p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
