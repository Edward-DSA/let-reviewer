import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    const questions = await prisma.question.findMany();

    return NextResponse.json({
      success: true,
      data: {
        categories,
        questions,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to sync data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Sync results from the student app back to the server
  try {
    const { results } = await request.json();
    
    if (results && Array.isArray(results)) {
      // Basic implementation: just insert them
      // In a real app, you'd want to check if they already exist
      for (const res of results) {
        await prisma.result.create({
          data: {
            studentName: res.studentName,
            categoryId: res.categoryId,
            score: res.score,
            total: res.total,
            createdAt: new Date(res.createdAt),
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to sync results' }, { status: 500 });
  }
}
