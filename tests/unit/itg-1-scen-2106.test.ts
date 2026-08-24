import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2106
  test('should delete reports older than 90 days and preserve recent reports', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const ninetyOneDaysAgo = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);
    const eightyNineDaysAgo = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);

    const oldReports = Array.from({ length: 10 }, (_, i) => ({
      reportId: `old-report-${i + 1}`,
      reporterId: `engineer-${(i % 3) + 1}`,
      submissionStatus: 'submitted' as const,
      submissionTimestamp: ninetyOneDaysAgo.toISOString(),
      yesterdayAccomplishment: `Yesterday task ${i + 1}`,
      todayPlan: `Today plan ${i + 1}`,
      currentChallenge: `Challenge ${i + 1}`,
    }));

    const almostOldReports = Array.from({ length: 5 }, (_, i) => ({
      reportId: `almost-old-report-${i + 1}`,
      reporterId: `engineer-${(i % 2) + 1}`,
      submissionStatus: 'submitted' as const,
      submissionTimestamp: eightyNineDaysAgo.toISOString(),
      yesterdayAccomplishment: `Yesterday task old ${i + 1}`,
      todayPlan: `Today plan old ${i + 1}`,
      currentChallenge: `Challenge old ${i + 1}`,
    }));

    const recentReports = Array.from({ length: 3 }, (_, i) => ({
      reportId: `recent-report-${i + 1}`,
      reporterId: `engineer-${(i % 2) + 1}`,
      submissionStatus: 'submitted' as const,
      submissionTimestamp: now.toISOString(),
      yesterdayAccomplishment: `Yesterday task recent ${i + 1}`,
      todayPlan: `Today plan recent ${i + 1}`,
      currentChallenge: `Challenge recent ${i + 1}`,
    }));

    const allReports = [...oldReports, ...almostOldReports, ...recentReports];

    const result = await ensureDashboardDataFreshness(
      allReports,
      now,
      90,
    );

    expect(result.deletedCount).toBe(10);
    expect(result.remainingReports).toHaveLength(8);
    expect(result.remainingReports.map(r => r.reportId)).toEqual(
      expect.arrayContaining([
        'almost-old-report-1',
        'almost-old-report-2',
        'almost-old-report-3',
        'almost-old-report-4',
        'almost-old-report-5',
        'recent-report-1',
        'recent-report-2',
        'recent-report-3',
      ]),
    );
    expect(result.remainingReports.map(r => r.reportId)).not.toEqual(
      expect.arrayContaining([
        'old-report-1',
        'old-report-2',
        'old-report-3',
        'old-report-4',
        'old-report-5',
        'old-report-6',
        'old-report-7',
        'old-report-8',
        'old-report-9',
        'old-report-10',
      ]),
    );
  });
});