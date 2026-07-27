export const dynamic = 'force-dynamic';
import { getUser as auth } from '@/lib/user';
import { redirect } from 'next/navigation';
import { DashboardNavbar } from '@/components/layout/DashboardNavbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  // Extract GitHub username if connected
  const githubUsername = session.githubConnections?.[0]?.username ?? null;

  return (
    <div className="min-h-screen bg-[#07111F] flex flex-col">
      <DashboardNavbar user={session} githubUsername={githubUsername} />
      <main
        id="main-content"
        className="flex-1 w-full max-w-[1360px] mx-auto px-6 py-6 flex flex-col justify-between"
      >
        {children}
      </main>
    </div>
  );
}
