import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let appName = 'LET Reviewer Hub';
  let logoUrl = '';

  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    appName = settings?.appName || 'LET Reviewer Hub';
    logoUrl = settings?.logoUrl || '';
  } catch (e) {
    console.error('Error fetching settings:', e);
  }

  return <HomeClient appName={appName} logoUrl={logoUrl} />;
}
