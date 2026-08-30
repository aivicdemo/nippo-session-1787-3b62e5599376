import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type {
  MonthlyReportGenerationRequest,
  MonthlyAnalysisReportResult,
  MonthlyReportDataset,
  MonthlyReport,
  ExtractedIssue,
  IssueTimeSeriesAnalysisResult,
  BottleneckProgressionResult,
  TeamPerformanceMetricsOutput,
  ProjectDelayRiskScoreResult,
} from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-456
  test('should throw AnalysisValidationFailure when priorityScore is missing from extracted issues', async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const extractedIssueWithoutScore: ExtractedIssue = {
      issueId: 'issue-001',
      issueContent: 'Build failure',
      frequency: 3,
      impactScore: 45,
      resolutionStatus: 'unresolved',
      extractedDate: new Date('2024-01-10T10:00:00Z'),
      priorityScore: undefined,
    };

    const extractedIssueWithScore: ExtractedIssue = {
      issueId: 'issue-002',
      issueContent: 'Test environment unstable',
      frequency: 2,
      impactScore: 60,
      resolutionStatus: 'in_progress',
      extractedDate: new Date('2024-01-12T14:30:00Z'),
      priorityScore: 65,
    };

    const monthlyReport: MonthlyReport = {
      reportId: 'report-001',
      reportDate: '2024-01-15',
      reporterId: 'eng-001',
      teamId: 'team-001',
      issues: [extractedIssueWithoutScore, extractedIssueWithScore],
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const reportDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 1,
      reports: [monthlyReport],
      dataQualityScore: 85,
    };

    const issueTimeSeriesResult: IssueTimeSeriesAnalysisResult = {
      issueTimeSeriesData: [
        {
          issueId: 'issue-001',
          issueContent: 'Build failure',
          frequencyTrend: [
            { date: new Date('2024-01-08T00:00:00Z'), frequency: 1 },
            { date: new Date('2024-01-15T00:00:00Z'), frequency: 2 },
          ],
          impactTrend: [
            { date: new Date('2024-01-08T00:00:00Z'), impactScore: 40 },
            { date: new Date('2024-01-15T00:00:00Z'), impactScore: 45 },
          ],
          resolutionStatusTimeline: [
            { date: new Date('2024-01-08T00:00:00Z'), status: 'unresolved' },
            { date: new Date('2024-01-15T00:00:00Z'), status: 'unresolved' },
          ],
        },
      ],
      bottleneckSeverityRanking: [
        {
          issueId: 'issue-001',
          severityRank: 'high',
          severityScore: 45,
          justification: 'Multiple reports from team members',
        },
      ],
      improvementTrendAnalysis: [
        {
          issueId: 'issue-001',
          trendDirection: 'deteriorating',
          improvementRate: -5,
          daysToResolution: null,
        },
      ],
    };

    const bottleneckResult: BottleneckProgressionResult = {
      progressionPatterns: [
        {
          issueId: 'issue-001',
          progressionType: 'deteriorating',
          weeklyFrequencyTrend: [1, 1, 1, 0],
          category: 'technical_issue',
        },
      ],
      criticalBottlenecks: [],
      resolvedBottlenecks: [],
      emergingBottlenecks: [],
    };

    const teamPerformanceOutput: TeamPerformanceMetricsOutput = {
      teamMetrics: [
        {
          teamId: 'team-001',
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 90,
          issueRecurrenceRate: 15,
          priorityScore: 72,
          performanceRank: 'medium',
        },
      ],
      aggregationPeriod: {
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-31T23:59:59Z'),
      },
      calculationTimestamp: new Date('2024-01-31T18:00:00Z'),
    };

    const delayRiskResult: ProjectDelayRiskScoreResult = {
      riskScore: 58,
      riskLevel: 'MEDIUM',
      delayDaysEstimate: 3,
    };

    const mockExtractMonthlyReportDataset = jest
      .fn()
      .mockResolvedValue(reportDataset);
    const mockValidateMonthlyAnalysisDataCompleteness = jest
      .fn()
      .mockResolvedValue({ isReportable: true });
    const mockAnalyzeIssueTimeSeriesChange = jest
      .fn()
      .mockResolvedValue(issueTimeSeriesResult);
    const mockIdentifyMonthlyBottleneckProgression = jest
      .fn()
      .mockResolvedValue(bottleneckResult);
    const mockCalculateTeamPerformanceMetrics = jest
      .fn()
      .mockResolvedValue(teamPerformanceOutput);
    const mockCalculateProjectDelayRiskScore = jest
      .fn()
      .mockResolvedValue(delayRiskResult);
    const mockExtractTopPriorityChallengesForExecutives = jest
      .fn()
      .mockRejectedValue(
        new Error(
          '分析対象データが品質基準を満たしていません。データを確認してから再実行してください。'
        )
      );

    const dependencies = {
      extractMonthlyReportDataset: mockExtractMonthlyReportDataset,
      validateMonthlyAnalysisDataCompleteness:
        mockValidateMonthlyAnalysisDataCompleteness,
      analyzeIssueTimeSeriesChange: mockAnalyzeIssueTimeSeriesChange,
      identifyMonthlyBottleneckProgression:
        mockIdentifyMonthlyBottleneckProgression,
      calculateTeamPerformanceMetrics: mockCalculateTeamPerformanceMetrics,
      calculateProjectDelayRiskScore: mockCalculateProjectDelayRiskScore,
      extractTopPriorityChallengesForExecutives:
        mockExtractTopPriorityChallengesForExecutives,
    };

    await expect(
      generateMonthlyAnalysisReport(request, dependencies)
    ).rejects.toThrow(/優先度スコア|品質基準/);
  });
});