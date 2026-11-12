import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from '@/components/Layout';
import NotFound from '@/pages/NotFound';
import DemoBanner from '@/components/DemoBanner';
import PageTitle from '@/components/PageTitle';
import { MAIN_PAGE, PAGES } from './pages.config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 } },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const page = (name) => {
  const Page = PAGES[name];
  return (
    <>
      <PageTitle name={name} />
      <Page />
    </>
  );
};

// One Layout for the whole app: the navbar is never re-created when the page
// changes (no flicker, scroll state kept); only the content below it is swapped.
function Shell({ children }) {
  const { pathname } = useLocation();
  const key = pathname.replace(/^\/+|\/+$/g, '');
  const name = key === '' ? MAIN_PAGE : PAGES[key] ? key : 'NotFound';
  return <Layout currentPageName={name}>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollToTop />
          <Shell>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={page(MAIN_PAGE)} />
              {Object.keys(PAGES).map((name) => (
                <Route key={name} path={`/${name}`} element={page(name)} />
              ))}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </Shell>
          <DemoBanner />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  );
}
