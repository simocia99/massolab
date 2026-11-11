import { useEffect } from 'react';

// Default <title> per page. Pages with dynamic titles (Blog, BlogPost,
// Percorsi, Trattamento) set their own afterwards and win, because their
// effects run after this one.
const TITLES = {
  Home: 'Massolab · Simone Ciacchi — Massoterapia a domicilio',
  BookingEntry: 'Prenota — MassoLab',
  GuestBooking: 'Prenota un appuntamento — MassoLab',
  ClientLogin: 'Area Clienti — MassoLab',
  ClientArea: 'La mia area — MassoLab',
  LeaveReview: 'Lascia una recensione — MassoLab',
  TherapistLogin: 'Area Terapista — MassoLab',
  TherapistDashboard: 'Dashboard — MassoLab',
  AppointmentAction: 'Il tuo appuntamento — MassoLab',
  IntakeForm: 'Modulo pre-trattamento — MassoLab',
  PostSessionFeedback: 'Com’è andata la seduta? — MassoLab',
};

export default function PageTitle({ name }) {
  useEffect(() => {
    if (TITLES[name]) document.title = TITLES[name];
  }, [name]);
  return null;
}
