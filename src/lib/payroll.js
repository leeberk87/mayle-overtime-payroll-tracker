// Shared payroll math. Keep these functions pure (no imports from React or base44)
// so they stay unit-testable — see payroll.test.js.

// Neutral defaults for a fresh account with no salary settings yet.
// Deliberately zeros: real numbers must come from Salary Settings.
export const DEFAULT_SETTINGS = {
  base_salary: 0,
  transport_allowance: 0,
  overtime_rate: 0,
};

export const MAX_OVERTIME_MINUTES = 720; // 12h cap to prevent accidental all-day entries

/**
 * Calculate overtime duration and pay from HH:mm start/end times.
 * Handles overnight shifts (end before start = crosses midnight),
 * rounds to the nearest 15 minutes (FLSA standard), and caps at 12 hours.
 * Returns { duration: minutes, pay: whole currency units } — both 0 when invalid.
 */
export function calculateOvertime(startTime, endTime, hourlyRate) {
  if (!startTime || !endTime) return { duration: 0, pay: 0 };

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight

  if (totalMinutes > MAX_OVERTIME_MINUTES) return { duration: 0, pay: 0 };

  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  const pay = Math.round((roundedMinutes / 60) * (hourlyRate || 0));

  return { duration: roundedMinutes, pay };
}

/**
 * Pick the salary settings snapshot that applies to a given month.
 * `settingsData` must be sorted newest-first by effective_from (list('-effective_from')).
 * `ym` is a 'yyyy-MM' string. Falls back to the oldest snapshot, then to DEFAULT_SETTINGS.
 */
export function selectSettingsForMonth(settingsData, ym) {
  if (!settingsData?.length) return DEFAULT_SETTINGS;
  const match = settingsData.find(s => !s.effective_from || s.effective_from <= ym);
  return match || settingsData[settingsData.length - 1] || DEFAULT_SETTINGS;
}
