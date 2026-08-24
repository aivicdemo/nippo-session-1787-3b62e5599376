import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Report Data Extraction - Negative Impact Score Error Handling', () => {
  test('SCEN-1812: should throw error when issue impact scores contain negative values', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-dept-head-001';
    const extractionPeriodStart = '2024-01-01T00:00:00Z';
    const extractionPeriodEnd = '2024-01-31T23:59:59Z';

    // Mock TextAnalysisServiceAdapter that returns negative impact scores
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'issue-a', frequency: 5 },
          { keyword: 'issue-b', frequency: 3 },
          { keyword: 'issue-c', frequency: 8 }
        ]
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === 'issue-b') return Promise.resolve(-3);
        if (keyword === 'issue-c') return Promise.resolve(-8);
        return Promise.resolve(75);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    // Test data with multiple daily reports containing issues
    const reportDataset = {
      extractionPeriodStart,
      extractionPeriodEnd,
      totalReportCount: 3,
      reportsByTeam: [
        {
          teamId: 'team-dev-001',
          reportCount: 3,
          submissionRate: 100,
          reportIds: ['report-001', 'report-002', 'report-003']
        }
      ],
      dataQualityScore: 95,
      extractedAt: '2024-02-01T09:00:00Z'
    };

    // Prepare input with negative scores detected
    const monthlyExtractionRequest = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: ['team-dev-001']
    };

    // Execute extraction with stubbed adapter that returns negative scores
    const extractionPromise = extractMonthlyReportData(
      monthlyExtractionRequest,
      mockTextAnalysisAdapter
    );

    // Assert that error is thrown with specific error message containing negative values
    await expect(extractionPromise).rejects.toThrow(/課題影響度スコアが負数です/);
    
    // Verify error message contains specific negative score values
    try {
      await extractMonthlyReportData(
        monthlyExtractionRequest,
        mockTextAnalysisAdapter
      );
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/issue-b=-3/);
        expect(error.message).toMatch(/issue-c=-8/);
      }
    }

    // Verify that TextAnalysisServiceAdapter was called during processing
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});