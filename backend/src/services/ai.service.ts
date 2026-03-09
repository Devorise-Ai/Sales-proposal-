import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const HF_INFERENCE_URL = `https://router.huggingface.co/novita/v3/openai/chat/completions`;

interface ModuleInfo {
  name: string;
  description: string;
}

interface ProposalContext {
  clientCompany: string;
  clientContact?: string;
  clientRole?: string;
  industryName: string;
  selectedModules: ModuleInfo[];
  totalSetup: number;
  totalMonthly: number;
  totalYearly: number;
  currency: 'JOD' | 'USD';
}

export interface GeneratedContent {
  clientNarrative: string;
  executiveSummary: string;
  roiProjection: string;
}

const SYSTEM_PROMPT = `You are a senior business consultant at Devorise AI, a leading AI transformation company. You write formal, corporate proposal content for enterprise clients. Your tone is professional, confident, and data-aware. Avoid marketing fluff — be specific and grounded in the modules and services the client has selected. Do not use markdown formatting. Write in plain text with clear paragraph breaks.`;

function buildUserPrompt(ctx: ProposalContext): string {
  const moduleList = ctx.selectedModules
    .map((m) => `- ${m.name}: ${m.description}`)
    .join('\n');

  const currencyLabel = ctx.currency === 'JOD' ? 'Jordanian Dinar (JOD)' : 'US Dollar (USD)';

  return `Generate proposal content for the following client engagement:

Client Company: ${ctx.clientCompany}
${ctx.clientContact ? `Client Contact: ${ctx.clientContact}` : ''}
${ctx.clientRole ? `Client Role: ${ctx.clientRole}` : ''}
Industry: ${ctx.industryName}
Investment: ${ctx.totalSetup.toLocaleString()} ${ctx.currency} setup + ${ctx.totalMonthly.toLocaleString()} ${ctx.currency}/month (${ctx.totalYearly.toLocaleString()} ${ctx.currency} first-year total)
Currency: ${currencyLabel}

Selected AI Modules:
${moduleList}

Produce exactly three sections separated by the delimiters shown below. Each section should be 2-3 sentences. Do not include the delimiter text in the actual content.

---CLIENT_NARRATIVE---
A personalized paragraph explaining how Devorise AI's selected modules will transform this specific client's operations in their industry. Reference the actual modules by name.

---EXECUTIVE_SUMMARY---
A high-level overview suitable for the proposal cover page. Mention the client by name, the industry focus, and the scope of the engagement.

---ROI_PROJECTION---
A realistic ROI projection paragraph referencing the specific modules selected and their expected operational impact for this client's industry. Use percentage ranges and timeframes.`;
}

function parseResponse(text: string): GeneratedContent {
  const narrativeMatch = text.match(
    /---CLIENT_NARRATIVE---\s*([\s\S]*?)\s*---EXECUTIVE_SUMMARY---/,
  );
  const summaryMatch = text.match(
    /---EXECUTIVE_SUMMARY---\s*([\s\S]*?)\s*---ROI_PROJECTION---/,
  );
  const roiMatch = text.match(/---ROI_PROJECTION---\s*([\s\S]*?)$/);

  return {
    clientNarrative: narrativeMatch?.[1]?.trim() || '',
    executiveSummary: summaryMatch?.[1]?.trim() || '',
    roiProjection: roiMatch?.[1]?.trim() || '',
  };
}

export async function generateProposalContent(
  ctx: ProposalContext,
): Promise<GeneratedContent> {
  const body = {
    model: env.hfModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(ctx) },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  let response: Response;
  try {
    response = await fetch(HF_INFERENCE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.hfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('HF Inference API network error:', err);
    throw new AppError(502, 'Failed to connect to AI service');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`HF Inference API error (${response.status}):`, errorBody);
    throw new AppError(502, 'AI service returned an error');
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError(502, 'AI service returned empty content');
  }

  const parsed = parseResponse(content);

  if (!parsed.clientNarrative || !parsed.executiveSummary || !parsed.roiProjection) {
    console.warn('AI response missing sections, raw content:', content);
    throw new AppError(502, 'AI service returned incomplete content');
  }

  return parsed;
}
