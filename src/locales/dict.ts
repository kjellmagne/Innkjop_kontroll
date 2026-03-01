export type Language = 'no' | 'en';

export const dict = {
    no: {
        title: {
            pro: "Innkjøps",
            control: "kontroll"
        },
        subtitle: "Automatisert KI-fakturakontroll",
        settingsBtn: "KI-innstillinger",
        languageBtn: "English",
        developedBy: "Utviklet av IKT og digitalisering",
        heroTitle: "Sjekk fakturaer mot avtaler på sekunder",
        heroSub: "Last opp dokumentene dine under, så vil vår KI trekke ut og sammenligne linjeelementene.",
        agreementBox: {
            title: "Innkjøpsavtaler",
            drag: "Dra & slipp",
            or: "eller",
            browse: "klikk for å bla gjennom",
        },
        invoiceBox: {
            title: "Fakturaer",
            drag: "Dra & slipp",
            or: "eller",
            browse: "klikk for å bla gjennom",
        },
        addAnother: "Legg til en til",
        compareBtn: "Start KI-sammenligning",
        processing: "Genererer KI-innsikt...",
        resultsTitle: "Rapport: Fakturaavvik",
        newAnalysis: "Ny analyse",
        table: {
            itemCol: "Artikkelbeskrivelse",
            agreementPriceCol: "Avtalepris",
            invoicePriceCol: "Fakturapris",
            varianceCol: "Avvik",
            statusCol: "Status",
        },
        status: {
            match: "Perfekt Match",
            overcharged: "Overfakturert",
            undercharged: "Underfakturert",
            notInAgreement: "Ikke i avtale",
            missingInInvoice: "Mangler i faktura"
        },
        settingsModal: {
            title: "KI-modellinnstillinger",
            formatLabel: "1. KI-leverandørformat",
            openaiProxy: "OpenAI (OpenAI, DeepSeek, osv.)",
            vllm: "vLLM (Lokale modeller)",
            gemini: "Google Gemini",
            baseUrlLabel: "2. Base-URL",
            baseUrlVllmLabel: "2. Base-URL",
            baseUrlOptional: "2. Base-URL (Valgfri for tilpassede endepunkter)",
            apiKeyLabelGemini: "2. API-nøkkel",
            apiKeyLabelOther: "3. API-nøkkel",
            optionalLocal: "(Valgfritt for lokale endepunkter)",
            enterKey: "Skriv inn API-nøkkel",
            modelLabelGemini: "3. Modellnavn",
            modelLabelOther: "4. Modellnavn",
            typeModel: "Skriv modellnavn",
            plessEnterValidGemini: "Skriv inn en gyldig API-nøkkel for å hente modeller.",
            plessEnterValidOther: "Skriv inn en gyldig nøkkel/URL for å hente modeller.",
            customModel: "-- Skriv inn egendefinert modell --",
            done: "Ferdig"
        }
    },
    en: {
        title: {
            pro: "Procurement",
            control: " Control"
        },
        subtitle: "Automated AI invoice verification",
        settingsBtn: "AI Settings",
        languageBtn: "Norsk",
        developedBy: "Developed by ICT and Digitalisation",
        heroTitle: "Verify invoices against agreements in seconds",
        heroSub: "Upload your documents below and our AI will extract and compare the line items.",
        agreementBox: {
            title: "Procurement Agreements",
            drag: "Drag & drop",
            or: "or",
            browse: "click to browse",
        },
        invoiceBox: {
            title: "Invoices",
            drag: "Drag & drop",
            or: "or",
            browse: "click to browse",
        },
        addAnother: "Add another",
        compareBtn: "Start AI Comparison",
        processing: "Generating AI Insight...",
        resultsTitle: "Invoice Discrepancy Report",
        newAnalysis: "New Analysis",
        table: {
            itemCol: "Item Description",
            agreementPriceCol: "Agreement Price",
            invoicePriceCol: "Invoice Price",
            varianceCol: "Variance",
            statusCol: "Status",
        },
        status: {
            match: "Perfect Match",
            overcharged: "Overcharged",
            undercharged: "Undercharged",
            notInAgreement: "Not In Agreement",
            missingInInvoice: "Missing in Invoice"
        },
        settingsModal: {
            title: "AI Model Settings",
            formatLabel: "1. AI Provider Format",
            openaiProxy: "OpenAI (OpenAI, DeepSeek, etc.)",
            vllm: "vLLM (Local Models)",
            gemini: "Google Gemini",
            baseUrlLabel: "2. Base URL",
            baseUrlVllmLabel: "2. Base URL",
            baseUrlOptional: "2. Base URL (Optional for custom endpoints)",
            apiKeyLabelGemini: "2. API Key",
            apiKeyLabelOther: "3. API Key",
            optionalLocal: "(Optional for local endpoints)",
            enterKey: "Enter API Key",
            modelLabelGemini: "3. Model Name",
            modelLabelOther: "4. Model Name",
            typeModel: "Type model name",
            plessEnterValidGemini: "Please enter a valid API Key to fetch models.",
            plessEnterValidOther: "Please enter a valid Key/URL to fetch models.",
            customModel: "-- Type custom model --",
            done: "Done"
        }
    }
};
