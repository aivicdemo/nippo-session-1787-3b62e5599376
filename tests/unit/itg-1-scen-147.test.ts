import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with Impact Score Normalization', () => {
  test('SCEN-147: Impact score exceeding 100 is normalized to 100', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(101),
      classifyIssueSeverity: jest.fn(),
    };

    const issuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const result = calculateIssuePriorityScore(issuePriorityScoringInput, mockTextAnalysisAdapter);

    expect(result.issueId).toBe('issue-001');
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.priorityRank).toBe('高');
    expect(result.calculatedAt).toBeTruthy();
  });
});