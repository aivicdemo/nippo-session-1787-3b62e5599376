import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付与', () => {
  // SCEN-894
  test('TextAnalysisServiceAdapterが正常応答したとき、課題のチーム波及度スコア（0-100）が算出される', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        confidence: 0.92,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    // 課題キーワード抽出済みの入力データを用意
    const priorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'システム障害が営業部門に影響し、納期遅延が発生',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A001',
    };

    // Act: calculateIssuePriorityScorerを呼び出し
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      priorityScoringInput,
      mockTextAnalysisAdapter
    );

    // Assert: assessImpactScoreメソッドが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      priorityScoringInput.issueContent
    );

    // 算出されたチーム波及度スコアが0～100の範囲内であることを確認
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result.priorityScore).toBe('number');

    // scoreBreakdownのimpactScoreが0～40の範囲内であることを確認
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    // 優先度ランクが適切に判定されていることを確認
    expect(['高', '中', '低']).toContain(result.priorityRank);

    // 色コードが適切に設定されていることを確認
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);

    // issueIdが正しく保持されていることを確認
    expect(result.issueId).toBe('ISSUE-001');

    // calculatedAtがISO 8601形式の日時文字列であることを確認
    expect(typeof result.calculatedAt).toBe('string');
    expect(new Date(result.calculatedAt).toISOString()).toBeDefined();

    // scoreBreakdownの各要素が期待通りの構造を持つことを確認
    expect(result.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(result.scoreBreakdown).toHaveProperty('impactScore');
    expect(result.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');

    // 各スコアコンポーネントの合計が優先度スコアに一致することを確認
    const expectedTotalScore =
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(result.priorityScore).toBe(expectedTotalScore);
  });
});