import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Impact Assessment - Priority Score Calculation', () => {
  // SCEN-1015
  test('should calculate priority scores based on impact and frequency factors, returning issues sorted by priority in descending order', () => {
    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-b-001',
      issueContent: 'Minor UI alignment issue in dashboard',
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-c-001',
      issueContent: 'API rate limiting causing production incidents',
      occurrenceFrequency: 8,
      impactScore: 90,
      affectedTeamCount: 5,
      resolutionDaysAverage: 4.0,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-001',
    };

    const resultA = calculateIssuePriorityScore(issueA);
    const resultB = calculateIssuePriorityScore(issueB);
    const resultC = calculateIssuePriorityScore(issueC);

    expect(resultA.issueId).toBe('issue-a-001');
    expect(resultA.priorityScore).toBeGreaterThan(0);
    expect(resultA.priorityScore).toBeLessThanOrEqual(100);
    expect(resultA.priorityRank).toMatch(/高|中|低/);
    expect(resultA.scoreBreakdown).toBeDefined();
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(resultA.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(resultA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(resultB.issueId).toBe('issue-b-001');
    expect(resultB.priorityScore).toBeGreaterThan(0);
    expect(resultB.priorityScore).toBeLessThanOrEqual(100);
    expect(resultB.priorityRank).toMatch(/高|中|低/);
    expect(resultB.scoreBreakdown).toBeDefined();
    expect(resultB.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    expect(resultC.issueId).toBe('issue-c-001');
    expect(resultC.priorityScore).toBeGreaterThan(0);
    expect(resultC.priorityScore).toBeLessThanOrEqual(100);
    expect(resultC.priorityRank).toMatch(/高|中|低/);
    expect(resultC.scoreBreakdown).toBeDefined();
    expect(resultC.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    expect(resultC.priorityScore).toBeGreaterThan(resultA.priorityScore);
    expect(resultA.priorityScore).toBeGreaterThan(resultB.priorityScore);

    const sortedResults = [resultA, resultB, resultC].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );
    expect(sortedResults[0].issueId).toBe('issue-c-001');
    expect(sortedResults[0].priorityScore).toBe(resultC.priorityScore);
    expect(sortedResults[1].issueId).toBe('issue-a-001');
    expect(sortedResults[1].priorityScore).toBe(resultA.priorityScore);
    expect(sortedResults[2].issueId).toBe('issue-b-001');
    expect(sortedResults[2].priorityScore).toBe(resultB.priorityScore);
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

interface IssuePriorityScoringOutput {
  issueId: string;
  priorityScore: number;
  priorityRank: string;
  scoreBreakdown: ScoreBreakdown;
  colorCode: string;
  calculatedAt: string;
}

interface ScoreBreakdown {
  frequencyScore: number;
  impactScore: number;
  resolutionDifficultyScore: number;
}