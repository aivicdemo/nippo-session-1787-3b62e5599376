import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Team Impact Assessment', () => {
  // SCEN-3006
  test('should throw TypeError when teamId is undefined during impact score calculation', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['サーバーダウン'],
        frequency: 2,
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string, teamId: string | undefined) => {
        if (teamId === undefined) {
          const error = new TypeError('teamId is required');
          error.stack = 'Error at assessImpactScore';
          throw error;
        }
        return { impactScore: 75 };
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーがダウンしている状態が継続している',
      occurrenceFrequency: 2,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: undefined as any,
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter);
    }).toThrow(/teamId/);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});