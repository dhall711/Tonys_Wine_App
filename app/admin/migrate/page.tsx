'use client';

import { useState } from 'react';
import wineData from '@/data/wine-catalog.json';
import { Wine } from '@/lib/types';

export default function MigratePage() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ catalog: number; localStorage: number } | null>(null);

  const migrateCatalog = async () => {
    setIsLoading(true);
    setStatus('Migrating catalog wines...');
    
    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkImport: true,
          wines: wineData as Wine[],
          isUserAdded: false,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setStatus(`Error: ${data.error}`);
      } else {
        setStatus(`Successfully imported ${data.count} catalog wines!`);
        setResults(prev => ({ ...prev, catalog: data.count } as { catalog: number; localStorage: number }));
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateLocalStorage = async () => {
    setIsLoading(true);
    setStatus('Migrating localStorage data...');
    
    try {
      // Get data from localStorage
      const stored = localStorage.getItem('wine-catalog-user-data');
      if (!stored) {
        setStatus('No localStorage data found.');
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(stored);
      
      // Migrate user-added wines
      if (userData.addedWines && userData.addedWines.length > 0) {
        const response = await fetch('/api/wines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulkImport: true,
            wines: userData.addedWines,
            isUserAdded: true,
          }),
        });
        
        const data = await response.json();
        setResults(prev => ({ ...prev, localStorage: data.count } as { catalog: number; localStorage: number }));
        setStatus(`Imported ${data.count} user-added wines from localStorage.`);
      }
      
      // Migrate consumption history
      if (userData.consumptionHistory) {
        for (const [wineId, events] of Object.entries(userData.consumptionHistory)) {
          for (const event of events as { date: string; notes: string }[]) {
            await fetch(`/api/wines/${wineId}/consumption`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: event.date, notes: event.notes }),
            });
          }
        }
        setStatus(prev => prev + ' Consumption history migrated.');
      }
      
      // Migrate user notes
      if (userData.userNotes) {
        for (const [wineId, note] of Object.entries(userData.userNotes)) {
          await fetch(`/api/wines/${wineId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note }),
          });
        }
        setStatus(prev => prev + ' User notes migrated.');
      }
      
      setStatus(prev => prev + ' Migration complete!');
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Migration</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Import Catalog Wines</h2>
            <p className="text-gray-400 mb-4">
              This will import {(wineData as Wine[]).length} wines from your catalog JSON file into Supabase.
            </p>
            <button
              onClick={migrateCatalog}
              disabled={isLoading}
              className="px-4 py-2 bg-wine-red hover:bg-wine-red-dark rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : 'Import Catalog Wines'}
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Step 2: Import localStorage Data</h2>
            <p className="text-gray-400 mb-4">
              This will import user-added wines, consumption history, and notes from your browser's localStorage.
            </p>
            <button
              onClick={migrateLocalStorage}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? 'Importing...' : 'Import localStorage Data'}
            </button>
          </div>
          
          {status && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Status</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{status}</p>
              
              {results && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p>Catalog wines: {results.catalog || 0}</p>
                  <p>User-added wines: {results.localStorage || 0}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">Important Notes</h2>
            <ul className="text-yellow-200 space-y-2 text-sm">
              <li>• Make sure you've added your Supabase URL and API key to .env.local</li>
              <li>• Make sure you've created the database tables (run the SQL in Supabase)</li>
              <li>• Run Step 1 first, then Step 2</li>
              <li>• This is safe to run multiple times (uses upsert)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
