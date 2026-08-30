import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportGenerationRequest, type MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  let mockExtractMonthlyReportDataset: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('SCEN-444: should generate report with empty dataset warning when no reports exist in extraction period', async () => {
    // Arrange
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const emptyMonthlyDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 0,
      reports: [],
      dataQualityScore: 0,
    };

    mockExtractMonthlyReportDataset = jest
      .fn()
      .mockResolvedValue(emptyMonthlyDataset);

    // Mock the extractMonthlyReportDataset to return empty results
    jest.doMock('../../src/logic/monthly-analysis-report', () => ({
      ...jest.requireActual('../../src/logic/monthly-analysis-report'),
      extractMonthlyReportDataset: mockExtractMonthlyReportDataset,
    }));

    // Act
    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    // Assert - Verify return type and structure
    expect(result).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.targetMonth).toBe('2024-01');

    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.issueTrendAnalysis).toBeDefined();
    expect(Array.isArray(result.reportContent.issueTrendAnalysis)).toBe(true);

    expect(result.reportContent.bottleneckProgression).toBeDefined();

    expect(result.reportContent.teamPerformanceMetrics).toBeDefined();
    expect(Array.isArray(result.reportContent.teamPerformanceMetrics)).toBe(true);

    expect(result.reportContent.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(result.reportContent.topPriorityChallenges)).toBe(true);
    expect(result.reportContent.topPriorityChallenges.length).toBe(0);

    expect(result.projectDelayRiskLevel).toMatch(/^(high|medium|low)$/);

    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeGreaterThan(0);

    // Verify warning was logged for empty dataset
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/対象月の報告データが見つかりません/)
    );

    // Verify that the function completes without throwing an error
    // (warning condition, not error condition)
    expect(result).toBeTruthy();
  });
});