import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import type {
  ProductivityMetricsInput,
  ProductivityMetricsOutput,
} from '../../src/logic/productivity-metrics-calculation';

describe('Productivity Metrics Calculation', () => {
  test('SCEN-542: calculateProductivityMetrics aggregates sub-process results into ProductivityMetricsOutput', () => {
    // Arrange
    const mockIssueResolutionSpeed = 5.5;
    const mockReportSubmissionRate = 92.0;
    const mockIssueRecurrenceRate = 8.5;
    const mockTeamProductivityScore = 87.3;
    const mockDetectedAnomalies = [];
    const mockDataQualityAssessment = {
      completeness: 95.0,
      accuracy: 88.5,
      trustworthiness: 91.2,
    };

    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date('2024-01-01T00:00:00Z'),
      aggregationEndDate: new Date('2024-01-31T23:59:59Z'),
      targetTeamIds: ['team-001', 'team-002'],
      excludeOutliers: false,
    };

    // Mock the sub-process functions
    jest.mock('../../src/logic/productivity-metrics-calculation', () => {
      const actualModule = jest.requireActual(
        '../../src/logic/productivity-metrics-calculation'
      );
      return {
        ...actualModule,
        calculateIssueResolutionSpeed: jest.fn(() => mockIssueResolutionSpeed),
        calculateReportSubmissionRate: jest.fn(() => mockReportSubmissionRate),
        calculateIssueRecurrenceRate: jest.fn(() => mockIssueRecurrenceRate),
        calculateTeamProductivityScore: jest.fn(() => mockTeamProductivityScore),
        identifyProductivityAnomalies: jest.fn(() => mockDetectedAnomalies),
        validateProductivityAnalysisDataQuality: jest.fn(() =>
          mockDataQualityAssessment
        ),
      };
    });

    // Act
    const result: ProductivityMetricsOutput =
      calculateProductivityMetrics(input);

    // Assert
    expect(result.issueResolutionSpeed).toBe(5.5);
    expect(result.reportSubmissionRate).toBe(92.0);
    expect(result.issueRecurrenceRate).toBe(8.5);
    expect(result.teamProductivityScore).toBe(87.3);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment).toEqual({
      completeness: 95.0,
      accuracy: 88.5,
      trustworthiness: 91.2,
    });
  });
});