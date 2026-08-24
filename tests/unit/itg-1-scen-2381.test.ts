import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('Issue Impact Score Capping', () => {
  test('SCEN-2381: Impact score should be capped at 100 when multiple assessments exceed maximum', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn()
        .mockReturnValueOnce(60)
        .mockReturnValueOnce(50),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'Critical database performance degradation affecting multiple service teams',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 4,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-engineering',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: expect.any(Number),
      priorityRank: expect.stringMatching(/^(高|中|低)$/),
      scoreBreakdown: {
        frequencyScore: expect.any(Number),
        impactScore: expect.any(Number),
        resolutionDifficultyScore: expect.any(Number),
      },
      colorCode: expect.stringMatching(/^#[0-9A-F]{6}$/),
      calculatedAt: expect.any(String),
    });

    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.impactScore).toBe(100);
  });
});