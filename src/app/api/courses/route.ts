import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const questionsDir = path.join(process.cwd(), 'public', 'questions');

        if (!fs.existsSync(questionsDir)) {
            return NextResponse.json([]);
        }

        const courses = fs.readdirSync(questionsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to load courses' },
            { status: 500 }
        );
    }
}