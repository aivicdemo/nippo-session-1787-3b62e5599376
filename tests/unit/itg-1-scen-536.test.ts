import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-536: [normal] 指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する
  test('calculateProductivityMetricsが設計された計算式の代表値を返す', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    const mockIssueResolutionSpeedResult = {
      averageResolutionDays: 5.5,
      resolvedIssueCount: 20,
      openIssueCount: 3,
      resolutionSpeedByIssue: [],
      calculatedAt: new Date('2024-01-31T10:00:00Z'),
    };

    const mockSubmissionRateResult = {
      submissionRate: 85.0,
      actualSubmissionCount: 170,
      expectedSubmissionCount: 200,
      calculationTimestamp: new Date('2024-01-31T10:00:00Z'),
    };

    const mockRecurrenceRateResult = {
      overallRecurrenceRate: 12.5,
      recurrenceByKeyword: [
        { keyword: 'バグ', totalOccurrences: 8, recurrenceCount: 2, recurrenceRate: 25.0 },
      ],
      recurrentIssueIds: ['issue-001', 'issue-002'],
      calculationTimestamp: '2024-01-31T10:00:00Z',
    };

    const mockTeamProductivityScoreResult = {
      teamId: 'team-001',
      overallProductivityScore: 78.3,
      submissionRateContribution: 25.5,
      resolutionSpeedContribution: 26.4,
      recurrenceRateContribution: 26.4,
      scoreRank: '良好',
      calculatedAt: '2024-01-31T10:00:00Z',
    };

    const mockAnomalies: any[] = [];

    const mockDataQualityAssessment = {
      completenessPercentage: 95.0,
      extractionAccuracy: 92.5,
      isReportable: true,
    };

    jest.mock('../../src/logic/productivity-metrics-calculation', () => ({
      calculateProductivityMetrics: jest.fn(),
      calculateIssueResolutionSpeed: jest.fn(() => mockIssueResolutionSpeedResult),
      calculateReportSubmissionRate: jest.fn(() => mockSubmissionRateResult),
      calculateIssueRecurrenceRate: jest.fn(() => mockRecurrenceRateResult),
      calculateTeamProductivityScore: jest.fn(() => mockTeamProductivityScoreResult),
      identifyProductivityAnomalies: jest.fn(() => mockAnomalies),
      validateProductivityAnalysisDataQuality: jest.fn(() => mockDataQualityAssessment),
    }));

    const result = calculateProductivityMetrics(
      {
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        excludeOutliers,
      },
      {
        calculateIssueResolutionSpeed: jest.fn(() => mockIssueResolutionSpeedResult),
        calculateReportSubmissionRate: jest.fn(() => mockSubmissionRateResult),
        calculateIssueRecurrenceRate: jest.fn(() => mockRecurrenceRateResult),
        calculateTeamProductivityScore: jest.fn(() => mockTeamProductivityScoreResult),
        identifyProductivityAnomalies: jest.fn(() => mockAnomalies),
        validateProductivityAnalysisDataQuality: jest.fn(() => mockDataQualityAssessment),
      }
    );

    expect(result.issueResolutionSpeed).toBe(5.5);
    expect(result.reportSubmissionRate).toBe(85.0);
    expect(result.issueRecurrenceRate).toBe(12.5);
    expect(result.teamProductivityScore).toBe(78.3);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment.completenessPercentage).toBe(95.0);
    expect(result.dataQualityAssessment.extractionAccuracy).toBe(92.5);
    expect(result.dataQualityAssessment.isReportable).toBe(true);
  });
});