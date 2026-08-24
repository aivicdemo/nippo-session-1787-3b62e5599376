import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-2272
  test('同じ入力キーワード群で2回実行した場合、優先度スコアは同じ値で算出される', () => {
    const testInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラーが発生し、API呼び出しが遅延している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const scoreFirstCall: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);
    const scoreSecondCall: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);

    expect(scoreFirstCall.priorityScore).toBe(scoreSecondCall.priorityScore);
    expect(scoreFirstCall.issueId).toBe(scoreSecondCall.issueId);
    expect(scoreFirstCall.priorityRank).toBe(scoreSecondCall.priorityRank);
    expect(scoreFirstCall.scoreBreakdown.frequencyScore).toBe(
      scoreSecondCall.scoreBreakdown.frequencyScore
    );
    expect(scoreFirstCall.scoreBreakdown.impactScore).toBe(
      scoreSecondCall.scoreBreakdown.impactScore
    );
    expect(scoreFirstCall.scoreBreakdown.resolutionDifficultyScore).toBe(
      scoreSecondCall.scoreBreakdown.resolutionDifficultyScore
    );
    expect(scoreFirstCall.colorCode).toBe(scoreSecondCall.colorCode);
  });
});