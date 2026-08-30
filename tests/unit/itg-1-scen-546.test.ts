import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  test('SCEN-546: 指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する - 異常値除外後の代表値を返す', () => {
    // Arrange
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-A'];
    const excludeOutliers = true;

    // Mock: identifyProductivityAnomalies
    const detectedAnomaliesData = [
      {
        date: '2024-01-15',
        memberId: 'member-3',
        issueKeyword: 'サーバー障害',
        originalValue: 25,
        deviationFromNormal: 150,
      },
    ];

    // Mock: calculateIssueResolutionSpeed - 異常値除外後の平均解決日数
    const issueResolutionSpeedValue = 9.5;

    // Mock: calculateReportSubmissionRate - 異常値除外後の提出率
    const reportSubmissionRateValue = 92.0;

    // Mock: calculateIssueRecurrenceRate - 異常値除外後の再発率
    const issueRecurrenceRateValue = 3.5;

    // Mock: calculateTeamProductivityScore - 異常値除外後のスコア
    const teamProductivityScoreValue = 87;

    // Mock: validateProductivityAnalysisDataQuality
    const dataQualityAssessmentData = {
      completenessPercentage: 92,
      extractionAccuracy: 88,
      isReportable: true,
    };

    // Act
    const result: ProductivityMetricsOutput = calculateProductivityMetrics(
      {
        aggregationStartDate,
        aggregationEndDate,
        targetTeamIds,
        excludeOutliers,
      },
      {
        identifyProductivityAnomalies: jest.fn().mockReturnValue(detectedAnomaliesData),
        calculateIssueResolutionSpeed: jest.fn().mockReturnValue(issueResolutionSpeedValue),
        calculateReportSubmissionRate: jest.fn().mockReturnValue(reportSubmissionRateValue),
        calculateIssueRecurrenceRate: jest.fn().mockReturnValue(issueRecurrenceRateValue),
        calculateTeamProductivityScore: jest.fn().mockReturnValue(teamProductivityScoreValue),
        validateProductivityAnalysisDataQuality: jest.fn().mockReturnValue(dataQualityAssessmentData),
      }
    );

    // Assert
    expect(result.issueResolutionSpeed).toBe(9.5);
    expect(result.reportSubmissionRate).toBe(92.0);
    expect(result.issueRecurrenceRate).toBe(3.5);
    expect(result.teamProductivityScore).toBe(87);

    expect(result.detectedAnomalies).toBeDefined();
    expect(result.detectedAnomalies).toHaveLength(1);
    expect(result.detectedAnomalies[0]).toEqual({
      date: '2024-01-15',
      memberId: 'member-3',
      issueKeyword: 'サーバー障害',
      originalValue: 25,
      deviationFromNormal: 150,
    });

    expect(result.dataQualityAssessment).toBeDefined();
    expect(result.dataQualityAssessment.completenessPercentage).toBe(92);
    expect(result.dataQualityAssessment.extractionAccuracy).toBe(88);
    expect(result.dataQualityAssessment.isReportable).toBe(true);
  });
});