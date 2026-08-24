import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  test('SCEN-797: 過去7日間の課題発生頻度データが空配列のとき処理が中断される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが発生',
      occurrenceFrequency: 0,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/課題発生頻度データが空/);
  });
});