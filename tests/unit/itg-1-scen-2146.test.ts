import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Multiple Teams Duplicate Keywords', () => {
  // SCEN-2146: [normal] 課題優先度スコア算出機能 - 複数チームからの重複課題キーワードが存在する場合、全チーム合算の発生頻度と最大影響度スコアで優先度が算出される
  test('should calculate priority score using aggregated occurrence frequency and maximum impact score across multiple teams', () => {
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001-db-connection',
      issueContent: 'データベース接続エラーが発生している。複数チームで報告されている。',
      occurrenceFrequency: 6,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-aggregated'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);

    expect(result.issueId).toBe('issue-001-db-connection');
    expect(result.priorityScore).toBe(450);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
  });
});