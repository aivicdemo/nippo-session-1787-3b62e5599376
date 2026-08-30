import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

jest.mock('../../src/logic/productivity-metrics-calculation', () => {
  const actualModule = jest.requireActual('../../src/logic/productivity-metrics-calculation');
  return {
    ...actualModule,
    calculateIssueResolutionSpeed: jest.fn(),
    calculateReportSubmissionRate: jest.fn(),
    calculateIssueRecurrenceRate: jest.fn(),
    calculateTeamProductivityScore: jest.fn(),
    identifyProductivityAnomalies: jest.fn(),
    validateProductivityAnalysisDataQuality: jest.fn(),
  };
});

describe('productivity-metrics-calculation', () => {
  // SCEN-596
  test('should calculate productivity metrics with aggregated data from daily reports within specified period', () => {
    const {
      calculateIssueResolutionSpeed,
      calculateReportSubmissionRate,
      calculateIssueRecurrenceRate,
      calculateTeamProductivityScore,
      identifyProductivityAnomalies,
      validateProductivityAnalysisDataQuality,
    } = require('../../src/logic/productivity-metrics-calculation');

    calculateIssueResolutionSpeed.mockReturnValue(5.5);
    calculateReportSubmissionRate.mockReturnValue(0.92);
    calculateIssueRecurrenceRate.mockReturnValue(0.08);
    calculateTeamProductivityScore.mockReturnValue(87.5);
    identifyProductivityAnomalies.mockReturnValue([]);
    validateProductivityAnalysisDataQuality.mockReturnValue({
      completeness: 0.95,
      accuracy: 0.88,
      reliability: 0.90,
    });

    const result = calculateProductivityMetrics({
      aggregationStartDate: new Date('2024-01-01'),
      aggregationEndDate: new Date('2024-01-31'),
      targetTeamIds: ['team-001', 'team-002'],
      excludeOutliers: false,
    });

    expect(result.issueResolutionSpeed).toBe(5.5);
    expect(result.reportSubmissionRate).toBe(0.92);
    expect(result.issueRecurrenceRate).toBe(0.08);
    expect(result.teamProductivityScore).toBe(87.5);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment.completeness).toBe(0.95);
    expect(result.dataQualityAssessment.accuracy).toBe(0.88);
    expect(result.dataQualityAssessment.reliability).toBe(0.90);
  });
});