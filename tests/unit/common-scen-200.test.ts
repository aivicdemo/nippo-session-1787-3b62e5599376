import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";
import type {
  Tx11Imp1AiClient,
  MemberReportData,
  ExtractedIssue,
  AuditLogEntry,
} from "../../src/types";

describe("notification-delivery: sendUnsubmittedReminder", () => {
  let mockAiClient: Tx11Imp1AiClient;
  let mockDatabaseMemberReports: MemberReportData[];
  let mockDatabasePastIssues: ExtractedIssue[];
  let mockEmailLog: Array<{ recipient: string; subject: string; body: string }>;
  let mockAuditLog: AuditLogEntry[];

  beforeEach(() => {
    mockEmailLog = [];
    mockAuditLog = [];

    // SCEN-200: Setup 10 members with submission status at 07:00 today
    // 7 submitted, 3 not submitted
    mockDatabaseMemberReports = [
      {
        memberId: "A",
        memberName: "Member A",
        submittedAt: new Date("2024-01-15T06:30:00Z"),
        content: "Completed feature X. Issue: Database query slow on endpoint /api/users.",
        status: "submitted",
      },
      {
        memberId: "B",
        memberName: "Member B",
        submittedAt: null,
        content: "",
        status: "not_submitted",
      },
      {
        memberId: "C",
        memberName: "Member C",
        submittedAt: new Date("2024-01-15T06:45:00Z"),
        content: "Bug fix for login timeout. Related: Issue #42 from 2 weeks ago.",
        status: "submitted",
      },
      {
        memberId: "D",
        memberName: "Member D",
        submittedAt: new Date("2024-01-15T06:15:00Z"),
        content: "Deployed release v2.1. All tests passed.",
        status: "submitted",
      },
      {
        memberId: "E",
        memberName: "Member E",
        submittedAt: null,
        content: "",
        status: "not_submitted",
      },
      {
        memberId: "F",
        memberName: "Member F",
        submittedAt: new Date("2024-01-15T06:20:00Z"),
        content: "Documentation update. Performance regression in batch job detected.",
        status: "submitted",
      },
      {
        memberId: "G",
        memberName: "Member G",
        submittedAt: new Date("2024-01-15T06:50:00Z"),
        content: "Code review completed. API schema conflict with mobile team.",
        status: "submitted",
      },
      {
        memberId: "H",
        memberName: "Member H",
        submittedAt: null,
        content: "",
        status: "not_submitted",
      },
      {
        memberId: "I",
        memberName: "Member I",
        submittedAt: new Date("2024-01-15T06:40:00Z"),
        content: "Integration test framework refactored. No blockers.",
        status: "submitted",
      },
      {
        memberId: "J",
        memberName: "Member J",
        submittedAt: new Date("2024-01-15T06:25:00Z"),
        content: "Monitoring dashboard improvements. Alert latency issue ongoing.",
        status: "submitted",
      },
    ];

    // Setup past 30 days of issues with same-issue recurrence data
    mockDatabasePastIssues = [
      {
        issueId: "ISSUE-001",
        reportId: "REP-2024-01-05-A",
        content: "Database query slow on endpoint /api/users",
        severity: "high",
        category: "performance",
        detectedDate: new Date("2024-01-05T08:00:00Z"),
        frequency: 3,
        relatedIssueIds: ["ISSUE-002", "ISSUE-003"],
      },
      {
        issueId: "ISSUE-002",
        reportId: "REP-2024-01-08-D",
        content: "Database query performance degradation",
        severity: "high",
        category: "performance",
        detectedDate: new Date("2024-01-08T07:30:00Z"),
        frequency: 2,
        relatedIssueIds: ["ISSUE-001"],
      },
      {
        issueId: "ISSUE-003",
        reportId: "REP-2024-01-12-F",
        content: "Query timeout on user endpoints",
        severity: "high",
        category: "performance",
        detectedDate: new Date("2024-01-12T09:00:00Z"),
        frequency: 1,
        relatedIssueIds: ["ISSUE-001"],
      },
      {
        issueId: "ISSUE-004",
        reportId: "REP-2024-01-10-C",
        content: "Login timeout intermittent failures",
        severity: "medium",
        category: "auth",
        detectedDate: new Date("2024-01-10T10:15:00Z"),
        frequency: 4,
        relatedIssueIds: [],
      },
      {
        issueId: "ISSUE-005",
        reportId: "REP-2024-01-07-G",
        content: "API schema mismatch with mobile client",
        severity: "medium",
        category: "integration",
        detectedDate: new Date("2024-01-07T14:20:00Z"),
        frequency: 2,
        relatedIssueIds: [],
      },
    ];

    // Mock AI client with required action prompt functions
    mockAiClient = {
      async executeAction01_CheckSubmissionStatus(): Promise<{
        totalMembers: number;
        submittedCount: number;
        submissionRate: number;
        unsubmittedMembers: string[];
      }> {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:00:00Z"),
          action: "Action-01: Check submission status",
          details: `Checked ${mockDatabaseMemberReports.length} members`,
        });
        const unsubmitted = mockDatabaseMemberReports
          .filter((m) => m.status === "not_submitted")
          .map((m) => m.memberId);
        return {
          totalMembers: 10,
          submittedCount: 7,
          submissionRate: 0.7,
          unsubmittedMembers: unsubmitted,
        };
      },

      async executeAction02_SendReminders(
        unsubmittedMemberIds: string[]
      ): Promise<{ sentCount: number; recipients: string[] }> {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:05:00Z"),
          action: "Action-02: Send reminders",
          details: `Sent reminders to ${unsubmittedMemberIds.length} members`,
        });
        for (const memberId of unsubmittedMemberIds) {
          const member = mockDatabaseMemberReports.find(
            (m) => m.memberId === memberId
          );
          if (member) {
            mockEmailLog.push({
              recipient: `${member.memberName}@company.com`,
              subject: "朝会報告提出のお願い",
              body: `${member.memberName}様へ、本日の朝会報告をお願いします。`,
            });
          }
        }
        return {
          sentCount: unsubmittedMemberIds.length,
          recipients: unsubmittedMemberIds,
        };
      },

      async executeAction03_ExtractIssues(
        submittedReports: MemberReportData[]
      ): Promise<ExtractedIssue[]> {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:10:00Z"),
          action: "Action-03: Extract issues",
          details: `Extracted issues from ${submittedReports.length} reports`,
        });
        const extractedIssues: ExtractedIssue[] = [];
        if (
          submittedReports.some((r) =>
            r.content.includes("Database query slow")
          )
        ) {
          extractedIssues.push({
            issueId: "ISSUE-TODAY-001",
            reportId: "REP-2024-01-15-A",
            content: "Database query slow on endpoint /api/users",
            severity: "high",
            category: "performance",
            detectedDate: new Date("2024-01-15T06:30:00Z"),
            frequency: 1,
            relatedIssueIds: [],
          });
        }
        if (
          submittedReports.some((r) =>
            r.content.includes("performance regression")
          )
        ) {
          extractedIssues.push({
            issueId: "ISSUE-TODAY-002",
            reportId: "REP-2024-01-15-F",
            content: "Performance regression in batch job",
            severity: "medium",
            category: "performance",
            detectedDate: new Date("2024-01-15T06:20:00Z"),
            frequency: 1,
            relatedIssueIds: [],
          });
        }
        if (
          submittedReports.some((r) =>
            r.content.includes("API schema conflict")
          )
        ) {
          extractedIssues.push({
            issueId: "ISSUE-TODAY-003",
            reportId: "REP-2024-01-15-G",
            content: "API schema conflict with mobile team",
            severity: "medium",
            category: "integration",
            detectedDate: new Date("2024-01-15T06:50:00Z"),
            frequency: 1,
            relatedIssueIds: [],
          });
        }
        if (
          submittedReports.some((r) =>
            r.content.includes("Alert latency issue")
          )
        ) {
          extractedIssues.push({
            issueId: "ISSUE-TODAY-004",
            reportId: "REP-2024-01-15-J",
            content: "Alert latency issue ongoing",
            severity: "low",
            category: "monitoring",
            detectedDate: new Date("2024-01-15T06:25:00Z"),
            frequency: 1,
            relatedIssueIds: [],
          });
        }
        return extractedIssues;
      },

      async executeAction04_SearchSimilarIssues(
        extractedIssues: ExtractedIssue[]
      ): Promise<Map<string, ExtractedIssue[]>> {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:15:00Z"),
          action: "Action-04: Search similar issues",
          details: `Searched database for similar issues to ${extractedIssues.length} extracted issues`,
        });
        const similarMap = new Map<string, ExtractedIssue[]>();

        for (const extracted of extractedIssues) {
          const similar: ExtractedIssue[] = [];
          if (
            extracted.content.includes("Database query") ||
            extracted.content.includes("performance")
          ) {
            similar.push(
              ...mockDatabasePastIssues.filter((p) =>
                p.category === "performance"
              )
            );
          }
          if (extracted.content.includes("API schema")) {
            similar.push(...mockDatabasePastIssues.filter((p) =>
              p.content.includes("schema")
            ));
          }
          similarMap.set(extracted.issueId, similar);
        }

        return similarMap;
      },

      async executeAction05_PrioritizeIssues(
        extractedIssues: ExtractedIssue[],
        similarIssuesMap: Map<string, ExtractedIssue[]>
      ): Promise<
        Array<{
          issue: ExtractedIssue;
          priorityRank: number;
          priorityLabel: string;
        }>
      > {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:20:00Z"),
          action: "Action-05: Prioritize issues",
          details: `Prioritized ${extractedIssues.length} issues by severity and frequency`,
        });

        const prioritized = extractedIssues
          .map((issue) => {
            const similarCount = similarIssuesMap.get(issue.issueId)?.length || 0;
            let priorityRank = 0;
            let priorityLabel = "low";

            if (issue.severity === "high") {
              priorityRank = 3;
              priorityLabel = "high";
            } else if (issue.severity === "medium") {
              priorityRank = 2;
              priorityLabel = "medium";
            } else {
              priorityRank = 1;
              priorityLabel = "low";
            }

            priorityRank += similarCount * 0.5;

            return {
              issue,
              priorityRank,
              priorityLabel,
            };
          })
          .sort((a, b) => b.priorityRank - a.priorityRank);

        return prioritized;
      },

      async executeAction06_BuildManagerSummaryEmail(
        submissionRate: number,
        unsubmittedMembers: string[],
        prioritizedIssues: Array<{
          issue: ExtractedIssue;
          priorityRank: number;
          priorityLabel: string;
        }>
      ): Promise<{ subject: string; body: string; draftOnly: boolean }> {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:25:00Z"),
          action: "Action-06: Build manager summary email",
          details: `Built summary email with ${prioritizedIssues.length} prioritized issues`,
        });

        const submissionRatePercent = Math.round(submissionRate * 100);
        const highPriorityCount = prioritizedIssues.filter(
          (p) => p.priorityLabel === "high"
        ).length;
        const mediumPriorityCount = prioritizedIssues.filter(
          (p) => p.priorityLabel === "medium"
        ).length;
        const lowPriorityCount = prioritizedIssues.filter(
          (p) => p.priorityLabel === "low"
        ).length;
        const timeReductionMinutes = 45;

        const subject = "【朝会用】本日の報告集約・課題優先度付けサマリー";
        const body = `【朝会用サマリー】
日報提出率: ${submissionRatePercent}%
未提出者: ${unsubmittedMembers.join(", ")} (${unsubmittedMembers.length}名)
抽出課題数: ${prioritizedIssues.length}件
- 高優先度: ${highPriorityCount}件
- 中優先度: ${mediumPriorityCount}件
- 低優先度: ${lowPriorityCount}件

優先度付け課題一覧:
${prioritizedIssues.map((p, idx) => `${idx + 1}. [${p.priorityLabel.toUpperCase()}] ${p.issue.content}`).join("\n")}

朝会推定短縮時間: ${timeReductionMinutes}分`;

        return {
          subject,
          body,
          draftOnly: true,
        };
      },

      async executeAction07_PrepareReferenceInfoForMembers(
        extractedIssues: ExtractedIssue[],
        similarIssuesMap: Map<string, ExtractedIssue[]>
      ): Promise<
        Array<{
          issueId: string;
          referenceTitle: string;
          referenceContent: string;
        }>
      > {
        mockAuditLog.push({
          timestamp: new Date("2024-01-15T07:30:00Z"),
          action: "Action-07: Prepare reference info for members",
          details: `Prepared reference information for ${extractedIssues.length} issues`,
        });

        const referenceSet: Array<{
          issueId: string;
          referenceTitle: string;
          referenceContent: string;
        }> = [];

        for (const issue of extractedIssues) {
          const similarIssues = similarIssuesMap.get(issue.issueId) || [];
          if (similarIssues.length > 0) {
            referenceSet.push({
              issueId: issue.issueId,
              referenceTitle: `過去の類似事例: "${issue.content}"`,
              referenceContent: `過去${similarIssues.length}件の類似事例が検出されました:\n${similarIssues.map((s) => `- ${s.content} (${s.detectedDate.toISOString()})`).join("\n")}`,
            });
          }
        }

        return referenceSet;
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-200: [normal] Autonomous agent execution for daily report collection, confirmation, and reminder sending
  test("SCEN-200: sendUnsubmittedReminder executes complete autonomous workflow with all actions in sequence", async () => {
    // Execute the agent function with the test setup
    const result = await sendUnsubmittedReminder(
      mockDatabaseMemberReports,
      mockDatabasePastIssues,
      mockAiClient
    );

    // Verify Action-01: Check submission status
    expect(result.submissionStats.totalMembers).toBe(10);
    expect(result.submissionStats.submittedCount).toBe(7);
    expect(result.submissionStats.submissionRate).toBe(0.7);
    expect(result.submissionStats.unsubmittedMembers).toEqual([
      "B",
      "E",
      "H",
    ]);

    // Verify Action-02: Send reminders to 3 unsubmitted members (B, E, H)
    expect(result.remindersResult.sentCount).toBe(3);
    expect(result.remindersResult.recipients).toEqual(["B", "E", "H"]);
    expect(mockEmailLog).toHaveLength(3);
    const recipientEmails = mockEmailLog.map((e) => e.recipient);
    expect(recipientEmails).toContain("Member B@company.com");
    expect(recipientEmails).toContain("Member E@company.com");
    expect(recipientEmails).toContain("Member H@company.com");

    // Verify Action-03: Extract issues from 7 submitted reports
    expect(result.extractedIssuesCount).toBe(4);
    expect(
      result.extractedIssues.some((i) =>
        i.content.includes("Database query slow")
      )
    ).toBe(true);
    expect(
      result.extractedIssues.some((i) =>
        i.content.includes("Performance regression")
      )
    ).toBe(true);
    expect(
      result.extractedIssues.some((i) =>
        i.content.includes("API schema conflict")
      )
    ).toBe(true);
    expect(
      result.extractedIssues.some((i) =>
        i.content.includes("Alert latency issue")
      )
    ).toBe(true);

    // Verify Action-04: Search for similar issues - should find 3 same-issue cases + 2 similar cases
    const databasePerfIssuesCount = mockDatabasePastIssues.filter(
      (i) => i.category === "performance"
    ).length;
    expect(databasePerfIssuesCount).toBe(3);
    const databaseSchemaIssuesCount = mockDatabasePastIssues.filter((i) =>
      i.content.includes("schema")
    ).length;
    expect(databaseSchemaIssuesCount).toBe(1);
    expect(result.similarIssuesFound).toBeGreaterThan(0);

    // Verify Action-05: Prioritized issues sorted by severity (high > medium > low) and frequency
    const prioritizedIssues = result.prioritizedIssues;
    expect(prioritizedIssues).toHaveLength(4);
    // First issue should be high priority (database query - matches 3 past cases)
    expect(prioritizedIssues[0].priorityLabel).toBe("high");
    expect(prioritizedIssues[0].issue.content).toContain("Database query");
    // Medium priority should follow
    const mediumPriorityIssues = prioritizedIssues.filter(
      (p) => p.priorityLabel === "medium"
    );
    expect(mediumPriorityIssues.length).toBeGreaterThanOrEqual(2);

    // Verify Action-06: Build manager summary email with required fields
    expect(result.managerSummaryEmail).toBeDefined();
    expect(result.managerSummaryEmail.subject).toContain("朝会用");
    expect(result.managerSummaryEmail.body).toContain("70%");
    expect(result.managerSummaryEmail.body).toContain("Member B");
    expect(result.managerSummaryEmail.body).toContain("Member E");
    expect(result.managerSummaryEmail.body).toContain("Member H");
    expect(result.managerSummaryEmail.body).toContain("4件");
    expect(result.managerSummaryEmail.body).toContain("高優先度");
    expect(result.managerSummaryEmail.body).toContain("中優先度");
    expect(result.managerSummaryEmail.draftOnly).toBe(true);

    // Verify Action-07: Prepare reference information for members
    expect(result.memberReferenceInfo).toBeDefined();
    expect(Array.isArray(result.memberReferenceInfo)).toBe(true);
    expect(result.memberReferenceInfo.length).toBeGreaterThan(0);
    for (const ref of result.memberReferenceInfo) {
      expect(ref.issueId).toBeDefined();
      expect(ref.referenceTitle).toBeDefined();
      expect(ref.referenceContent).toBeDefined();
      expect(ref.referenceTitle).toContain("過去");
      expect(ref.referenceTitle).toContain("類似事例");
    }

    // Verify all 7 actions logged in audit trail with timestamps and details
    expect(mockAuditLog).toHaveLength(7);
    expect(mockAuditLog[0].action).toContain("Action-01");
    expect(mockAuditLog[1].action).toContain("Action-02");
    expect(mockAuditLog[2].action).toContain("Action-03");
    expect(mockAuditLog[3].action).toContain("Action-04");
    expect(mockAuditLog[4].action).toContain("Action-05");
    expect(mockAuditLog[5].action).toContain("Action-06");
    expect(mockAuditLog[6].action).toContain("Action-07");

    // Verify audit log contains processing statistics
    expect(mockAuditLog[0].details).toContain("10");
    expect(mockAuditLog[1].details).toContain("3");
    expect(mockAuditLog[2].details).toContain("7");
    expect(mockAuditLog[3].details).toContain("Searched");
    expect(mockAuditLog[4].details).toContain("Prioritized");
    expect(mockAuditLog[5].details).toContain("4 prioritized issues");
    expect(mockAuditLog[6].details).toContain("4 issues");

    // Verify no actual emails were sent (draft only) and reminders used stub log
    expect(result.managerSummaryEmail.draftOnly).toBe(true);
    expect(mockEmailLog).toHaveLength(3);
    for (const email of mockEmailLog) {
      expect(email.subject).toContain("朝会報告提出");
      expect(email.body).toContain("朝会報告をお願いします");
    }

    // Verify AI client interface requirement
    expect(mockAiClient).toBeDefined();
    expect(typeof mockAiClient.executeAction01_CheckSubmissionStatus).toBe(
      "function"
    );
    expect(typeof mockAiClient.executeAction02_SendReminders).toBe("function");
    expect(typeof mockAiClient.executeAction03_ExtractIssues).toBe("function");
    expect(typeof mockAiClient.executeAction04_SearchSimilarIssues).toBe(
      "function"
    );
    expect(typeof mockAiClient.executeAction05_PrioritizeIssues).toBe(
      "function"
    );
    expect(typeof mockAiClient.executeAction06_BuildManagerSummaryEmail).toBe(
      "function"
    );
    expect(typeof mockAiClient.executeAction07_PrepareReferenceInfoForMembers).toBe(
      "function"
    );

    // Verify complete processing result object structure
    expect(result).toHaveProperty("submissionStats");
    expect(result).toHaveProperty("remindersResult");
    expect(result).toHaveProperty("extractedIssuesCount");
    expect(result).toHaveProperty("extractedIssues");
    expect(result).toHaveProperty("similarIssuesFound");
    expect(result).toHaveProperty("prioritizedIssues");
    expect(result).toHaveProperty("managerSummaryEmail");
    expect(result).toHaveProperty("memberReferenceInfo");
    expect(result).toHaveProperty("auditLog");

    // Verify final state: agent completed all 7 actions successfully
    expect(result.auditLog).toHaveLength(7);
    expect(result.submissionStats.submissionRate).toBe(0.7);
    expect(result.remindersResult.sentCount).toBe(3);
    expect(result.extractedIssuesCount).toBe(4);
    expect(result.managerSummaryEmail.subject).toBeTruthy();
    expect(result.memberReferenceInfo.length).toBeGreaterThan(0);
  });
});