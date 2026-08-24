import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-809: [error] 課題優先度スコア算出機能 - 算出された優先度スコア値が有効範囲（0-100）を超過する
  it('should throw RangeError when calculated priority score exceeds valid range (0-100)', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーがダウンしている',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/優先度スコアは0-100の範囲内である必要があります/);
  });
});