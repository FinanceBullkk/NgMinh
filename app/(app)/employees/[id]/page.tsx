import { ProfileView } from "@/components/profile/profile-view";

// Profile page: thin server shell — reads params only, no DB calls here.
// All data is fetched client-side via ProfileView → fetchProfile() → Supabase (browser→DB).
// This keeps the profile off the SSR serverless path, identical to the Feed pattern.
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileView employeeId={id} />;
}
