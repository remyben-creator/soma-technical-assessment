import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// Helper to check for circular dependencies using DFS
type VisitMap = { [id: number]: boolean };
async function hasCycle(fromId: number, toId: number): Promise<boolean> {
  // Check if fromId is reachable from toId
  const stack = [toId];
  const visited: VisitMap = {};
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited[current]) continue;
    visited[current] = true;
    if (current === fromId) return true; // cycle detected
    const deps = await prisma.taskDependency.findMany({
      where: { fromId: current },
      select: { toId: true },
    });
    for (const dep of deps) {
      stack.push(dep.toId);
    }
  }
  return false;
}

// GET: Get dependencies and dependents for a task
export async function GET(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  try {
    const dependencies = await prisma.taskDependency.findMany({
      where: { fromId: id },
      include: { to: true },
    });
    const dependents = await prisma.taskDependency.findMany({
      where: { toId: id },
      include: { from: true },
    });
    return NextResponse.json({
      dependencies: dependencies.map((d: any) => d.to),
      dependents: dependents.map((d: any) => d.from),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching dependencies' }, { status: 500 });
  }
}

// POST: Add a dependency to a task
export async function POST(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { dependencyId } = body;
    const depId = parseInt(dependencyId);
    if (isNaN(depId) || depId === id) {
      return NextResponse.json({ error: 'Invalid dependency ID' }, { status: 400 });
    }
    // Prevent circular dependencies
    if (await hasCycle(id, depId)) {
      return NextResponse.json({ error: 'Adding this dependency would create a circular dependency.' }, { status: 400 });
    }
    // Create the dependency
    await prisma.taskDependency.create({
      data: { fromId: id, toId: depId },
    });
    return NextResponse.json({ message: 'Dependency added' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding dependency' }, { status: 500 });
  }
}

// DELETE: Remove a dependency from a task
export async function DELETE(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { dependencyId } = body;
    const depId = parseInt(dependencyId);
    if (isNaN(depId)) {
      return NextResponse.json({ error: 'Invalid dependency ID' }, { status: 400 });
    }
    await prisma.taskDependency.delete({
      where: { fromId_toId: { fromId: id, toId: depId } },
    });
    return NextResponse.json({ message: 'Dependency removed' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error removing dependency' }, { status: 500 });
  }
}
