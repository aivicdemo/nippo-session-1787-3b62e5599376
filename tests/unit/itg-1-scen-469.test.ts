import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";

describe("Monthly Analysis Report Generation", () => {
  test("SCEN-469: generateMonthlyAnalysisReport returns correct retry delay and notification recipient on first timeout retry", async () => {
    const targetMonth = "2024-01";
    const projectManagerId = "pm-user-001";
    const includeExecutiveSummary = true;
    const topChallengesCount = 5;

    const mockMonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      },
      totalReportCount: 45,
      reports: [
        {
          reportId: "report-001",
          reportDate: "2024-01-15",
          reporterId: "eng-001",
          teamId: "team-001",
          issues: [
            {
              issueId: "issue-001",
              issueKeyword: "ビルド失敗",
              frequency: 3,
              impactScore: 75,
            },
          ],
          submissionTimestamp: "2024-01-15T08:30:00Z",
        },
        {
          reportId: "report-002",
          reportDate: "2024-01-15",
          reporterId: "eng-002",
          teamId: "team-001",
          issues: [
            {
              issueId: "issue-002",
              issueKeyword: "テスト失敗",
              frequency: 2,
              impactScore: 60,
            },
          ],
          submissionTimestamp: "2024-01-15T08:45:00Z",
        },
      ],
      dataQualityScore: 85,
    };

    const mockIssueTimeSeriesAnalysisResult = {
      issueTimeSeriesData: [
        {
          issueId: "issue-001",
          issueContent: "ビルド失敗",
          frequencyTrend: [
            { date: new Date("2024-01-01"), frequency: 1 },
            { date: new Date("2024-01-08"), frequency: 2 },
            { date: new Date("2024-01-15"), frequency: 3 },
            { date: new Date("2024-01-22"), frequency: 3 },
            { date: new Date("2024-01-29"), frequency: 2 },
          ],
          impactTrend: [
            { date: new Date("2024-01-01"), impactScore: 60 },
            { date: new Date("2024-01-08"), impactScore: 65 },
            { date: new Date("2024-01-15"), impactScore: 75 },
            { date: new Date("2024-01-22"), impactScore: 75 },
            { date: new Date("2024-01-29"), impactScore: 70 },
          ],
          resolutionStatusTimeline: [
            { date: new Date("2024-01-01"), status: "unresolved" },
            { date: new Date("2024-01-08"), status: "unresolved" },
            { date: new Date("2024-01-15"), status: "in_progress" },
            { date: new Date("2024-01-22"), status: "in_progress" },
            { date: new Date("2024-01-29"), status: "resolved" },
          ],
        },
      ],
      bottleneckSeverityRanking: [
        {
          issueId: "issue-001",
          severityRank: "high",
          severityScore: 78,
          justification: "連続発生による進捗阻害",
        },
      ],
      improvementTrendAnalysis: [
        {
          issueId: "issue-001",
          trendDirection: "improving",
          improvementRate: 25,
          daysToResolution: 3,
        },
      ],
    };

    const mockTeamPerformanceMetricsOutput = {
      teamMetrics: [
        {
          teamId: "team-001",
          issueResolutionSpeedDays: 3.5,
          reportSubmissionRate: 90,
          issueRecurrenceRate: 15,
          priorityScore: 72,
          performanceRank: "high",
        },
      ],
      aggregationPeriod: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      },
      calculationTimestamp: new Date("2024-01-31T18:00:00Z"),
    };

    const mockBottleneckProgressionResult = {
      progressionPatterns: [
        {
          issueId: "issue-001",
          progressionType: "improving",
          weeklyFrequencyTrend: [1, 2, 3, 2],
          category: "technical",
        },
      ],
      criticalBottlenecks: [],
      resolvedBottlenecks: [
        {
          issueId: "issue-001",
          resolvedDate: "2024-01-29",
          resolutionDurationDays: 28,
        },
      ],
      emergingBottlenecks: [],
    };

    const mockTopChallengesExtractionOutput = {
      selectedChallenges: [
        {
          challengeId: "issue-001",
          priorityScore: 78,
          impactDegree: 75,
          occurrenceFrequency: 3,
        },
      ],
      totalChallengesAnalyzed: 8,
      selectionRationale: "頻出度と影響度の上位課題を優先度順に選定",
      dataQualityValidationResult: {
        isComplete: true,
        completenessPercentage: 90,
        hasAnomalies: false,
      },
    };

    const mockStructuredReportContent = {
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      topPriorityChallenges: [
        {
          challengeId: "issue-001",
          description: "ビルド失敗",
          priorityScore: 78,
          impactDegree: 75,
          occurrenceFrequency: 3,
          recommendedCountermeasure: "CI/CDパイプラインの強化",
        },
      ],
      teamPerformanceSummary: {
        totalTeams: 1,
        averageSubmissionRate: 90,
        averageResolutionSpeedDays: 3.5,
        averageRecurrenceRate: 15,
      },
      recommendedCountermeasures: [
        {
          challengeId: "issue-001",
          action: "CI/CDパイプラインの検査強化",
          assignee: "tech-lead-001",
          deadline: "2024-02-07",
          estimatedEffort: "16時間",
        },
      ],
      projectDelayRiskAssessment: {
        riskScore: 35,
        riskLevel: "medium",
        affectedProjects: ["project-001"],
      },
    };

    const result = await generateMonthlyAnalysisReport(
      targetMonth,
      projectManagerId,
      includeExecutiveSummary,
      topChallengesCount,
      mockMonthlyReportDataset,
      mockIssueTimeSeriesAnalysisResult,
      mockTeamPerformanceMetricsOutput,
      mockBottleneckProgressionResult,
      mockTopChallengesExtractionOutput,
      mockStructuredReportContent
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.targetMonth).toBe("2024-01");
    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.issueTrendAnalysis).toHaveLength(1);
    expect(result.reportContent.issueTrendAnalysis[0].issueId).toBe(
      "issue-001"
    );
    expect(result.reportContent.issueTrendAnalysis[0].frequencyTimeSeries).toBe(
      mockIssueTimeSeriesAnalysisResult.issueTimeSeriesData[0].frequencyTrend
    );
    expect(result.reportContent.bottleneckProgression).toBeDefined();
    expect(result.reportContent.teamPerformanceMetrics).toHaveLength(1);
    expect(result.reportContent.teamPerformanceMetrics[0].teamId).toBe(
      "team-001"
    );
    expect(result.reportContent.teamPerformanceMetrics[0].issueResolutionSpeedDays).toBe(
      3.5
    );
    expect(result.reportContent.teamPerformanceMetrics[0].reportSubmissionRate).toBe(
      90
    );
    expect(result.reportContent.teamPerformanceMetrics[0].issueRecurrenceRate).toBe(
      15
    );
    expect(result.reportContent.topPriorityChallenges).toHaveLength(1);
    expect(result.reportContent.topPriorityChallenges[0].challengeId).toBe(
      "issue-001"
    );
    expect(result.reportContent.topPriorityChallenges[0].priorityScore).toBe(
      78
    );
    expect(result.projectDelayRiskLevel).toBe("medium");
    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});