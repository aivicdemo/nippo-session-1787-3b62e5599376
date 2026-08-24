import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  it('SCEN-2159: チーム波及度スコアが0未満のとき、エラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システムダウン',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/チーム波及度スコア/);
  });
});