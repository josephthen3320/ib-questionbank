"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

type SubSubQuestion = {
    label: string;
    question: string;
    marks: string;
    markscheme?: string;
};

type SubQuestion = {
    label: string;
    question: string;
    marks: string;
    subsubquestions: SubSubQuestion[];
    markscheme?: string;
};

type Question = {
    courseName: string;
    courseCode: string;
    year: number;
    session: string;
    level: string;
    paperComponent: string;
    componentSection: string;
    questionNumber: string;
    title: string;
    marks: string;
    subquestions: SubQuestion[];
    id: string;
};

export default function QuestionBank() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);
    const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
    const [editMode, setEditMode] = useState<Record<string, boolean>>({});
    const [editedQuestions, setEditedQuestions] = useState<Record<string, Question>>({});

    // Filter states
    const [filters, setFilters] = useState({
        courseCode: "",
        year: "",
        session: "",
        paperComponent: "",
        searchQuery: ""
    });

    // Available options for filters
    const [filterOptions, setFilterOptions] = useState({
        courseCodes: [] as string[],
        years: [] as number[],
        sessions: [] as string[],
        paperComponents: [] as string[]
    });

    // Load available courses
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const response = await fetch('/api/courses');
                if (!response.ok) throw new Error('Failed to fetch courses');
                const courses = await response.json();
                setAvailableCourses(courses);
                if (courses.length > 0) {
                    setSelectedCourse(courses[0]);
                }
            } catch (err) {
                setError("Failed to load courses: " + err);
            }
        };
        loadCourses();
    }, []);

    // Load questions when course changes
    useEffect(() => {
        if (!selectedCourse) return;

        const loadQuestions = async () => {
            try {
                const response = await fetch(`/api/questions/${selectedCourse}`);
                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setQuestions(data);
                setFilteredQuestions(data);
                setExpandedQuestions(Object.fromEntries(data.map((q: Question) => [q.id, false])));

                // Update filter options based on loaded questions
                setFilterOptions({
                    courseCodes: Array.from(new Set(data.map((q: Question) => q.courseCode))),
                    years: (Array.from(new Set(data.map((q: Question) => q.year))) as number[]).sort((a, b) => b - a),
                    sessions: Array.from(new Set(data.map((q: Question) => q.session))),
                    paperComponents: Array.from(new Set(data.map((q: Question) => q.paperComponent)))
                });

            } catch (err) {
                setError("Failed to load questions");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadQuestions();
    }, [selectedCourse]);

    // Apply filters whenever filters state changes
    useEffect(() => {
        const filtered = questions.filter(question => {
            // Course filter (using selectedCourse from the main dropdown)
            const matchesCourse = filters.courseCode === "" || question.courseCode === filters.courseCode;

            // Year filter
            const matchesYear = filters.year === "" || question.year.toString() === filters.year;

            // Session filter
            const matchesSession = filters.session === "" || question.session === filters.session;

            // Paper component filter
            const matchesPaperComponent = filters.paperComponent === "" || question.paperComponent === filters.paperComponent;

            // Search functionality
            let matchesSearch = true;
            if (filters.searchQuery) {
                const searchTerm = filters.searchQuery.toLowerCase();
                matchesSearch = (
                    question.title.toLowerCase().includes(searchTerm) ||
                    question.subquestions.some(subq =>
                        subq.question.toLowerCase().includes(searchTerm) ||
                        subq.subsubquestions.some(subsubq =>
                            subsubq.question.toLowerCase().includes(searchTerm)
                        )
                    )
                );
            }

            return matchesCourse && matchesYear && matchesSession && matchesPaperComponent && matchesSearch;
        });
        setFilteredQuestions(filtered);
    }, [filters, questions]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            searchQuery: "",
            courseCode: "",
            year: "",
            session: "",
            paperComponent: ""
        });
        // Optionally reset to show all questions from the selected course
        setFilteredQuestions(questions);
    };

    const toggleExpand = (questionId: string) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const toggleEditMode = (questionId: string) => {
        setEditMode(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));

        if (!editMode[questionId]) {
            const questionToEdit = questions.find(q => q.id === questionId);
            if (questionToEdit) {
                setEditedQuestions(prev => ({
                    ...prev,
                    [questionId]: JSON.parse(JSON.stringify(questionToEdit)) // Deep copy
                }));
            }
        }
    };

    const handleQuestionChange = (questionId: string, field: string, value: unknown) => {
        setEditedQuestions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
    };

    const handleSubquestionChange = (
        questionId: string,
        subIndex: number,
        field: string,
        value: unknown
    ) => {
        setEditedQuestions(prev => {
            const updatedQuestion = {...prev[questionId]};
            updatedQuestion.subquestions[subIndex] = {
                ...updatedQuestion.subquestions[subIndex],
                [field]: value
            };
            return {
                ...prev,
                [questionId]: updatedQuestion
            };
        });
    };

    const handleSubSubquestionChange = (
        questionId: string,
        subIndex: number,
        subSubIndex: number,
        field: string,
        value: unknown
    ) => {
        setEditedQuestions(prev => {
            const updatedQuestion = {...prev[questionId]};
            updatedQuestion.subquestions[subIndex].subsubquestions[subSubIndex] = {
                ...updatedQuestion.subquestions[subIndex].subsubquestions[subSubIndex],
                [field]: value
            };
            return {
                ...prev,
                [questionId]: updatedQuestion
            };
        });
    };

    const saveQuestion = async (questionId: string) => {
        try {
            // In a real app, you would make an API call to save the question
            const editedQuestion = editedQuestions[questionId];
            setQuestions(prev =>
                prev.map(q => (q.id === questionId ? editedQuestion : q))
            );
            setEditMode(prev => ({...prev, [questionId]: false}));
        } catch (err) {
            console.error("Failed to save question:", err);
            setError("Failed to save question");
        }
    };

    const deleteQuestion = async (questionId: string) => {
        if (confirm("Are you sure you want to delete this question?")) {
            try {
                // In a real app, you would make an API call to delete the question
                setQuestions(prev => prev.filter(q => q.id !== questionId));
            } catch (err) {
                console.error("Failed to delete question:", err);
                setError("Failed to delete question");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Question Bank</h1>
                <Link
                    href="/questionbank/add"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Add New Question
                </Link>
            </div>

            {/* Course Selection */}
            <div className="mb-6">
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Course:
                </label>
                <select
                    id="course-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="block w-full max-w-xs p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    disabled={loading}
                >
                    {availableCourses.map(course => (
                        <option key={course} value={course}>{course}</option>
                    ))}
                </select>
            </div>

            {/* Filter Section */}
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Filters</h2>

                {/* Add search bar at the top */}
                <div className="mb-4">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search Questions
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="search"
                            name="searchQuery"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({...prev, searchQuery: e.target.value }))}
                            placeholder="Search question content..."
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/** Course Code Filter }
                    <div>
                        <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course
                        </label>
                        <select
                            id="courseCode"
                            name="courseCode"
                            value={filters.courseCode}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">All Courses</option>
                            {filterOptions.courseCodes.map(code => {
                                const course = questions.find(q => q.courseCode === code);
                                return (
                                    <option key={code} value={code}>
                                        {course?.courseName || code} {/* Show name if available }
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    **/}

                    {/* Year Filter */}
                    <div>
                        <label htmlFor="year"
                               className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Year
                        </label>
                        <select
                            id="year"
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">All Years</option>
                            {filterOptions.years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Session Filter */}
                    <div>
                        <label htmlFor="session"
                               className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Session
                        </label>
                        <select
                            id="session"
                            name="session"
                            value={filters.session}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">All Sessions</option>
                            {filterOptions.sessions.map(session => (
                                <option key={session} value={session}>{session}</option>
                            ))}
                        </select>
                    </div>

                    {/* Paper Component Filter */}
                    <div>
                        <label htmlFor="paperComponent"
                               className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Paper Component
                        </label>
                        <select
                            id="paperComponent"
                            name="paperComponent"
                            value={filters.paperComponent}
                            onChange={handleFilterChange}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                        >
                            <option value="">All Components</option>
                            {filterOptions.paperComponents.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={resetFilters}
                        className="px-3 py-1 text-gray-700 dark:text-gray-300 border border-gray-300 rounded-lg mr-2"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredQuestions.length} of {questions.length} questions
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No questions match your filters.
                    </div>
                ) : (
                    filteredQuestions.map(question => (
                        <QuestionItem
                            key={question.id}
                            question={question}
                            expanded={expandedQuestions[question.id]}
                            editMode={editMode[question.id]}
                            editedQuestion={editedQuestions[question.id]}
                            onToggleExpand={() => toggleExpand(question.id)}
                            onToggleEdit={() => toggleEditMode(question.id)}
                            onSave={() => saveQuestion(question.id)}
                            onDelete={() => deleteQuestion(question.id)}
                            onQuestionChange={(field, value) => handleQuestionChange(question.id, field, value)}
                            availableCourses={availableCourses}
                            allQuestions={questions}
                            // ... pass other necessary props for subquestion handling
                        />
                    ))
                )}
            </div>
        </div>
    );


    // Update the QuestionItem component to show courseName instead of courseCode
    function QuestionItem(
        {
            question, expanded,
            editMode, editedQuestion,
            onToggleExpand, onToggleEdit,
            onSave, onDelete, onQuestionChange,
            availableCourses, allQuestions
        }: {
        question: Question;
        expanded: boolean;
        editMode: boolean;
        editedQuestion: Question;
        onToggleExpand: () => void;
        onToggleEdit: () => void;
        onSave: () => void;
        onDelete: () => void;
        onQuestionChange: (field: string, value: unknown) => void;
        availableCourses: string[];
        allQuestions: Question[];
    }) {
        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                {editMode ? (
                    /* Edit Mode - Keep course code for internal use */
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course:
                                </label>
                                <select
                                    value={editedQuestion.courseCode}
                                    onChange={(e) => onQuestionChange("courseCode", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                >
                                    {availableCourses.map(code => {
                                        const course = allQuestions.find(q => q.courseCode === code);
                                        return (
                                            <option key={code} value={code}>
                                                {course?.courseName || code}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Question Number:
                                </label>
                                <input
                                    type="text"
                                    value={editedQuestion.questionNumber}
                                    onChange={(e) => onQuestionChange("questionNumber", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title:
                            </label>
                            <textarea
                                value={editedQuestions[question.id]?.title || ""}
                                onChange={(e) => handleQuestionChange(question.id, "title", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Marks:
                            </label>
                            <input
                                type="text"
                                value={editedQuestions[question.id]?.marks || ""}
                                onChange={(e) => handleQuestionChange(question.id, "marks", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                            />
                        </div>

                        {/* Subquestions */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-800 dark:text-white">Subquestions</h3>
                            {editedQuestions[question.id]?.subquestions.map((subq, subIndex) => (
                                <div key={subIndex} className="border-l-2 border-gray-300 pl-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Label:
                                            </label>
                                            <input
                                                type="text"
                                                value={subq.label}
                                                onChange={(e) => handleSubquestionChange(question.id, subIndex, "label", e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Marks:
                                            </label>
                                            <input
                                                type="text"
                                                value={subq.marks}
                                                onChange={(e) => handleSubquestionChange(question.id, subIndex, "marks", e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Question:
                                        </label>
                                        <textarea
                                            value={subq.question}
                                            onChange={(e) => handleSubquestionChange(question.id, subIndex, "question", e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                            rows={2}
                                        />
                                    </div>

                                    {/* Sub-subquestions */}
                                    <div className="space-y-2 pl-4">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Sub-subquestions</h4>
                                        {subq.subsubquestions.map((subsubq, subSubIndex) => (
                                            <div key={subSubIndex} className="border-l-2 border-gray-200 pl-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Label:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={subsubq.label}
                                                            onChange={(e) => handleSubSubquestionChange(question.id, subIndex, subSubIndex, "label", e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Marks:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={subsubq.marks}
                                                            onChange={(e) => handleSubSubquestionChange(question.id, subIndex, subSubIndex, "marks", e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <label
                                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Question:
                                                    </label>
                                                    <textarea
                                                        value={subsubq.question}
                                                        onChange={(e) => handleSubSubquestionChange(question.id, subIndex, subSubIndex, "question", e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={onToggleEdit}
                                className="px-3 py-1 text-gray-700 dark:text-gray-300 border border-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSave}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    /* View Mode - Show course name to users */
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {question.courseName} - Question {question.questionNumber}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">{question.title}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {question.marks} marks
                </span>
                                    <span className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {question.level}
                </span>
                                    <span className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {question.year} {question.session}
                </span>
                                    <span className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  Paper {question.paperComponent}
                </span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={onToggleEdit}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={onToggleExpand}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                >
                                    {expanded ? "Collapse" : "Expand"}
                                </button>
                            </div>
                        </div>

                        {expanded && (
                            <div className="mt-4 space-y-4">
                                {question.subquestions.map((subq, subIndex) => (
                                    <div key={subIndex} className="border-l-2 border-gray-300 pl-4">
                                        <div className="flex items-start">
                                            <span className="font-medium mr-2">{subq.label}</span>
                                            <div>
                                                <p>{subq.question}</p>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                        {subq.marks} marks
                      </span>
                                            </div>
                                        </div>

                                        {subq.subsubquestions.length > 0 && (
                                            <div className="ml-4 space-y-2 mt-2">
                                                {subq.subsubquestions.map((subsubq, subSubIndex) => (
                                                    <div key={subSubIndex} className="border-l-2 border-gray-200 pl-4">
                                                        <div className="flex items-start">
                                                            <span className="font-medium mr-2">{subsubq.label}</span>
                                                            <div>
                                                                <p>{subsubq.question}</p>
                                                                <span
                                                                    className="text-sm text-gray-500 dark:text-gray-400">
                                {subsubq.marks} marks
                              </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}