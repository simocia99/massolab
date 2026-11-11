// Notifiche di prenotazione. I testi delle email sono generati dal server
// (edge function "send-email", tipo booking_received): qui si inviano solo
// id + token dell'appuntamento. Una email non riuscita non blocca la prenotazione.
import { db } from '@/api/client';

/** source: 'guest' (prenotazione ospite) | 'area' (dall'Area Clienti). */
export async function notifyBookingReceived(appt, { source = 'guest', intakeSkipped = false } = {}) {
  try {
    await db.integrations.Core.SendNotification({
      type: 'booking_received',
      appointment_id: appt.id,
      token: appt.access_token,
      data: { source, intake_skipped: !!intakeSkipped },
    });
  } catch (err) {
    console.warn('Invio email non riuscito:', err);
  }
}
