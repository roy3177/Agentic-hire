/**
 * @author: Roy Meoded
 * @date: 2026-09-12
 * @description: This is the main landing page for the Agentic Hire application. It includes a hero section, 
 * features, agents, how it works, a call-to-action banner, and a footer with about information.
 */

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Layers,
    Menu,
    X,
    ArrowRight,
    Languages,
    Filter,
    FileText,
    Briefcase,
    Zap,
    BarChart3,
    ScanSearch,
    BrainCircuit,
    Github,
    Linkedin,
    Mail,
} from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { landingText } from './i18n/translations';

const featureIcons = [ScanSearch, BrainCircuit, Zap, BarChart3];
const agentIcons = [Filter, FileText, Briefcase, BrainCircuit];

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { language, toggleLanguage } = useLanguage();
    const t = landingText[language];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40 text-slate-900 font-sans">

            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/25">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">
                                Agentic Hire
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            {t.navLinks.map(link => (
                                <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center">
                            <button
                                onClick={toggleLanguage}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full px-3.5 py-1.5 transition-all duration-300 ease-in-out hover:bg-slate-50"
                            >
                                <Languages className="w-4 h-4" />
                                {t.switchLanguage}
                            </button>
                        </div>

                        <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-[slideUp_0.2s_ease-out]">
                        {t.navLinks.map(link => (
                            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900">
                                {link.label}
                            </a>
                        ))}
                        <button
                            onClick={toggleLanguage}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-full px-3.5 py-1.5 transition-all duration-300 ease-in-out"
                        >
                            <Languages className="w-4 h-4" />
                            {t.switchLanguage}
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Copy */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            {t.badge}
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900 mb-6">
                            {t.heroTitlePrefix}<span className="text-blue-600">{t.heroTitleAccent}</span>{t.heroTitleSuffix}
                        </h1>

                        <p className="text-lg text-slate-500 leading-relaxed max-w-xl mb-8">
                            {t.heroSubtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-blue-500/25 transition-colors">
                                {t.ctaPrimary} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                            <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-full border border-slate-200 transition-colors">
                                {t.ctaSecondary}
                            </a>
                        </div>
                    </div>

                    {/* Illustration */}
                    <div className="relative aspect-square rounded-3xl border border-slate-200/70 overflow-hidden shadow-sm">
                        <Image
                            src="/hero-illustration.png"
                            alt={t.heroImageAlt}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-100">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                        {t.featuresTitle}
                    </h2>
                    <p className="text-slate-500 text-lg">
                        {t.featuresSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {t.features.map((feature, i) => (
                        <FeatureCard key={feature.title} icon={featureIcons[i]} title={feature.title} description={feature.description} />
                    ))}
                </div>
            </section>

            {/* Agents */}
            <section id="agents" className="bg-slate-50/70 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                            {t.agentsTitle}
                        </h2>
                        <p className="text-slate-500 text-lg">
                            {t.agentsSubtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {t.agents.map((agent, i) => (
                            <AgentCard key={agent.step} step={agent.step} icon={agentIcons[i]} title={agent.title} description={agent.description} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-100">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                        {t.howItWorksTitle}
                    </h2>
                    <p className="text-slate-500 text-lg">
                        {t.howItWorksSubtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {t.steps.map((step, i) => (
                        <StepCard key={step.title} number={i + 1} title={step.title} description={step.description} />
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 px-8 py-16 text-center shadow-xl shadow-blue-500/20">
                    <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                    <h2 className="relative text-3xl sm:text-4xl font-extrabold text-white mb-4">
                        {t.ctaBannerTitle}
                    </h2>
                    <p className="relative text-blue-50 text-lg mb-8 max-w-xl mx-auto">
                        {t.ctaBannerSubtitle}
                    </p>
                    <Link href="/dashboard" className="relative inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-7 py-3.5 rounded-full shadow-lg hover:bg-blue-50 transition-colors">
                        {t.ctaPrimary} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                </div>
            </section>

            {/* Footer / About */}
            <footer id="about" className="border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                        <div>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="bg-blue-600 p-1.5 rounded-lg">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-slate-900">Agentic Hire</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                                {t.footerAbout}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">{t.footerProductHeading}</h3>
                            <ul className="space-y-3 text-sm text-slate-500">
                                {t.navLinks.filter(l => l.href !== '#about').map(link => (
                                    <li key={link.href}><a href={link.href} className="hover:text-slate-900 transition-colors">{link.label}</a></li>
                                ))}
                                <li><Link href="/dashboard" className="hover:text-slate-900 transition-colors">{t.dashboardLink}</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">{t.footerAuthorHeading}</h3>
                            <p className="text-sm font-semibold text-slate-900 mb-1">{t.authorName}</p>
                            <p className="text-sm text-slate-500 mb-4">{t.authorTitle}</p>
                            <div className="flex items-center gap-3">
                                <a href="https://github.com/roy3177" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                    <Github className="w-4 h-4" />
                                </a>
                                <a href="https://www.linkedin.com/in/roy-meoded" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a href="mailto:roymeoded2512@gmail.com" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
    );
}

function AgentCard({ step, icon: Icon, title, description }: { step: string; icon: React.ElementType; title: string; description: string }) {
    return (
        <div className="bg-white border border-slate-200/70 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow relative">
            <span className="absolute top-6 rtl:left-7 ltr:right-7 text-xs font-bold text-blue-200">{step}</span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                {number}
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{description}</p>
        </div>
    );
}
