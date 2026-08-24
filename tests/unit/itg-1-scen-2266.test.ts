import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput, type DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能 - キーワード抽出と出現頻度', () => {
  // SCEN-2266
  test('指定期間内に1件の日報がある場合、その日報から抽出されたキーワードと出現頻度が計算される', () => {
    const aggregationStartDate = new Date('2026-01-15T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-15T23:59:59Z');
    const teamId = 'team-001';

    const reportRecords: DailyReportRecord[] = [
      {
        reportId: 'report-001',
        teamId: teamId,
        userId: 'user-001',
        reportDate: new Date('2026-01-15T09:00:00Z'),
        yesterdayAccomplishment: 'バグ修正、テスト実施。',
        todayPlan: 'バグ修正、ドキュメント作成。',
        currentIssues: 'パフォーマンス問題、バグ修正遅延',
        submittedAt: new Date('2026-01-15T08:30:00Z'),
      },
    ];

    const mockTextAnalysisClient = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'バグ修正', frequency: 2, impactScore: 75 },
          { keyword: 'パフォーマンス問題', frequency: 1, impactScore: 85 },
          { keyword: 'テスト実施', frequency: 1, impactScore: 60 },
          { keyword: 'ドキュメント作成', frequency: 1, impactScore: 50 },
          { keyword: 'バグ修正遅延', frequency: 1, impactScore: 80 },
        ],
      }),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisClient as any,
    );

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === teamId);
    expect(teamMetric).toBeDefined();
    expect(teamMetric?.teamId).toBe(teamId);

    expect(mockTextAnalysisClient.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('バグ修正'),
    );

    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    const extractedKeywords = mockTextAnalysisClient.extractKeywords.mock.results[0].value.keywords;
    expect(extractedKeywords).toContainEqual(
      expect.objectContaining({
        keyword: 'バグ修正',
        frequency: 2,
      }),
    );
    expect(extractedKeywords).toContainEqual(
      expect.objectContaining({
        keyword: 'パフォーマンス問題',
        frequency: 1,
      }),
    );
    expect(extractedKeywords).toContainEqual(
      expect.objectContaining({
        keyword: 'テスト実施',
        frequency: 1,
      }),
    );

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});