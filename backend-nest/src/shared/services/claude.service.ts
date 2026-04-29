import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const PLATFORM_SPECS: Record<string, { headlineMax: number; bodyMax: number; desc: string; tone: string }> = {
  facebook:  { headlineMax: 40,  bodyMax: 125, desc: 'פייסבוק פיד ופרסומות',      tone: 'אישי, שיחתי, עם קריאה לפעולה ברורה' },
  instagram: { headlineMax: 50,  bodyMax: 200, desc: 'אינסטגרם פיד וסטורי',       tone: 'ויזואלי, אסתטי, עם אמוג׳י' },
  google:    { headlineMax: 30,  bodyMax: 90,  desc: 'גוגל אדס חיפוש ודיספליי',   tone: 'ממוקד מילות מפתח, ישיר' },
  tiktok:    { headlineMax: 100, bodyMax: 150, desc: 'טיקטוק תוכן קצר וויראלי',   tone: 'צעיר, אנרגטי, טרנדי, עם האשטגים' },
};

const GOAL_LABELS: Record<string, string> = {
  awareness: 'מודעות למותג', leads: 'לידים', sales: 'מכירות', traffic: 'תנועה לאתר', engagement: 'מעורבות',
};

@Injectable()
export class ClaudeService {
  private client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') });
  }

  async generateCampaignCopy(params: {
    productName: string;
    productDescription: string;
    businessName: string;
    goal: string;
    targetAudience: string;
    platforms: string[];
    language: string;
    tone?: string;
  }): Promise<Record<string, any>> {
    const { language } = params;
    const langInstruction = language === 'he'
      ? 'כתוב הכל בעברית ברמה גבוהה, שיווקית ומשכנעת.'
      : language === 'en'
      ? 'Write everything in high-quality, persuasive marketing English.'
      : 'Write each variant in both Hebrew and English, clearly labeled.';

    const platformBlocks = params.platforms.map((p) => {
      const s = PLATFORM_SPECS[p] || { headlineMax: 40, bodyMax: 125, desc: p, tone: 'מקצועי' };
      return `**${p.toUpperCase()}** (${s.desc}):\n- כותרת: עד ${s.headlineMax} תווים\n- גוף: עד ${s.bodyMax} תווים\n- טון: ${s.tone}`;
    }).join('\n\n');

    const prompt = `אתה קופירייטר מומחה עם 15 שנות ניסיון. ${langInstruction}

עסק: ${params.businessName}
מוצר: ${params.productName}
תיאור: ${params.productDescription}
מטרה: ${GOAL_LABELS[params.goal] || params.goal}
קהל: ${params.targetAudience}
${params.tone ? `טון: ${params.tone}` : ''}

${platformBlocks}

צור 3 וריאנטים (headline/body/cta) לכל פלטפורמה.
החזר JSON בלבד:
{
  "platform_name": {
    "variants": [{ "headline": "...", "body": "...", "cta": "..." }]
  }
}`;

    return this._callAndParse(prompt, 4000);
  }

  async generateAudienceSuggestions(params: {
    productName: string;
    productDescription: string;
    goal: string;
    platforms: string[];
  }): Promise<Record<string, any>> {
    const prompt = `אתה מומחה מדיה דיגיטלית. הגדר קהלי יעד לפלטפורמות: ${params.platforms.join(', ')}.

מוצר: ${params.productName}
תיאור: ${params.productDescription}
מטרה: ${params.goal}

לכל פלטפורמה: גילאים, מגדר, תחומי עניין (8+), התנהגויות (4+), מיקומים, קהלים מיוחדים.
JSON בלבד:
{
  "platform": { "age_min": 18, "age_max": 65, "genders": [], "interests": [], "behaviors": [], "locations": [], "special_audiences": [] }
}`;

    return this._callAndParse(prompt, 3000);
  }

  async improveCopy(originalCopy: string, platform: string, goal: string, feedback: string): Promise<string> {
    const spec = PLATFORM_SPECS[platform];
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `שפר את הקופי הבא עבור ${platform}:\n\n${originalCopy}\n\nבקשה: ${feedback}\nמטרה: ${goal}\nמגבלות: כותרת עד ${spec?.headlineMax || 40}, גוף עד ${spec?.bodyMax || 125}\n\nהחזר רק את הקופי המשופר.`,
      }],
    });
    return (response.content[0] as any).text.trim();
  }

  async analyzeForOptimization(params: {
    campaignName: string;
    productName: string;
    goal: string;
    platforms: string[];
    metrics: Record<string, any>;
    copyVariants: any[];
  }): Promise<any> {
    const prompt = `אתה מומחה אופטימיזציה קמפיינים. נתח וספק המלצות.

קמפיין: ${params.campaignName}
מוצר: ${params.productName}
מטרה: ${params.goal}

מדדים: ${JSON.stringify(params.metrics, null, 2)}
קופי: ${JSON.stringify(params.copyVariants.slice(0, 6), null, 2)}

החזר JSON:
{
  "analysis": "...",
  "performance_score": 7.5,
  "recommendations": [{
    "type": "copy_update|audience_adjustment|budget_reallocation",
    "platform": "...",
    "priority": "high|medium|low",
    "description": "...",
    "suggested_content": "...",
    "expected_improvement": "..."
  }]
}`;

    return this._callAndParse(prompt, 2000);
  }

  private async _callAndParse(prompt: string, maxTokens: number): Promise<any> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      let text = (response.content[0] as any).text.trim();
      if (text.startsWith('```')) {
        text = text.split('```')[1];
        if (text.startsWith('json')) text = text.slice(4);
      }
      return JSON.parse(text.trim());
    } catch (err) {
      throw new InternalServerErrorException(`Claude error: ${err.message}`);
    }
  }
}
