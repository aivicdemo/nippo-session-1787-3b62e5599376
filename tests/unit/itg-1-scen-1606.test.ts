import { describe, test, expect, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Assessment', () => {
  // SCEN-1606: [normal] 課題影響度判定機能 - 抽出された課題複数件に対してチーム全体への波及度を判定し、複数の優先度スコアが返される
  test('should calculate priority scores for multiple extracted issues with varying team impact levels', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを設定
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'API遅延', frequency: 3 },
          { keyword: 'データベース接続エラー', frequency: 2 },
          { keyword: 'ドキュメント未整備', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'API遅延': 75,
          'データベース接続エラー': 62,
          'ドキュメント未整備': 28
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium')
    };

    // 入力データの準備：複数の課題を含む日報テキスト
    const issuePriorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '抱えている課題：API遅延、データベース接続エラー、ドキュメント未整備',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act: 課題影響度判定機能を実行
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issuePriorityScoringInput,
      mockTextAnalysisServiceAdapter
    );

    // Assert: 複数の優先度スコアが返されることを確認
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // TextAnalysisServiceAdapterのメソッドが呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // スコア計算の内訳が合理的な範囲内であることを確認
    const totalScore = 
      result.scoreBreakdown.frequencyScore +
      result.scoreBreakdown.impactScore +
      result.scoreBreakdown.resolutionDifficultyScore;
    expect(totalScore).toBeLessThanOrEqual(100);
  });
});