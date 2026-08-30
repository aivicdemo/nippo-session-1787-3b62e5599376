import { generateWeeklyAnalysisReport, type WeeklyAnalysisReportInput } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  // SCEN-435: Data quality warning when completeness is between 49% and 70% of minimum threshold
  test('should warn when data completeness falls below minimum threshold but above 49% threshold', () => {
    const minimumDataCompleteness = 0.7;
    const minimumRecordCount = 5;
    const analysisStartDate = new Date('2024-01-08T00:00:00Z'); // Monday
    const analysisEndDate = new Date('2024-01-14T23:59:59Z'); // Sunday

    const reportRecords = [
      {
        reportId: 'RPT001',
        reporterId: 'E001',
        reportDate: '2024-01-08',
        yesterday: 'Implementation task completed',
        today: 'Planned work for today',
        issue: '',
        submittedAt: '2024-01-08T09:00:00Z',
      },
      {
        reportId: 'RPT002',
        reporterId: 'E002',
        reportDate: '2024-01-08',
        yesterday: '',
        today: 'Planning session',
        issue: 'Resource constraint identified',
        submittedAt: '2024-01-08T09:15:00Z',
      },
      {
        reportId: 'RPT003',
        reporterId: 'E003',
        reportDate: '2024-01-09',
        yesterday: 'Code review completed',
        today: 'Feature development',
        issue: '',
        submittedAt: '2024-01-09T08:30:00Z',
      },
      {
        reportId: 'RPT004',
        reporterId: 'E004',
        reportDate: '2024-01-09',
        yesterday: '',
        today: 'Testing phase',
        issue: 'Bug in module X',
        submittedAt: '2024-01-09T08:45:00Z',
      },
      {
        reportId: 'RPT005',
        reporterId: 'E005',
        reportDate: '2024-01-10',
        yesterday: 'Documentation updated',
        today: 'Integration testing',
        issue: '',
        submittedAt: '2024-01-10T09:00:00Z',
      },
      {
        reportId: 'RPT006',
        reporterId: 'E006',
        reportDate: '2024-01-10',
        yesterday: '',
        today: 'Deployment preparation',
        issue: 'Network latency detected',
        submittedAt: '2024-01-10T09:10:00Z',
      },
      {
        reportId: 'RPT007',
        reporterId: 'E007',
        reportDate: '2024-01-11',
        yesterday: 'Sprint planning',
        today: 'Backend optimization',
        issue: '',
        submittedAt: '2024-01-11T08:50:00Z',
      },
      {
        reportId: 'RPT008',
        reporterId: 'E008',
        reportDate: '2024-01-11',
        yesterday: '',
        today: 'Database migration',
        issue: 'Schema conflict',
        submittedAt: '2024-01-11T09:05:00Z',
      },
      {
        reportId: 'RPT009',
        reporterId: 'E009',
        reportDate: '2024-01-12',
        yesterday: 'API endpoint testing',
        today: 'Security audit',
        issue: '',
        submittedAt: '2024-01-12T08:40:00Z',
      },
      {
        reportId: 'RPT010',
        reporterId: 'E010',
        reportDate: '2024-01-12',
        yesterday: '',
        today: 'Performance monitoring',
        issue: 'Memory leak suspected',
        submittedAt: '2024-01-12T09:20:00Z',
      },
    ];

    const filledFieldCounts = reportRecords.map((record) => {
      let count = 0;
      if (record.yesterday && record.yesterday.trim()) count++;
      if (record.today && record.today.trim()) count++;
      if (record.issue && record.issue.trim()) count++;
      return count;
    });

    const totalFilledFields = filledFieldCounts.reduce((sum, count) => sum + count, 0);
    const totalPossibleFields = reportRecords.length * 3;
    const actualCompletenessScore = totalFilledFields / totalPossibleFields;

    expect(actualCompletenessScore).toBe(0.65);
    expect(actualCompletenessScore).toBeLessThan(minimumDataCompleteness);
    expect(actualCompletenessScore).toBeGreaterThanOrEqual(minimumDataCompleteness * minimumDataCompleteness);

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate,
      analysisEndDate,
      teamId: 'TEAM-001',
      aggregatedReportData: {
        reportRecords,
        extractedIssues: [
          {
            issueId: 'ISS001',
            issueKeyword: 'Resource constraint',
            occurrenceCount: 1,
            affectedMemberCount: 1,
          },
          {
            issueId: 'ISS002',
            issueKeyword: 'Bug in module X',
            occurrenceCount: 1,
            affectedMemberCount: 1,
          },
          {
            issueId: 'ISS003',
            issueKeyword: 'Network latency',
            occurrenceCount: 1,
            affectedMemberCount: 1,
          },
          {
            issueId: 'ISS004',
            issueKeyword: 'Schema conflict',
            occurrenceCount: 1,
            affectedMemberCount: 1,
          },
          {
            issueId: 'ISS005',
            issueKeyword: 'Memory leak',
            occurrenceCount: 1,
            affectedMemberCount: 1,
          },
        ],
        dataQualityMetrics: {
          completenessRate: 0.65,
          deduplicationRate: 0.95,
          validityRate: 0.98,
        },
      },
      minimumReportThreshold: 5,
    };

    expect(() => {
      generateWeeklyAnalysisReport(input);
    }).toThrow(/記入漏れ|品質/);
  });
});