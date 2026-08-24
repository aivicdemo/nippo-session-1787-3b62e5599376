import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  test('SCEN-1307: Multiple issues are sorted in ascending order by priority score', () => {
    const issuesInput = [
      {
        issueId: 'issue-a',
        issueContent: 'Sample issue A',
        occurrenceFrequency: 5,
        impactScore: 50,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
        priorityScore: 45,
      },
      {
        issueId: 'issue-b',
        issueContent: 'Sample issue B',
        occurrenceFrequency: 1,
        impactScore: 10,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
        priorityScore: 12,
      },
      {
        issueId: 'issue-c',
        issueContent: 'Sample issue C',
        occurrenceFrequency: 10,
        impactScore: 100,
        affectedTeamCount: 5,
        resolutionDaysAverage: 7,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
        priorityScore: 78,
      },
      {
        issueId: 'issue-d',
        issueContent: 'Sample issue D',
        occurrenceFrequency: 3,
        impactScore: 30,
        affectedTeamCount: 1,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
        priorityScore: 34,
      },
      {
        issueId: 'issue-e',
        issueContent: 'Sample issue E',
        occurrenceFrequency: 7,
        impactScore: 70,
        affectedTeamCount: 3,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
        priorityScore: 56,
      },
    ];

    const sortedIssues = calculateIssuePriorityScore(issuesInput);

    expect(sortedIssues).toHaveLength(5);
    expect(sortedIssues[0].issueId).toBe('issue-b');
    expect(sortedIssues[0].priorityScore).toBe(12);
    expect(sortedIssues[1].issueId).toBe('issue-d');
    expect(sortedIssues[1].priorityScore).toBe(34);
    expect(sortedIssues[2].issueId).toBe('issue-a');
    expect(sortedIssues[2].priorityScore).toBe(45);
    expect(sortedIssues[3].issueId).toBe('issue-e');
    expect(sortedIssues[3].priorityScore).toBe(56);
    expect(sortedIssues[4].issueId).toBe('issue-c');
    expect(sortedIssues[4].priorityScore).toBe(78);
  });
});