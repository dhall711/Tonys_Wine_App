import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getWineSummaryForAI } from '@/lib/wines';

// Initialize Anthropic client (will use ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

interface UserWine {
  producer: string;
  name: string;
  vintage: string;
  region: string;
  country: string;
  wineType: string;
  grapeVarieties: string;
  drinkWindowStart: string;
  drinkWindowEnd: string;
  tastingNotes: string;
  foodPairings: string;
  body: string;
  quantity: string;
}

function formatUserWinesForAI(wines: UserWine[]): string {
  if (!wines || wines.length === 0) return '';
  
  return wines.map(w => {
    const parts = [
      `${w.producer} ${w.name}`,
      w.vintage && `(${w.vintage})`,
      w.region && w.country && `- ${w.region}, ${w.country}`,
      w.wineType && `[${w.wineType}]`,
      w.grapeVarieties && `Grapes: ${w.grapeVarieties}`,
      w.body && `Body: ${w.body}`,
      w.drinkWindowStart && w.drinkWindowEnd && `Drink: ${w.drinkWindowStart}-${w.drinkWindowEnd}`,
      w.tastingNotes && `Notes: ${w.tastingNotes}`,
      w.foodPairings && `Pairings: ${w.foodPairings}`,
      w.quantity && `Qty: ${w.quantity}`,
    ].filter(Boolean);
    return parts.join(' | ');
  }).join('\n');
}

export async function POST(request: Request) {
  try {
    const { message, userAddedWines } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI chat is not configured. Please add your ANTHROPIC_API_KEY to the environment variables.',
          reply: 'AI chat is not configured. Please add your ANTHROPIC_API_KEY to enable this feature.'
        },
        { status: 200 }
      );
    }

    // Get wine collection context (catalog wines)
    const wineContext = getWineSummaryForAI();
    
    // Format user-added wines
    const userWineContext = formatUserWinesForAI(userAddedWines || []);
    
    // Combine contexts
    const fullContext = userWineContext 
      ? `${wineContext}\n\n--- USER-ADDED WINES ---\n${userWineContext}`
      : wineContext;

    // Build the system prompt
    const totalWines = wineContext.split('\n').length + (userAddedWines?.length || 0);
    const systemPrompt = `You are a knowledgeable wine sommelier assistant helping a collector explore their personal wine collection. You have deep expertise in wine regions, grape varieties, food pairings, and optimal drinking windows.

Here is the user's current wine collection (${totalWines} wines):

${fullContext}

Based on this collection, answer the user's questions helpfully and specifically. When making recommendations:
- Reference specific wines from their collection by name
- Consider the wine type, grape varieties, region, and tasting notes
- Suggest appropriate food pairings based on the wine characteristics
- Note drinking windows and whether wines are ready to drink or should be cellared
- If a question is not about wine, politely redirect to wine-related topics

Be conversational, enthusiastic about wine, and provide practical advice.`;

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ],
    });

    // Extract text response
    const textContent = response.content.find(block => block.type === 'text');
    const reply = textContent ? textContent.text : 'I apologize, but I was unable to generate a response.';

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
