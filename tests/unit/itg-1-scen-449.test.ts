import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyAnalysisReportInput, type MonthlyAnalysisReportOutput } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-449: Issue resolution threshold boundary condition clamping (0 and 365+ edge cases)
  test('should clamp issueResolutionThresholdDays to valid range (1-365) and generate report with normalized threshold', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001', 'team-002'];
    const requestingUserId = 'pm-user-001';

    const inputWithThresholdZero: MonthlyAnalysisReportInput = {
      reportingPeriodStart: analysisStartDate,
      reportingPeriodEnd: analysisEndDate,
      targetTeamIds: targetTeamIds,
      requestingUserId: requestingUserId,
      issueResolutionThresholdDays: 0,
    };

    const resultWithZero = generateMonthlyAnalysisReport(inputWithThresholdZero);

    expect(resultWithZero).toBeDefined();
    expect(resultWithZero.isReportable).toBe(true);
    expect(resultWithZero.dataCompletenessScore).toBeGreaterThanOrEqual(0);
    expect(resultWithZero.dataCompletenessScore).toBeLessThanOrEqual(100);
    expect(resultWithZero.extractionAccuracyScore).toBeGreaterThanOrEqual(0);
    expect(resultWithZero.extractionAccuracyScore).toBeLessThanOrEqual(100);
    expect(resultWithZero.measuresFeasibilityScore).toBeGreaterThanOrEqual(0);
    expect(resultWithZero.measuresFeasibilityScore).toBeLessThanOrEqual(100);

    const inputWithThresholdOver365: MonthlyAnalysisReportInput = {
      reportingPeriodStart: analysisStartDate,
      reportingPeriodEnd: analysisEndDate,
      targetTeamIds: targetTeamIds,
      requestingUserId: requestingUserId,
      issueResolutionThresholdDays: 366,
    };

    const resultWithOver365 = generateMonthlyAnalysisReport(inputWithThresholdOver365);

    expect(resultWithOver365).toBeDefined();
    expect(resultWithOver365.isReportable).toBe(true);
    expect(resultWithOver365.dataCompletenessScore).toBeGreaterThanOrEqual(0);
    expect(resultWithOver365.dataCompletenessScore).toBeLessThanOrEqual(100);
    expect(resultWithOver365.extractionAccuracyScore).toBeGreaterThanOrEqual(0);
    expect(resultWithOver365.extractionAccuracyScore).toBeLessThanOrEqual(100);
    expect(resultWithOver365.measuresFeasibilityScore).toBeGreaterThanOrEqual(0);
    expect(resultWithOver365.measuresFeasibilityScore).toBeLessThanOrEqual(100);

    const inputWithValidThreshold: MonthlyAnalysisReportInput = {
      reportingPeriodStart: analysisStartDate,
      reportingPeriodEnd: analysisEndDate,
      targetTeamIds: targetTeamIds,
      requestingUserId: requestingUserId,
      issueResolutionThresholdDays: 7,
    };

    const resultWithValid = generateMonthlyAnalysisReport(inputWithValidThreshold);

    expect(resultWithValid).toBeDefined();
    expect(resultWithValid.isReportable).toBe(true);
    expect(resultWithValid.dataCompletenessScore).toBeGreaterThanOrEqual(0);
    expect(resultWithValid.dataCompletenessScore).toBeLessThanOrEqual(100);
    expect(resultWithValid.extractionAccuracyScore).toBeGreaterThanOrEqual(0);
    expect(resultWithValid.extractionAccuracyScore).toBeLessThanOrEqual(100);
    expect(resultWithValid.measuresFeasibilityScore).toBeGreaterThanOrEqual(0);
    expect(resultWithValid.measuresFeasibilityScore).toBeLessThanOrEqual(100);

    expect(resultWithZero.failureReasons).toBeUndefined();
    expect(resultWithOver365.failureReasons).toBeUndefined();
  });
});