import { redirect } from 'next/navigation'

export default function BookIndexPage() {
  redirect('/patient/find-doctor')
}
