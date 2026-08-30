import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";
import { type MonthlyAnalysisReportResult, type MonthlyReportGenerationRequest } from "../../src/logic/monthly-analysis-report";

describe("generateMonthlyAnalysisReport", () => {
  test("SCEN-089: [normal] generates monthly analysis report with issue time series, bottleneck progression, and team performance metrics", async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: "2024-01",
      projectManagerId: "pm-001",
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const mockReportDataset = {
      extractionPeriod: {
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      },
      totalReportCount: 40,
      reports: [
        {
          reportId: "report-2024-01-01-001",
          reportDate: "2024-01-01",
          reporterId: "eng-001",
          teamId: "team-a",
          issues: [
            {
              issueId: "issue-001",
              issueContent: "ネットワーク遅延が発生",
              extractedDate: new Date("2024-01-01T09:00:00Z"),
            },
          ],
          submissionTimestamp: "2024-01-01T08:30:00Z",
        },
      ],
      dataQualityScore: 95,
    };

    const mockValidationResult = {
      isComplete: true,
      missingFields: [],
      validationScore: 100,
    };

    const mockTimeSeriesAnalysis = {
      issueTimeSeriesData: [
        {
          issueId: "issue-001",
          issueContent: "ネットワーク遅延",
          frequencyTrend: [
            { date: new Date("2024-01-07"), frequency: 3 },
            { date: new Date("2024-01-14"), frequency: 5 },
            { date: new Date("2024-01-21"), frequency: 4 },
            { date: new Date("2024-01-28"), frequency: 2 },
          ],
          impactTrend: [
            { date: new Date("2024-01-07"), impactScore: 65 },
            { date: new Date("2024-01-14"), impactScore: 78 },
            { date: new Date("2024-01-21"), impactScore: 72 },
            { date: new Date("2024-01-28"), impactScore: 55 },
          ],
          resolutionStatusTimeline: [
            { date: new Date("2024-01-07"), status: "unresolved" as const },
            { date: new Date("2024-01-14"), status: "in_progress" as const },
            { date: new Date("2024-01-21"), status: "in_progress" as const },
            { date: new Date("2024-01-28"), status: "resolved" as const },
          ],
        },
      ],
      bottleneckSeverityRanking: [
        {
          issueId: "issue-001",
          severityRank: "high" as const,
          severityScore: 72,
          justification: "Network delays affecting team output",
        },
      ],
      improvementTrendAnalysis: [
        {
          issueId: "issue-001",
          trendDirection: "improving" as const,
          improvementRate: 8.5,
          daysToResolution: 18,
        },
      ],
    };

    const mockBottleneckProgression = {
      progressionPatterns: [
        {
          issueId: "issue-001",
          progressionType: "improving" as const,
          weeklyFrequencyTrend: [3, 5, 4, 2],
          category: "Infrastructure",
        },
      ],
      criticalBottlenecks: [],
      resolvedBottlenecks: [
        {
          issueId: "issue-001",
          resolutionDate: new Date("2024-01-28"),
          weekResolvedIn: 4,
        },
      ],
      emergingBottlenecks: [],
    };

    const mockTeamPerformanceMetrics = {
      teamMetrics: [
        {
          teamId: "team-a",
          issueResolutionSpeedDays: 3,
          reportSubmissionRate: 98,
          issueRecurrenceRate: 5,
          priorityScore: 82,
          performanceRank: "high" as const,
        },
        {
          teamId: "team-b",
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 95,
          issueRecurrenceRate: 8,
          priorityScore: 75,
          performanceRank: "medium" as const,
        },
      ],
      aggregationPeriod: {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      },
      calculationTimestamp: new Date("2024-02-01T10:00:00Z"),
    };

    const mockDelayRiskScore = {
      riskScore: 62,
      riskLevel: "medium" as const,
      delayDaysEstimate: 3,
    };

    const mockTopChallenges = {
      selectedChallenges: [
        {
          challengeId: "issue-001",
          priorityScore: 85,
          impactDegree: 78,
          occurrenceFrequency: 14,
        },
        {
          challengeId: "issue-002",
          priorityScore: 72,
          impactDegree: 65,
          occurrenceFrequency: 9,
        },
        {
          challengeId: "issue-003",
          priorityScore: 68,
          impactDegree: 62,
          occurrenceFrequency: 8,
        },
        {
          challengeId: "issue-004",
          priorityScore: 55,
          impactDegree: 50,
          occurrenceFrequency: 6,
        },
        {
          challengeId: "issue-005",
          priorityScore: 48,
          impactDegree: 45,
          occurrenceFrequency: 5,
        },
      ],
      totalChallengesAnalyzed: 12,
      selectionRationale: "Top challenges selected by priority score",
      dataQualityValidationResult: {
        isValid: true,
        completenessScore: 95,
        accuracyScore: 92,
      },
    };

    const mockStructuredContent = {
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      topPriorityChallenges: [
        {
          challengeId: "issue-001",
          challengeTitle: "ネットワーク遅延",
          priorityScore: 85,
          impactDegree: 78,
          occurrenceFrequency: 14,
        },
      ],
      teamPerformanceSummary: {
        highPerformingTeams: ["team-a"],
        mediumPerformingTeams: ["team-b"],
        lowPerformingTeams: [],
        overallTeamHealthScore: 79,
      },
      recommendedCountermeasures: [
        {
          issueId: "issue-001",
          recommendedAction: "Infrastructure upgrade",
          assignedOwner: "tech-lead-001",
          expectedCompletionDate: "2024-02-15",
        },
      ],
      projectDelayRiskAssessment: {
        riskScore: 62,
        riskLevel: "medium",
        affectedProjects: ["project-001"],
      },
    };

    const mockSaveResult = {
      success: true,
      savedRecordsCount: 1,
      timestamp: new Date("2024-02-01T10:00:00Z"),
    };

    const mockEmailResult = {
      success: true,
      deliveryStatus: "sent",
      recipientId: "pm-001",
      sentAt: new Date("2024-02-01T10:00:00Z"),
    };

    const extractMonthlyReportDatasetMock = jest
      .fn()
      .mockResolvedValue(mockReportDataset);
    const validateMonthlyAnalysisDataCompletenessMock = jest
      .fn()
      .mockResolvedValue(mockValidationResult);
    const analyzeIssueTimeSeriesChangeMock = jest
      .fn()
      .mockResolvedValue(mockTimeSeriesAnalysis);
    const identifyMonthlyBottleneckProgressionMock = jest
      .fn()
      .mockResolvedValue(mockBottleneckProgression);
    const calculateTeamPerformanceMetricsMock = jest
      .fn()
      .mockResolvedValue(mockTeamPerformanceMetrics);
    const calculateProjectDelayRiskScoreMock = jest
      .fn()
      .mockResolvedValue(mockDelayRiskScore);
    const extractTopPriorityChallengesForExecutivesMock = jest
      .fn()
      .mockResolvedValue(mockTopChallenges);
    const structureMonthlyReportContentMock = jest
      .fn()
      .mockResolvedValue(mockStructuredContent);
    const saveExtractedIssueDataMock = jest
      .fn()
      .mockResolvedValue(mockSaveResult);
    const sendConfirmationEmailToManagerMock = jest
      .fn()
      .mockResolvedValue(mockEmailResult);

    const mockDependencies = {
      extractMonthlyReportDataset: extractMonthlyReportDatasetMock,
      validateMonthlyAnalysisDataCompleteness:
        validateMonthlyAnalysisDataCompletenessMock,
      analyzeIssueTimeSeriesChange: analyzeIssueTimeSeriesChangeMock,
      identifyMonthlyBottleneckProgression:
        identifyMonthlyBottleneckProgressionMock,
      calculateTeamPerformanceMetrics: calculateTeamPerformanceMetricsMock,
      calculateProjectDelayRiskScore: calculateProjectDelayRiskScoreMock,
      extractTopPriorityChallengesForExecutives:
        extractTopPriorityChallengesForExecutivesMock,
      structureMonthlyReportContent: structureMonthlyReportContentMock,
      saveExtractedIssueData: saveExtractedIssueDataMock,
      sendConfirmationEmailToManager: sendConfirmationEmailToManagerMock,
    };

    const result = await generateMonthlyAnalysisReport(request, mockDependencies);

    expect(result).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);
    expect(result.targetMonth).toBe("2024-01");
    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.reportPeriod.startDate).toBe("2024-01-01");
    expect(result.reportContent.reportPeriod.endDate).toBe("2024-01-31");
    expect(result.reportContent.topPriorityChallenges).toHaveLength(1);
    expect(result.reportContent.topPriorityChallenges[0].priorityScore).toBe(85);
    expect(result.reportContent.teamPerformanceSummary.overallTeamHealthScore).toBe(79);
    expect(result.projectDelayRiskLevel).toBe("medium");
    expect(result.generatedAt).toBeInstanceOf(Date);

    expect(extractMonthlyReportDatasetMock).toHaveBeenCalledTimes(1);
    expect(validateMonthlyAnalysisDataCompletenessMock).toHaveBeenCalledTimes(1);
    expect(analyzeIssueTimeSeriesChangeMock).toHaveBeenCalledTimes(1);
    expect(identifyMonthlyBottleneckProgressionMock).toHaveBeenCalledTimes(1);
    expect(calculateTeamPerformanceMetricsMock).toHaveBeenCalledTimes(1);
    expect(calculateProjectDelayRiskScoreMock).toHaveBeenCalledTimes(1);
    expect(extractTopPriorityChallengesForExecutivesMock).toHaveBeenCalledTimes(1);
    expect(structureMonthlyReportContentMock).toHaveBeenCalledTimes(1);
    expect(saveExtractedIssueDataMock).toHaveBeenCalledTimes(1);
    expect(sendConfirmationEmailToManagerMock).toHaveBeenCalledTimes(1);
    expect(sendConfirmationEmailToManagerMock).toHaveBeenCalledWith(
      "pm-001",
      expect.any(Object)
    );
  });
});