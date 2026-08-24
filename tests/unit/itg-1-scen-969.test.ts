import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Color Display for Identical Scores', () => {
  test('SCEN-969: Multiple issues with same priority score should display with identical color', () => {
    const issueA = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const issueB = {
      issueId: 'ISSUE-002',
      issueContent: 'Memory leak in background process',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const issueC = {
      issueId: 'ISSUE-003',
      issueContent: 'Minor UI alignment issue',
      occurrenceFrequency: 2,
      impactScore: 30,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1.0,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    expect(resultA.issueId).toBe('ISSUE-001');
    expect(resultB.issueId).toBe('ISSUE-002');
    expect(resultC.issueId).toBe('ISSUE-003');

    expect(resultA.priorityScore).toBe(75);
    expect(resultB.priorityScore).toBe(75);
    expect(resultC.priorityScore).toBe(50);

    expect(resultA.priorityRank).toBe('高');
    expect(resultB.priorityRank).toBe('高');
    expect(resultC.priorityRank).toBe('中');

    expect(resultA.colorCode).toBe('#FF0000');
    expect(resultB.colorCode).toBe('#FF0000');
    expect(resultC.colorCode).toBe('#FFFF00');

    expect(resultA.colorCode).toEqual(resultB.colorCode);
    expect(resultA.colorCode).not.toEqual(resultC.colorCode);

    expect(resultA.scoreBreakdown.frequencyScore).toBe(20);
    expect(resultB.scoreBreakdown.frequencyScore).toBe(20);
    expect(resultC.scoreBreakdown.frequencyScore).toBe(5);

    expect(resultA.scoreBreakdown.impactScore).toBe(34);
    expect(resultB.scoreBreakdown.impactScore).toBe(34);
    expect(resultC.scoreBreakdown.impactScore).toBe(12);

    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBe(21);
    expect(resultB.scoreBreakdown.resolutionDifficultyScore).toBe(21);
    expect(resultC.scoreBreakdown.resolutionDifficultyScore).toBe(33);
  });
});