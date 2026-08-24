import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2164
  test('集計対象期間の開始日が null のとき、エラーが発生する', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
      startDate: null as any,
      endDate: new Date('2024-01-31'),
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/startDate|開始日/i);
  });
});