import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCatalogWines } from '@/lib/wines';
import { Wine, WineReference } from '@/lib/types';

// Initialize Anthropic client (will use ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

interface UserWine {
  id?: string;
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

// Format wines with IDs for AI context
function formatWinesForAI(wines: Wine[]): string {
  return wines.map(w => 
    `[ID:${w.id}] ${w.producer} ${w.name} (${w.vintage || 'NV'}) - ${w.wineType} from ${w.country}, ${w.region}${w.grapeVarieties ? ` - ${w.grapeVarieties}` : ''}${w.foodPairings ? ` | Pairs with: ${w.foodPairings}` : ''}${w.drinkWindowStart && w.drinkWindowEnd ? ` | Drink: ${w.drinkWindowStart}-${w.drinkWindowEnd}` : ''}`
  ).join('\n');
}

function formatUserWinesForAI(wines: UserWine[]): string {
  if (!wines || wines.length === 0) return '';
  
  return wines.map(w => {
    const id = w.id || `user-${w.producer}-${w.name}`.toLowerCase().replace(/\s+/g, '-');
    const parts = [
      `[ID:${id}] ${w.producer} ${w.name}`,
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

// Parse wine references from AI response
function parseWineReferences(text: string, allWines: Wine[], userWines: UserWine[]): WineReference[] {
  const references: WineReference[] = [];
  const seen = new Set<string>();
  
  // Match [[Wine Name|id]] format
  const regex = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const displayName = match[1];
    const id = match[2];
    
    if (!seen.has(id)) {
      seen.add(id);
      references.push({ id, displayName });
    }
  }
  
  return references;
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

    // Get wine collection with IDs
    const catalogWines = getCatalogWines();
    const wineContext = formatWinesForAI(catalogWines);
    
    // Format user-added wines
    const userWineContext = formatUserWinesForAI(userAddedWines || []);
    
    // Combine contexts
    const fullContext = userWineContext 
      ? `${wineContext}\n\n--- USER-ADDED WINES ---\n${userWineContext}`
      : wineContext;

    // Build the system prompt
    const totalWines = catalogWines.length + (userAddedWines?.length || 0);
    const systemPrompt = `You are a knowledgeable wine sommelier assistant helping a collector explore their personal wine collection. You have deep expertise in wine regions, grape varieties, food pairings, and optimal drinking windows.

Here is the user's current wine collection (${totalWines} wines). Each wine has an ID shown in brackets:

${fullContext}

IMPORTANT: When you mention a specific wine from the collection, format it as a clickable link using this exact format: [[Display Name|ID]]
For example, if a wine is listed as "[ID:178] Castello Banfi Brunello di Montalcino (2018)...", format it as: [[Castello Banfi Brunello di Montalcino 2018|178]]

The display name should be the producer and wine name (optionally with vintage). The ID is the number from the [ID:xxx] prefix in the wine list above - use EXACTLY that number.

Based on this collection, answer the user's questions helpfully and specifically. When making recommendations:
- Reference specific wines from their collection using the [[Name|id]] format so they become clickable links
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
    
    // Parse wine references from the reply
    const wineReferences = parseWineReferences(reply, catalogWines, userAddedWines || []);

    return NextResponse.json({ reply, wineReferences });

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
