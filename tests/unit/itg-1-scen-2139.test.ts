import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2139
  test('should mark all data older than retention period as deleted in reverse chronological order', async () => {
    const retentionDays = 30;
    const baseDate = new Date('2024-01-15T12:00:00Z');
    
    const dataA = {
      reportId: 'report-a',
      reportDate: '2023-12-11',
      submissionTimestamp: new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      submissionStatus: 'submitted' as const,
      reporterId: 'eng-001'
    };
    
    const dataB = {
      reportId: 'report-b',
      reportDate: '2023-12-06',
      submissionTimestamp: new Date(baseDate.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      submissionStatus: 'submitted' as const,
      reporterId: 'eng-002'
    };
    
    const dataC = {
      reportId: 'report-c',
      reportDate: '2023-11-26',
      submissionTimestamp: new Date(baseDate.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      submissionStatus: 'submitted' as const,
      reporterId: 'eng-003'
    };
    
    const result = await ensureDashboardDataFreshness(
      {
        userId: 'dept-chief-001',
        teamId: 'team-dev-001',
        reportDate: '2024-01-15',
        maxStalenessSeconds: 300
      },
      {
        dashboardReportData: [dataA, dataB, dataC],
        retentionDays: retentionDays,
        currentDate: baseDate
      }
    );
    
    expect(result.isDataFresh).toBe(false);
    expect(result.deletedReportIds).toEqual(['report-c', 'report-b', 'report-a']);
    expect(result.deletedCount).toBe(3);
    expect(result.retentionDaysApplied).toBe(30);
  });
});