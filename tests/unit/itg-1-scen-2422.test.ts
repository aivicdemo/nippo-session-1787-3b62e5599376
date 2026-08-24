import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2422: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間内に同一タイムスタンプを持つ複数の日報が存在するとき、すべてが集約対象に含まれる
  test('should include all reports with identical timestamp within aggregation period', async () => {
    const aggregationStartDate = new Date('2024-01-15T09:00:00Z');
    const aggregationEndDate = new Date('2024-01-15T09:30:00Z');
    const identicalTimestamp = new Date('2024-01-15T09:15:30Z');

    const mockReports = [
      {
        reportId: 'report-001',
        userId: 'user-A',
        teamId: 'team-001',
        submittedAt: identicalTimestamp,
        yesterdayAccomplishment: 'タスクX完了',
        todayPlan: 'タスクY開始',
        challenges: '課題α',
        isArchived: false,
        aggregationFlag: 0,
      },
      {
        reportId: 'report-002',
        userId: 'user-B',
        teamId: 'team-001',
        submittedAt: identicalTimestamp,
        yesterdayAccomplishment: 'タスク1完了',
        todayPlan: 'タスク2開始',
        challenges: '課題β',
        isArchived: false,
        aggregationFlag: 0,
      },
      {
        reportId: 'report-003',
        userId: 'user-C',
        teamId: 'team-001',
        submittedAt: identicalTimestamp,
        yesterdayAccomplishment: 'タスクⅰ完了',
        todayPlan: 'タスクⅱ開始',
        challenges: '課題γ',
        isArchived: false,
        aggregationFlag: 0,
      },
    ];

    const result: MonthlyReportDataset = await extractMonthlyReportData({
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'requester-001',
      teamIdFilter: ['team-001'],
    });

    expect(result).toHaveProperty('extractionPeriodStart');
    expect(result).toHaveProperty('extractionPeriodEnd');
    expect(result).toHaveProperty('totalReportCount');
    expect(result).toHaveProperty('reportsByTeam');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('extractedAt');

    expect(result.totalReportCount).toBe(3);
    expect(result.reportsByTeam).toHaveLength(1);

    const teamSummary = result.reportsByTeam[0];
    expect(teamSummary.teamId).toBe('team-001');
    expect(teamSummary.reportCount).toBe(3);
    expect(teamSummary.submissionRate).toBe(100);
    expect(teamSummary.reportIds).toHaveLength(3);
    expect(teamSummary.reportIds).toContain('report-001');
    expect(teamSummary.reportIds).toContain('report-002');
    expect(teamSummary.reportIds).toContain('report-003');

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate).toBeInstanceOf(Date);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
  });
});