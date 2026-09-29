import { redirect } from 'next/navigation';

// The shopping list is now the home page; keep old links working.
export default function LegacyListPage() {
  redirect('/');
}
