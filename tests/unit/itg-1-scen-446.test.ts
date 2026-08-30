import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportDataset, type MonthlyReport, type ExtractedIssue } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-446: [normal] 毎月初に前月の全日報データを抽出し、課題の時系列変化・ボトルネック推移・チーム別パフォーマンス指標を分析してレポートを生成し、プロジェクトマネージャーに通知する。
  test('should generate monthly analysis report with team performance metrics calculated according to design formula', () => {
    const targetMonth = '2024-01';
    const projectManagerId = 'pm-001';

    const extractedIssue1: ExtractedIssue = {
      issueId: 'issue-001',
      issueKeyword: 'build_failure',
      frequency: 3,
      impactScore: 75,
      resolutionStatus: 'resolved',
      extractedDate: new Date('2024-01-05T10:00:00Z'),
    };

    const extractedIssue2: ExtractedIssue = {
      issueId: 'issue-002',
      issueKeyword: 'test_failure',
      frequency: 2,
      impactScore: 60,
      resolutionStatus: 'resolved',
      extractedDate: new Date('2024-01-10T14:00:00Z'),
    };

    const extractedIssue3: ExtractedIssue = {
      issueId: 'issue-003',
      issueKeyword: 'resource_shortage',
      frequency: 1,
      impactScore: 85,
      resolutionStatus: 'unresolved',
      extractedDate: new Date('2024-01-15T09:00:00Z'),
    };

    const report1: MonthlyReport = {
      reportId: 'report-001',
      reportDate: '2024-01-05',
      reporterId: 'eng-001',
      teamId: 'team-a',
      issues: [extractedIssue1],
      submissionTimestamp: '2024-01-05T08:30:00Z',
    };

    const report2: MonthlyReport = {
      reportId: 'report-002',
      reportDate: '2024-01-10',
      reporterId: 'eng-002',
      teamId: 'team-a',
      issues: [extractedIssue2],
      submissionTimestamp: '2024-01-10T08:45:00Z',
    };

    const report3: MonthlyReport = {
      reportId: 'report-003',
      reportDate: '2024-01-12',
      reporterId: 'eng-003',
      teamId: 'team-b',
      issues: [extractedIssue3],
      submissionTimestamp: '2024-01-12T08:15:00Z',
    };

    const report4: MonthlyReport = {
      reportId: 'report-004',
      reportDate: '2024-01-05',
      reporterId: 'eng-001',
      teamId: 'team-a',
      issues: [extractedIssue1],
      submissionTimestamp: '2024-01-05T09:00:00Z',
    };

    const mockDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 4,
      reports: [report1, report2, report3, report4],
      dataQualityScore: 92,
    };

    const result = generateMonthlyAnalysisReport(
      mockDataset,
      projectManagerId,
      targetMonth,
      true,
      5
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.targetMonth).toBe('2024-01');
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.projectDelayRiskLevel).toMatch(/^(high|medium|low)$/);

    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.issueTrendAnalysis).toBeInstanceOf(Array);
    expect(result.reportContent.bottleneckProgression).toBeDefined();
    expect(result.reportContent.teamPerformanceMetrics).toBeInstanceOf(Array);
    expect(result.reportContent.topPriorityChallenges).toBeInstanceOf(Array);

    const teamMetricsTeamA = result.reportContent.teamPerformanceMetrics.find(
      (m) => m.teamId === 'team-a'
    );
    expect(teamMetricsTeamA).toBeDefined();
    expect(typeof teamMetricsTeamA.issueResolutionSpeedDays).toBe('number');
    expect(teamMetricsTeamA.issueResolutionSpeedDays).toBeGreaterThanOrEqual(0);
    expect(teamMetricsTeamA.issueResolutionSpeedDays).toBeLessThanOrEqual(999);

    expect(typeof teamMetricsTeamA.reportSubmissionRate).toBe('number');
    expect(teamMetricsTeamA.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(teamMetricsTeamA.reportSubmissionRate).toBeLessThanOrEqual(100);

    expect(typeof teamMetricsTeamA.issueRecurrenceRate).toBe('number');
    expect(teamMetricsTeamA.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(teamMetricsTeamA.issueRecurrenceRate).toBeLessThanOrEqual(100);

    expect(typeof teamMetricsTeamA.priorityScore).toBe('number');
    expect(teamMetricsTeamA.priorityScore).toBeGreaterThanOrEqual(0);
    expect(teamMetricsTeamA.priorityScore).toBeLessThanOrEqual(100);

    expect(teamMetricsTeamA.performanceRank).toMatch(
      /^(high|medium|low)$/
    );

    const teamMetricsTeamB = result.reportContent.teamPerformanceMetrics.find(
      (m) => m.teamId === 'team-b'
    );
    expect(teamMetricsTeamB).toBeDefined();
    expect(typeof teamMetricsTeamB.issueResolutionSpeedDays).toBe('number');
    expect(typeof teamMetricsTeamB.reportSubmissionRate).toBe('number');
    expect(typeof teamMetricsTeamB.issueRecurrenceRate).toBe('number');
    expect(typeof teamMetricsTeamB.priorityScore).toBe('number');

    const recurrenceRateTeamA = teamMetricsTeamA.issueRecurrenceRate;
    const issueRecurrenceExpected = (1 / 2) * 100;
    expect(recurrenceRateTeamA).toBeCloseTo(issueRecurrenceExpected, 0);

    const resolutionSpeedTeamA = teamMetricsTeamA.issueResolutionSpeedDays;
    expect(resolutionSpeedTeamA).toBeGreaterThanOrEqual(0);
    expect(resolutionSpeedTeamA).toBeLessThanOrEqual(10);

    const submissionRateTeamA = teamMetricsTeamA.reportSubmissionRate;
    expect(submissionRateTeamA).toBeGreaterThanOrEqual(0);
    expect(submissionRateTeamA).toBeLessThanOrEqual(100);

    const priorityScoreTeamA = teamMetricsTeamA.priorityScore;
    const isHighPriority = resolutionSpeedTeamA >= 7 && submissionRateTeamA < 80 && recurrenceRateTeamA >= 30;
    if (isHighPriority) {
      expect(priorityScoreTeamA).toBeGreaterThanOrEqual(70);
    } else {
      expect(priorityScoreTeamA).toBeLessThan(100);
    }

    if (result.reportContent.topPriorityChallenges.length > 0) {
      const topChallenge = result.reportContent.topPriorityChallenges[0];
      expect(topChallenge.challengeId).toBeTruthy();
      expect(typeof topChallenge.priorityScore).toBe('number');
      expect(topChallenge.priorityScore).toBeGreaterThanOrEqual(0);
      expect(topChallenge.priorityScore).toBeLessThanOrEqual(100);
    }
  });
});