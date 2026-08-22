import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-132: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test("should complete all 8 autonomous actions in order and present analysis report to department head", async () => {
    const currentDate = new Date("2025-01-01T09:00:00Z");
    const departmentHeadEmail = "head@company.com";

    const mockReportData = {
      reportId: "RPT-202501-0001",
      generatedDate: currentDate.toISOString(),
      dataCount: 10,
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
    };

    const mockTimeSeriesAnalysis = {
      issueA: {
        occurrenceDate: "2025-01-15",
        resolutionDate: "2025-01-18",
        durationDays: 3,
      },
      issueB: {
        occurrenceDate: "2025-01-10",
        resolutionDate: "2025-01-12",
        durationDays: 2,
      },
      comparisonWithPreviousMonth: {
        averageResolutionTimeDelta: -1.5,
        trendIndicator: "improving",
      },
    };

    const mockBottleneckAnalysis = {
      mostFrequentCategory: "category_B",
      occurrenceCount: 7,
      affectedTeamCount: 3,
      teamImpactList: ["team_x", "team_y", "team_z"],
    };

    const mockPerformanceMetrics = {
      teamX: {
        utilizationRate: 82.5,
        issueResolutionRate: 88.3,
      },
      teamZ: {
        utilizationRate: 76.2,
        issueResolutionRate: 91.5,
      },
      comparisonTable: {
        columns: [
          "team_name",
          "utilization_rate",
          "issue_resolution_rate",
        ],
        rows: [
          ["team_x", 82.5, 88.3],
          ["team_z", 76.2, 91.5],
        ],
      },
    };

    const mockPriorityAssignments = {
      highPriority: [
        { issueId: "issue_B", score: 8.5, category: "category_B" },
      ],
      mediumPriority: [
        { issueId: "issue_A", score: 5.2, category: "category_A" },
      ],
      allAssignmentsCount: 2,
    };

    const mockMailSendResult = {
      recipient: departmentHeadEmail,
      subject: `Monthly Analysis Report - January 2025`,
      sendDate: currentDate.toISOString(),
      status: "success",
    };

    const mockAgentOutput = {
      action1_trigger_confirmation: {
        triggerActive: true,
        triggerDate: currentDate.toISOString(),
      },
      action2_data_extraction: {
        extractionTarget: "current_month_reports",
        dataCount: 10,
        integrityCheckStatus: "completed",
        extractionErrors: [],
      },
      action3_report_generation: mockReportData,
      action4_time_series_analysis: mockTimeSeriesAnalysis,
      action5_bottleneck_identification: mockBottleneckAnalysis,
      action6_performance_metrics: mockPerformanceMetrics,
      action7_priority_assignment: mockPriorityAssignments,
      action8_department_head_presentation: mockMailSendResult,
      finalStatus: "COMPLETED",
    };

    const result = await generateMonthlyAnalysisReport({
      executionDate: currentDate,
      departmentHeadEmail: departmentHeadEmail,
      reportingPeriodStart: new Date("2025-01-01"),
      reportingPeriodEnd: new Date("2025-01-31"),
      agentOutput: mockAgentOutput,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.reportId).toBe("RPT-202501-0001");
    expect(result.dataCount).toBe(10);

    expect(result.timeSeriesAnalysis.issueA.occurrenceDate).toBe("2025-01-15");
    expect(result.timeSeriesAnalysis.issueA.resolutionDate).toBe("2025-01-18");
    expect(result.timeSeriesAnalysis.issueA.durationDays).toBe(3);
    expect(
      result.timeSeriesAnalysis.comparisonWithPreviousMonth.averageResolutionTimeDelta
    ).toBe(-1.5);
    expect(
      result.timeSeriesAnalysis.comparisonWithPreviousMonth.trendIndicator
    ).toBe("improving");

    expect(result.bottleneckAnalysis.mostFrequentCategory).toBe("category_B");
    expect(result.bottleneckAnalysis.occurrenceCount).toBe(7);
    expect(result.bottleneckAnalysis.affectedTeamCount).toBe(3);

    expect(result.performanceMetrics.teamX.utilizationRate).toBe(82.5);
    expect(result.performanceMetrics.teamX.issueResolutionRate).toBe(88.3);
    expect(result.performanceMetrics.teamZ.utilizationRate).toBe(76.2);
    expect(result.performanceMetrics.teamZ.issueResolutionRate).toBe(91.5);

    expect(result.priorityAssignments.highPriority).toHaveLength(1);
    expect(result.priorityAssignments.highPriority[0].issueId).toBe("issue_B");
    expect(result.priorityAssignments.highPriority[0].score).toBe(8.5);

    expect(result.priorityAssignments.mediumPriority).toHaveLength(1);
    expect(result.priorityAssignments.mediumPriority[0].issueId).toBe("issue_A");
    expect(result.priorityAssignments.mediumPriority[0].score).toBe(5.2);

    expect(result.mailNotification.recipient).toBe(departmentHeadEmail);
    expect(result.mailNotification.subject).toContain("January 2025");
    expect(result.mailNotification.status).toBe("success");
  });
});