import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1555
  test('レポートに集計期間が必須項目として含まれて生成される', async () => {
    // Arrange: テスト入力データの準備
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-01-06',
      aggregationEndDate: '2026-01-10',
      extractedIssues: [
        {
          issueKeyword: 'バグ対応',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          issueKeyword: 'パフォーマンス改善',
          occurrenceCount: 2,
          impactScore: 72,
        },
        {
          issueKeyword: '顧客要件確認',
          occurrenceCount: 4,
          impactScore: 90,
        },
      ],
      teamId: 'team-001',
    };

    // スタブの応答を設定
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: 'バグ対応', frequency: 3 },
        { keyword: 'パフォーマンス改善', frequency: 2 },
        { keyword: '顧客要件確認', frequency: 4 },
      ],
    });

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      (keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'バグ対応': 85,
          'パフォーマンス改善': 72,
          '顧客要件確認': 90,
        };
        return Promise.resolve(scoreMap[keyword] || 50);
      }
    );

    // Act: 関数を呼び出す
    const report: WeeklyAnalysisReport = await generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert: レスポンスを検証
    // (1) reportId が UUID 形式であることを確認
    expect(report.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // (2) aggregationPeriod オブジェクトが存在し、startDate と endDate が正確に一致していることを確認
    expect(report.aggregationPeriod).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe('2026-01-06');
    expect(report.aggregationPeriod.endDate).toBe('2026-01-10');

    // (3) generatedAt が ISO 8601 形式のタイムスタンプであることを確認
    expect(report.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/
    );

    // (4) issueRanking が配列として存在することを確認
    expect(Array.isArray(report.issueRanking)).toBe(true);
    expect(report.issueRanking.length).toBeGreaterThan(0);

    // (5) 発生頻度でランク付けされていることを確認（降順）
    expect(report.issueRanking[0].occurrenceCount).toBeGreaterThanOrEqual(
      report.issueRanking[1]?.occurrenceCount || 0
    );

    // (6) priorityScores が配列として存在することを確認
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);

    // (7) 各課題に priorityScore が 0～100 の範囲で存在することを確認
    report.priorityScores.forEach((priorityData) => {
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(priorityData.priorityRank);
    });

    // (8) recommendedCountermeasures が配列として存在することを確認
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);
  });
});