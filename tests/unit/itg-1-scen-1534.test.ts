import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  test('SCEN-1534: 分析対象期間の開始日が終了日より後の場合エラーが発生する', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-12-28',
      teamId: 'team-001'
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(/分析対象期間/);
  });
});