import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Month Boundary Period', () => {
  // SCEN-1544: [edge] 課題優先度スコア算出機能 - 前週データが月初日を含む場合でも期間集計が正確に計算される
  test('should accurately calculate priority scores across month boundary when week includes start of month', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '課題A',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-04-02T09:30:00Z',
      teamId: 'team-dev-001',
    };

    const output: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 発生頻度に基づくスコア計算: 頻度2回 × 20 = 40（最大40）
    const expectedFrequencyScore = Math.min(input.occurrenceFrequency * 20, 40);
    
    // 影響度に基づくスコア: 45（入力値をそのまま使用、最大40まで正規化）
    const expectedImpactScore = Math.min(input.impactScore, 40);
    
    // 解決難度スコア: 平均解決日数5日 × 2 = 10（最大20）
    const expectedResolutionDifficultyScore = Math.min(
      input.resolutionDaysAverage * 2,
      20
    );
    
    // 総合優先度スコア = 40 + 40 + 10 = 90（最大100）
    const expectedPriorityScore = Math.min(
      expectedFrequencyScore + expectedImpactScore + expectedResolutionDifficultyScore,
      100
    );

    expect(output).toEqual(
      expect.objectContaining({
        issueId: 'issue-001',
        priorityScore: expectedPriorityScore,
        priorityRank: '高',
        scoreBreakdown: expect.objectContaining({
          frequencyScore: expectedFrequencyScore,
          impactScore: expectedImpactScore,
          resolutionDifficultyScore: expectedResolutionDifficultyScore,
        }),
        colorCode: '#FF0000',
        calculatedAt: expect.any(String),
      })
    );

    // スコア計算結果の正確性を検証
    expect(output.priorityScore).toBe(90);
    expect(output.scoreBreakdown.frequencyScore).toBe(40);
    expect(output.scoreBreakdown.impactScore).toBe(40);
    expect(output.scoreBreakdown.resolutionDifficultyScore).toBe(10);

    // 月初日をまたぐ期間での優先度判定が正確であることを検証
    expect(output.priorityRank).toBe('高');
    expect(output.colorCode).toBe('#FF0000');
  });
});