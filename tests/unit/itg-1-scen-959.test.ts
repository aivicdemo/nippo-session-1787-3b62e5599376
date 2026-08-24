import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-959
  test('課題データの日付が当日でないときエラーを返す', () => {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayIsoString = yesterdayDate.toISOString().split('T')[0];

    const invalidIssuePriorityInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: yesterdayIsoString,
      teamId: 'team-001',
    };

    expect(() =>
      calculateIssuePriorityScore(invalidIssuePriorityInput)
    ).toThrow(/日付|date/i);
  });
});