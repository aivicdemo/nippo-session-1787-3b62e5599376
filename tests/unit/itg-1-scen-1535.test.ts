import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-1535: 分析対象期間の開始日がnullのときエラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システムの応答速度が低い',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2026-08-19T10:30:00Z',
      teamId: 'team-dev-001',
      startDate: null as any,
      endDate: new Date('2026-08-19'),
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/startDate|開始日|required/i);
  });
});