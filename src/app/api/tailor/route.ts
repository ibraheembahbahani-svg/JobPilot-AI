import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { z } from 'zod';

const requestSchema = z.object({ profile: z.record(z.unknown()), resumeText: z.string().min(1), jobDescription: z.string().min(1) });
const outputSchema = z.object({ summary: z.string(), bullets: z.array(z.string()), missingEvidence: z.array(z.string()), warnings: z.array(z.string()) });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const client = getOpenAI();
    const response = await client.chat.completions.create({ model: process.env.OPENAI_MATCHING_MODEL || 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' }, messages: [
      { role: 'system', content: 'You create truthful resume drafts. Use only evidence present in PROFILE or RESUME. Never invent employers, dates, metrics, credentials, authorization, or skills. Put unsupported requirements in missingEvidence. Return only JSON with summary, bullets, missingEvidence, warnings.' },
      { role: 'user', content: JSON.stringify({ PROFILE: input.profile, RESUME: input.resumeText, JOB_DESCRIPTION: input.jobDescription }) }
    ] });
    const parsed = outputSchema.parse(JSON.parse(response.choices[0]?.message.content || '{}'));
    return NextResponse.json({ ...parsed, mode: 'draft', requiresUserApproval: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create draft' }, { status: 400 }); }
}
