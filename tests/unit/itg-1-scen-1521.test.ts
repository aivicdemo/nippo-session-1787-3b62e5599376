import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  it('SCEN-1521: 課題項目フィールドが null のときエラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: null as any,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/課題項目/);
  });
});