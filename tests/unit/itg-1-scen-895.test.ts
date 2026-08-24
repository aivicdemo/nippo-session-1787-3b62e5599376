import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Idempotent Calculation', () => {
  // SCEN-895: [normal] 優先度スコア計算の冪等性確認 - 同じ日報入力で優先度スコア計算を2回実行したとき、両回の結果が同一である
  test('should return identical priority scores on repeated calculations with same input', () => {
    // 準備: テスト対象の日報データを準備する
    const issueInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours causing application slowdown',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha'
    };

    // モック化したTextAnalysisServiceAdapterを準備
    // extractKeywords と assessImpactScore の戻り値を固定値で設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['database', 'timeout', 'connection'],
        frequency: [5, 4, 3]
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    // 1回目の優先度スコア計算処理を実行
    const result1: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueInput,
      mockTextAnalysisAdapter
    );

    // 2回目の優先度スコア計算処理を実行（同じ入力、同じモック設定）
    const result2: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueInput,
      mockTextAnalysisAdapter
    );

    // result1とresult2の優先度スコア値を比較
    expect(result1.priorityScore).toBe(result2.priorityScore);

    // 具体値の確認：発生頻度スコア (0-40)、影響度スコア (0-40)、解決難度スコア (0-20) の合計
    // 発生頻度: 5回 → スコア = (5 / 10) * 40 = 20
    // 影響度: 75 → スコア = (75 / 100) * 40 = 30
    // 解決難度: 平均2日 → スコア = (2 / 5) * 20 = 8
    // 合計優先度スコア = 20 + 30 + 8 = 58
    expect(result1.priorityScore).toBe(58);
    expect(result2.priorityScore).toBe(58);

    // 優先度ランク（高・中・低）が同一であることを確認
    expect(result1.priorityRank).toBe(result2.priorityRank);
    expect(result1.priorityRank).toBe('中');

    // スコア算出に使用されたキーワード抽出結果を比較
    expect(result1.scoreBreakdown.frequencyScore).toBe(result2.scoreBreakdown.frequencyScore);
    expect(result1.scoreBreakdown.frequencyScore).toBe(20);

    // スコア算出に使用されたチーム波及度スコアを比較
    expect(result1.scoreBreakdown.impactScore).toBe(result2.scoreBreakdown.impactScore);
    expect(result1.scoreBreakdown.impactScore).toBe(30);

    // 解決難度スコアを比較
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBe(result2.scoreBreakdown.resolutionDifficultyScore);
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBe(8);

    // 色コードが同一であることを確認
    expect(result1.colorCode).toBe(result2.colorCode);
    expect(result1.colorCode).toBe('#FFFF00');

    // 計算実行日時が記録されていることを確認（ISO 8601形式）
    expect(result1.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result2.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // モックが同じ回数呼ばれていることを確認（冪等性の検証）
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(2);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
  });
});