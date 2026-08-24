import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-1531: 発生頻度と波及度スコアの両方が0のときエラーが発生する', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-test-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    // Act & Assert
    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /発生頻度スコアと波及度スコアの両方が0/
    );
  });
});