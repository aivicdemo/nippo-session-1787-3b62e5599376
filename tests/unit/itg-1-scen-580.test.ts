import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-580
  test('reporterIdがundefinedのとき、エラーをスローする', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-001',
      reporterId: undefined as unknown as string,
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/reporterId/);
  });
});