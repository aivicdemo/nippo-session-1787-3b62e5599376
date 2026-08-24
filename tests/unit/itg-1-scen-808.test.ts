import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  let loggerSpyError: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    loggerSpyError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerSpyError.mockRestore();
  });

  // SCEN-808
  test('算出された優先度スコア値が有効範囲（0-100）を超過する負の数のとき処理が中断される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テストサーバーの応答遅延',
      occurrenceFrequency: 5,
      impactScore: -15,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/優先度スコア|有効範囲|負/);

    expect(loggerSpyError).toHaveBeenCalledWith(
      expect.stringMatching(/優先度スコアが有効範囲外です.*-15/)
    );
  });
});