import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定・優先度スコア付与', () => {
  it('SCEN-848: teamId が 0 で渡されたときエラーになる', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'バグ報告',
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: '0',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/チームID/);
  });
});