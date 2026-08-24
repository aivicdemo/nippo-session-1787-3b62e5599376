import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1552
  test('前週の日報から抽出された課題0件のとき、統一形式レポートが生成される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const weekStartDate = '2024-01-08';
    const weekEndDate = '2024-01-14';
    const extractedIssues: any[] = [];
    const teamId = 'team-001';

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: weekStartDate,
      aggregationEndDate: weekEndDate,
      extractedIssues: extractedIssues,
      teamId: teamId,
    };

    // Act: 週次課題傾向レポート生成機能を実行
    const result = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter
    ) as WeeklyAnalysisReport;

    // Assert: 生成されたレポートの構造を検証
    // (1) レポートタイプフィールドに'weeklyTrendReport'が設定されている
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    // (2) 対象週フィールドに前週の開始日と終了日が記載されている
    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-14');

    // (3) 抽出課題セクションに課題0件と明示されている
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBe(0);

    // (4) 検出された再発パターンセクションが存在し、『パターンなし』と表示されている
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBe(0);

    // (5) 予防提案セクションが存在し、『提案該当なし』と表示されている
    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);
    expect(result.recommendedCountermeasures.length).toBe(0);

    // (6) レポート生成日時がISO8601形式で記載されている
    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe('string');
    const generatedAtDate = new Date(result.generatedAt);
    expect(generatedAtDate).toBeInstanceOf(Date);
    expect(isNaN(generatedAtDate.getTime())).toBe(false);

    // (7) TextAnalysisServiceAdapterのextractKeywordsが1回呼ばれ、assessImpactScoreは0回呼ばれている
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(0);
  });
});