import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Archive Deletion', () => {
  // SCEN-2392
  test('should delete archived report data older than 1 year and preserve recent archived data with deletion log', async () => {
    const currentDate = new Date('2024-12-15T10:00:00Z');
    const oneYearOneDayAgo = new Date(currentDate.getTime() - 366 * 24 * 60 * 60 * 1000);
    const recentArchiveDate = new Date(currentDate.getTime() - 300 * 24 * 60 * 60 * 1000);

    const oldArchivedReports = Array.from({ length: 10 }, (_, index) => ({
      reportId: `old-archived-${index + 1}`,
      teamId: `team-001`,
      createdAt: oneYearOneDayAgo,
      status: 'archived' as const,
      content: `Old archived report ${index + 1}`,
    }));

    const recentArchivedReports = Array.from({ length: 5 }, (_, index) => ({
      reportId: `recent-archived-${index + 1}`,
      teamId: `team-001`,
      createdAt: recentArchiveDate,
      status: 'archived' as const,
      content: `Recent archived report ${index + 1}`,
    }));

    const allReports = [...oldArchivedReports, ...recentArchivedReports];

    const result = await extractMonthlyReportData({
      currentDate,
      allReports,
      archiveRetentionDays: 365,
    });

    expect(result.deletedReportIds).toHaveLength(10);
    expect(result.deletedReportIds).toEqual([
      'old-archived-1',
      'old-archived-2',
      'old-archived-3',
      'old-archived-4',
      'old-archived-5',
      'old-archived-6',
      'old-archived-7',
      'old-archived-8',
      'old-archived-9',
      'old-archived-10',
    ]);

    expect(result.preservedReportIds).toHaveLength(5);
    expect(result.preservedReportIds).toEqual([
      'recent-archived-1',
      'recent-archived-2',
      'recent-archived-3',
      'recent-archived-4',
      'recent-archived-5',
    ]);

    expect(result.deletionLog).toBeDefined();
    expect(result.deletionLog.deletionReason).toBe('1年経過によるアーカイブ削除');
    expect(result.deletionLog.deletedRecordCount).toBe(10);
    expect(result.deletionLog.deletedReportCount).toBe(10);
    expect(new Date(result.deletionLog.deletionExecutedAt).toISOString()).toBe(currentDate.toISOString());
  });
});