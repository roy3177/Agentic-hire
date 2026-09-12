/**
 * @author: Roy Meoded
 * @ date: 2026-09-12
 * @description: This is the API route for analyzing resumes. It acts as a proxy between the frontend and the backend.
 * In addition to forwarding the request, it also handles error responses from the backend and surfaces them to the frontend 
 * in a user-friendly manner.
 */


"use client";

import React, { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
    Layers,
    Languages,
    UploadCloud,
    FileText,
    CheckCircle2,
    Loader2,
    X,
    Eye,
    Briefcase,
    AlertCircle,
    TrendingUp,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { dashboardText } from '../i18n/translations';

// --- Interfaces ---
// Represents the evaluation result for a candidate, as returned by the backend:
interface CandidateEvaluation {
    candidate_name: string;
    score: number;
    key_strengths: string[];
    concerns: string[];
    reasoning: string;
    final_recommendation: 'Strong Hire' | 'Hire' | 'Caution' | 'Reject';
    // Structured flag the model sets explicitly (see backend/app/schemas.py)
    // -- only true for a genuine, unambiguous prompt-injection attempt, never
    // just a strong/impressive resume.
    injection_detected?: boolean;
}

// Represents a task in the upload/analysis pipeline:
interface Task {
    id: string;
    filename: string;
    status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
    data: CandidateEvaluation | null;
}

export default function AgenticDashboard() {
    const { language, toggleLanguage } = useLanguage();
    const t = dashboardText[language];

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluation | null>(null);
    const [jobDescription, setJobDescription] = useState<string>("");
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [injectionAlert, setInjectionAlert] = useState<CandidateEvaluation | null>(null);

    // UI State for Drag & Drop
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // --- Core Upload Logic (Reusable for both Drop and Click) ---
    const processFiles = async (filesArray: File[]) => {
        if (!jobDescription.trim()) {
            alert(t.jobDescriptionRequiredAlert);
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
            // Capture THIS file's own temp id (created above, one per file in
            // the same order) -- matching on it below, instead of on
            // filename+status, is what keeps two files with the same name
            // from being conflated. Before this fix, every card still sitting
            // at 'uploading' (i.e. every card whose own request hadn't
            // resolved yet) with a matching filename got overwritten with
            // whichever response came back first -- their real session_ids
            // were then never recorded, and polling kept re-fetching the same
            // one session for every such card.
            const tempId = newTasks[i].id;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_description', jobDescription);

            try {
                const response = await axios.post('/api/analyze', formData);
                const { session_id } = response.data;

                setTasks(prev => prev.map(t =>
                    t.id === tempId
                        ? { ...t, id: session_id, status: 'pending' }
                        : t
                ));
            } catch (error) {
                // This is an expected, handled failure (e.g. the backend
                // rejecting a multi-page resume) -- console.warn with just the
                // message, not console.error with the raw Error object, so
                // Next.js's dev overlay doesn't flag it as an unhandled "Issue"
                // (it tracks console.error calls carrying an Error instance).
                const logMessage = error instanceof Error ? error.message : String(error);
                console.warn("Upload failed:", logMessage);

                // Surface the backend's rejection reason (e.g. multi-page resume,
                // no extractable text) as a user-facing popup instead of letting
                // it show up only as a console error / dev overlay.
                let message: string = t.uploadErrorGeneric;
                if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
                    message = error.response.data.detail;
                }
                setUploadError(message);

                setTasks(prev => prev.map(t => t.id === tempId ? { ...t, status: 'failed' } : t));
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
            alert(t.jobDescriptionRequiredAlert);
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
                        // Pop the red alert exactly once, right when this result
                        // first lands as 'completed' -- checked against !task.data
                        // (the pre-update task) so a later unrelated re-render
                        // never re-triggers it for the same candidate.
                        if (res.data.status === 'completed' && !task.data && res.data.result?.injection_detected) {
                            setInjectionAlert(res.data.result);
                        }

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
                    // Same reasoning as the upload catch above: log just the
                    // message via console.warn, not the raw Error object via
                    // console.error, so a transient polling hiccup doesn't
                    // pop the Next.js dev overlay.
                    const logMessage = err instanceof Error ? err.message : String(err);
                    console.warn("Polling error:", logMessage);
                }
            }
        }, 1000); // was 2000ms -- halved so completed results show up to 1s sooner
        return () => clearInterval(interval);
    }, [tasks]);

    // Derived State
    const completedTasks = tasks
        .filter(t => t.status === 'completed' && t.data)
        .sort((a, b) => (b.data?.score || 0) - (a.data?.score || 0));

    // Active tasks are those that are still in the pipeline (not completed or failed):
    const activeTasks = tasks.filter(t => ['pending', 'processing', 'uploading'].includes(t.status));

    const avgScore = completedTasks.length > 0
        ? Math.round(completedTasks.reduce((sum, t) => sum + (t.data?.score || 0), 0) / completedTasks.length)
        : null;

    return (
        <div className="min-h-screen bg-slate-100 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/25">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">
                                Agentic Hire
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {t.tagline}
                            </div>
                            <button
                                onClick={toggleLanguage}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full px-3.5 py-1.5 transition-all duration-300 ease-in-out hover:bg-gray-50"
                            >
                                <Languages className="w-4 h-4" />
                                {language === 'en' ? 'עברית' : 'English'}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatTile icon={FileText} label={t.statTotalCandidates} value={tasks.length} accent="blue" />
                    <StatTile icon={Loader2} label={t.statInQueue} value={activeTasks.length} accent="sky" spin={activeTasks.length > 0} />
                    <StatTile icon={CheckCircle2} label={t.statCompleted} value={completedTasks.length} accent="emerald" />
                    <StatTile icon={TrendingUp} label={t.statAvgScore} value={avgScore !== null ? `${avgScore}%` : '—'} accent="cyan" />
                </div>

                {/* Section 1: Job Context & Upload */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Job Description Input */}
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 border border-white/60 p-6 transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-blue-500/10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-blue-50 p-1.5 rounded-lg">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">{t.jobContextTitle}</h2>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">
                            {t.jobContextSubtitle}
                        </p>
                        <textarea
                            className="w-full h-40 p-4 bg-slate-300 border border-slate-400 rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm leading-relaxed transition-all duration-300 ease-in-out text-gray-900 font-medium placeholder:text-gray-600 placeholder:font-normal"
                            placeholder={t.jobContextPlaceholder}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        ></textarea>
                        <div className="mt-2 text-end text-xs text-gray-400">
                            {jobDescription.trim().length} {t.charactersLabel}
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="lg:col-span-1 h-full">
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`group/upload flex flex-col items-center justify-center w-full h-full min-h-[240px] rounded-3xl cursor-pointer transition-all duration-300 ease-in-out ${
                                !jobDescription.trim()
                                    ? 'bg-slate-100 shadow-inner opacity-60 cursor-not-allowed'
                                    : isDragging
                                        ? 'bg-blue-50 scale-[1.02] shadow-xl shadow-blue-500/20 ring-2 ring-blue-300' // Visual feedback when dragging
                                        : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50/60 shadow-xl shadow-slate-200/60 border border-white/60 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-6 pointer-events-none">
                                <div className={`p-4 rounded-full mb-4 transition-all duration-300 ease-in-out ${
                                    !jobDescription.trim() ? 'bg-gray-200' : isDragging ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 scale-110' : 'bg-blue-100 shadow-sm group-hover/upload:scale-110 group-hover/upload:shadow-md'
                                }`}>
                                    <UploadCloud className={`w-8 h-8 transition-transform duration-300 ease-in-out ${!jobDescription.trim() ? 'text-gray-400' : isDragging ? 'text-white -translate-y-0.5' : 'text-blue-600 group-hover/upload:-translate-y-0.5'}`} />
                                </div>
                                <p className="mb-2 text-lg font-semibold text-gray-700">
                                    {isDragging ? t.uploadDropNow : t.uploadTitle}
                                </p>
                                <p className="text-xs text-gray-500 max-w-[200px]">
                                    {!jobDescription.trim()
                                        ? t.uploadDisabledHint
                                        : t.uploadHint}
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
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                    {/* Live Pipeline (Active Tasks) */}
                    <div className="xl:col-span-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Loader2 className="w-4 h-4" />
                            {t.processingQueueTitle} ({activeTasks.length})
                        </h3>

                        <div className="space-y-3">
                            {activeTasks.map(task => (
                                <div key={task.id} className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-xl shadow-slate-200/60 flex items-center justify-between group transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl animate-[slideUp_0.3s_ease-out]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <span className="text-sm font-medium text-gray-900 truncate w-32">{task.filename}</span>
                                            <span className="text-xs text-gray-500 mb-1">{t.statusLabels[task.status]}...</span>
                                            <div className="h-1 w-32 rounded-full bg-gray-100 overflow-hidden">
                                                <div className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,theme(colors.blue.200),theme(colors.blue.500),theme(colors.blue.200))] bg-[length:200%_100%] animate-[shimmer_1.4s_linear_infinite]" />
                                            </div>
                                        </div>
                                    </div>
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 ms-2" />
                                </div>
                            ))}

                            {activeTasks.length === 0 && (
                                <div className="text-center py-10 rounded-2xl bg-slate-100 shadow-inner">
                                    <p className="text-gray-400 text-sm">{t.queueEmpty}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="xl:col-span-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {t.completedAnalysisTitle} ({completedTasks.length})
                            </h3>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 border border-white/60 overflow-hidden transition-all duration-300 ease-in-out">
                            <div className="overflow-x-auto">
                                <table className="w-full text-start border-collapse">
                                    <thead>
                                    <tr className="bg-slate-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4 text-start">{t.tableCandidate}</th>
                                        <th className="px-6 py-4 text-start">{t.tableMatchScore}</th>
                                        <th className="px-6 py-4 text-start">{t.tableRecommendation}</th>
                                        <th className="px-6 py-4 text-end">{t.tableActions}</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {completedTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                {t.noResults}
                                            </td>
                                        </tr>
                                    ) : (
                                        completedTasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-blue-50/40 transition-colors duration-300 ease-in-out group animate-[slideUp_0.3s_ease-out]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
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
                                                <td className="px-6 py-4 text-end">
                                                    <button
                                                        onClick={() => setSelectedCandidate(task.data)}
                                                        className="text-gray-400 hover:text-blue-600 transition-all duration-300 ease-in-out p-2 rounded-full hover:bg-blue-50"
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
                <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col border border-gray-100 animate-[scaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)]">

                        {/* Modal Header */}
                        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden shrink-0">
                            <div className="absolute -top-16 -end-16 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -start-10 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl" />

                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="absolute top-5 end-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 ease-in-out"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>

                            <div className="relative flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white/10 shrink-0">
                                    {selectedCandidate.candidate_name?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        {t.modalReportSubtitle}
                                    </p>
                                    <h2 className="text-2xl font-bold text-white truncate">{selectedCandidate.candidate_name}</h2>
                                </div>
                            </div>

                            <div className="relative flex items-center gap-3 mt-6">
                                <ScoreGauge score={selectedCandidate.score || 0} />
                                <RecommendationBadge rec={selectedCandidate.final_recommendation} />
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/60">

                            {/* Summary Card */}
                            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm shadow-blue-100/50">
                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    {t.executiveSummary}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {selectedCandidate.reasoning}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="p-1.5 rounded-lg bg-emerald-50">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        </span>
                                        {t.keyStrengths}
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {selectedCandidate.key_strengths?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-emerald-50/60 p-3 rounded-xl border-s-4 border-emerald-400">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Concerns */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="p-1.5 rounded-lg bg-amber-50">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                        </span>
                                        {t.areasOfConcern}
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {selectedCandidate.concerns?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-amber-50/60 p-3 rounded-xl border-s-4 border-amber-400">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                            <button onClick={() => setSelectedCandidate(null)} className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-all duration-300 ease-in-out shadow-sm">
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Rejected Modal -- surfaces the backend's rejection reason
                (multi-page resume, unreadable file, etc.) as a clear popup
                instead of a silent console error. */}
            {uploadError && (
                <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-[scaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)] text-center">
                        <button
                            onClick={() => setUploadError(null)}
                            className="absolute top-4 end-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300 ease-in-out"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="px-8 pt-10 pb-8">
                            <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 ring-8 ring-rose-50/50 flex items-center justify-center mb-5">
                                <AlertTriangle className="w-8 h-8 text-rose-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2.5">{t.uploadErrorTitle}</h2>
                            <p className="text-gray-500 leading-relaxed">{uploadError}</p>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-slate-50/60">
                            <button
                                onClick={() => setUploadError(null)}
                                className="w-full px-5 py-3 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all duration-300 ease-in-out shadow-sm shadow-rose-600/20"
                            >
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt-Injection Alert -- pops when a completed result comes
                back with injection_detected=true (a structured flag the model
                itself sets, see backend/app/schemas.py -- not a frontend
                heuristic on free text, to avoid false positives on merely
                impressive resumes). Separate from Upload Rejected: this fires
                well after upload succeeds, once the async pipeline finishes. */}
            {injectionAlert && (
                <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-600 animate-[scaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)] text-center">
                        <button
                            onClick={() => setInjectionAlert(null)}
                            className="absolute top-4 end-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300 ease-in-out"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="px-8 pt-10 pb-6">
                            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 ring-8 ring-red-100/60 flex items-center justify-center mb-5 animate-pulse">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-red-700 mb-2.5">🚨 {t.injectionAlertTitle}</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">{t.injectionAlertBody}</p>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-start">
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                    {injectionAlert.candidate_name}
                                </div>
                                <div className="text-xs text-gray-600">{injectionAlert.reasoning}</div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-red-50/60">
                            <button
                                onClick={() => setInjectionAlert(null)}
                                className="w-full px-5 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-300 ease-in-out shadow-sm shadow-red-600/20"
                            >
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Stat Tile ---

const statAccents: Record<string, { bg: string; text: string; shadow: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', shadow: 'hover:shadow-blue-500/10' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', shadow: 'hover:shadow-sky-500/10' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', shadow: 'hover:shadow-emerald-500/10' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', shadow: 'hover:shadow-cyan-500/10' },
};

function StatTile({ icon: Icon, label, value, accent, spin }: { icon: React.ElementType; label: string; value: number | string; accent: string; spin?: boolean }) {
    const colors = statAccents[accent];
    return (
        <div className={`bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-xl shadow-slate-200/60 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl ${colors.shadow}`}>
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.text} ${spin ? 'animate-spin' : ''}`} />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

function ScoreGauge({ score }: { score: number }) {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

    let ringColor = "stroke-rose-400";
    if (score >= 80) ringColor = "stroke-emerald-400";
    else if (score >= 60) ringColor = "stroke-amber-400";

    return (
        <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={radius} className="stroke-white/10" strokeWidth="5" fill="none" />
                <circle
                    cx="28" cy="28" r={radius}
                    className={`${ringColor} transition-all duration-700 ease-out`}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{score}%</span>
            </div>
        </div>
    );
}

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
    const { language } = useLanguage();
    const t = dashboardText[language];

    const styles: Record<string, string> = {
        'Strong Hire': 'bg-blue-100 text-blue-700 border-blue-200',
        'Hire': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Caution': 'bg-amber-100 text-amber-700 border-amber-200',
        'Reject': 'bg-rose-100 text-rose-700 border-rose-200',
    };

    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${styles[rec] || styles['Caution']}`}>
            {t.recommendationLabels[rec] || t.recommendationLabels['Caution']}
        </span>
    );
}
