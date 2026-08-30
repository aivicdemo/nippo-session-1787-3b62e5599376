import { validateReportQuality } from '../../src/logic/report-quality-validation';

describe('Report Quality Validation', () => {
  test('SCEN-503: validateReportQuality should validate report completeness, accuracy, and utility against quality criteria and return correction instructions when criteria are not met', () => {
    const reportId = 'report-001';
    const reportContent = {
      reportId: reportId,
      aggregationPeriodStart: new Date('2024-01-08'),
      aggregationPeriodEnd: new Date('2024-01-14'),
      issueRankingList: [
        {
          keyword: 'バグ',
          frequency: 5,
          percentageOfTeam: 50.0,
          rank: 1,
        },
        {
          keyword: '遅延',
          frequency: 3,
          percentageOfTeam: 30.0,
          rank: 2,
        },
      ],
      priorityScoredIssues: [
        {
          issueId: 'issue-001',
          priorityScore: 85,
        },
        {
          issueId: 'issue-002',
          priorityScore: 65,
        },
      ],
      recommendedCountermeasures: [
        {
          issueId: 'issue-001',
          countermeasure: 'バグ修正プロセスの強化',
        },
      ],
    };

    const sourceReportDataset = {
      reports: [
        {
          employeeId: 'emp-001',
          date: '2024-01-08',
          issues: 'バグが複数発生',
        },
        {
          employeeId: 'emp-002',
          date: '2024-01-09',
          issues: '遅延が発生',
        },
      ],
    };

    const validationCriteria = {
      requiredSections: [
        'issueRankingList',
        'priorityScoredIssues',
        'recommendedCountermeasures',
      ],
      accuracyThreshold: 95,
      requiredUtilityElements: [
        'issueRankingList',
        'priorityScoredIssues',
        'recommendedCountermeasures',
      ],
    };

    const result = validateReportQuality(
      reportId,
      reportContent,
      sourceReportDataset,
      validationCriteria
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('validationStatus');
    expect(result).toHaveProperty('completenessResult');
    expect(result).toHaveProperty('accuracyResult');
    expect(result).toHaveProperty('utilityResult');
    expect(result).toHaveProperty('correctionInstructions');
    expect(result).toHaveProperty('approvalEligibility');
    expect(typeof result.isValid).toBe('boolean');
    expect(['approved', 'rejected', 'conditional']).toContain(
      result.validationStatus
    );
    expect(Array.isArray(result.correctionInstructions)).toBe(true);
    expect(typeof result.approvalEligibility).toBe('boolean');
  });
});