import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportGenerationRequest, type MonthlyAnalysisReportResult, type MonthlyReportDataset, type MonthlyReport } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-442
  test('should generate monthly analysis report with extracted dataset values preserved in report content', async () => {
    const targetMonth = '2024-01';
    const projectManagerId = 'pm-001';
    const extractionPeriodStart = '2024-01-01T00:00:00Z';
    const extractionPeriodEnd = '2024-01-31T23:59:59Z';
    const totalReportCount = 15;
    const teamMembersCovered = [
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
    ];

    const mockReports: MonthlyReport[] = [
      {
        reportId: 'report-001',
        reportDate: '2024-01-01',
        reporterId: 'member-001',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-001',
            issueContent: 'ビルド失敗',
            extractedDate: new Date('2024-01-01T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-01T09:00:00Z',
      },
      {
        reportId: 'report-002',
        reportDate: '2024-01-02',
        reporterId: 'member-002',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-002',
            issueContent: 'テスト失敗',
            extractedDate: new Date('2024-01-02T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-02T09:00:00Z',
      },
      {
        reportId: 'report-003',
        reportDate: '2024-01-03',
        reporterId: 'member-003',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-003',
            issueContent: 'リソース不足',
            extractedDate: new Date('2024-01-03T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-03T09:00:00Z',
      },
      {
        reportId: 'report-004',
        reportDate: '2024-01-04',
        reporterId: 'member-004',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-004',
            issueContent: 'デプロイ遅延',
            extractedDate: new Date('2024-01-04T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-04T09:00:00Z',
      },
      {
        reportId: 'report-005',
        reportDate: '2024-01-05',
        reporterId: 'member-005',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-005',
            issueContent: 'ビルド失敗',
            extractedDate: new Date('2024-01-05T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-05T09:00:00Z',
      },
      {
        reportId: 'report-006',
        reportDate: '2024-01-08',
        reporterId: 'member-006',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-006',
            issueContent: 'テスト失敗',
            extractedDate: new Date('2024-01-08T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-08T09:00:00Z',
      },
      {
        reportId: 'report-007',
        reportDate: '2024-01-09',
        reporterId: 'member-007',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-007',
            issueContent: 'リソース不足',
            extractedDate: new Date('2024-01-09T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-09T09:00:00Z',
      },
      {
        reportId: 'report-008',
        reportDate: '2024-01-10',
        reporterId: 'member-008',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-008',
            issueContent: 'デプロイ遅延',
            extractedDate: new Date('2024-01-10T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-10T09:00:00Z',
      },
      {
        reportId: 'report-009',
        reportDate: '2024-01-11',
        reporterId: 'member-001',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-009',
            issueContent: 'ビルド失敗',
            extractedDate: new Date('2024-01-11T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-11T09:00:00Z',
      },
      {
        reportId: 'report-010',
        reportDate: '2024-01-12',
        reporterId: 'member-002',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-010',
            issueContent: 'テスト環境不安定',
            extractedDate: new Date('2024-01-12T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-12T09:00:00Z',
      },
      {
        reportId: 'report-011',
        reportDate: '2024-01-15',
        reporterId: 'member-003',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-011',
            issueContent: 'リソース不足',
            extractedDate: new Date('2024-01-15T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-15T09:00:00Z',
      },
      {
        reportId: 'report-012',
        reportDate: '2024-01-16',
        reporterId: 'member-004',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-012',
            issueContent: 'デプロイ遅延',
            extractedDate: new Date('2024-01-16T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-16T09:00:00Z',
      },
      {
        reportId: 'report-013',
        reportDate: '2024-01-17',
        reporterId: 'member-005',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-013',
            issueContent: 'ビルド失敗',
            extractedDate: new Date('2024-01-17T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-17T09:00:00Z',
      },
      {
        reportId: 'report-014',
        reportDate: '2024-01-18',
        reporterId: 'member-006',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-014',
            issueContent: 'テスト失敗',
            extractedDate: new Date('2024-01-18T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-18T09:00:00Z',
      },
      {
        reportId: 'report-015',
        reportDate: '2024-01-19',
        reporterId: 'member-007',
        teamId: 'team-001',
        issues: [
          {
            issueId: 'issue-015',
            issueContent: 'リソース不足',
            extractedDate: new Date('2024-01-19T09:00:00Z'),
          },
        ],
        submissionTimestamp: '2024-01-19T09:00:00Z',
      },
    ];

    const mockDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: extractionPeriodStart,
        endDateTime: extractionPeriodEnd,
      },
      totalReportCount: totalReportCount,
      reports: mockReports,
      dataQualityScore: 95,
    };

    const mockExtractMonthlyReportDataset = jest
      .fn()
      .mockResolvedValue(mockDataset);

    const generationRequest: MonthlyReportGenerationRequest = {
      targetMonth: targetMonth,
      projectManagerId: projectManagerId,
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const result: MonthlyAnalysisReportResult =
      await generateMonthlyAnalysisReport(generationRequest, mockExtractMonthlyReportDataset);

    expect(result).toBeDefined();
    expect(result.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(result.targetMonth).toBe(targetMonth);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);

    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.extractionPeriod.startDateTime).toBe(
      extractionPeriodStart
    );
    expect(result.reportContent.extractionPeriod.endDateTime).toBe(
      extractionPeriodEnd
    );
    expect(result.reportContent.totalReportCount).toBe(totalReportCount);
    expect(result.reportContent.teamMembersCovered).toEqual(teamMembersCovered);
    expect(result.reportContent.reports).toHaveLength(totalReportCount);

    for (let i = 0; i < mockReports.length; i++) {
      expect(result.reportContent.reports[i].reportId).toBe(
        mockReports[i].reportId
      );
      expect(result.reportContent.reports[i].reportDate).toBe(
        mockReports[i].reportDate
      );
      expect(result.reportContent.reports[i].reporterId).toBe(
        mockReports[i].reporterId
      );
      expect(result.reportContent.reports[i].teamId).toBe(mockReports[i].teamId);
      expect(result.reportContent.reports[i].submissionTimestamp).toBe(
        mockReports[i].submissionTimestamp
      );
      expect(result.reportContent.reports[i].issues).toEqual(
        mockReports[i].issues
      );
    }
  });
});