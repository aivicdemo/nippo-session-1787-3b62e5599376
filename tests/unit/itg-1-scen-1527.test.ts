import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  test('SCEN-1527: calculateIssuePriorityScore throws error when impact score exceeds 100', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: 'test', frequency: 5 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(async () => {
      await calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).rejects.toThrow(/チーム波及度スコア/);
  });
});