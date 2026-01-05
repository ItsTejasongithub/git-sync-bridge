import { LifeEvent } from '../types';

// Event pool for random selection (losses & gains)
export const EVENT_POOL = {
  losses: [
    { message: 'House robbery during Diwali', amount: -30000 },
    { message: 'Family medical emergency', amount: -75000 },
    { message: 'Vehicle repair after monsoon', amount: -20000 },
    { message: 'Wedding shopping expenses', amount: -50000 },
    { message: 'Health insurance deductible', amount: -25000 },
    { message: 'Home repairs after flooding', amount: -45000 },
    { message: 'Laptop suddenly stopped working', amount: -50000 },
    { message: 'Legal fees for property dispute', amount: -40000 },
    { message: 'AC breakdown in peak summer', amount: -10000 },
    { message: 'Parent hospitalization costs', amount: -80000 },
    { message: 'Car accident - insurance excess', amount: -22000 },
    { message: 'Stolen mobile phone', amount: -12000 },
    { message: 'Urgent home appliance replacement', amount: -28000 },
    { message: 'Child school fees increase', amount: -50000 },
    { message: 'Unexpected tax liability', amount: -30000 },
    { message: 'Emergency dental treatment', amount: -18000 },
    { message: 'Bike accident repair', amount: -14000 },
    { message: 'Flooding damaged furniture', amount: -40000 },
    { message: 'Friend wedding gift expected', amount: -10000 },
    { message: 'Pet medical emergency', amount: -10000 }
  ],
  gains: [
    { message: 'Diwali bonus from company', amount: 50000 },
    { message: 'Freelance project bonus', amount: 40000 },
    { message: 'Side business profit', amount: 35000 },
    { message: 'Performance bonus at work', amount: 45000 },
    { message: 'Tax refund received', amount: 25000 },
    { message: 'Sold old items online', amount: 15000 },
    { message: 'Investment dividend received', amount: 30000 }
  ]
};

const TOTAL_GAME_YEARS = 20;

// Helper: pick a random integer in [min, max]
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a set of LifeEvents for a single player.
// Rules enforced:
// - Select `count` events randomly (gains/losses)
// - Assign random year (1..TOTAL_GAME_YEARS) and random month (1..12)
// - Avoid scheduling in game years that have asset unlocks (we treat those as month 1 collisions)
// - No two events for the same player can be in the same year/month
export function generateLifeEvents(count: number, assetUnlockSchedule?: any): LifeEvent[] {
  const events: LifeEvent[] = [];

  // Compute disallowed months set as strings "year-month"
  const disallowed = new Set<string>();
  if (assetUnlockSchedule) {
    for (const yearKey of Object.keys(assetUnlockSchedule)) {
      const yearNum = Number(yearKey);
      if (!Number.isNaN(yearNum)) {
        // Asset unlock entries are treated as happening in month 1 for that year
        disallowed.add(`${yearNum}-1`);
      }
    }
  }

  const pool = [...EVENT_POOL.gains, ...EVENT_POOL.losses];
  const usedMessages = new Set<string>();

  let attempts = 0;
  while (events.length < count && attempts < count * 20) {
    attempts++;

    // Pick a random event from pool (allow duplicates only if exhausted)
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (usedMessages.has(candidate.message) && usedMessages.size < pool.length) {
      continue; // prefer unique events until pool exhausted
    }

    // Pick a random year/month avoiding disallowed months and existing events
    let year = randInt(1, TOTAL_GAME_YEARS);
    let month = randInt(1, 12);

    // Re-roll if in disallowed or collides with existing event
    let innerAttempts = 0;
    while ((disallowed.has(`${year}-${month}`) || events.some(e => e.gameYear === year && e.gameMonth === month)) && innerAttempts < 50) {
      year = randInt(1, TOTAL_GAME_YEARS);
      month = randInt(1, 12);
      innerAttempts++;
    }

    if (innerAttempts >= 50) {
      // Give up on strictly avoiding collisions (rare), just pick next slot
      year = randInt(1, TOTAL_GAME_YEARS);
      month = randInt(1, 12);
      // Ensure uniqueness by shifting month until free
      let shiftAttempts = 0;
      while (events.some(e => e.gameYear === year && e.gameMonth === month) && shiftAttempts < 24) {
        month = (month % 12) + 1;
        shiftAttempts++;
      }
    }

    const event: LifeEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: candidate.amount >= 0 ? 'gain' : 'loss',
      message: candidate.message,
      amount: candidate.amount,
      gameYear: year,
      gameMonth: month,
      triggered: false
    };

    events.push(event);
    usedMessages.add(candidate.message);
  }

  return events.sort((a, b) => (a.gameYear - b.gameYear) || (a.gameMonth - b.gameMonth));
}
