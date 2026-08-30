import { generateWeeklyAnalysisReport, type AggregatedWeeklyReportData } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  // SCEN-086
  test('should generate weekly analysis report with aggregated data from previous week', () => {
    const analysisStartDate = new Date('2025-01-06T00:00:00Z');
    const analysisEndDate = new Date('2025-01-12T23:59:59Z');
    const teamId = 'team-001';

    const reportRecords = [
      {
        reportId: 'report-001',
        reporterId: 'eng-001',
        reportDate: '2025-01-06',
        reportContent: 'Fixed authentication bug',
        submittedAt: '2025-01-06T08:15:00Z'
      },
      {
        reportId: 'report-002',
        reporterId: 'eng-002',
        reportDate: '2025-01-07',
        reportContent: 'Refactored API endpoints',
        submittedAt: '2025-01-07T08:20:00Z'
      },
      {
        reportId: 'report-003',
        reporterId: 'eng-003',
        reportDate: '2025-01-08',
        reportContent: 'Server response delayed',
        submittedAt: '2025-01-08T08:10:00Z'
      },
      {
        reportId: 'report-004',
        reporterId: 'eng-004',
        reportDate: '2025-01-09',
        reportContent: 'Deploy automation not implemented',
        submittedAt: '2025-01-09T08:25:00Z'
      },
      {
        reportId: 'report-005',
        reporterId: 'eng-005',
        reportDate: '2025-01-10',
        reportContent: 'Specification document out of sync',
        submittedAt: '2025-01-10T08:18:00Z'
      },
      {
        reportId: 'report-006',
        reporterId: 'eng-006',
        reportDate: '2025-01-11',
        reportContent: 'Test environment insufficient',
        submittedAt: '2025-01-11T08:22:00Z'
      },
      {
        reportId: 'report-007',
        reporterId: 'eng-007',
        reportDate: '2025-01-12',
        reportContent: 'Documentation synchronization mismatch',
        submittedAt: '2025-01-12T08:12:00Z'
      },
      {
        reportId: 'report-008',
        reporterId: 'eng-008',
        reportDate: '2025-01-06',
        reportContent: 'Database query optimization needed',
        submittedAt: '2025-01-06T08:30:00Z'
      }
    ];

    const extractedIssues = [
      {
        issueId: 'issue-001',
        issueContent: 'Server response delays affecting user experience',
        keyword: 'Server response delay',
        occurrenceCount: 3
      },
      {
        issueId: 'issue-002',
        issueContent: 'Deployment automation framework missing',
        keyword: 'Deploy automation',
        occurrenceCount: 2
      },
      {
        issueId: 'issue-003',
        issueContent: 'Technical specification documentation out of date',
        keyword: 'Specification document',
        occurrenceCount: 2
      },
      {
        issueId: 'issue-004',
        issueContent: 'Test environment resource constraints',
        keyword: 'Test environment',
        occurrenceCount: 2
      },
      {
        issueId: 'issue-005',
        issueContent: 'Documentation and codebase synchronization issues',
        keyword: 'Documentation sync',
        occurrenceCount: 1
      }
    ];

    const aggregatedData: AggregatedWeeklyReportData = {
      reportRecords,
      extractedIssues,
      dataQualityMetrics: {
        completenessRate: 0.85,
        deduplicationRate: 0.92,
        validityRate: 0.88
      }
    };

    const result = generateWeeklyAnalysisReport({
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData: aggregatedData
    });

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.aggregationPeriod.startDate).toEqual(analysisStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(analysisEndDate);

    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);
    expect(result.issueRanking.length).toBe(5);

    expect(result.issueRanking[0].occurrenceFrequency).toBeGreaterThanOrEqual(
      result.issueRanking[1].occurrenceFrequency
    );
    expect(result.issueRanking[1].occurrenceFrequency).toBeGreaterThanOrEqual(
      result.issueRanking[2].occurrenceFrequency
    );

    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);
    expect(result.priorityScores.length).toBe(5);

    result.priorityScores.forEach((score) => {
      expect(typeof score.issueId).toBe('string');
      expect(typeof score.priorityScore).toBe('number');
      expect(score.priorityScore).toBeGreaterThanOrEqual(0);
      expect(score.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(score.priorityRank);
    });

    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    expect(result.recommendedActions.length).toBeGreaterThan(0);

    result.recommendedActions.forEach((action) => {
      expect(typeof action.issueId).toBe('string');
      expect(typeof action.recommendedAction).toBe('string');
      expect(action.recommendedAction.length).toBeGreaterThan(0);
    });

    expect(result.colorCodedIssueList).toBeDefined();
    expect(Array.isArray(result.colorCodedIssueList)).toBe(true);
    expect(result.colorCodedIssueList.length).toBe(5);

    result.colorCodedIssueList.forEach((issue) => {
      expect(typeof issue.issueId).toBe('string');
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
    });

    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(
      new Date().getTime() - 5000
    );
  });
});