import { redirect } from 'next/navigation';

export default function Home() {
  // Redirigir al login si no está autenticado
  redirect('/login');
}
