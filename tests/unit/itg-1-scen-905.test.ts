import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-905
  test('発生頻度が0以下のとき優先度スコア算出が失敗し例外をスローする', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'テスト用課題',
      occurrenceFrequency: -1,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/発生頻度/);
  });
});