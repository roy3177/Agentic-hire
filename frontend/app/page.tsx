"use client";

import React, { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import axios from 'axios';
import {
    UploadCloud,
    FileText,
    CheckCircle2,
    Loader2,
    X,
    Eye,
    Briefcase,
    BrainCircuit,
    AlertCircle,
    TrendingUp,
    AlertTriangle,
    XCircle
} from 'lucide-react';

// --- Interfaces ---

interface CandidateEvaluation {
    candidate_name: string;
    score: number;
    key_strengths: string[];
    concerns: string[];
    reasoning: string;
    final_recommendation: 'Strong Hire' | 'Hire' | 'Caution' | 'Reject';
}

interface Task {
    id: string;
    filename: string;
    status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
    data: CandidateEvaluation | null;
}

export default function AgenticDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluation | null>(null);
    const [jobDescription, setJobDescription] = useState<string>("");

    // UI State for Drag & Drop
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // --- Core Upload Logic (Reusable for both Drop and Click) ---
    const processFiles = async (filesArray: File[]) => {
        if (!jobDescription.trim()) {
            alert("Please enter a Job Description first.");
            return;
        }

        if (filesArray.length === 0) return;

        // Optimistic UI
        const newTasks: Task[] = [];
        for (const file of filesArray) {
            const tempId = Math.random().toString(36).substr(2, 9);
            newTasks.push({
                id: tempId,
                filename: file.name,
                status: 'uploading',
                data: null
            });
        }
        setTasks(prev => [...prev, ...newTasks]);

        // Upload Loop
        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_description', jobDescription);

            try {
                const response = await axios.post('/api/analyze', formData);
                const { session_id } = response.data;

                setTasks(prev => prev.map(t =>
                    t.filename === file.name && t.status === 'uploading'
                        ? { ...t, id: session_id, status: 'pending' }
                        : t
                ));
            } catch (error) {
                console.error("Upload failed", error);
                setTasks(prev => prev.map(t => t.filename === file.name ? { ...t, status: 'failed' } : t));
            }
        }
    };

    // --- Event Handlers ---

    // 1. Handle Click Upload
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
        e.target.value = ""; // Reset input
    };

    // 2. Handle Drag Over (Must prevent default to allow drop)
    const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        if (!jobDescription.trim()) return; // Don't show active state if disabled
        setIsDragging(true);
    };

    // 3. Handle Drag Leave
    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    // 4. Handle Drop
    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (!jobDescription.trim()) {
            alert("Please enter a Job Description first.");
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    // --- Polling Logic ---
    useEffect(() => {
        const interval = setInterval(async () => {
            const activeTasks = tasks.filter(t => ['pending', 'processing'].includes(t.status));
            if (activeTasks.length === 0) return;

            for (const task of activeTasks) {
                try {
                    const res = await axios.get(`/api/status/${task.id}`);
                    if (res.data.status !== task.status || (res.data.status === 'completed' && !task.data)) {
                        setTasks(prev => prev.map(t => {
                            if (t.id === task.id) {
                                return {
                                    ...t,
                                    status: res.data.status,
                                    data: res.data.result
                                };
                            }
                            return t;
                        }));
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [tasks]);

    // Derived State
    const completedTasks = tasks
        .filter(t => t.status === 'completed' && t.data)
        .sort((a, b) => (b.data?.score || 0) - (a.data?.score || 0));

    const activeTasks = tasks.filter(t => ['pending', 'processing', 'uploading'].includes(t.status));

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <BrainCircuit className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                Agentic<span className="text-indigo-600">Hire</span>
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            AI Recruitment Copilot
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                {/* Section 1: Job Context & Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Job Description Input */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Job Context</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                            Paste the full job description here. The agents will use this to score candidates.
                        </p>
                        <textarea
                            className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm leading-relaxed transition-all"
                            placeholder="e.g. Senior Python Developer with 5+ years of experience in FastAPI and Celery..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        ></textarea>
                    </div>

                    {/* File Upload Area */}
                    <div className="lg:col-span-1 h-full">
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full h-full min-h-[240px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                                !jobDescription.trim()
                                    ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                                    : isDragging
                                        ? 'bg-indigo-50 border-indigo-500 scale-[1.02] shadow-lg ring-4 ring-indigo-100' // Visual feedback when dragging
                                        : 'bg-indigo-50/30 border-indigo-300 hover:bg-indigo-50 hover:border-indigo-500 hover:scale-[1.02]'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-6 pointer-events-none">
                                <div className={`p-4 rounded-full mb-4 transition-colors ${
                                    !jobDescription.trim() ? 'bg-gray-200' : isDragging ? 'bg-indigo-200' : 'bg-indigo-100'
                                }`}>
                                    <UploadCloud className={`w-8 h-8 ${!jobDescription.trim() ? 'text-gray-400' : 'text-indigo-600'}`} />
                                </div>
                                <p className="mb-2 text-lg font-semibold text-gray-700">
                                    {isDragging ? 'Drop files now' : 'Upload CVs'}
                                </p>
                                <p className="text-xs text-gray-500 max-w-[200px]">
                                    {!jobDescription.trim()
                                        ? 'Please define the Job Description first'
                                        : 'Drag & drop PDF or DOCX files here, or click to browse'}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.docx,.doc"
                                onChange={handleFileSelect} // Updated handler
                                disabled={!jobDescription.trim()}
                            />
                        </label>
                    </div>
                </div>

                {/* Section 2: Pipeline & Results */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                    {/* Live Pipeline (Active Tasks) */}
                    <div className="xl:col-span-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin-slow" />
                            Processing Queue ({activeTasks.length})
                        </h3>

                        <div className="space-y-3">
                            {activeTasks.map(task => (
                                <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-gray-900 truncate w-32">{task.filename}</span>
                                            <span className="text-xs text-gray-500 capitalize">{task.status}...</span>
                                        </div>
                                    </div>
                                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                </div>
                            ))}

                            {activeTasks.length === 0 && (
                                <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <p className="text-gray-400 text-sm">Queue is empty</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="xl:col-span-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed Analysis ({completedTasks.length})
                            </h3>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">Match Score</th>
                                        <th className="px-6 py-4">Recommendation</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {completedTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                No results yet. Upload resumes to start the agents.
                                            </td>
                                        </tr>
                                    ) : (
                                        completedTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                            {task.data?.candidate_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{task.data?.candidate_name}</div>
                                                            <div className="text-xs text-gray-500">{task.filename}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ScoreBadge score={task.data?.score || 0} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <RecommendationBadge rec={task.data?.final_recommendation || 'Caution'} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedCandidate(task.data)}
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Analysis Detail Modal */}
            {selectedCandidate && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate.candidate_name}</h2>
                                <p className="text-sm text-gray-500 mt-1">AI Agent Analysis Report</p>
                            </div>
                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto space-y-8">

                            {/* Summary Card */}
                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4" />
                                    Executive Summary
                                </h3>
                                <p className="text-indigo-900/80 leading-relaxed">
                                    {selectedCandidate.reasoning}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Strengths */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        Key Strengths
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedCandidate.key_strengths?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Concerns */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        Areas of Concern
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedCandidate.concerns?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setSelectedCandidate(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub Components ---

function ScoreBadge({ score }: { score: number }) {
    let colorClass = "bg-gray-100 text-gray-700 ring-gray-200";
    let Icon = XCircle;

    if (score >= 80) {
        colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-200";
        Icon = TrendingUp;
    } else if (score >= 60) {
        colorClass = "bg-amber-50 text-amber-700 ring-amber-200";
        Icon = AlertTriangle;
    } else {
        colorClass = "bg-rose-50 text-rose-700 ring-rose-200";
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ring-1 ring-inset ${colorClass}`}>
            <Icon className="w-3.5 h-3.5" />
            {score}%
        </span>
    );
}

function RecommendationBadge({ rec }: { rec: string }) {
    const map: Record<string, { text: string; styles: string }> = {
        'Strong Hire': { text: 'Strong Hire', styles: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        'Hire': { text: 'Hire', styles: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        'Caution': { text: 'Caution', styles: 'bg-amber-100 text-amber-700 border-amber-200' },
        'Reject': { text: 'Reject', styles: 'bg-rose-100 text-rose-700 border-rose-200' },
    };

    const config = map[rec] || map['Caution'];

    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${config.styles}`}>
            {config.text}
        </span>
    );
}