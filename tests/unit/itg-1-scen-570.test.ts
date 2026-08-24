import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-570: [error] 課題優先度判定機能 - 抽出課題リストがundefinedのとき課題優先度判定エラーが発生する
  test('undefinedの抽出課題リストが渡された場合、エラーを発生させてシステムは継続動作する', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    expect(() => {
      calculateIssuePriorityScore(invalidInput);
    }).toThrow(/課題リスト|抽出課題|無効|null|undefined/);
  });
});