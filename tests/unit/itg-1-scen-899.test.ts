import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation and Sorting', () => {
  // SCEN-899
  test('should return issues sorted by priority score in descending order', () => {
    const issues = [
      {
        issueId: 'issue-a',
        issueContent: 'Database performance degradation',
        occurrenceFrequency: 5,
        impactScore: 45,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15T10:30:00Z',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-b',
        issueContent: 'API response timeout',
        occurrenceFrequency: 12,
        impactScore: 75,
        affectedTeamCount: 5,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15T10:30:00Z',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-c',
        issueContent: 'Minor logging bug',
        occurrenceFrequency: 2,
        impactScore: 15,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15T10:30:00Z',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-d',
        issueContent: 'Critical data loss in production',
        occurrenceFrequency: 1,
        impactScore: 95,
        affectedTeamCount: 8,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15T10:30:00Z',
        teamId: 'team-001',
      },
    ];

    const sortedIssues = issues.sort((issueX, issueY) => {
      const scoreX = calculateIssuePriorityScore({
        issueId: issueX.issueId,
        issueContent: issueX.issueContent,
        occurrenceFrequency: issueX.occurrenceFrequency,
        impactScore: issueX.impactScore,
        affectedTeamCount: issueX.affectedTeamCount,
        resolutionDaysAverage: issueX.resolutionDaysAverage,
        reportingDate: issueX.reportingDate,
        teamId: issueX.teamId,
      });

      const scoreY = calculateIssuePriorityScore({
        issueId: issueY.issueId,
        issueContent: issueY.issueContent,
        occurrenceFrequency: issueY.occurrenceFrequency,
        impactScore: issueY.impactScore,
        affectedTeamCount: issueY.affectedTeamCount,
        resolutionDaysAverage: issueY.resolutionDaysAverage,
        reportingDate: issueY.reportingDate,
        teamId: issueY.teamId,
      });

      return scoreY.priorityScore - scoreX.priorityScore;
    });

    const resultScores = sortedIssues.map((issue) => {
      const result = calculateIssuePriorityScore({
        issueId: issue.issueId,
        issueContent: issue.issueContent,
        occurrenceFrequency: issue.occurrenceFrequency,
        impactScore: issue.impactScore,
        affectedTeamCount: issue.affectedTeamCount,
        resolutionDaysAverage: issue.resolutionDaysAverage,
        reportingDate: issue.reportingDate,
        teamId: issue.teamId,
      });
      return result.priorityScore;
    });

    expect(resultScores.length).toBe(4);
    expect(resultScores[0]).toBeGreaterThanOrEqual(resultScores[1]);
    expect(resultScores[1]).toBeGreaterThanOrEqual(resultScores[2]);
    expect(resultScores[2]).toBeGreaterThanOrEqual(resultScores[3]);
    expect(sortedIssues[0].issueId).toBe('issue-d');
    expect(sortedIssues[1].issueId).toBe('issue-b');
    expect(sortedIssues[2].issueId).toBe('issue-a');
    expect(sortedIssues[3].issueId).toBe('issue-c');
  });
});