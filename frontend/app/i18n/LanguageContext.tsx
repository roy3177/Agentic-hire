"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'he';

interface LanguageContextValue {
    language: Language;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = 'agentic-hire-language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function applyDocumentDirection(lang: Language) {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
}

function readStoredLanguage(): Language {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'he' || stored === 'en' ? stored : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Start with the SSR-safe default so the client's first render matches the
    // server-rendered HTML exactly; the real (possibly stored) language is
    // applied after mount, once localStorage is available.
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const stored = readStoredLanguage();
        // Deliberate: this is exactly the "hydrate from localStorage after
        // mount" pattern from the comment above, not an accidental
        // cascading-render bug -- localStorage isn't available during SSR,
        // so it can't be read any earlier than this effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguageState(stored);
        applyDocumentDirection(stored);
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        window.localStorage.setItem(STORAGE_KEY, lang);
        applyDocumentDirection(lang);
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguage(language === 'en' ? 'he' : 'en');
    }, [language, setLanguage]);

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
    return ctx;
}
