# Wine Catalog Web App

**Live at:** [tonys-wine-app-uxbb.vercel.app](https://tonys-wine-app-uxbb.vercel.app)

A mobile-friendly Next.js 15 web application for browsing and exploring your personal wine collection, featuring an AI sommelier powered by Claude. Images are hosted on Supabase Storage for fast global delivery.

## Features

### Browse & Filter
- **Fixed Filter Sidebar** - Stays in place while you scroll through wines
- **Advanced Filtering** - Filter by country, region, wine type, vintage, body, tannin level, acidity, and drinking status
- **URL-Persisted Filters** - Filters are saved in the URL; back button restores your previous view
- **Drink Window Status** - Filter wines that are Ready to Drink, At Peak, Too Young, or Past Prime
- **Search** - Find wines by producer, name, region, grape variety, or tasting notes
- **Multiple View Modes** - Grid, Compact, and List views
- **Responsive Design** - Beautiful card-based layout that works on desktop and mobile

### Wine Details
- **Full Wine Information** - Structure, drinking window, tasting notes, food pairings
- **Image Viewing** - Click on label images to view enlarged versions
- **Similar Wines** - Find wines with similar characteristics (type, body, grapes, region, tasting notes)

### Collection Management
- **Mark as Consumed** - Track when you drank a wine with optional notes
- **Personal Notes** - Add your own tasting notes and comments to any wine
- **Show/Hide Consumed** - Toggle to show or hide consumed wines
- **Data Persistence** - Your notes and consumed status are saved in browser localStorage

### AI Sommelier
- **Chat with Claude** - Ask questions about your collection
- **Pairing Recommendations** - Get food pairing suggestions
- **Contextual Answers** - The AI knows your entire wine collection

## Collection Summary

- **190 wines** cataloged from the CSV database
- **463 label images** (front and back labels)
- Countries: France, Italy, Slovenia
- Heavy emphasis on Italian wines (Piedmont, Tuscany, Campania) and French wines (Bordeaux, Burgundy, Alsace)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd wine-catalog-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up AI chat - copy the environment template and add your Anthropic API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your ANTHROPIC_API_KEY
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

The app is deployed at [tonys-wine-app-uxbb.vercel.app](https://tonys-wine-app-uxbb.vercel.app).

To deploy your own instance:

1. Push this project to a GitHub repository

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "New Project" and import your repository

4. Add environment variables:
   - `ANTHROPIC_API_KEY` - Your API key from [console.anthropic.com](https://console.anthropic.com)
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

5. Click "Deploy"

**Image Hosting:** Wine label images are stored in Supabase Storage (bucket: `wine-labels`). The `wine-catalog.json` file contains full Supabase URLs for each image.

## Project Structure

```
wine-catalog-app/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (wine grid + sidebar)
│   ├── globals.css         # Global styles and Tailwind
│   ├── wine/[id]/page.tsx  # Wine detail page
│   └── api/chat/route.ts   # AI chat API endpoint
├── components/
│   ├── WineCard.tsx        # Wine card component
│   ├── WineGrid.tsx        # Grid of wine cards
│   ├── WineCardCompact.tsx # Compact view card
│   ├── WineCardList.tsx    # List view card
│   ├── FilterSidebar.tsx   # Fixed filter sidebar
│   ├── SimilarWinesModal.tsx # Similar wines finder
│   ├── AddWineModal.tsx    # Add wine via label photo
│   ├── ChatWidget.tsx      # AI chat interface
│   └── ImageModal.tsx      # Enlarged image viewer
├── lib/
│   ├── wines.ts            # Wine data utilities + similarity algorithm
│   ├── userData.ts         # User data persistence (localStorage)
│   ├── supabase.ts         # Supabase client configuration
│   └── types.ts            # TypeScript type definitions
├── data/
│   └── wine-catalog.json   # Wine data with Supabase image URLs
└── public/
    └── logo.png            # App logo
```

**Note:** Wine label images (463 files, ~500MB) are hosted on Supabase Storage, not in this repo.

## Similarity Algorithm

The "Find Similar" feature calculates similarity scores based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Wine Type | 25% | Same type (Red, White, Rosé, etc.) |
| Region | 15% | Same wine region |
| Body | 15% | Same body level |
| Grape Varieties | 12-24% | Shared grape varieties |
| Tannin Level | 10% | Similar tannin levels |
| Acidity Level | 10% | Similar acidity |
| Country | 8% | Same country of origin |
| Tasting Notes | 5-13% | Shared flavor keywords |
| Oak Treatment | 5% | Same oak treatment |

## Data Persistence

User data (consumed wines, personal notes) is stored in browser localStorage. This data persists across sessions but is local to each browser/device. To sync across devices, you would need to implement a backend database.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (for sommelier chat and label extraction)
- **Image Storage**: Supabase Storage
- **Hosting**: Vercel

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private project for personal use.
