export type DatePreset = 'today' | 'last7' | 'last30' | 'custom';

export interface DateRangeState {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startIso: string;
  endIso: string;
}

/**
 * Calculates start and end ISO strings for a given preset in the local timezone.
 * Uses Asia/Kolkata (UTC+5:30) as store default.
 */
export function calculateDateRange(preset: DatePreset, customStart?: string, customEnd?: string): DateRangeState {
  const now = new Date();
  // Store local timezone offset: 330 minutes (+05:30)
  const tzOffsetMs = 330 * 60 * 1000;
  const localNow = new Date(now.getTime() + tzOffsetMs);

  const localY = localNow.getUTCFullYear();
  const localM = localNow.getUTCMonth();
  const localD = localNow.getUTCDate();

  const toYmd = (y: number, m: number, d: number) =>
    `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

  const todayStr = toYmd(localY, localM, localD);

  let startYmd = todayStr;
  let endYmd = todayStr;

  if (preset === 'today') {
    startYmd = todayStr;
    endYmd = todayStr;
  } else if (preset === 'last7') {
    const past = new Date(Date.UTC(localY, localM, localD - 6));
    startYmd = toYmd(past.getUTCFullYear(), past.getUTCMonth(), past.getUTCDate());
    endYmd = todayStr;
  } else if (preset === 'last30') {
    const past = new Date(Date.UTC(localY, localM, localD - 29));
    startYmd = toYmd(past.getUTCFullYear(), past.getUTCMonth(), past.getUTCDate());
    endYmd = todayStr;
  } else if (preset === 'custom') {
    startYmd = customStart || todayStr;
    endYmd = customEnd || todayStr;
    if (startYmd > endYmd) {
      endYmd = startYmd;
    }
  }

  // Convert local YMD boundary to UTC ISO string
  const [sY, sM, sD] = startYmd.split('-').map(Number);
  const [eY, eM, eD] = endYmd.split('-').map(Number);

  // Local start of day 00:00:00 in IST = subtract 5.5 hours to get UTC
  const startIso = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0) - tzOffsetMs).toISOString();
  // Local end of day 23:59:59.999 in IST
  const endIso = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999) - tzOffsetMs).toISOString();

  return {
    preset,
    startDate: startYmd,
    endDate: endYmd,
    startIso,
    endIso,
  };
}

