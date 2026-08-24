import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-811
  test('[error] 本日の報告日付が未来の日付である場合に処理が中断される', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const futureDate = new Date('2024-01-16T10:00:00Z');

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '本番環境でパフォーマンス低下が発生',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: futureDate.toISOString(),
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input);
    }).toThrow(/報告日付/);
  });
});