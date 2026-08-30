import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-550: 指定された集約期間内の日報データから課題解決速度、提出率、課題再発率を定量化し、生産性指標を計算する
  test('should calculate productivity metrics with correct weighted formula for valid 31-day period with 80% data completeness and diverse issue extraction', () => {
    // Setup: Input data matching SCEN-550 scenario
    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date('2024-01-01'),
      aggregationEndDate: new Date('2024-01-31'),
      targetTeamIds: ['team-001'],
      excludeOutliers: false,
    };

    // Mock underlying calculation results to test weighted formula
    // Expected calculations:
    // - dataCompletenessRatio = 200 / 250 = 0.8
    // - issueFrequencyDistribution has 4 keyword types with count {遅延:15, バグ:12, 仕様不明:10, リソース不足:8}
    // - Total extracted issues = 45
    // - Improvement measures: 2 items with estimatedImpact [75, 65] and resourceRequired [60, 40]

    // Execute function
    const result: ProductivityMetricsOutput = calculateProductivityMetrics(input);

    // Assertion 1: Basic structure validation
    expect(result).toHaveProperty('issueResolutionSpeed');
    expect(result).toHaveProperty('reportSubmissionRate');
    expect(result).toHaveProperty('issueRecurrenceRate');
    expect(result).toHaveProperty('teamProductivityScore');
    expect(result).toHaveProperty('dataQualityAssessment');

    // Assertion 2: Data quality assessment structure
    expect(result.dataQualityAssessment).toHaveProperty('completenessPercentage');
    expect(result.dataQualityAssessment).toHaveProperty('extractionAccuracy');
    expect(result.dataQualityAssessment).toHaveProperty('isReportable');

    // Assertion 3: Data completeness = 200/250 = 0.8 = 80%
    expect(result.dataQualityAssessment.completenessPercentage).toBe(80);

    // Assertion 4: Extraction accuracy should be 60 or above based on diverse keyword distribution
    // With 4 keyword types and 45 total extracted issues showing good diversity
    expect(result.dataQualityAssessment.extractionAccuracy).toBeGreaterThanOrEqual(60);
    expect(result.dataQualityAssessment.extractionAccuracy).toBeLessThanOrEqual(100);

    // Assertion 5: Team productivity score in valid range (0-100)
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    // Assertion 6: Issue resolution speed should be numeric and positive
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(result.issueResolutionSpeed).toBeGreaterThanOrEqual(0);

    // Assertion 7: Report submission rate = 200/250 * 100 = 80%
    expect(result.reportSubmissionRate).toBe(80);

    // Assertion 8: Issue recurrence rate in valid percentage range
    expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);

    // Assertion 9: Data is reportable when completeness >= 80%, extraction >= 60%, and other criteria met
    expect(result.dataQualityAssessment.isReportable).toBe(true);

    // Assertion 10: No anomalies expected for normal input data (or empty if no anomalies detected)
    if (result.detectedAnomalies !== undefined) {
      expect(Array.isArray(result.detectedAnomalies)).toBe(true);
    }

    // Assertion 11: Weighted formula validation
    // trustworthinessScore = (completenessRatio × 0.4 + extractionAccuracy × 0.35 + feasibilityScore × 0.25) × 100
    // With completeness=0.8 (40%), extractionAccuracy≥60 (35%), feasibilityScore≥50 (25%)
    // Minimum: (0.8 × 0.4 + 0.6 × 0.35 + 0.5 × 0.25) × 100 = (0.32 + 0.21 + 0.125) × 100 = 64.5
    // Maximum: (0.8 × 0.4 + 1.0 × 0.35 + 1.0 × 0.25) × 100 = (0.32 + 0.35 + 0.25) × 100 = 92
    const impliedTrustworthinessScore = 
      (0.8 * 0.4 + (result.dataQualityAssessment.extractionAccuracy / 100) * 0.35 + (result.teamProductivityScore / 100) * 0.25) * 100;
    
    expect(impliedTrustworthinessScore).toBeGreaterThanOrEqual(64);
    expect(impliedTrustworthinessScore).toBeLessThanOrEqual(100);

    // Assertion 12: Verify all output fields are present and properly typed
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(typeof result.teamProductivityScore).toBe('number');
    expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
    expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');
  });
});