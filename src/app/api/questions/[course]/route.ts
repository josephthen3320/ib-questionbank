import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ course: string }> }
) {
    try {
        const questionsDir = path.join(process.cwd(), 'public', 'questions', (await params).course);

        if (!fs.existsSync(questionsDir)) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        const files = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));

        const questions = files.map(file => {
            const filePath = path.join(questionsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return {
                ...JSON.parse(fileContent),
                id: file.replace('.json', '')
            };
        });

        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to load questions' },
            { status: 500 }
        );
    }
}