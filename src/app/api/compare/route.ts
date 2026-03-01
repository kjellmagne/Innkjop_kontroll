import { NextResponse } from 'next/server';
import { DocumentData, ComparisonResult, LineItem } from '@/types';

function similarity(s1: string, s2: string) {
    // A simple jaccard or levenshtein could be better, but let's do soft token matching
    const t1 = s1.toLowerCase().split(/\s+/);
    const t2 = s2.toLowerCase().split(/\s+/);
    const intersection = t1.filter(t => t2.includes(t));
    return (intersection.length * 2) / (t1.length + t2.length);
}

function findBestMatch(target: LineItem, pool: LineItem[], threshold = 0.4): LineItem | null {
    let bestMatch: LineItem | null = null;
    let highestScore = 0;

    for (const item of pool) {
        const score = similarity(target.description, item.description);
        if (score > highestScore && score >= threshold) {
            highestScore = score;
            bestMatch = item;
        }
    }
    return bestMatch;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agreementData, invoiceData } = body as { agreementData: DocumentData; invoiceData: DocumentData };

        if (!agreementData || !invoiceData) {
            return NextResponse.json({ error: 'Missing document data' }, { status: 400 });
        }

        const results: ComparisonResult[] = [];
        const matchedAgreementItems = new Set<string>();

        // Check every invoice item against the agreement
        for (const invItem of invoiceData.items) {
            const match = findBestMatch(invItem, agreementData.items);

            if (!match) {
                results.push({
                    description: invItem.description,
                    agreementPrice: null,
                    invoicePrice: invItem.unitPrice,
                    variance: null,
                    isMatch: false,
                    status: 'NOT_IN_AGREEMENT'
                });
            } else {
                matchedAgreementItems.add(match.description);
                const variance = invItem.unitPrice - match.unitPrice;

                let status: ComparisonResult['status'] = 'MATCH';
                if (variance > 0.01) status = 'OVERCHARGED'; // floating point tolerance
                else if (variance < -0.01) status = 'UNDERCHARGED';

                results.push({
                    description: invItem.description,
                    agreementPrice: match.unitPrice,
                    invoicePrice: invItem.unitPrice,
                    variance: variance,
                    isMatch: status === 'MATCH',
                    status
                });
            }
        }

        // Check for agreement items that were missing in the invoice
        // This isn't technically a discrepancy unless it was expected to be billed, 
        // but useful context.
        for (const agrItem of agreementData.items) {
            if (!matchedAgreementItems.has(agrItem.description)) {
                results.push({
                    description: agrItem.description,
                    agreementPrice: agrItem.unitPrice,
                    invoicePrice: null,
                    variance: null,
                    isMatch: false,
                    status: 'MISSING_IN_INVOICE'
                });
            }
        }

        return NextResponse.json({ results });
    } catch (error: unknown) {
        console.error("Comparison error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown comparison error" }, { status: 500 });
    }
}
