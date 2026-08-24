import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Data Quality at Acceptable Threshold', () => {
  // SCEN-1700
  test('should execute weekly issue analysis when data quality score is 1 point above minimum threshold', async () => {
    const weekStartDate = new Date('2024-01-15T00:00:00Z');
    const weekEndDate = new Date('2024-01-21T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const requestedByUserId = 'user-manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'デプロイ遅延', frequency: 5, confidence: 0.95 },
          { keyword: 'テスト不足', frequency: 3, confidence: 0.88 },
          { keyword: 'ドキュメント不備', frequency: 2, confidence: 0.82 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        score: 61,
        breakdown: {
          completeness: 70,
          accuracy: 65,
          usefulness: 48
        }
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: [
          { issueKeyword: 'デプロイ遅延', severity: 'high' },
          { issueKeyword: 'テスト不足', severity: 'high' },
          { issueKeyword: 'ドキュメント不備', severity: 'medium' }
        ]
      })
    };

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId
    };

    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter
    );

    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.dataQualityScore).toBe(61);
    expect(result.totalReportsExtracted).toBeGreaterThan(0);
    expect(result.reportsByDate).toBeDefined();
    expect(Array.isArray(result.reportsByDate)).toBe(true);
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();

    const severityClassifications = mockTextAnalysisAdapter.classifyIssueSeverity.mock.results[0].value.classifications;
    expect(severityClassifications).toBeDefined();
    expect(severityClassifications.length).toBeGreaterThan(0);
    expect(severityClassifications[0]).toHaveProperty('issueKeyword');
    expect(severityClassifications[0]).toHaveProperty('severity');
  });
});