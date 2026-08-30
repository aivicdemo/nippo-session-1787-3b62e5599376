import { aggregateReportsByPeriod } from '../../src/logic/report-data-aggregation';

describe('Report Data Aggregation', () => {
  // SCEN-564: [normal] 指定された期間（日次・週次・月次）の複数メンバーの日報を集約し、課題データを構造化して集計対象データセットを確定する。
  test('should aggregate reports by period and return structured dataset with quality metrics', () => {
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const periodType = 'monthly';

    const aggregatedIssuesData = [
      {
        issueId: 'issue-001',
        issueContent: 'APIレイテンシ低下',
        occurrenceCount: 5,
        affectedTeams: ['team-001', 'team-002']
      },
      {
        issueId: 'issue-002',
        issueContent: 'テストカバレッジ不足',
        occurrenceCount: 3,
        affectedTeams: ['team-001']
      },
      {
        issueId: 'issue-003',
        issueContent: 'デプロイスクリプト不安定',
        occurrenceCount: 4,
        affectedTeams: ['team-002', 'team-003']
      }
    ];

    const mockReportRecords = [
      {
        reportId: 'report-001',
        reporterId: 'eng-001',
        reportDate: new Date('2024-01-15T09:00:00Z'),
        issueContent: 'APIレイテンシ低下',
        status: 'completed'
      },
      {
        reportId: 'report-002',
        reporterId: 'eng-002',
        reportDate: new Date('2024-01-20T09:00:00Z'),
        issueContent: 'テストカバレッジ不足',
        status: 'completed'
      },
      {
        reportId: 'report-003',
        reporterId: 'eng-003',
        reportDate: new Date('2024-01-25T09:00:00Z'),
        issueContent: 'デプロイスクリプト不安定',
        status: 'completed'
      }
    ];

    const result = aggregateReportsByPeriod(
      startDate,
      endDate,
      periodType,
      mockReportRecords,
      aggregatedIssuesData
    );

    expect(result.aggregationPeriod.startDate).toEqual(startDate);
    expect(result.aggregationPeriod.endDate).toEqual(endDate);
    expect(result.aggregationPeriod.periodType).toBe('monthly');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedIssues).toHaveLength(3);
    expect(result.aggregatedIssues[0].issueId).toBe('issue-001');
    expect(result.aggregatedIssues[0].issueContent).toBe('APIレイテンシ低下');
    expect(result.aggregatedIssues[0].occurrenceCount).toBe(5);
    expect(result.aggregatedIssues[1].issueId).toBe('issue-002');
    expect(result.aggregatedIssues[1].issueContent).toBe('テストカバレッジ不足');
    expect(result.aggregatedIssues[2].issueId).toBe('issue-003');
    expect(result.aggregatedIssues[2].issueContent).toBe('デプロイスクリプト不安定');
    expect(result.dataQualityMetrics.completenessScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.completenessScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.accuracyScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.accuracyScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.deduplicationRate).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.deduplicationRate).toBeLessThanOrEqual(100);
    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe('object');
    expect(result.generatedAt instanceof Date).toBe(true);
  });
});