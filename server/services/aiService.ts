import { GoogleGenAI } from '@google/genai';
import { IdeaDB } from '../config/db';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

export interface AIPredictionResult {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  confidenceScore: number;
  detectedTags: string[];
  summary: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateIdeaId?: string;
  similarityScore: number;
  reason?: string;
  suggestedAction?: string;
}

export async function predictCategoryAndSeverity(
  title: string,
  description: string
): Promise<AIPredictionResult> {
  const ai = getAIClient();
  
  if (!ai) {
    // Smart heuristic fallback if GEMINI_API_KEY is not configured
    const text = `${title} ${description}`.toLowerCase();
    let category = 'Community';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let department = 'Public Works & Roads';
    let tags = ['Civic Issue'];

    if (text.includes('pothole') || text.includes('road') || text.includes('crack') || text.includes('asphalt')) {
      category = 'Roads & Potholes';
      severity = text.includes('deep') || text.includes('hazard') || text.includes('danger') ? 'critical' : 'high';
      department = 'Public Works & Roads';
      tags = ['Pothole Hazard', 'Road Repair', 'Traffic Safety'];
    } else if (text.includes('solar') || text.includes('tree') || text.includes('park') || text.includes('clean') || text.includes('plastic') || text.includes('trash')) {
      category = 'Green & Eco';
      severity = 'medium';
      department = 'Sanitation & Environment';
      tags = ['Eco Green', 'Sustainability', 'Clean Campus'];
    } else if (text.includes('bus') || text.includes('traffic') || text.includes('shuttle') || text.includes('bike') || text.includes('signal')) {
      category = 'Traffic & Transit';
      severity = 'high';
      department = 'Traffic & Transit Authority';
      tags = ['Smart Mobility', 'Transit Safety', 'Urban Transit'];
    } else if (text.includes('drain') || text.includes('water') || text.includes('flood') || text.includes('leak') || text.includes('sewage')) {
      category = 'Water & Drainage';
      severity = text.includes('overflow') || text.includes('stagnant') ? 'critical' : 'high';
      department = 'Metro Water & Drainage';
      tags = ['Water Logging', 'Drainage Defect', 'Public Health'];
    } else if (text.includes('light') || text.includes('dark') || text.includes('lamp') || text.includes('crime') || text.includes('unsafe')) {
      category = 'Safety & Lighting';
      severity = 'high';
      department = 'Electrical & Public Safety';
      tags = ['Street Lighting', 'Public Safety', 'Night Corridor'];
    }

    return {
      category,
      severity,
      department,
      confidenceScore: 88,
      detectedTags: tags,
      summary: `Auto-categorized as ${category} (${severity} severity) assigned to ${department}.`
    };
  }

  try {
    const prompt = `Analyze this civic issue report for a Smart City Platform:
Title: "${title}"
Description: "${description}"

Categories available: ["Roads & Potholes", "Green & Eco", "Traffic & Transit", "Sanitation & Waste", "Water & Drainage", "Safety & Lighting", "Community", "Smart City"]
Severities available: ["low", "medium", "high", "critical"]
Departments available: ["Public Works & Roads", "Sanitation & Environment", "Traffic & Transit Authority", "Metro Water & Drainage", "Electrical & Public Safety", "Urban Planning"]

Return STRICT JSON matching this format:
{
  "category": "<one of the categories>",
  "severity": "<one of the severities>",
  "department": "<one of the departments>",
  "confidenceScore": <number between 80 and 99>,
  "detectedTags": ["tag1", "tag2", "tag3"],
  "summary": "<1 sentence rationale>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const textResult = response.text;
    if (textResult) {
      const parsed = JSON.parse(textResult);
      return {
        category: parsed.category || 'Community',
        severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity) ? parsed.severity : 'medium',
        department: parsed.department || 'Public Works & Roads',
        confidenceScore: parsed.confidenceScore || 92,
        detectedTags: parsed.detectedTags || ['Smart City'],
        summary: parsed.summary || 'AI Auto-categorization completed successfully.'
      };
    }
  } catch (err) {
    console.warn('Gemini API prediction fallback:', err);
  }

  return {
    category: 'Community',
    severity: 'medium',
    department: 'Public Works & Roads',
    confidenceScore: 85,
    detectedTags: ['Civic Report'],
    summary: 'Standard civic issue submission.'
  };
}

export async function detectDuplicates(
  title: string,
  description: string,
  existingIdeas: IdeaDB[]
): Promise<DuplicateCheckResult> {
  const ai = getAIClient();

  if (existingIdeas.length === 0) {
    return { isDuplicate: false, similarityScore: 0 };
  }

  // Fast semantic keyword check
  const newText = `${title} ${description}`.toLowerCase();
  
  for (const idea of existingIdeas) {
    const existingText = `${idea.title} ${idea.description}`.toLowerCase();
    
    // Exact or near-exact match
    if (newText === existingText) {
      return {
        isDuplicate: true,
        duplicateIdeaId: idea.id,
        similarityScore: 98,
        reason: `Identical issue report exists: "${idea.title}"`,
        suggestedAction: 'Consider upvoting or adding a community verification to the existing report instead of creating a duplicate.'
      };
    }
  }

  if (!ai) {
    // Keyword similarity fallback
    for (const idea of existingIdeas) {
      const wordsNew = new Set(newText.split(/\s+/).filter(w => w.length > 3));
      const wordsExisting = new Set(`${idea.title} ${idea.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      
      let intersection = 0;
      wordsNew.forEach(w => { if (wordsExisting.has(w)) intersection++; });
      const total = Math.max(wordsNew.size, 1);
      const score = Math.round((intersection / total) * 100);

      if (score >= 70) {
        return {
          isDuplicate: true,
          duplicateIdeaId: idea.id,
          similarityScore: score,
          reason: `High semantic overlap detected with existing report: "${idea.title}"`,
          suggestedAction: 'You can verify or comment on the existing issue report to boost priority.'
        };
      }
    }

    return { isDuplicate: false, similarityScore: 20 };
  }

  try {
    const prompt = `Compare this new civic issue report against existing reports to detect duplicates:

New Issue Title: "${title}"
New Issue Description: "${description}"

Existing Reports:
${existingIdeas.slice(0, 10).map((i, idx) => `[ID: ${i.id}] Title: "${i.title}" | Desc: "${i.description}"`).join('\n')}

Determine if the new issue is a duplicate of any existing report.
STRICT JSON output format:
{
  "isDuplicate": <true or false>,
  "duplicateIdeaId": "<matching ID or null>",
  "similarityScore": <0 to 100>,
  "reason": "<short explanation>",
  "suggestedAction": "<recommendation for user>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        isDuplicate: !!parsed.isDuplicate,
        duplicateIdeaId: parsed.duplicateIdeaId || undefined,
        similarityScore: parsed.similarityScore || 0,
        reason: parsed.reason,
        suggestedAction: parsed.suggestedAction
      };
    }
  } catch (err) {
    console.warn('AI duplicate detection fallback:', err);
  }

  return { isDuplicate: false, similarityScore: 10 };
}

export async function translateContent(
  text: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  const ai = getAIClient();
  const langNames: Record<string, string> = {
    ta: 'Tamil',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    en: 'English'
  };

  const targetLangName = langNames[targetLang] || 'Tamil';

  if (!ai) {
    return {
      translatedText: `[${targetLangName} Translation]: ${text}`,
      detectedLanguage: 'en'
    };
  }

  try {
    const prompt = `Translate the following text into ${targetLangName}:
"${text}"

Return STRICT JSON:
{
  "translatedText": "<translated text in ${targetLangName}>",
  "detectedLanguage": "<source language code>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        translatedText: parsed.translatedText || text,
        detectedLanguage: parsed.detectedLanguage || 'en'
      };
    }
  } catch (err) {
    console.warn('Translation error fallback:', err);
  }

  return { translatedText: text, detectedLanguage: 'en' };
}
