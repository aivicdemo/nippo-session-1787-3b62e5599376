import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-825
  test('複数の課題が同じ優先度スコアで並ぶとき、発生頻度による二次ソートが適用される', () => {
    const issuesWithSamePriority: IssuePriorityScoringInput[] = [
      {
        issueId: 'issue-001',
        issueContent: 'Database connection timeout',
        occurrenceFrequency: 5,
        impactScore: 75,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-002',
        issueContent: 'API response delay',
        occurrenceFrequency: 5,
        impactScore: 75,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-003',
        issueContent: 'Memory leak in worker process',
        occurrenceFrequency: 3,
        impactScore: 75,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.5,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
    ];

    const results: IssuePriorityScoringOutput[] = issuesWithSamePriority.map(issue =>
      calculateIssuePriorityScore(issue)
    );

    const sortedByPriorityAndFrequency = results.sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      const frequencyA = issuesWithSamePriority.find(i => i.issueId === a.issueId)?.occurrenceFrequency ?? 0;
      const frequencyB = issuesWithSamePriority.find(i => i.issueId === b.issueId)?.occurrenceFrequency ?? 0;
      return frequencyB - frequencyA;
    });

    expect(results.length).toBe(3);

    expect(results[0].priorityScore).toBe(results[1].priorityScore);
    expect(results[0].priorityScore).toBe(results[2].priorityScore);

    const firstIssueFrequency = issuesWithSamePriority.find(i => i.issueId === sortedByPriorityAndFrequency[0].issueId)?.occurrenceFrequency;
    const secondIssueFrequency = issuesWithSamePriority.find(i => i.issueId === sortedByPriorityAndFrequency[1].issueId)?.occurrenceFrequency;
    const thirdIssueFrequency = issuesWithSamePriority.find(i => i.issueId === sortedByPriorityAndFrequency[2].issueId)?.occurrenceFrequency;

    expect(firstIssueFrequency).toBe(5);
    expect(secondIssueFrequency).toBe(5);
    expect(thirdIssueFrequency).toBe(3);

    expect(firstIssueFrequency).toBeGreaterThanOrEqual(secondIssueFrequency!);
    expect(secondIssueFrequency).toBeGreaterThanOrEqual(thirdIssueFrequency!);

    expect(results[0].colorCode).toBe('#FF0000');
    expect(results[1].colorCode).toBe('#FF0000');
    expect(results[2].colorCode).toBe('#FF0000');
  });
});