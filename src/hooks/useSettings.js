import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { selectSettingsForMonth } from '@/lib/payroll';

/**
 * Shared salary-settings hook. Fetches all settings snapshots (newest first)
 * and resolves the one that applies to the given month.
 * `month` can be a Date or a 'yyyy-MM' string; defaults to the current month.
 */
export default function useSettings(month) {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.AppSettings.list('-effective_from'),
  });

  const ym = month instanceof Date ? format(month, 'yyyy-MM') : (month || format(new Date(), 'yyyy-MM'));

  const settings = useMemo(
    () => selectSettingsForMonth(settingsData, ym),
    [settingsData, ym]
  );

  return { settings, settingsData, isLoading };
}
