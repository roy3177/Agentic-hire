import type { Language } from './LanguageContext';

export const landingText: Record<Language, {
    navLinks: { label: string; href: string }[];
    switchLanguage: string;
    badge: string;
    heroTitlePrefix: string;
    heroTitleAccent: string;
    heroTitleSuffix: string;
    heroSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroImageAlt: string;
    featuresTitle: string;
    featuresSubtitle: string;
    features: { title: string; description: string }[];
    agentsTitle: string;
    agentsSubtitle: string;
    agents: { step: string; title: string; description: string }[];
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    steps: { title: string; description: string }[];
    ctaBannerTitle: string;
    ctaBannerSubtitle: string;
    footerAbout: string;
    footerProductHeading: string;
    footerAuthorHeading: string;
    authorName: string;
    authorTitle: string;
    dashboardLink: string;
}> = {
    en: {
        navLinks: [
            { label: 'Features', href: '#features' },
            { label: 'Agents', href: '#agents' },
            { label: 'About', href: '#about' },
        ],
        switchLanguage: 'עברית',
        badge: 'Powered by Google Gemini 3.0',
        heroTitlePrefix: 'Hire like the ',
        heroTitleAccent: 'future',
        heroTitleSuffix: ' depends on it.',
        heroSubtitle: 'Agentic Hire deploys a fleet of specialized AI agents that parse resumes, analyze job descriptions, and reason through candidate fit — so your team can focus on the human conversations that matter.',
        ctaPrimary: 'Start screening',
        ctaSecondary: 'See how it works',
        heroImageAlt: 'Network of AI agents analyzing candidate resumes',
        featuresTitle: 'Everything a modern hiring team needs',
        featuresSubtitle: 'A full agentic pipeline — from raw resume to ranked, reasoned recommendation.',
        features: [
            { title: 'Smart Resume Parsing', description: 'Extracts structured candidate data from PDF and DOCX resumes automatically.' },
            { title: 'Multi-Agent Reasoning', description: 'Specialized AI agents collaborate to evaluate fit against your job description.' },
            { title: 'Real-Time Pipeline', description: 'Celery-powered async processing with live status updates as candidates are screened.' },
            { title: 'Full Observability', description: 'Every agent decision is traced end-to-end with Langfuse for auditability.' },
        ],
        agentsTitle: 'Meet the agent team',
        agentsSubtitle: 'Four specialized agents work in sequence to turn a resume into a hiring decision.',
        agents: [
            { step: '01', title: 'Triage Agent', description: 'Quickly screens out clearly irrelevant candidates before the full, more expensive pipeline runs.' },
            { step: '02', title: 'Parser Agent', description: 'Reads the resume file and extracts skills, experience, and education into structured data.' },
            { step: '03', title: 'Analyst Agent', description: 'Compares the candidate profile against the job description to identify strengths and gaps.' },
            { step: '04', title: 'Team Lead', description: 'Synthesizes a final score and a human-readable recommendation with clear justification.' },
        ],
        howItWorksTitle: 'How it works',
        howItWorksSubtitle: 'Three steps between a stack of resumes and a ranked shortlist.',
        steps: [
            { title: 'Paste the job description', description: 'Define the role once — every candidate is scored against the same context.' },
            { title: 'Upload resumes', description: 'Drag & drop PDFs or DOCX files. The pipeline picks them up automatically.' },
            { title: 'Get ranked results', description: 'Review scores, recommendations, and full reasoning for every candidate.' },
        ],
        ctaBannerTitle: 'Ready to hire like the future depends on it?',
        ctaBannerSubtitle: 'Paste a job description and upload your first resume in under a minute.',
        footerAbout: 'An autonomous, multi-agent recruitment copilot built with Next.js, FastAPI, and Google Gemini — the official codebase for "The Backdoor to High-Tech".',
        footerProductHeading: 'Product',
        footerAuthorHeading: 'Author',
        authorName: 'Roy Meoded',
        authorTitle: 'Software Developer',
        dashboardLink: 'Dashboard',
    },
    he: {
        navLinks: [
            { label: 'תכונות', href: '#features' },
            { label: 'סוכנים', href: '#agents' },
            { label: 'אודות', href: '#about' },
        ],
        switchLanguage: 'English',
        badge: 'מופעל על ידי Google Gemini 3.0',
        heroTitlePrefix: 'גייסו כאילו ',
        heroTitleAccent: 'העתיד',
        heroTitleSuffix: ' תלוי בזה.',
        heroSubtitle: 'Agentic Hire מפעילה צי של סוכני AI מתמחים שמנתחים קורות חיים, בוחנים דרישות תפקיד, ומנמקים את התאמת המועמד — כדי שהצוות שלכם יוכל להתמקד בשיחות האנושיות שבאמת חשובות.',
        ctaPrimary: 'התחילו לסנן מועמדים',
        ctaSecondary: 'כך זה עובד',
        heroImageAlt: 'רשת של סוכני AI מנתחת קורות חיים של מועמדים',
        featuresTitle: 'כל מה שצוות גיוס מודרני צריך',
        featuresSubtitle: 'פייפליין אג\'נטי מלא — מקורות חיים גולמיים ועד המלצה מדורגת ומנומקת.',
        features: [
            { title: 'ניתוח קורות חיים חכם', description: 'מחלץ אוטומטית נתוני מועמדים מובנים מקבצי PDF ו-DOCX.' },
            { title: 'חשיבה רב-סוכנים', description: 'סוכני AI מתמחים משתפים פעולה כדי להעריך התאמה מול דרישות התפקיד.' },
            { title: 'פייפליין בזמן אמת', description: 'עיבוד אסינכרוני מבוסס Celery עם עדכוני סטטוס חיים תוך כדי סינון המועמדים.' },
            { title: 'שקיפות מלאה', description: 'כל החלטה של סוכן מתועדת מקצה לקצה באמצעות Langfuse לצורך בקרה.' },
        ],
        agentsTitle: 'הכירו את צוות הסוכנים',
        agentsSubtitle: 'ארבעה סוכנים מתמחים פועלים ברצף כדי להפוך קורות חיים להחלטת גיוס.',
        agents: [
            { step: '01', title: 'סוכן הסינון', description: 'מסנן במהירות מועמדים שברור שאינם רלוונטיים, לפני הרצת הפייפליין המלא והיקר יותר.' },
            { step: '02', title: 'סוכן המפענח', description: 'קורא את קובץ קורות החיים ומחלץ כישורים, ניסיון והשכלה לנתונים מובנים.' },
            { step: '03', title: 'סוכן המנתח', description: 'משווה את פרופיל המועמד לדרישות התפקיד כדי לזהות חוזקות ופערים.' },
            { step: '04', title: 'ראש הצוות', description: 'מגבש ציון סופי והמלצה קריאה לבני אדם עם נימוק ברור.' },
        ],
        howItWorksTitle: 'איך זה עובד',
        howItWorksSubtitle: 'שלושה שלבים בין ערימת קורות חיים לרשימה מדורגת.',
        steps: [
            { title: 'הדביקו את דרישות התפקיד', description: 'הגדירו את התפקיד פעם אחת — כל מועמד מדורג מול אותו הקשר.' },
            { title: 'העלו קורות חיים', description: 'גררו ושחררו קבצי PDF או DOCX. הפייפליין קולט אותם אוטומטית.' },
            { title: 'קבלו תוצאות מדורגות', description: 'בדקו ציונים, המלצות והנמקה מלאה לכל מועמד.' },
        ],
        ctaBannerTitle: 'מוכנים לגייס כאילו העתיד תלוי בזה?',
        ctaBannerSubtitle: 'הדביקו דרישות תפקיד והעלו את קורות החיים הראשונים תוך פחות מדקה.',
        footerAbout: 'קופיילוט גיוס אוטונומי מבוסס ריבוי-סוכנים, בנוי עם Next.js, FastAPI ו-Google Gemini — קוד המקור הרשמי לספר "הדלת האחורית להייטק".',
        footerProductHeading: 'מוצר',
        footerAuthorHeading: 'מפתח',
        authorName: 'רואי מעודד',
        authorTitle: 'מפתח תוכנה',
        dashboardLink: 'דשבורד',
    },
};

export const dashboardText: Record<Language, {
    tagline: string;
    jobDescriptionRequiredAlert: string;
    statTotalCandidates: string;
    statInQueue: string;
    statCompleted: string;
    statAvgScore: string;
    jobContextTitle: string;
    jobContextSubtitle: string;
    jobContextPlaceholder: string;
    charactersLabel: string;
    uploadTitle: string;
    uploadDropNow: string;
    uploadDisabledHint: string;
    uploadHint: string;
    processingQueueTitle: string;
    queueEmpty: string;
    completedAnalysisTitle: string;
    tableCandidate: string;
    tableMatchScore: string;
    tableRecommendation: string;
    tableActions: string;
    noResults: string;
    statusLabels: Record<string, string>;
    modalReportSubtitle: string;
    executiveSummary: string;
    keyStrengths: string;
    areasOfConcern: string;
    close: string;
    recommendationLabels: Record<string, string>;
    uploadErrorTitle: string;
    uploadErrorGeneric: string;
    startHereBadge: string;
}> = {
    en: {
        tagline: 'AI Recruitment Copilot',
        jobDescriptionRequiredAlert: 'Please enter a Job Description first.',
        statTotalCandidates: 'Total Candidates',
        statInQueue: 'In Queue',
        statCompleted: 'Completed',
        statAvgScore: 'Avg. Match Score',
        jobContextTitle: 'Job Context',
        jobContextSubtitle: 'Paste the full job description here. The agents will use this to score candidates.',
        jobContextPlaceholder: 'e.g. Senior Python Developer with 5+ years of experience in FastAPI and Celery...',
        charactersLabel: 'characters',
        uploadTitle: 'Upload CVs',
        uploadDropNow: 'Drop files now',
        uploadDisabledHint: 'Please define the Job Description first',
        uploadHint: 'Drag & drop PDF or DOCX files here, or click to browse',
        processingQueueTitle: 'Processing Queue',
        queueEmpty: 'Queue is empty',
        completedAnalysisTitle: 'Completed Analysis',
        tableCandidate: 'Candidate',
        tableMatchScore: 'Match Score',
        tableRecommendation: 'Recommendation',
        tableActions: 'Actions',
        noResults: 'No results yet. Upload resumes to start the agents.',
        statusLabels: {
            uploading: 'uploading',
            pending: 'pending',
            processing: 'processing',
            completed: 'completed',
            failed: 'failed',
        },
        modalReportSubtitle: 'AI Agent Analysis Report',
        executiveSummary: 'Executive Summary',
        keyStrengths: 'Key Strengths',
        areasOfConcern: 'Areas of Concern',
        close: 'Close',
        recommendationLabels: {
            'Strong Hire': 'Strong Hire',
            'Hire': 'Hire',
            'Caution': 'Caution',
            'Reject': 'Reject',
        },
        uploadErrorTitle: 'Upload Rejected',
        uploadErrorGeneric: 'Something went wrong while uploading this file. Please try again.',
        startHereBadge: 'Start here',
    },
    he: {
        tagline: 'קופיילוט גיוס מבוסס AI',
        jobDescriptionRequiredAlert: 'יש להזין תחילה תיאור תפקיד.',
        statTotalCandidates: 'סה"כ מועמדים',
        statInQueue: 'בתור',
        statCompleted: 'הושלמו',
        statAvgScore: 'ציון התאמה ממוצע',
        jobContextTitle: 'תיאור התפקיד',
        jobContextSubtitle: 'הדביקו כאן את תיאור התפקיד המלא. הסוכנים ישתמשו בו כדי לדרג מועמדים.',
        jobContextPlaceholder: 'לדוגמה: מפתח/ת Python בכיר/ה עם 5+ שנות ניסיון ב-FastAPI ו-Celery...',
        charactersLabel: 'תווים',
        uploadTitle: 'העלאת קורות חיים',
        uploadDropNow: 'שחררו את הקבצים כאן',
        uploadDisabledHint: 'יש להגדיר תחילה את תיאור התפקיד',
        uploadHint: 'גררו ושחררו קבצי PDF או DOCX לכאן, או לחצו לבחירה',
        processingQueueTitle: 'תור עיבוד',
        queueEmpty: 'התור ריק',
        completedAnalysisTitle: 'ניתוחים שהושלמו',
        tableCandidate: 'מועמד',
        tableMatchScore: 'ציון התאמה',
        tableRecommendation: 'המלצה',
        tableActions: 'פעולות',
        noResults: 'אין עדיין תוצאות. העלו קורות חיים כדי להפעיל את הסוכנים.',
        statusLabels: {
            uploading: 'מעלה',
            pending: 'ממתין',
            processing: 'מעבד',
            completed: 'הושלם',
            failed: 'נכשל',
        },
        modalReportSubtitle: 'דוח ניתוח של סוכן AI',
        executiveSummary: 'תקציר מנהלים',
        keyStrengths: 'חוזקות עיקריות',
        areasOfConcern: 'נקודות לתשומת לב',
        close: 'סגור',
        recommendationLabels: {
            'Strong Hire': 'התאמה מצוינת',
            'Hire': 'מתאים/ה',
            'Caution': 'זהירות',
            'Reject': 'לא מתאים/ה',
        },
        uploadErrorTitle: 'ההעלאה נדחתה',
        uploadErrorGeneric: 'משהו השתבש בהעלאת הקובץ. נסו שוב.',
        startHereBadge: 'התחילו כאן',
    },
};
