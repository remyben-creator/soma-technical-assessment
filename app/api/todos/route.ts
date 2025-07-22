import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received body:', body);
    const { title, dueDate } = body;
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const data: any = { title };
    if (dueDate && dueDate.trim() !== "") {
      // If dueDate is in YYYY-MM-DD format, convert to ISO-8601
      if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        data.dueDate = new Date(dueDate).toISOString();
      } else {
        data.dueDate = dueDate;
      }
    } else {
      data.dueDate = null;
    }

    // Fetch image from Pexels API proxy
    let imageURL = null;
    try {
      const imageRes = await fetch(`${request.url}/pexels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      });
      if (imageRes.ok) {
        const imageData = await imageRes.json();
        imageURL = imageData.imageUrl || null;
        console.log(imageURL)
      }
    } catch (e) {
      console.error('Failed to fetch image from Pexels:', e);
    }
    data.imageURL = imageURL;

    const todo = await prisma.todo.create({
      data,
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/todos:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Error creating todo', details: message }, { status: 500 });
  }
}