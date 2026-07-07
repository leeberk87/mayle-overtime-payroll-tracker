import { describe, it, expect } from 'vitest';
import { calculateOvertime, selectSettingsForMonth, DEFAULT_SETTINGS } from './payroll.js';

describe('calculateOvertime', () => {
  it('calculates a simple duration and pay', () => {
    // 18:00–20:00 = 120 min = 2h × ₪65 = ₪130
    expect(calculateOvertime('18:00', '20:00', 65)).toEqual({ duration: 120, pay: 130 });
  });

  it('rounds to the nearest 15 minutes (FLSA)', () => {
    // 1h07m → rounds down to 1h00m
    expect(calculateOvertime('18:00', '19:07', 60).duration).toBe(60);
    // 1h08m → rounds up to 1h15m
    expect(calculateOvertime('18:00', '19:08', 60).duration).toBe(75);
  });

  it('pays fractional hours correctly after rounding', () => {
    // 90 min at ₪65/h = ₪97.5 → rounds to ₪98
    expect(calculateOvertime('18:00', '19:30', 65).pay).toBe(98);
  });

  it('handles overnight shifts crossing midnight', () => {
    // 22:00–01:00 = 3h
    expect(calculateOvertime('22:00', '01:00', 50)).toEqual({ duration: 180, pay: 150 });
  });

  it('caps at 12 hours to catch accidental all-day entries', () => {
    // 08:00–07:00 would be 23h — treated as invalid
    expect(calculateOvertime('08:00', '07:00', 65)).toEqual({ duration: 0, pay: 0 });
    // Exactly 12h is still allowed
    expect(calculateOvertime('08:00', '20:00', 65)).toEqual({ duration: 720, pay: 780 });
  });

  it('returns zero for missing times or sub-8-minute durations', () => {
    expect(calculateOvertime('', '20:00', 65)).toEqual({ duration: 0, pay: 0 });
    expect(calculateOvertime('18:00', '', 65)).toEqual({ duration: 0, pay: 0 });
    // 7 minutes rounds down to 0
    expect(calculateOvertime('18:00', '18:07', 65)).toEqual({ duration: 0, pay: 0 });
  });

  it('returns zero pay when no hourly rate is configured', () => {
    expect(calculateOvertime('18:00', '20:00', undefined).pay).toBe(0);
    expect(calculateOvertime('18:00', '20:00', 0).pay).toBe(0);
  });
});

describe('selectSettingsForMonth', () => {
  // Newest-first, as returned by AppSettings.list('-effective_from')
  const snapshots = [
    { effective_from: '2026-06', base_salary: 12000, overtime_rate: 70 },
    { effective_from: '2026-03', base_salary: 11000, overtime_rate: 68 },
    { effective_from: '2026-01', base_salary: 10000, overtime_rate: 65 },
  ];

  it('picks the snapshot whose effective month matches exactly', () => {
    expect(selectSettingsForMonth(snapshots, '2026-03').base_salary).toBe(11000);
  });

  it('picks the most recent snapshot at or before the month', () => {
    // April and May fall under the March snapshot
    expect(selectSettingsForMonth(snapshots, '2026-04').base_salary).toBe(11000);
    expect(selectSettingsForMonth(snapshots, '2026-05').base_salary).toBe(11000);
    // July falls under the June snapshot
    expect(selectSettingsForMonth(snapshots, '2026-07').base_salary).toBe(12000);
  });

  it('falls back to the oldest snapshot for months before all snapshots', () => {
    // Historical months before the first snapshot use the oldest known rates
    expect(selectSettingsForMonth(snapshots, '2025-11').base_salary).toBe(10000);
  });

  it('treats a snapshot without effective_from as always applicable', () => {
    const legacy = [{ base_salary: 9000 }];
    expect(selectSettingsForMonth(legacy, '2026-05').base_salary).toBe(9000);
  });

  it('returns neutral defaults when no settings exist', () => {
    expect(selectSettingsForMonth([], '2026-05')).toEqual(DEFAULT_SETTINGS);
    expect(selectSettingsForMonth(undefined, '2026-05')).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.base_salary).toBe(0);
  });
});
