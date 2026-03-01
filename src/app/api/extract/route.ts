import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import * as pdfParser from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdf = (pdfParser as any).default || pdfParser;

export const maxDuration = 60; // Allow more time for AI parsing

const documentSchema = z.object({
    supplierName: z.string().optional().describe("The name of the supplier or vendor."),
    date: z.string().optional().describe("The date of the document in YYYY-MM-DD format if possible."),
    items: z.array(z.object({
        description: z.string().describe("Description of the item or service."),
        quantity: z.number().describe("Quantity of the item."),
        unitPrice: z.number().describe("Price per single unit of the item."),
        totalPrice: z.number().optional().describe("Total price for the line item (quantity * unitPrice).")
    })).describe("List of all items/services in the document."),
    totalAmount: z.number().optional().describe("The total amount of the document."),
    currency: z.string().optional().describe("The currency used, e.g. USD, EUR, NOK.")
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const providerStr = formData.get('provider') as string;
        const apiKey = formData.get('apiKey') as string | null;
        const baseUrl = formData.get('baseUrl') as string | null;
        const docType = formData.get('type') as string; // 'agreement' or 'invoice'

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        // 1. Extract raw text from all PDFs
        let combinedText = '';
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const parsedData = await pdf(buffer);
            combinedText += `\n--- Document content start ---\n${parsedData.text}\n--- Document content end ---\n`;
        }

        // 2. Configure AI Provider
        let model;
        const userModel = formData.get('model') as string;

        if (providerStr === 'gemini') {
            if (!apiKey) throw new Error("API Key required for Gemini");
            const google = createGoogleGenerativeAI({ apiKey });
            model = google(userModel || 'gemini-2.5-flash');
        } else if (providerStr === 'openai') {
            if (!apiKey && !baseUrl) throw new Error("API Key or Base URL required for OpenAI");
            const openai = createOpenAI({
                apiKey: apiKey || 'dummy-key',
                ...(baseUrl && { baseURL: baseUrl })
            });
            model = openai(userModel || 'gpt-4o-mini');
        } else if (providerStr === 'vllm') {
            if (!baseUrl) throw new Error("Base URL required for local vLLM");
            const vllm = createOpenAI({
                baseURL: baseUrl,
                apiKey: apiKey || 'dummy-key' // local models often don't need a real key but sdk might check
            });
            model = vllm(userModel || 'gemma');
        } else {
            throw new Error("Invalid provider");
        }

        // 3. Extract structured data
        const systemPrompt = `You are a highly accurate data extraction system. Your task is to extract structural invoice and procurement agreement data from the following raw PDF text. The document type is: ${docType}. Ensure you accurately capture the line items and prices. If the quantity is omitted, assume 1. Extract numeric values cleanly without currency symbols in the number fields.`;

        const { object } = await generateObject({
            model: model,
            schema: documentSchema,
            prompt: `${systemPrompt}\n\nRAW TEXT:\n${combinedText}`,
        });

        return NextResponse.json({ data: object });

    } catch (error: unknown) {
        console.error("Extraction error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown extraction error" }, { status: 500 });
    }
}
