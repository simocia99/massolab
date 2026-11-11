// Cross-area exports of the "content" range, by minified bundle name.
// 28292-29130 + 29130-30700, 59732-61622, 64244-64430, 87895-89152.

// Blog / booking entry
export { default as Bw } from '@/components/content/BlogSidebar';
export { default as Vw } from '@/pages/Blog';
export { default as Hw } from '@/pages/BlogPost';
export { default as Yw } from '@/pages/BookingEntry';

// Client area "appointments" tab (lines 30494-30749)
export { default as BE, STATUS_BADGES as RE, hoursUntil as zE } from '@/components/content/ClientAppointmentsList';

// Home hero + about (used by Home j3)
export { default as O4 } from '@/components/content/HomeHero';
export { default as A4 } from '@/components/content/HomeAbout';

// Treatments
export { TREATMENTS as j4 } from '@/data/treatments';
export {
  Stars as M4,
  Stars as I4,
  FaqItem as N4,
  FaqItem as L4,
  TreatmentReviews as P4,
  TreatmentReviewsCompact as R4,
} from '@/components/content/TreatmentBits';
export { default as F4 } from '@/pages/Trattamento';
export { default as z4 } from '@/components/content/TreatmentDetailModal';
export { TREATMENT_SLUGS as B4, TREATMENT_KEYS as V4, TREATMENT_CARDS as H4 } from '@/data/treatmentCards';

// Reviews / appointment links / intake
export { default as M3 } from '@/pages/LeaveReview';
export { default as Mte } from '@/pages/AppointmentAction';
export { default as Ite } from '@/pages/IntakeForm';
export {
  STEPS as N9,
  BODY_AREAS as Nte,
  DURATIONS as Pte,
  RED_FLAG_WORDS as Fte,
  hasRedFlags as P9,
  StepCard as F9,
  TextField as I9,
  ConsentBox as L9,
  StepNav as R9,
} from '@/components/content/IntakeFormParts';

// Percorsi
export { PACKAGE_PRICING_KEYS as Lte, PACKAGES as Rte, default as zte } from '@/components/content/PercorsoCard';
export { default as Bte } from '@/pages/Percorsi';
