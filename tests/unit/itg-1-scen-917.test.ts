import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示機能', () => {
  test('SCEN-917: 優先度スコアが-1以下のときスコア出力が失敗し例外をスローする', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '顧客対応遅延とシステム障害が発生',
      occurrenceFrequency: 3,
      impactScore: -1,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /優先度スコアは0以上100以下の範囲内である必要があります/
    );

    try {
      calculateIssuePriorityScore(input);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/計算値:\s*-1/);
      }
    }
  });
});