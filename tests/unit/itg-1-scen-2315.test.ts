import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';

describe('Team Performance Metrics Calculation', () => {
  test('SCEN-2315: [normal] 課題解決速度の定量計算機能 - 課題が報告日から複数日経過後に解決した場合、経過日数が正しく計算される', () => {
    // Arrange: テストデータを準備
    const reportedDate = new Date('2026-08-19T00:00:00Z');
    const resolvedDate = new Date('2026-08-22T00:00:00Z');
    
    const dailyReportRecord = {
      reportId: 'RPT-001',
      teamId: 'TEAM-001',
      reportDate: reportedDate,
      reportContent: {
        yesterday: 'Completed feature implementation',
        today: 'Testing and bug fixes',
        issues: [
          {
            issueId: 'ISS-001',
            description: 'Critical bug in payment module',
            reportedDate: reportedDate,
            resolvedDate: resolvedDate,
            resolutionStatus: 'resolved' as const,
            impactScore: 85
          }
        ]
      }
    };

    const input = {
      aggregationStartDate: new Date('2026-08-19T00:00:00Z'),
      aggregationEndDate: new Date('2026-08-22T23:59:59Z'),
      teamIds: ['TEAM-001'],
      reportDataset: [dailyReportRecord]
    };

    // Act: 課題解決速度の定量計算機能を呼び出し
    const result = calculateTeamPerformanceMetrics(input);

    // Assert: 経過日数が3日として正しく計算されることを検証
    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric).toBeDefined();
    expect(teamMetric.teamId).toBe('TEAM-001');
    
    // 課題解決速度は平均解決日数（3日）として計算される
    expect(teamMetric.issueResolutionSpeed).toBe(3);
    
    // 他の指標も正しい形式であることを確認
    expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
    expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);
  });
});