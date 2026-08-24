import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Error Handling', () => {
  // SCEN-636
  test('should log error and rethrow exception when assessImpactScore fails during priority score calculation', () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation(() => {
        throw new TypeError('Unexpected API response format');
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout in production',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'team-dev-001',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisAdapter, mockLogger);
    }).toThrow(TypeError);

    expect(mockLogger.error).toHaveBeenCalled();
    const errorCall = mockLogger.error.mock.calls[0];
    expect(errorCall[0]).toMatch(/優先度スコア計算処理中にエラーが発生/);
    expect(errorCall[0]).toMatch(/TypeError/);
  });
});