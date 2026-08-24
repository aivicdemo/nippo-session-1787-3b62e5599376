import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1364
  test('重複課題の自動判定と統合 - 統合後の課題リストが一意な課題のみで構成される', () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const mockDailyReports = [
      {
        id: 'report-001',
        reportDate: '2024-01-08T09:00:00Z',
        issues: 'データベース接続エラーが発生した。再接続で復旧。',
      },
      {
        id: 'report-002',
        reportDate: '2024-01-09T09:00:00Z',
        issues: 'データベース接続エラーで朝会が30分遅延。',
      },
      {
        id: 'report-003',
        reportDate: '2024-01-10T09:00:00Z',
        issues: 'データベース接続エラーにより本番環境で障害発生。',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: mockDailyReports,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const databaseErrorKeywords = result.keywords.filter(
      (kw) => kw.keyword === 'データベース接続エラー'
    );
    expect(databaseErrorKeywords.length).toBe(1);

    const uniqueKeywords = new Set(result.keywords.map((kw) => kw.keyword));
    expect(uniqueKeywords.size).toBe(result.keywords.length);

    expect(result.totalIssueCount).toBeGreaterThanOrEqual(1);
    expect(result.analysisExecutedAt).toBeDefined();
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    result.keywords.forEach((keyword) => {
      expect(typeof keyword.keyword).toBe('string');
      expect(typeof keyword.frequency).toBe('number');
      expect(keyword.frequency).toBeGreaterThan(0);
      expect(typeof keyword.priorityScore).toBe('number');
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
      expect(['red', 'yellow', 'green']).toContain(keyword.priorityColor);
    });
  });
});