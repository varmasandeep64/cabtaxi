import { redirect } from 'next/navigation';

// The old mock-data history page was replaced by /ride-history (real data from Supabase).
// Kept as a redirect so old links still work. You can delete this folder.
export default function HistoryRedirect() {
  redirect('/ride-history');
}
