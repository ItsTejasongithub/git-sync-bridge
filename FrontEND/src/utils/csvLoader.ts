import { AssetData, FDRate } from '../types';

export const loadCSV = async (path: string): Promise<string> => {
  const response = await fetch(path);
  const text = await response.text();
  return text;
};

export const parseAssetCSV = (csvText: string): AssetData[] => {
  const lines = csvText.trim().split('\n');
  const data: AssetData[] = [];

  // Read header to determine column structure
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim());

  // Find the index of the "Close" column (this is the price we want)
  let priceColumnIndex = headers.findIndex(h => h.toLowerCase() === 'close');

  // If no "Close" column found, try "Price" column
  if (priceColumnIndex === -1) {
    priceColumnIndex = headers.findIndex(h => h.toLowerCase() === 'price');
  }

  // Default to column 1 if we can't find a suitable column
  if (priceColumnIndex === -1) {
    priceColumnIndex = 1;
  }

  // Skip first 3 header rows (header, ticker, date label)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length >= 2) {
      const date = parts[0];
      const closePrice = parseFloat(parts[priceColumnIndex]);

      if (date && !isNaN(closePrice) && closePrice > 0) {
        data.push({
          date: date,
          price: closePrice
        });
      }
    }
  }

  return data;
};

export const parseFDRates = (csvText: string): FDRate[] => {
  const lines = csvText.trim().split('\n');
  const rates: FDRate[] = [];

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length >= 4) {
      const dateRange = parts[0];
      const yearMatch = dateRange.match(/\d{4}/);
      if (yearMatch) {
        rates.push({
          year: parseInt(yearMatch[0]),
          threeMonth: parseFloat(parts[1]) || 0,
          oneYear: parseFloat(parts[2]) || 0,
          threeYear: parseFloat(parts[3]) || 0
        });
      }
    }
  }

  return rates;
};

export const getAssetPriceAtDate = (assetData: AssetData[], calendarYear: number, month: number): number => {
  if (!assetData || assetData.length === 0) {
    return 0;
  }

  // Use the calendar year directly (e.g., 2005, 2006, etc.)
  const targetDate = new Date(calendarYear, month - 1);

  // Check if the target date is before the first data point
  const firstDataDate = new Date(assetData[0].date);
  if (targetDate < firstDataDate) {
    // Data not available yet for this year
    return 0;
  }

  // Check if the target date is after the last data point
  const lastDataDate = new Date(assetData[assetData.length - 1].date);
  if (targetDate > lastDataDate) {
    // Use the last available price
    return assetData[assetData.length - 1].price;
  }

  let closestData = assetData[0];
  let minDiff = Number.MAX_VALUE;

  for (const data of assetData) {
    const dataDate = new Date(data.date);
    const diff = Math.abs(dataDate.getTime() - targetDate.getTime());

    if (diff < minDiff) {
      minDiff = diff;
      closestData = data;
    }
  }

  return closestData?.price || 0;
};

export const getFDRateForYear = (fdRates: FDRate[], calendarYear: number, duration: 3 | 12 | 36): number => {
  if (!fdRates || fdRates.length === 0) {
    // Default rates if no data available
    if (duration === 3) return 6.9;
    if (duration === 12) return 7.0;
    return 7.5;
  }

  // Use calendar year directly (e.g., 2005, 2006, etc.)
  // Find the most recent rate that applies to this year
  const sortedRates = [...fdRates].sort((a, b) => b.year - a.year);
  const rate = sortedRates.find(r => r.year <= calendarYear) || fdRates[fdRates.length - 1];

  if (!rate) {
    // Fallback to default rates
    if (duration === 3) return 6.9;
    if (duration === 12) return 7.0;
    return 7.5;
  }

  if (duration === 3) return rate.threeMonth;
  if (duration === 12) return rate.oneYear;
  return rate.threeYear;
};
