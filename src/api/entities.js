// The 19 data collections of the app, and their Supabase table names.
export const ENTITY_NAMES = [
  'Appointment',
  'AutomationLog',
  'AutomationSettings',
  'BlogPost',
  'ClientAccount',
  'Exercise',
  'ExerciseProgram',
  'GuidedBooking',
  'HealthData',
  'IntakeForm',
  'ManualPatient',
  'Message',
  'PatientDocument',
  'PricingSettings',
  'Review',
  'TherapistSettings',
  'TreatmentPackage',
  'TreatmentProgress',
  'TreatmentReport',
];

/** "TreatmentPackage" -> "treatment_package" */
export const tableName = (entity) =>
  entity.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Parse a base44-style sort string ("-created_date") */
export function parseSort(sort) {
  if (!sort || typeof sort !== 'string') return null;
  const desc = sort.startsWith('-');
  return { field: desc ? sort.slice(1) : sort, desc };
}

/** Accept both list(sort, limit) and list({ sort, limit }) call styles. */
export function normalizeListArgs(sortOrOpts, limit) {
  if (sortOrOpts && typeof sortOrOpts === 'object') {
    return { sort: parseSort(sortOrOpts.sort), limit: sortOrOpts.limit ?? null };
  }
  return { sort: parseSort(sortOrOpts), limit: limit ?? null };
}

export function compareBy(field, desc) {
  return (a, b) => {
    const va = a?.[field];
    const vb = b?.[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const r = va < vb ? -1 : va > vb ? 1 : 0;
    return desc ? -r : r;
  };
}
