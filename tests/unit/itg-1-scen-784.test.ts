import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-784: [normal] 課題優先度スコア算出機能 - 過去7日間に課題キーワードが0件の場合、本日の報告内容のみで優先度スコアが算出される
  test('過去7日間に課題キーワード0件の場合、本日の報告内容のみで優先度スコア85が算出される', () => {
    const today = new Date('2024-02-15T09:00:00Z');
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-server-down-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 0,
      impactScore: 85,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-02-15',
      teamId: 'team-engineering-001'
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-server-down-001',
      priorityScore: 85,
      priorityRank: '高',
      scoreBreakdown: {
        frequencyScore: 0,
        impactScore: 85,
        resolutionDifficultyScore: 20
      },
      colorCode: '#FF0000',
      calculatedAt: expect.any(String)
    });

    expect(result.priorityScore).toBe(85);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(85);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(20);
    expect(result.colorCode).toBe('#FF0000');
  });
});