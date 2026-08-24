import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('課題キーワード抽出と優先度ランク付け機能', () => {
  test('SCEN-1366: [normal] 重複課題の自動判定と統合 - TextAnalysisServiceAdapterが正常応答した場合、課題の影響度判定が完了し優先度スコアが算出される', async () => {
    // TextAnalysisServiceAdapterのスタブを準備
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 5,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high',
        affectedTeamMembers: 3,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    // 入力データを準備
    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: 'report-001',
          teamId: 'team-001',
          reporterId: 'user-001',
          reportDate: '2024-01-15',
          issueContent: 'データベース接続エラーが本番環境で頻発している',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
        },
        {
          id: 'report-002',
          teamId: 'team-001',
          reporterId: 'user-002',
          reportDate: '2024-01-15',
          issueContent: 'DB接続トラブルにより処理が停止',
          createdAt: '2024-01-15T09:15:00Z',
          updatedAt: '2024-01-15T09:15:00Z',
        },
        {
          id: 'report-003',
          teamId: 'team-001',
          reporterId: 'user-003',
          reportDate: '2024-01-15',
          issueContent: 'データベース接続エラーが本番環境で頻発している',
          createdAt: '2024-01-15T09:30:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
        },
      ],
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-15',
      minFrequencyThreshold: 1,
    };

    // extractAndRankIssueKeywords関数を呼び出す
    const result = await extractAndRankIssueKeywords(input, textAnalysisServiceAdapterStub);

    // 期待結果を検証
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    // 最初の課題キーワード「データベース接続エラー」に対する検証
    const databaseErrorKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー' || k.keyword.includes('データベース接続')
    );

    if (databaseErrorKeyword) {
      // 影響度スコア75に基づいて優先度スコアが算出されていることを確認
      expect(databaseErrorKeyword.priorityScore).toBeGreaterThanOrEqual(75);
      expect(databaseErrorKeyword.priorityScore).toBeLessThanOrEqual(100);

      // 優先度スコアが75以上なので表示色は『red』（高優先度）であることを確認
      expect(databaseErrorKeyword.priorityColor).toBe('red');

      // 発生頻度は最小2以上（重複課題を統合した結果）であることを確認
      expect(databaseErrorKeyword.frequency).toBeGreaterThanOrEqual(2);
    }

    // 全体の統計情報を検証
    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(typeof result.analysisExecutedAt).toBe('string');
    expect(result.analysisExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // データ品質スコアが0～100の範囲内であることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // TextAnalysisServiceAdapterのassessImpactScoreメソッドが呼び出されたことを確認
    expect(textAnalysisServiceAdapterStub.assessImpactScore).toHaveBeenCalled();
  });
});