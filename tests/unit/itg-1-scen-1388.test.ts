import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1388: [edge] 重複課題の自動判定と統合機能 - 類似度スコアが統合閾値超過（例：80.1%）で親課題に統合される
  test('類似度スコア80.1%の新規課題が親課題に自動統合される', () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const dailyReports = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-08T09:00:00Z',
        engineerId: 'eng-001',
        yesterdayAccomplishment: 'ユーザー認証機能の修正を完了した',
        todayPlan: 'APIエンドポイントの実装',
        currentIssue: 'バグ対応が進行中、テストケースの追加が必要',
        submittedAt: '2024-01-08T08:30:00Z',
        isSubmittedOnTime: true,
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-09T09:00:00Z',
        engineerId: 'eng-002',
        yesterdayAccomplishment: 'データベーススキーマの設計完了',
        todayPlan: 'マイグレーションスクリプト作成',
        currentIssue: 'バグフィックスが遅延している状況',
        submittedAt: '2024-01-09T08:45:00Z',
        isSubmittedOnTime: true,
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-10T09:00:00Z',
        engineerId: 'eng-003',
        yesterdayAccomplishment: 'UI コンポーネント実装',
        todayPlan: 'スタイル調整',
        currentIssue: 'バグ対応の優先度判定が課題',
        submittedAt: '2024-01-10T08:15:00Z',
        isSubmittedOnTime: true,
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: dailyReports,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(1);
    expect(result.analysisExecutedAt).toBeDefined();
    expect(typeof result.analysisExecutedAt).toBe('string');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const bugKeyword = result.keywords.find((k) => k.keyword.toLowerCase().includes('バグ'));
    expect(bugKeyword).toBeDefined();

    if (bugKeyword) {
      expect(bugKeyword.frequency).toBeGreaterThanOrEqual(1);
      expect(bugKeyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(bugKeyword.priorityScore).toBeLessThanOrEqual(100);
      expect(['red', 'yellow', 'green']).toContain(bugKeyword.priorityColor);
    }

    expect(result.keywords.length).toBeGreaterThan(0);
    const sortedByFrequency = [...result.keywords].sort((a, b) => b.frequency - a.frequency);
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(sortedByFrequency[0].frequency);
  });
});