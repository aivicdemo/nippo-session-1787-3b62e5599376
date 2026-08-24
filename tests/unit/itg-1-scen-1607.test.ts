import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-1607
  test('優先度スコアで課題を昇順に並べ直し、高スコアから低スコアへ順序付けされたリストが返される', () => {
    const issue_A: IssuePriorityScoringInput = {
      issueId: 'issue-A',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue_B: IssuePriorityScoringInput = {
      issueId: 'issue-B',
      issueContent: 'Minor UI alignment bug',
      occurrenceFrequency: 2,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue_C: IssuePriorityScoringInput = {
      issueId: 'issue-C',
      issueContent: 'API response delay',
      occurrenceFrequency: 5,
      impactScore: 72,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issue_D: IssuePriorityScoringInput = {
      issueId: 'issue-D',
      issueContent: 'Documentation typo',
      occurrenceFrequency: 1,
      impactScore: 30,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0.25,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result_A: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_A);
    const result_B: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_B);
    const result_C: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_C);
    const result_D: IssuePriorityScoringOutput = calculateIssuePriorityScore(issue_D);

    const results = [result_A, result_B, result_C, result_D];
    const sorted_results = results.sort((a, b) => b.priorityScore - a.priorityScore);

    expect(sorted_results[0].issueId).toBe('issue-A');
    expect(sorted_results[0].priorityScore).toBe(85);

    expect(sorted_results[1].issueId).toBe('issue-C');
    expect(sorted_results[1].priorityScore).toBe(72);

    expect(sorted_results[2].issueId).toBe('issue-B');
    expect(sorted_results[2].priorityScore).toBe(45);

    expect(sorted_results[3].issueId).toBe('issue-D');
    expect(sorted_results[3].priorityScore).toBe(30);

    expect(sorted_results[0].priorityRank).toBe('高');
    expect(sorted_results[1].priorityRank).toBe('高');
    expect(sorted_results[2].priorityRank).toBe('中');
    expect(sorted_results[3].priorityRank).toBe('低');
  });
});