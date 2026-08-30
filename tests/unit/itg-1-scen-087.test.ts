import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type AggregatedWeeklyReportData } from '../../src/logic/weekly-analysis-report';

describe('朝会報告管理システム - 週次分析レポート生成', () => {
  // SCEN-087
  test('分析対象日報レコード件数が最小閾値未満の場合、エラーを発生させる', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const minimumReportThreshold = 5;

    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          reporterEmployeeId: 'emp-001',
          reportDate: new Date('2024-01-08T09:00:00Z'),
          yesterdayWork: 'Feature A implementation',
          todayWork: 'Feature B planning',
          currentIssue: 'Database connection issue',
          submittedAt: new Date('2024-01-08T09:00:00Z'),
        },
        {
          reportId: 'report-002',
          reporterEmployeeId: 'emp-002',
          reportDate: new Date('2024-01-09T09:00:00Z'),
          yesterdayWork: 'Unit test execution',
          todayWork: 'Integration test setup',
          currentIssue: 'API response timeout',
          submittedAt: new Date('2024-01-09T09:00:00Z'),
        },
        {
          reportId: 'report-003',
          reporterEmployeeId: 'emp-003',
          reportDate: new Date('2024-01-10T09:00:00Z'),
          yesterdayWork: 'Code review completion',
          todayWork: 'Documentation update',
          currentIssue: 'Build script error',
          submittedAt: new Date('2024-01-10T09:00:00Z'),
        },
        {
          reportId: 'report-004',
          reporterEmployeeId: 'emp-004',
          reportDate: new Date('2024-01-11T09:00:00Z'),
          yesterdayWork: 'Bug fix for login module',
          todayWork: 'Performance optimization',
          currentIssue: 'Memory leak detected',
          submittedAt: new Date('2024-01-11T09:00:00Z'),
        },
      ],
      extractedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'Database connection issue',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
        {
          issueId: 'issue-002',
          issueContent: 'API response timeout',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
        {
          issueId: 'issue-003',
          issueContent: 'Build script error',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
        {
          issueId: 'issue-004',
          issueContent: 'Memory leak detected',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 0.8,
        deduplicationRate: 0.95,
        validityRate: 0.9,
      },
    };

    expect(() =>
      generateWeeklyAnalysisReport(
        analysisStartDate,
        analysisEndDate,
        teamId,
        aggregatedReportData,
        minimumReportThreshold,
      ),
    ).toThrow(/日報データが不足/);
  });
});