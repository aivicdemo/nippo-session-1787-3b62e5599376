import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア計算と順序付け', () => {
  test('SCEN-1640: 優先度スコアが未計算のままリポート生成を試みたときエラーを返す', () => {
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 5,
      impactScore: undefined,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(issueInput as any);
    }).toThrow(/優先度スコア/);
  });
});