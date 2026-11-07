import { redirect } from 'next/navigation';

// Class program pages are hidden for every role, including administrators.
export default function HiddenClassProgramsLayout() {
  redirect('/');
}
