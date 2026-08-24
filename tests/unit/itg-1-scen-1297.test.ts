import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Assessment', () => {
  // SCEN-1297: [normal] 課題影響度判定機能 - 抽出されたキーワードに対してチーム波及度スコア(0-100)が算出される
  test('should calculate priority score with varying impact scores for different keywords', () => {
    // Arrange: TextAnalysisServiceAdapterのassessImpactScoreをスタブ化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn()
        .mockReturnValueOnce(95)  // 「本番障害」に対するチーム波及度スコア
        .mockReturnValueOnce(25)  // 「ドキュメント未更新」に対するチーム波及度スコア
        .mockReturnValueOnce(75), // 複合キーワード「API認証本番」に対するスコア
      classifyIssueSeverity: jest.fn(),
    };

    // Test Case 1: 単一キーワード「本番障害」でのスコア算出
    const input1: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: '本番障害が発生しています',
      occurrenceFrequency: 5,
      impactScore: 95,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'TEAM-A',
    };

    const result1 = calculateIssuePriorityScore(input1, mockTextAnalysisServiceAdapter);

    // Assert: スコア値が0-100の範囲内であることを確認
    expect(result1.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result1.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result1.priorityScore).toBe('number');
    expect(Number.isInteger(result1.priorityScore)).toBe(true);

    // Assert: impactScoreが高い場合、優先度ランクが「高」であることを確認
    expect(result1.priorityRank).toBe('高');

    // Assert: scoreBreakdownが存在し、各スコア成分が適切な範囲であることを確認
    expect(result1.scoreBreakdown).toBeDefined();
    expect(result1.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result1.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result1.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result1.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Assert: 色コードが赤（高優先度）であることを確認
    expect(result1.colorCode).toBe('#FF0000');

    // Assert: 計算日時が正しいISO 8601形式であることを確認
    expect(result1.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Test Case 2: 単一キーワード「ドキュメント未更新」でのスコア算出（低影響度）
    const input2: IssuePriorityScoringInput = {
      issueId: 'ISSUE-002',
      issueContent: 'ドキュメント未更新が課題',
      occurrenceFrequency: 1,
      impactScore: 25,
      affectedTeamCount: 1,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T11:00:00Z',
      teamId: 'TEAM-A',
    };

    const result2 = calculateIssuePriorityScore(input2, mockTextAnalysisServiceAdapter);

    // Assert: スコア値が0-100の範囲内であることを確認
    expect(result2.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result2.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result2.priorityScore).toBe('number');

    // Assert: impactScoreが低い場合、優先度ランクが「低」であることを確認
    expect(result2.priorityRank).toBe('低');

    // Assert: 色コードが緑（低優先度）であることを確認
    expect(result2.colorCode).toBe('#00FF00');

    // Test Case 3: 複合キーワード「API認証本番」でのスコア算出（中程度影響度）
    const input3: IssuePriorityScoringInput = {
      issueId: 'ISSUE-003',
      issueContent: 'API認証機能が本番環境で不安定',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T11:30:00Z',
      teamId: 'TEAM-B',
    };

    const result3 = calculateIssuePriorityScore(input3, mockTextAnalysisServiceAdapter);

    // Assert: スコア値が0-100の範囲内であることを確認
    expect(result3.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result3.priorityScore).toBeLessThanOrEqual(100);
    expect(typeof result3.priorityScore).toBe('number');

    // Assert: impactScoreが中程度の場合、優先度ランクが「中」であることを確認
    expect(result3.priorityRank).toBe('中');

    // Assert: 色コードが黄（中優先度）であることを確認
    expect(result3.colorCode).toBe('#FFFF00');

    // Assert: キーワードごとに異なるスコア値が算出されていることを確認
    expect(result1.priorityScore).not.toBe(result2.priorityScore);
    expect(result2.priorityScore).not.toBe(result3.priorityScore);
    expect(result1.priorityScore).not.toBe(result3.priorityScore);

    // Assert: assessImpactScoreが正しい回数呼ばれていることを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // Assert: issueIdが出力に正しく反映されていることを確認
    expect(result1.issueId).toBe('ISSUE-001');
    expect(result2.issueId).toBe('ISSUE-002');
    expect(result3.issueId).toBe('ISSUE-003');
  });
});