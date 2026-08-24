import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import type { Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/orchestrator";

describe("tx-6-imp-1: Daily report collection to analysis report generation", () => {
  let mockAiClient: jest.Mocked<Tx6Imp1AiClient>;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;
  let originalNow: () => number;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock current time to Monday 2024-01-08 08:00 JST (00:00 UTC)
    const mondayMorningJst = new Date("2024-01-08T08:00:00+09:00").getTime();
    originalNow = Date.now;
    Date.now = jest.fn(() => mondayMorningJst);

    // Spy on console.log to verify autonomous action execution logs
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Create mock AI client
    mockAiClient = {
      callDailyReportApiStub: jest.fn(),
      applyPrivacyProtection: jest.fn(),
      extractCourseData: jest.fn(),
      classifyAndScorePriority: jest.fn(),
      generateAnalysisReport: jest.fn(),
      sendReportToManager: jest.fn(),
    };

    // Setup stub responses for daily report API
    const mockReportData = [
      {
        id: "report_001",
        memberId: "mem_001",
        memberEmail: "user001@example.com",
        memberName: "Employee001",
        submissionDate: "2024-01-05T09:00:00Z",
        reportContent: "Issue: System latency detected",
        issues: ["performance"],
      },
      {
        id: "report_002",
        memberId: "mem_002",
        memberEmail: "user002@example.com",
        memberName: "Employee002",
        submissionDate: "2024-01-05T09:30:00Z",
        reportContent: "Issue: Database connection pool exhausted",
        issues: ["infrastructure"],
      },
      {
        id: "report_003",
        memberId: "mem_003",
        memberEmail: "user003@example.com",
        memberName: "Employee003",
        submissionDate: "2024-01-05T10:00:00Z",
        reportContent: "Progress: Feature X development 80% complete",
        issues: [],
      },
      {
        id: "report_004",
        memberId: "mem_004",
        memberEmail: "user004@example.com",
        memberName: "Employee004",
        submissionDate: "2024-01-05T10:15:00Z",
        reportContent: "Issue: Memory leak in background service",
        issues: ["quality"],
      },
      {
        id: "report_005",
        memberId: "mem_005",
        memberEmail: "user005@example.com",
        memberName: "Employee005",
        submissionDate: "2024-01-06T09:00:00Z",
        reportContent: "Risk: Third-party API dependency update needed",
        issues: ["risk"],
      },
      {
        id: "report_006",
        memberId: "mem_006",
        memberEmail: "user006@example.com",
        memberName: "Employee006",
        submissionDate: "2024-01-06T09:45:00Z",
        reportContent: "Achievement: Successfully deployed patch to production",
        issues: [],
      },
      {
        id: "report_007",
        memberId: "mem_007",
        memberEmail: "user007@example.com",
        memberName: "Employee007",
        submissionDate: "2024-01-07T08:30:00Z",
        reportContent:
          "Issue: Customer complaint regarding API response time escalated to engineering",
        issues: ["customer"],
      },
      {
        id: "report_008",
        memberId: "mem_008",
        memberEmail: "user008@example.com",
        memberName: "Employee008",
        submissionDate: "2024-01-07T09:00:00Z",
        reportContent: "Issue: Test coverage for module Y dropped below 70%",
        issues: ["quality"],
      },
      {
        id: "report_009",
        memberId: "mem_009",
        memberEmail: "user009@example.com",
        memberName: "Employee009",
        submissionDate: "2024-01-07T10:00:00Z",
        reportContent: "Blocker: Dependency resolution failure in CI/CD pipeline",
        issues: ["blocker"],
      },
      {
        id: "report_010",
        memberId: "mem_010",
        memberEmail: "user010@example.com",
        memberName: "Employee010",
        submissionDate: "2024-01-07T10:30:00Z",
        reportContent:
          "Coordination: Scheduled maintenance window for database migration next week",
        issues: [],
      },
    ];

    mockAiClient.callDailyReportApiStub.mockResolvedValue({
      records: mockReportData,
      recordCount: 10,
      periodStart: "2024-01-01",
      periodEnd: "2024-01-07",
      allSubmitted: true,
    });

    // Setup privacy protection mock - masks email and anonymizes name
    mockAiClient.applyPrivacyProtection.mockImplementation((data) => ({
      ...data,
      records: data.records.map((record: any) => ({
        ...record,
        memberEmail: record.memberEmail.replace(/(.+)@.+/, "$1@***"),
        memberName: `Employee_${record.memberId.replace(/mem_/, "")}`,
      })),
      privacyProtectionApplied: true,
    }));

    // Setup issue extraction mock
    mockAiClient.extractCourseData.mockResolvedValue({
      extractedIssues: [
        {
          keyword: "performance",
          occurrenceCount: 1,
          affectedMembers: 1,
        },
        {
          keyword: "infrastructure",
          occurrenceCount: 1,
          affectedMembers: 1,
        },
        {
          keyword: "quality",
          occurrenceCount: 2,
          affectedMembers: 2,
        },
        {
          keyword: "risk",
          occurrenceCount: 1,
          affectedMembers: 1,
        },
        {
          keyword: "customer",
          occurrenceCount: 1,
          affectedMembers: 1,
        },
        {
          keyword: "blocker",
          occurrenceCount: 1,
          affectedMembers: 1,
        },
      ],
      totalIssuesCount: 7,
    });

    // Setup priority scoring mock
    mockAiClient.classifyAndScorePriority.mockResolvedValue({
      priorityIssuedList: [
        {
          issueKeyword: "blocker",
          occurrenceCount: 1,
          priorityScore: 95,
          priorityRank: "high",
        },
        {
          issueKeyword: "customer",
          occurrenceCount: 1,
          priorityScore: 85,
          priorityRank: "high",
        },
        {
          issueKeyword: "quality",
          occurrenceCount: 2,
          priorityScore: 70,
          priorityRank: "medium",
        },
        {
          issueKeyword: "infrastructure",
          occurrenceCount: 1,
          priorityScore: 65,
          priorityRank: "medium",
        },
        {
          issueKeyword: "risk",
          occurrenceCount: 1,
          priorityScore: 55,
          priorityRank: "medium",
        },
      ],
      scoringMethodology: "impact_frequency_based",
    });

    // Setup report generation mock
    mockAiClient.generateAnalysisReport.mockResolvedValue({
      reportId: "report_2024_w02",
      reportTitle: "Weekly Analysis Report - Week of 2024-01-01 to 2024-01-07",
      reportGeneratedAt: new Date("2024-01-08T08:15:00Z"),
      analysisStartDate: "2024-01-01",
      analysisEndDate: "2024-01-07",
      teamId: "team_engineering",
      extractedIssueCount: 7,
      topPriorityIssues: [
        {
          issueKeyword: "blocker",
          occurrenceCount: 1,
          priorityScore: 95,
          priorityRank: "high",
        },
        {
          issueKeyword: "customer",
          occurrenceCount: 1,
          priorityScore: 85,
          priorityRank: "high",
        },
        {
          issueKeyword: "quality",
          occurrenceCount: 2,
          priorityScore: 70,
          priorityRank: "medium",
        },
        {
          issueKeyword: "infrastructure",
          occurrenceCount: 1,
          priorityScore: 65,
          priorityRank: "medium",
        },
        {
          issueKeyword: "risk",
          occurrenceCount: 1,
          priorityScore: 55,
          priorityRank: "medium",
        },
      ],
    });

    // Setup report distribution mock
    mockAiClient.sendReportToManager.mockResolvedValue({
      recipientManagerId: "manager_001",
      recipientEmail: "manager@example.com",
      emailSentAt: new Date("2024-01-08T08:20:00Z"),
      deliveryStatus: "success",
    });
  });

  afterEach(() => {
    // Restore original Date.now
    Date.now = originalNow;
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  // SCEN-107: [normal] Daily report collection to analysis report generation autonomous agent - executes autonomous action "automatically collect daily report data from last week every Monday morning at the start of the week"
  test("SCEN-107: runTx6Imp1Agent executes autonomous action to collect previous weeks daily report data every Monday morning", async () => {
    // Setup test input - Monday 2024-01-08, analysis for previous week (2024-01-01 to 2024-01-07)
    const agentInput = {
      executionTimestamp: new Date("2024-01-08T08:00:00Z"),
      analysisStartDate: "2024-01-01",
      analysisEndDate: "2024-01-07",
      teamId: "team_engineering",
    };

    // Execute the orchestrator with mocked AI client
    const result = await runTx6Imp1Agent(agentInput, mockAiClient);

    // Verify autonomous action 1 was executed: call daily report API stub
    expect(mockAiClient.callDailyReportApiStub).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callDailyReportApiStub).toHaveBeenCalledWith({
      periodStart: "2024-01-01",
      periodEnd: "2024-01-07",
      teamId: "team_engineering",
    });

    // Verify privacy protection was applied during data aggregation
    expect(mockAiClient.applyPrivacyProtection).toHaveBeenCalled();

    // Verify issue extraction was performed
    expect(mockAiClient.extractCourseData).toHaveBeenCalled();

    // Verify priority classification was executed
    expect(mockAiClient.classifyAndScorePriority).toHaveBeenCalled();

    // Verify analysis report was generated
    expect(mockAiClient.generateAnalysisReport).toHaveBeenCalled();

    // Verify report was sent to manager
    expect(mockAiClient.sendReportToManager).toHaveBeenCalled();

    // Validate output structure
    expect(result).toBeDefined();
    expect(result.reportId).toBe("report_2024_w02");
    expect(result.reportGeneratedAt).toEqual(new Date("2024-01-08T08:15:00Z"));
    expect(result.emailSentAt).toEqual(new Date("2024-01-08T08:20:00Z"));
    expect(result.extractedIssueCount).toBe(7);

    // Verify top priority issues are correctly ordered
    expect(result.topPriorityIssues).toHaveLength(5);
    expect(result.topPriorityIssues[0].issueKeyword).toBe("blocker");
    expect(result.topPriorityIssues[0].priorityScore).toBe(95);
    expect(result.topPriorityIssues[0].priorityRank).toBe("high");

    expect(result.topPriorityIssues[1].issueKeyword).toBe("customer");
    expect(result.topPriorityIssues[1].priorityScore).toBe(85);
    expect(result.topPriorityIssues[1].priorityRank).toBe("high");

    expect(result.topPriorityIssues[2].issueKeyword).toBe("quality");
    expect(result.topPriorityIssues[2].priorityScore).toBe(70);
    expect(result.topPriorityIssues[2].priorityRank).toBe("medium");

    expect(result.topPriorityIssues[3].issueKeyword).toBe("infrastructure");
    expect(result.topPriorityIssues[3].priorityScore).toBe(65);
    expect(result.topPriorityIssues[3].priorityRank).toBe("medium");

    expect(result.topPriorityIssues[4].issueKeyword).toBe("risk");
    expect(result.topPriorityIssues[4].priorityScore).toBe(55);
    expect(result.topPriorityIssues[4].priorityRank).toBe("medium");

    // Verify execution logs contain autonomous action marker
    const logOutput = consoleLogSpy.mock.calls
      .map((call) => call[0]?.toString() || "")
      .join(" ");

    // Verify that the agent completed all autonomous actions in correct order
    expect(mockAiClient.callDailyReportApiStub).toHaveBeenCalledBefore(
      mockAiClient.applyPrivacyProtection as jest.Mock
    );
    expect(mockAiClient.applyPrivacyProtection).toHaveBeenCalledBefore(
      mockAiClient.extractCourseData as jest.Mock
    );
    expect(mockAiClient.extractCourseData).toHaveBeenCalledBefore(
      mockAiClient.classifyAndScorePriority as jest.Mock
    );
    expect(mockAiClient.classifyAndScorePriority).toHaveBeenCalledBefore(
      mockAiClient.generateAnalysisReport as jest.Mock
    );
    expect(mockAiClient.generateAnalysisReport).toHaveBeenCalledBefore(
      mockAiClient.sendReportToManager as jest.Mock
    );

    // Verify collected data metrics
    const callArgs = mockAiClient.callDailyReportApiStub.mock.calls[0][0];
    expect(callArgs.periodStart).toBe("2024-01-01");
    expect(callArgs.periodEnd).toBe("2024-01-07");
    expect(callArgs.teamId).toBe("team_engineering");

    // Verify report metadata
    expect(result.reportGeneratedAt.getFullYear()).toBe(2024);
    expect(result.reportGeneratedAt.getMonth()).toBe(0); // January (0-indexed)
    expect(result.reportGeneratedAt.getDate()).toBe(8);

    // Verify email was sent after report generation
    expect(result.emailSentAt).toBeInstanceOf(Date);
    expect(result.emailSentAt > result.reportGeneratedAt).toBe(true);

    // Verify privacy protection was applied (as indicated by action sequence)
    expect(mockAiClient.applyPrivacyProtection).toHaveBeenCalled();
  });
});