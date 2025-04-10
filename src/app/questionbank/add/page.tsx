"use client";

import { useState } from "react";
import {FiPlus, FiTrash2, FiChevronRight, FiSave} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RichTextEditor from "@/utils/richtext-editor";

type SubSubQuestion = {
    label: string;
    question: string;
    marks: string;
};

type SubQuestion = {
    label: string;
    question: string;
    marks: string;
    subsubquestions?: SubSubQuestion[];
};

type QuestionData = {
    title?: string;
    marks?: string;
    subquestions?: SubQuestion[];
    year?: number;
    paperComponent?: number;
    componentSection?: string;
    level?: string;
    session?: string;
    courseInfo?: string;
    courseCode?: string;
    questionNumber?: number;
    markscheme?: string;
};

export default function QuestionForm() {
    const [questionData, setQuestionData] = useState<QuestionData>({
        title: "",
        marks: "",
        subquestions: [],
        courseInfo: JSON.stringify({ courseName: "Computer Science", courseCode: "100132" }),
        year: new Date().getFullYear() - 1,
        session: "M",
        level: "SL",
        paperComponent: 1,
        componentSection: "",
        questionNumber: 1,
        markscheme: ""
    });

    const getSubLabel = (index: number) => `(${String.fromCharCode(97 + index)})`;
    const getSubSubLabel = (index: number) => `(${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][index]})`;

    const updateLabels = (subquestions: SubQuestion[]) => {
        return subquestions.map((sub, subIndex) => ({
            ...sub,
            label: getSubLabel(subIndex),
            subsubquestions: sub.subsubquestions
                ? sub.subsubquestions.map((subsub, subSubIndex) => ({
                    ...subsub,
                    label: getSubSubLabel(subSubIndex)
                }))
                : []
        }));
    };

    const addSubquestion = () => {
        setQuestionData((prev) => {
            const updatedSubquestions = [
                ...(prev.subquestions || []),
                { label: "", question: "", marks: "", subsubquestions: [] }
            ];
            return { ...prev, subquestions: updateLabels(updatedSubquestions) };
        });
    };

    const removeSubquestion = (index: number) => {
        setQuestionData((prev) => {
            const updatedSubquestions = prev.subquestions?.filter((_, i) => i !== index) || [];
            return { ...prev, subquestions: updateLabels(updatedSubquestions) };
        });
    };

    const addSubSubquestion = (subIndex: number) => {
        setQuestionData((prev) => {
            const updatedSubquestions = prev.subquestions?.map((sub, idx) => {
                if (idx !== subIndex) return sub;
                const newSubsubquestions = [...(sub.subsubquestions || []), { label: "", question: "", marks: "" }];
                return { ...sub, subsubquestions: updateLabels([{ ...sub, subsubquestions: newSubsubquestions }])[0].subsubquestions };
            }) || [];
            return { ...prev, subquestions: updatedSubquestions };
        });
    };

    const removeSubSubquestion = (subIndex: number, subSubIndex: number) => {
        setQuestionData((prev) => {
            const updatedSubquestions = prev.subquestions?.map((sub, idx) => {
                if (idx !== subIndex) return sub;
                const filteredSubsub = sub.subsubquestions?.filter((_, i) => i !== subSubIndex) || [];
                return { ...sub, subsubquestions: updateLabels([{ ...sub, subsubquestions: filteredSubsub }])[0].subsubquestions };
            }) || [];
            return { ...prev, subquestions: updatedSubquestions };
        });
    };

    const handleChange = (field, value) => {
        setQuestionData({ ...questionData, [field]: value });
    };

    const handleSubquestionChange = (
        index: number,
        field: keyof SubQuestion,
        value: string
    ) => {
        setQuestionData((prev) => {
            const updatedSubquestions = [...(prev.subquestions || [])];
            const target = updatedSubquestions[index];

            if (field === "subsubquestions") {
                // Avoid accidental assignment
                console.warn("Invalid assignment: subsubquestions expects an array.");
            } else {
                // Assign normally
                updatedSubquestions[index] = {
                    ...target,
                    [field]: value,
                };
            }

            return { ...prev, subquestions: updateLabels(updatedSubquestions) };
        });
    };

    const handleSubSubquestionChange = (subIndex: number, subSubIndex: number, field: keyof SubSubQuestion, value: string) => {
        setQuestionData((prev) => {
            const updatedSubquestions = [...(prev.subquestions || [])];
            if (updatedSubquestions[subIndex].subsubquestions) {
                updatedSubquestions[subIndex].subsubquestions![subSubIndex][field] = value;
            }
            return { ...prev, subquestions: updateLabels(updatedSubquestions) };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/saveQuestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...questionData,
                    courseInfo: JSON.parse(questionData.courseInfo as string),
                }),
            });

            if (response.ok) {
                toast.success("Question saved successfully! 🎉", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

                // Only reset question-specific fields, keep metadata
                setQuestionData(prev => ({
                    ...prev,
                    title: "",
                    marks: "",
                    subquestions: []
                }));
            } else {
                const errorData = await response.json();
                toast.error(`Failed to save question: ${errorData.message}`, {
                    position: "top-right",
                });
            }
        } catch (error) {
            toast.error("Network error - please try again later", {
                position: "top-right",
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg shadow-sm">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <FiChevronRight className="text-blue-600" />
                Question Builder
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Course Name Dropdown */}
                    <div className="bg-white p-4 rounded-lg shadow-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                        <select
                            value={questionData.courseInfo}
                            onChange={(e) => handleChange("courseInfo", e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                        >
                            <option value='{ "courseName": "Computer Science", "courseCode": "100132" }'>IB Computer Science</option>
                        </select>
                    </div>

                    {/** Metadata Section **/}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Session Year Dropdown */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session Year</label>
                            <select
                                value={questionData.year} // Now properly initialized
                                onChange={(e) => handleChange("year", e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                            >
                                {Array.from({ length: new Date().getFullYear() - 2010 }, (_, i) => {
                                    const year = 2010 + i;
                                    return <option key={year} value={year}>{year}</option>;
                                })}
                            </select>
                        </div>

                        {/* Session Month Radio */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="session"
                                        value="M"
                                        checked={questionData.session === 'M'}
                                        onChange={(e) => handleChange("session", e.target.value)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">May</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="session"
                                        value="N"
                                        checked={questionData.session === 'N'}
                                        onChange={(e) => handleChange("session", e.target.value)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">November</span>
                                </label>
                            </div>
                        </div>

                        {/* Paper Component */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Paper Component</label>
                            <input
                                type="number"
                                min="1"
                                max="3"
                                value={questionData.paperComponent}
                                onChange={(e) => handleChange("paperComponent", e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                                placeholder="1-3"
                            />
                        </div>

                        {/* Level Radio Buttons */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="level"
                                        value="SL"
                                        checked={questionData.level === 'SL'}
                                        onChange={(e) => handleChange("level", e.target.value)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">SL</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="level"
                                        value="HL"
                                        checked={questionData.level === 'HL'}
                                        onChange={(e) => handleChange("level", e.target.value)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">HL</span>
                                </label>
                            </div>
                        </div>

                        {/* Paper Section */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                            <input
                                type="text"
                                value={questionData.componentSection}
                                onChange={(e) => handleChange("componentSection", e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                                placeholder="A"
                            />
                        </div>

                        {/* Question Number */}
                        <div className="bg-white p-4 rounded-lg shadow-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Number</label>
                            <input
                                type="number"
                                value={questionData.questionNumber}
                                onChange={(e) => handleChange("questionNumber", e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                                placeholder="1"
                            />
                        </div>

                    </div>


                    {/** Question Start **/}
                    <div className="bg-white p-4 rounded-lg shadow-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Main Question</label>
                        <input
                            type="text"
                            value={questionData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                            placeholder="Enter main question title"
                        />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-xs">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                        <input
                            type="number"
                            value={questionData.marks}
                            onChange={(e) => handleChange("marks", e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-700"
                            placeholder="Enter total marks"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Sub-Questions</h3>
                        <button
                            type="button"
                            onClick={addSubquestion}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="text-lg" />
                            Add Sub-Question
                        </button>
                    </div>

                    {questionData.subquestions?.map((sub, subIndex) => (
                        <div key={subIndex} className="bg-white p-4 rounded-lg shadow-xs border-l-4 border-blue-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="font-medium text-blue-600">{sub.label}</span>
                                <button
                                    type="button"
                                    onClick={() => removeSubquestion(subIndex)}
                                    className="ml-auto p-2 hover:bg-red-50 rounded-full text-red-500 hover:text-red-700"
                                    aria-label="Remove sub-question"
                                >
                                    <FiTrash2 className="text-lg" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Sub-question text"
                                    value={sub.question}
                                    onChange={(e) => handleSubquestionChange(subIndex, "question", e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 text-gray-700"
                                />
                                <input
                                    type="number"
                                    placeholder="Marks"
                                    value={sub.marks}
                                    onChange={(e) => handleSubquestionChange(subIndex, "marks", e.target.value)}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 text-gray-700"
                                />
                            </div>

                            <div className="mt-4 ml-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Sub-sub-questions</span>
                                    <button
                                        type="button"
                                        onClick={() => addSubSubquestion(subIndex)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                    >
                                        <FiPlus className="text-sm" />
                                        Add Child
                                    </button>
                                </div>

                                {sub.subsubquestions?.map((subsub, subSubIndex) => (
                                    <div key={subSubIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm font-medium text-gray-600">{subsub.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSubSubquestion(subIndex, subSubIndex)}
                                                className="ml-auto p-1.5 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600"
                                                aria-label="Remove sub-sub-question"
                                            >
                                                <FiTrash2 className="text-sm" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Sub-subquestion text"
                                            value={subsub.question}
                                            onChange={(e) => handleSubSubquestionChange(subIndex, subSubIndex, "question", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 mb-2 text-gray-700"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Marks"
                                            value={subsub.marks}
                                            onChange={(e) => handleSubSubquestionChange(subIndex, subSubIndex, "marks", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 text-gray-700"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-xs text-gray-700">
                    <h3 className="text-lg font-semibold text-gray-700">Markscheme</h3>

                    {/* Rich Text Editor for Input */}
                    <RichTextEditor
                        value={questionData.markscheme as string}
                        onChange={(content) => setQuestionData({ ...questionData, markscheme: content })}
                    />

                    {/* Render the formatted HTML output */}
                    <div className="mt-4 p-2 border rounded bg-gray-100 text-gray-700"
                         dangerouslySetInnerHTML={{ __html: questionData.markscheme as string }} />
                </div>

                <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <FiSave className="text-lg" />
                    Save Question
                </button>

                {/**
                 <button
                    type="button"
                    onClick={() => setQuestionData({
                        year: new Date().getFullYear(),
                        session: 'M',
                        paperComponent: 1,
                        level: 'SL',
                        title: "",
                        marks: "",
                        subquestions: []
                    })}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    <FiFilePlus className="mr-2" />
                    Reset
                </button>
                **/}
            </form>
        </div>
    );
}
