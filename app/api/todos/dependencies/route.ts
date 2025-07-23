import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dependencies = await prisma.taskDependency.findMany({
      select: { fromId: true, toId: true },
    });
    return NextResponse.json(dependencies);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}