import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('generateWeeklyAnalysisReport - TextAnalysisServiceAdapter failure', () => {
  // SCEN-1690
  test('should stop analysis and return error when assessImpactScore fails', async () => {
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const teamId = 'team-001';

    const extractedIssues = [
      {
        keyword: 'API response timeout',
        occurrenceCount: 3,
        impactLevel: 'high',
      },
      {
        keyword: 'Database connection pool exhaustion',
        occurrenceCount: 2,
        impactLevel: 'medium',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['API response timeout', 'Database connection pool exhaustion'],
        confidenceScores: [0.95, 0.87],
      }),
      assessImpactScore: jest.fn().mockRejectedValue(new Error('Impact assessment failed')),
      classifyIssueSeverity: jest.fn(),
    };

    const result = await generateWeeklyAnalysisReport(
      {
        aggregationStartDate,
        aggregationEndDate,
        extractedIssues,
        teamId,
      },
      mockTextAnalysisServiceAdapter,
    );

    expect(result).toEqual({
      success: false,
      error: 'Impact assessment failed',
      phase: 'assessImpactScore',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});