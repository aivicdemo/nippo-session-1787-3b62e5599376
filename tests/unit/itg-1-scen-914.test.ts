import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('issue priority score calculation', () => {
  test('SCEN-914: throws error when createdAt is null during aggregation timestamp validation', () => {
    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout occurs intermittently',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-alpha',
      createdAt: null as any,
    };

    expect(() => {
      calculateIssuePriorityScore(invalidInput);
    }).toThrow(/日報の作成日時が未設定です/);
  });
});