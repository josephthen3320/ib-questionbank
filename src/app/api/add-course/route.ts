import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    const { courseName, courseCode, courseType } = await req.json();

    if (!courseName || !courseCode || !courseType) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const basePath = path.join(process.cwd(), 'public', 'questions', courseType, courseCode);
    try {
        fs.mkdirSync(basePath, { recursive: true });
        return NextResponse.json({ message: 'Directory created' });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create directory' }, { status: 500 });
    }
}