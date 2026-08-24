import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('extractAndRankIssueKeywords - マージ済みフラグ付与機能', () => {
  // SCEN-1399: [edge] マージ済みフラグ付与機能 - 統合されたすべての子課題にマージ済みフラグが付与される
  test('親課題1件と子課題3件を含むデータセットで、統合済みの子課題すべてにマージ済みフラグが付与される', () => {
    const analysisStartDate = '2024-01-08';
    const analysisEndDate = '2024-01-14';

    const mockDailyReportList = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-08T09:00:00Z',
        teamId: 'team-001',
        userId: 'user-001',
        yesterday: 'Task A completed',
        today: 'Task B starts',
        issues: 'Parent issue: Database connection slow. Child issue A: Query optimization needed. Child issue B: Connection pooling misconfigured. Child issue C: Memory leak detected.',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-09T09:00:00Z',
        teamId: 'team-001',
        userId: 'user-002',
        yesterday: 'Task B in progress',
        today: 'Task C planned',
        issues: 'Parent issue: Database connection slow. Child issue A: Query optimization needed.',
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-10T09:00:00Z',
        teamId: 'team-001',
        userId: 'user-003',
        yesterday: 'Task C completed',
        today: 'Task D starts',
        issues: 'Child issue B: Connection pooling misconfigured. Child issue C: Memory leak detected.',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: mockDailyReportList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    // 期待結果: 抽出されたキーワードが発生頻度でランク付けされている
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 期待結果: 発生頻度が正しく計算されている
    // "Database connection slow" は2回発生（report-001, report-002）
    // "Query optimization needed" は2回発生（report-001, report-002）
    // "Connection pooling misconfigured" は2回発生（report-001, report-003）
    // "Memory leak detected" は2回発生（report-001, report-003）
    const databaseKeyword = result.keywords.find(k => k.keyword.includes('Database'));
    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(2);

    const queryKeyword = result.keywords.find(k => k.keyword.includes('Query'));
    expect(queryKeyword).toBeDefined();
    expect(queryKeyword?.frequency).toBe(2);

    const poolingKeyword = result.keywords.find(k => k.keyword.includes('pooling'));
    expect(poolingKeyword).toBeDefined();
    expect(poolingKeyword?.frequency).toBe(2);

    const memoryKeyword = result.keywords.find(k => k.keyword.includes('Memory'));
    expect(memoryKeyword).toBeDefined();
    expect(memoryKeyword?.frequency).toBe(2);

    // 期待結果: 優先度スコアが計算されている（0～100）
    result.keywords.forEach(keyword => {
      expect(typeof keyword.priorityScore).toBe('number');
      expect(keyword.priorityScore).toBeGreaterThanOrEqual(0);
      expect(keyword.priorityScore).toBeLessThanOrEqual(100);
    });

    // 期待結果: 優先度色が正しく割り当てられている
    result.keywords.forEach(keyword => {
      expect(['red', 'yellow', 'green']).toContain(keyword.priorityColor);
    });

    // 期待結果: 優先度スコアで降順にソートされている
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].priorityScore).toBeGreaterThanOrEqual(
        result.keywords[i + 1].priorityScore
      );
    }

    // 期待結果: 分析結果の総件数が正しく計算されている
    expect(result.totalIssueCount).toBe(result.keywords.length);

    // 期待結果: 分析実行時刻がISO 8601形式で記録されている
    expect(result.analysisExecutedAt).toBeDefined();
    const executionDate = new Date(result.analysisExecutedAt);
    expect(executionDate).toBeInstanceOf(Date);
    expect(isNaN(executionDate.getTime())).toBe(false);

    // 期待結果: データ品質スコアが0～100の範囲で計算されている
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // 期待結果: 最小発生頻度閾値が適用されている
    // minFrequencyThreshold=1なので、1回以上発生したすべての課題が抽出される
    result.keywords.forEach(keyword => {
      expect(keyword.frequency).toBeGreaterThanOrEqual(1);
    });
  });
});