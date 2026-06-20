import Papa from 'papaparse';
import { DataRow } from './ml';

const DATA_URL = 'https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv';

export async function fetchBostonData(): Promise<DataRow[]> {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          // The dataset has a few string columns maybe ? No, mostly numeric.
          // Let's filter out any rows with missing or non-numeric target (medv).
          const data = results.data as Record<string, any>[];
          const cleaned = data
            .map((row) => ({
              ...row,
              chas: row.chas === '1' || row.chas === 1 ? 1 : 0 // sometimes it's text
            }))
            .filter((r: any) => typeof r.medv === 'number' && !isNaN(r.medv));
          
          resolve(cleaned as DataRow[]);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
}

// Features to exclude from X explicitly
export const TARGET_COL = 'medv';
export const EXCLUDE_COLS = [TARGET_COL]; 
