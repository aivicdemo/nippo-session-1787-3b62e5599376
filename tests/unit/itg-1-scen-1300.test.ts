import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定機能', () => {
  test('SCEN-1300: 波及度スコアが中間値で影響度が中程度と判定される', () => {
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const result = calculateIssuePriorityScore(issueInput);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/高|中|低/),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: 20,
        resolutionDifficultyScore: expect.any(Number)
      },
      colorCode: expect.stringMatching(/#[0-9A-F]{6}/i),
      calculatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    });

    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.priorityRank).toBe('中');
  });
});