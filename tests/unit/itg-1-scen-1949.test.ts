import { describe, test, expect, beforeEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1949
  test('分析対象期間の開始日が未指定のときエラーになる', () => {
    const analysisStartDate = undefined;
    const analysisEndDate = new Date('2026-08-25T23:59:59Z');
    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open' as const,
      },
    ];
    const minimumDataPointsThreshold = 7;
    const outlierDetectionEnabled = true;

    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        analysisStartDate as any,
        analysisEndDate,
        issueTimeSeriesData,
        minimumDataPointsThreshold,
        outlierDetectionEnabled,
        stubTextAnalysisServiceAdapter,
      ),
    ).toThrow(/開始日/);

    expect(stubTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(stubTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(stubTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});