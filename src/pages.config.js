import { lazy } from 'react';

// Page name -> component. URLs are "/<PageName>" exactly like the Base44 site.
export const PAGES = {
  Home: lazy(() => import('./pages/Home.jsx')),
  Blog: lazy(() => import('./pages/Blog.jsx')),
  BlogPost: lazy(() => import('./pages/BlogPost.jsx')),
  BookingEntry: lazy(() => import('./pages/BookingEntry.jsx')),
  ClientArea: lazy(() => import('./pages/ClientArea.jsx')),
  ClientLogin: lazy(() => import('./pages/ClientLogin.jsx')),
  GuestBooking: lazy(() => import('./pages/GuestBooking.jsx')),
  LeaveReview: lazy(() => import('./pages/LeaveReview.jsx')),
  TherapistDashboard: lazy(() => import('./pages/TherapistDashboard.jsx')),
  TherapistLogin: lazy(() => import('./pages/TherapistLogin.jsx')),
  AppointmentAction: lazy(() => import('./pages/AppointmentAction.jsx')),
  IntakeForm: lazy(() => import('./pages/IntakeForm.jsx')),
  Percorsi: lazy(() => import('./pages/Percorsi.jsx')),
  Trattamento: lazy(() => import('./pages/Trattamento.jsx')),
  PostSessionFeedback: lazy(() => import('./pages/PostSessionFeedback.jsx')),
};
export const MAIN_PAGE = 'Home';
