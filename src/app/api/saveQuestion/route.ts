import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const { title, marks, subquestions, year, session, paperComponent, level, componentSection, courseInfo, questionNumber } = await req.json();

        // Validate required fields
        if (!title || !marks) {
            return NextResponse.json({ error: "Missing title or marks" }, { status: 400 });
        }

        if (!courseInfo || typeof courseInfo !== "object") {
            return NextResponse.json({ error: "Course info is missing or invalid" }, { status: 400 });
        }

        const { courseName, courseCode } = courseInfo;

        if (!courseName || !courseCode) {
            return NextResponse.json({ error: "Invalid courseInfo structure" }, { status: 400 });
        }

        // Generate a safe JSON file name
        const questionEncoding = `${session}${year}_${courseCode}_${level}_P${paperComponent}_${componentSection}_Q${questionNumber}`;
        const fileName = questionEncoding.replace(/\s+/g, "_").toLowerCase() + ".json";
        const filePath = path.join(process.cwd(), "public", "questions", courseCode, fileName);

        // Ensure the directory exists before writing the file
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Save the question as a JSON file
        const questionData = { courseName, courseCode, year, session, level, paperComponent, componentSection, questionNumber, title, marks, subquestions };
        await fs.promises.writeFile(filePath, JSON.stringify(questionData, null, 2));

        return NextResponse.json({ message: "Question saved successfully!", filePath }, { status: 200 });
    } catch (error) {
        console.error("Error saving question:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
