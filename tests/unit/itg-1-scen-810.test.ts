import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-810
  test('報告日付が本日より過去の日付である場合にエラーが発生する', () => {
    const today = new Date('2026-08-20T00:00:00Z');
    const pastReportingDate = '2026-08-15';

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム遅延',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: pastReportingDate,
      teamId: 'team-001'
    };

    expect(() => {
      calculateIssuePriorityScore(input, today);
    }).toThrow(/報告日付/);
  });
});