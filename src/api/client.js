// Single entry point for all data access. Mirrors the Base44 SDK shape so
// the code reads the same as before:
//   db.entities.Appointment.filter({ client_email }, '-preferred_date', 50)
//   db.auth.me()   db.integrations.Core.SendEmail({...})   db.functions.invoke('booked_slots', {...})
import { IS_DEMO } from './config';
import { localEntities } from './localAdapter';
import { supabaseEntities } from './supabaseAdapter';
import { auth } from './auth';
import { functions, integrations } from './integrations';

export const db = {
  entities: IS_DEMO ? localEntities : supabaseEntities,
  auth,
  integrations,
  functions,
  isDemo: IS_DEMO,
};

export default db;
