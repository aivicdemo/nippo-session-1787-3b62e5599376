import { describe, test, expect } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  // SCEN-088: [error] 分析対象期間が前週（月曜～日曜）の7日間ではない場合、InvalidAnalysisPeriodErrorエラーが発生する
  test('should throw InvalidAnalysisPeriodError when analysisEndDate is not Sunday of the target week', () => {
    const analysisStartDate = new Date('2026-01-12T00:00:00Z'); // 前週月曜日
    const analysisEndDate = new Date('2026-01-19T00:00:00Z'); // 当日月曜日（日曜日ではない）
    const teamId = 'team-001';
    const minimumReportThreshold = 5;

    const aggregatedReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          reportDate: '2026-01-12',
          memberId: 'member-001',
          yesterdayActivity: 'Completed API integration',
          todayActivity: 'Start unit testing',
          submittedAt: '2026-01-12T07:30:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2026-01-13',
          memberId: 'member-002',
          yesterdayActivity: 'Fixed database query',
          todayActivity: 'Review pull requests',
          submittedAt: '2026-01-13T07:30:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2026-01-14',
          memberId: 'member-003',
          yesterdayActivity: 'Deployed to staging',
          todayActivity: 'Performance testing',
          submittedAt: '2026-01-14T07:30:00Z',
        },
        {
          reportId: 'report-004',
          reportDate: '2026-01-15',
          memberId: 'member-004',
          yesterdayActivity: 'Documentation update',
          todayActivity: 'Code review',
          submittedAt: '2026-01-15T07:30:00Z',
        },
        {
          reportId: 'report-005',
          reportDate: '2026-01-16',
          memberId: 'member-005',
          yesterdayActivity: 'Bug fix for issue #123',
          todayActivity: 'Implement feature X',
          submittedAt: '2026-01-16T07:30:00Z',
        },
      ],
      extractedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'Database connection timeout',
          reporterTeamId: 'team-001',
          occurrenceCount: 2,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.90,
        validityRate: 0.92,
      },
    };

    expect(() =>
      generateWeeklyAnalysisReport({
        analysisStartDate,
        analysisEndDate,
        teamId,
        minimumReportThreshold,
        aggregatedReportData,
      })
    ).toThrow(/分析対象期間は前週の月曜日から日曜日までの7日間である必要があります/);
  });
});