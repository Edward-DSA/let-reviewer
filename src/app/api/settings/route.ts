import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' }
    });
    return NextResponse.json({
      appName: settings?.appName || 'LET Reviewer',
      logoUrl: settings?.logoUrl || '',
      examTimerSeconds: settings?.examTimerSeconds || 1800
    });
  } catch (err) {
    return NextResponse.json({ appName: 'LET Reviewer', logoUrl: '', examTimerSeconds: 1800 });
  }
}
