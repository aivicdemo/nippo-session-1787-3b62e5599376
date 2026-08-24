import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-2783
  test('重複する課題キーワードを含む複数報告から抽出された課題で、スコア計算が正確に行われる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生。キャッシュ戦略を検討中。複数報告からの集約後に検証される。',
      occurrenceFrequency: 3,
      impactScore: 60,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(60);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 24,
      impactScore: 24,
      resolutionDifficultyScore: 12,
    });
    expect(result.calculatedAt).toBeTruthy();
    expect(typeof result.calculatedAt).toBe('string');
  });
});