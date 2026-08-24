import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Calculation - Edge Cases', () => {
  test('SCEN-600: calculateIssuePriorityScore correctly handles issues with multiple input scenarios and returns ordered results', () => {
    const issue1Input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout in production',
      occurrenceFrequency: 8,
      impactScore: 92,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issue2Input: IssuePriorityScoringInput = {
      issueId: 'issue-002',
      issueContent: 'Minor UI styling inconsistency',
      occurrenceFrequency: 2,
      impactScore: 15,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issue3Input: IssuePriorityScoringInput = {
      issueId: 'issue-003',
      issueContent: 'API response delay during peak hours',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 1.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const result1 = calculateIssuePriorityScore(issue1Input);
    const result2 = calculateIssuePriorityScore(issue2Input);
    const result3 = calculateIssuePriorityScore(issue3Input);

    expect(result1.issueId).toBe('issue-001');
    expect(result1.priorityScore).toBeGreaterThan(80);
    expect(result1.priorityRank).toBe('高');
    expect(result1.colorCode).toBe('#FF0000');
    expect(result1.scoreBreakdown.frequencyScore).toBeGreaterThan(25);
    expect(result1.scoreBreakdown.impactScore).toBeGreaterThan(35);

    expect(result2.issueId).toBe('issue-002');
    expect(result2.priorityScore).toBeLessThan(40);
    expect(result2.priorityRank).toBe('低');
    expect(result2.colorCode).toBe('#00FF00');
    expect(result2.scoreBreakdown.frequencyScore).toBeLessThan(10);
    expect(result2.scoreBreakdown.impactScore).toBeLessThan(10);

    expect(result3.issueId).toBe('issue-003');
    expect(result3.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result3.priorityScore).toBeLessThan(80);
    expect(result3.priorityRank).toBe('中');
    expect(result3.colorCode).toBe('#FFFF00');
    expect(result3.scoreBreakdown.impactScore).toBeGreaterThan(25);

    const issueArray = [
      { issueId: result2.issueId, priorityScore: result2.priorityScore, priorityRank: result2.priorityRank },
      { issueId: result1.issueId, priorityScore: result1.priorityScore, priorityRank: result1.priorityRank },
      { issueId: result3.issueId, priorityScore: result3.priorityScore, priorityRank: result3.priorityRank }
    ];

    const sortedArray = issueArray.sort((a, b) => b.priorityScore - a.priorityScore);

    expect(sortedArray[0].issueId).toBe('issue-001');
    expect(sortedArray[0].priorityRank).toBe('高');
    expect(sortedArray[1].issueId).toBe('issue-003');
    expect(sortedArray[1].priorityRank).toBe('中');
    expect(sortedArray[2].issueId).toBe('issue-002');
    expect(sortedArray[2].priorityRank).toBe('低');

    expect(sortedArray[0].priorityScore).toBeGreaterThan(sortedArray[1].priorityScore);
    expect(sortedArray[1].priorityScore).toBeGreaterThan(sortedArray[2].priorityScore);

    expect(new Date(result1.calculatedAt)).toBeInstanceOf(Date);
    expect(new Date(result2.calculatedAt)).toBeInstanceOf(Date);
    expect(new Date(result3.calculatedAt)).toBeInstanceOf(Date);
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}

interface ScoreBreakdown {
  frequencyScore: number;
  impactScore: number;
  resolutionDifficultyScore: number;
}

interface IssuePriorityScoringOutput {
  issueId: string;
  priorityScore: number;
  priorityRank: string;
  scoreBreakdown: ScoreBreakdown;
  colorCode: string;
  calculatedAt: string;
}