import { validateReportQuality } from '../../src/logic/report-quality-validation';
import type {
  ReportQualityValidationInput,
  ReportQualityValidationResult,
} from '../../src/logic/report-quality-validation';

describe('Report Quality Validation', () => {
  test('SCEN-179: validateReportQuality processes valid report with complete content, accuracy, and utility', () => {
    const input: ReportQualityValidationInput = {
      reportId: 'RPT-001',
      reportContent: {
        sections: ['executive_summary', 'issue_extraction', 'priority_scores', 'analysis_results'],
        issueRankingList: [
          { keyword: 'build_failure', frequency: 5, rank: 1 },
          { keyword: 'test_delay', frequency: 3, rank: 2 },
        ],
        priorityScoredIssues: [
          { issueId: 'ISS-001', priorityScore: 85 },
          { issueId: 'ISS-002', priorityScore: 62 },
        ],
        recommendedCountermeasures: [
          { issueId: 'ISS-001', countermeasure: 'Automate build pipeline' },
          { issueId: 'ISS-002', countermeasure: 'Optimize test environment' },
        ],
      },
      sourceReportDataset: {
        reportDate: '2024-01-15',
        dailyReports: [
          {
            employeeId: 'EMP-001',
            reportedIssues: ['build_failure'],
            submittedAt: '2024-01-15T08:00:00Z',
          },
          {
            employeeId: 'EMP-002',
            reportedIssues: ['build_failure', 'test_delay'],
            submittedAt: '2024-01-15T08:15:00Z',
          },
        ],
      },
      validationCriteria: {
        requiredSections: ['issue_extraction', 'priority_scores', 'analysis_results'],
        accuracyThreshold: 5,
        requiredUtilityElements: ['root_cause_classification', 'priority_ranking', 'execution_plan'],
      },
    };

    const result: ReportQualityValidationResult = validateReportQuality(input);

    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('approved');
    expect(result.completenessResult).toEqual({
      isComplete: true,
      fulfilledSections: ['issue_extraction', 'priority_scores', 'analysis_results'],
      missingSections: [],
      validationTimestamp: expect.any(Date),
    });
    expect(result.accuracyResult).toEqual({
      isAccurate: true,
      accuracyScore: 100,
      detectedIssues: [],
      calculationLogicValidation: 'criteria_compliant',
    });
    expect(result.utilityResult).toEqual({
      isUtilityValid: true,
      utilityScore: 95,
      includedElements: ['root_cause_classification', 'priority_ranking', 'execution_plan'],
      missingElements: [],
    });
    expect(result.correctionInstructions).toEqual([]);
    expect(result.approvalEligibility).toBe(true);
  });
});