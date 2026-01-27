import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis is not configured. Please add your ANTHROPIC_API_KEY.' },
        { status: 200 }
      );
    }

    // Extract base64 data and media type from data URL
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = matches[2];

    // Call Claude with vision to analyze the label
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `You are an expert sommelier analyzing a wine label image. Extract ALL visible information and use your wine expertise to infer additional details based on the wine type, region, and grape varieties.

Return a JSON object with these fields (use empty string only if you truly cannot determine or infer the value):

{
  "producer": "winery/producer name",
  "name": "wine name (not including producer)",
  "vintage": "year as string, e.g. '2020'",
  "country": "country of origin",
  "region": "wine region (e.g., Napa Valley, Barolo, Champagne)",
  "appellation": "official appellation/DOC/DOCG/AOC/AVA if visible or inferrable",
  "grapeVarieties": "grape varieties, comma separated (infer from wine name/region if not explicit, e.g., Barolo = Nebbiolo, Chablis = Chardonnay)",
  "blendPercentage": "blend percentages if visible (e.g., '80% Cabernet, 20% Merlot')",
  "wineType": "one of: Red, White, Rosé, Sparkling, Dessert, Fortified, Orange/Amber",
  "color": "descriptive color (e.g., 'Deep ruby with garnet rim', 'Pale straw yellow')",
  "alcohol": "alcohol percentage as number string, e.g. '14'",
  "bottleSize": "bottle size if visible (e.g., '750ml', '1.5L')",
  "body": "one of: Light, Light-Medium, Medium, Medium-Full, Full (infer based on wine type, grape, and region)",
  "tanninLevel": "one of: N/A, Low, Low-Medium, Medium, Medium-High, High, Very High (infer for reds based on grape variety)",
  "acidityLevel": "one of: Low, Medium, Medium-High, High (infer based on wine type, grape, and climate)",
  "oakTreatment": "oak aging details if visible or inferrable (e.g., '18 months French oak', 'Unoaked', 'Stainless steel')",
  "agingPotential": "how long the wine can age (e.g., 'Drink now', '5-10 years', '10-20 years') - infer based on wine structure",
  "drinkWindowStart": "earliest year to drink (4-digit year, e.g., '2024') - calculate based on vintage and wine type",
  "drinkWindowEnd": "latest year for optimal drinking (4-digit year, e.g., '2035') - calculate based on wine structure",
  "tastingNotes": "palate/taste notes - extract if visible OR infer typical characteristics (e.g., 'Red cherry, tobacco, tar' for Barolo)",
  "aromaNotes": "nose/aroma notes - extract if visible OR infer typical aromas (e.g., 'Rose petals, cherry, earth')",
  "foodPairings": "food pairing suggestions - extract if visible OR suggest based on wine style (e.g., 'Braised meats, aged cheeses, truffle dishes')",
  "notes": "any other relevant information (awards, special designations like 'Riserva', 'Grand Cru', vineyard notes, winemaker notes)"
}

Guidelines for inference:
- For classic wines (Barolo, Burgundy, Champagne, etc.), use your knowledge to fill in typical characteristics
- Drink window: Light whites 1-3 years from vintage, full reds can be 10-25+ years
- Be specific with tasting notes - use professional wine descriptors
- For body/tannin/acidity, consider the grape variety and region climate

Only return valid JSON, no other text.`
            }
          ],
        }
      ],
    });

    // Extract the text response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      const extractedData = JSON.parse(jsonText);
      return NextResponse.json({ data: extractedData });
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text);
      return NextResponse.json(
        { error: 'Failed to parse label data', raw: textContent.text },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Label analysis error:', error);
    
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
