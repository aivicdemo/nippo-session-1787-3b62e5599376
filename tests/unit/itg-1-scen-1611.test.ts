import { validateReportQuality } from '../../src/logic/weekly-issue-analysis';
import { type ReportQualityValidationInput, type ReportQualityValidationResult } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Report Quality Validation', () => {
  // SCEN-1611: [normal] 課題分析結果再現性検証機能 - 同じ前週の日報に対して 2 回課題抽出を実行し、両回の抽出結果が完全に一致する
  test('should produce identical extraction results when analyzing the same weekly report data twice', () => {
    const reportId = 'report-2024-01-15-001';
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');

    const firstExecutionReport: ReportQualityValidationInput = {
      reportId,
      reportContent: {
        reportId,
        aggregationPeriod: {
          startDate: '2024-01-08',
          endDate: '2024-01-14',
        },
        issueRanking: [
          {
            issueKeyword: 'Database Connection Timeout',
            occurrenceCount: 3,
            rank: 1,
          },
          {
            issueKeyword: 'API Bug Investigation',
            occurrenceCount: 2,
            rank: 2,
          },
        ],
        priorityScores: [
          {
            issueId: 'issue-001',
            priorityScore: 72,
            priorityRank: 'high',
          },
          {
            issueId: 'issue-002',
            priorityScore: 58,
            priorityRank: 'medium',
          },
        ],
        recommendedCountermeasures: [
          {
            issueId: 'issue-001',
            countermeasure: 'Optimize connection pool settings',
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
        ],
        generatedAt: '2024-01-15T10:00:00Z',
      },
      sourceReportData: [
        {
          reportDate: '2024-01-08',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
        {
          reportDate: '2024-01-09',
          reportCount: 1,
          submittedByUserIds: ['user-002'],
          challengeItems: ['API Bug Investigation'],
        },
        {
          reportDate: '2024-01-10',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
        {
          reportDate: '2024-01-11',
          reportCount: 1,
          submittedByUserIds: ['user-003'],
          challengeItems: ['API Bug Investigation'],
        },
        {
          reportDate: '2024-01-12',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
      ],
      validationCriteria: {
        minRequiredIssueCount: 2,
        minAccuracyThreshold: 75,
        requiredReportSections: [
          'aggregationPeriod',
          'issueRanking',
          'priorityScores',
          'recommendedCountermeasures',
        ],
      },
    };

    const firstExecutionResult = validateReportQuality(firstExecutionReport);

    const secondExecutionReport: ReportQualityValidationInput = {
      reportId,
      reportContent: {
        reportId,
        aggregationPeriod: {
          startDate: '2024-01-08',
          endDate: '2024-01-14',
        },
        issueRanking: [
          {
            issueKeyword: 'Database Connection Timeout',
            occurrenceCount: 3,
            rank: 1,
          },
          {
            issueKeyword: 'API Bug Investigation',
            occurrenceCount: 2,
            rank: 2,
          },
        ],
        priorityScores: [
          {
            issueId: 'issue-001',
            priorityScore: 72,
            priorityRank: 'high',
          },
          {
            issueId: 'issue-002',
            priorityScore: 58,
            priorityRank: 'medium',
          },
        ],
        recommendedCountermeasures: [
          {
            issueId: 'issue-001',
            countermeasure: 'Optimize connection pool settings',
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
        ],
        generatedAt: '2024-01-15T10:00:00Z',
      },
      sourceReportData: [
        {
          reportDate: '2024-01-08',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
        {
          reportDate: '2024-01-09',
          reportCount: 1,
          submittedByUserIds: ['user-002'],
          challengeItems: ['API Bug Investigation'],
        },
        {
          reportDate: '2024-01-10',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
        {
          reportDate: '2024-01-11',
          reportCount: 1,
          submittedByUserIds: ['user-003'],
          challengeItems: ['API Bug Investigation'],
        },
        {
          reportDate: '2024-01-12',
          reportCount: 1,
          submittedByUserIds: ['user-001'],
          challengeItems: ['Database Connection Timeout'],
        },
      ],
      validationCriteria: {
        minRequiredIssueCount: 2,
        minAccuracyThreshold: 75,
        requiredReportSections: [
          'aggregationPeriod',
          'issueRanking',
          'priorityScores',
          'recommendedCountermeasures',
        ],
      },
    };

    const secondExecutionResult = validateReportQuality(secondExecutionReport);

    expect(JSON.stringify(firstExecutionResult)).toBe(
      JSON.stringify(secondExecutionResult)
    );

    expect(firstExecutionResult.isValid).toBe(true);
    expect(firstExecutionResult.validationStatus).toBe('approved');
    expect(secondExecutionResult.isValid).toBe(true);
    expect(secondExecutionResult.validationStatus).toBe('approved');

    expect(firstExecutionResult.issues).toEqual(secondExecutionResult.issues);
  });
});