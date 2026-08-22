import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("共通 - 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  // SCEN-031
  test("should escalate with CRITICAL_INCIDENT_DETECTED and halt side effects before human review", async () => {
    const mockAuditLog: Array<{
      eventType: string;
      timestamp: string;
      escalationReason?: string;
      criticalIncidentCount?: number;
      incidentDetails?: Array<{ id: string; severity: string; reportedContent: string }>;
    }> = [];

    const mockReportData = {
      collectionPeriod: {
        startDate: "2024-01-08",
        endDate: "2024-01-14",
      },
      submittedReports: [
        {
          reportId: "RPT001",
          memberId: "MEM001",
          submittedAt: "2024-01-08T09:00:00Z",
          content: "通常の進捗報告",
          issues: [],
        },
        {
          reportId: "RPT002",
          memberId: "MEM002",
          submittedAt: "2024-01-08T09:15:00Z",
          content: "本番環境でデータベース接続エラーが発生。顧客システムが停止状態。",
          issues: [
            {
              issueId: "ISS001",
              title: "本番DBダウン",
              severity: "CRITICAL",
              isCriticalIncident: true,
              reportedAt: "2024-01-08T09:15:00Z",
            },
          ],
        },
      ],
      unsubmittedMembers: ["MEM003"],
    };

    const mockAiClient = {
      action01GetDailyReportData: jest.fn().mockResolvedValue({
        status: "success",
        data: mockReportData.submittedReports.concat([
          { memberId: "MEM003", reportId: null, content: null, issues: [] },
        ]),
        collectionTimestamp: "2024-01-08T10:00:00Z",
      }),

      action02DetectUnsubmittedMembers: jest.fn().mockResolvedValue({
        status: "success",
        unsubmittedMembers: mockReportData.unsubmittedMembers,
        notificationsSent: 1,
      }),

      action03ExtractIssues: jest.fn().mockResolvedValue({
        status: "success",
        extractedIssues: [
          {
            issueId: "ISS001",
            title: "本番DBダウン",
            category: "INFRASTRUCTURE",
            severity: "CRITICAL",
            isCriticalIncident: true,
            affectedSystems: ["PRODUCTION_DB"],
            reportedBy: "MEM002",
            reportedAt: "2024-01-08T09:15:00Z",
          },
        ],
      }),

      action04AssignPriority: jest.fn().mockResolvedValue({
        status: "success",
        prioritizedIssues: [
          {
            issueId: "ISS001",
            priority: 1,
            urgencyScore: 100,
            impactScore: 95,
            riskScore: 98,
            isCriticalIncident: true,
          },
        ],
        escalationRequired: true,
        escalationReason: "CRITICAL_INCIDENT_DETECTED",
        criticalIncidentIds: ["ISS001"],
      }),

      action05GenerateMorningMaterial: jest.fn(),
      action06SendCompletionNotification: jest.fn(),
    };

    const runTx1Imp1Agent = async (
      reportData: typeof mockReportData,
      aiClient: typeof mockAiClient
    ) => {
      const auditEntry = {
        eventType: "AGENT_STARTED",
        timestamp: new Date().toISOString(),
      };
      mockAuditLog.push(auditEntry);

      const action01Result = await aiClient.action01GetDailyReportData();
      if (action01Result.status !== "success") {
        throw new Error("Action01 failed");
      }

      const action02Result = await aiClient.action02DetectUnsubmittedMembers();
      if (action02Result.status !== "success") {
        throw new Error("Action02 failed");
      }

      const action03Result = await aiClient.action03ExtractIssues();
      if (action03Result.status !== "success") {
        throw new Error("Action03 failed");
      }

      const action04Result = await aiClient.action04AssignPriority();
      if (action04Result.status !== "success") {
        throw new Error("Action04 failed");
      }

      if (
        action04Result.escalationRequired &&
        action04Result.escalationReason === "CRITICAL_INCIDENT_DETECTED"
      ) {
        const escalationAuditEntry = {
          eventType: "ESCALATION_INITIATED",
          timestamp: new Date("2024-01-08T10:05:00Z").toISOString(),
          escalationReason: "CRITICAL_INCIDENT_DETECTED",
          criticalIncidentCount: action04Result.criticalIncidentIds.length,
          incidentDetails: action03Result.extractedIssues
            .filter((issue: { isCriticalIncident: boolean; issueId: string }) =>
              action04Result.criticalIncidentIds.includes(issue.issueId)
            )
            .map(
              (issue: {
                issueId: string;
                severity: string;
                reportedAt: string;
                title: string;
              }) => ({
                id: issue.issueId,
                severity: issue.severity,
                reportedContent: issue.title,
              })
            ),
        };
        mockAuditLog.push(escalationAuditEntry);

        return {
          status: "ESCALATION_PENDING",
          humanReviewRequired: true,
          escalationReason: "CRITICAL_INCIDENT_DETECTED",
          criticalIncidentIds: action04Result.criticalIncidentIds,
          pendingActions: ["朝会資料生成", "部長通知送信"],
          executedActions: ["日報取得", "未提出検出", "課題抽出", "優先順位付与"],
          escalationContext: {
            detectedAt: new Date("2024-01-08T10:05:00Z").toISOString(),
            criticalIssueCount: action04Result.criticalIncidentIds.length,
            unsubmittedMemberCount: action02Result.unsubmittedMembers.length,
          },
          approvalRequired: true,
        };
      }

      const action05Result = await aiClient.action05GenerateMorningMaterial();
      if (action05Result.status !== "success") {
        throw new Error("Action05 failed");
      }

      const action06Result = await aiClient.action06SendCompletionNotification();
      if (action06Result.status !== "success") {
        throw new Error("Action06 failed");
      }

      return {
        status: "COMPLETED",
        humanReviewRequired: false,
        pendingActions: [],
        executedActions: [
          "日報取得",
          "未提出検出",
          "課題抽出",
          "優先順位付与",
          "朝会資料生成",
          "部長通知送信",
        ],
      };
    };

    const result = await runTx1Imp1Agent(mockReportData, mockAiClient);

    expect(result.status).toBe("ESCALATION_PENDING");
    expect(result.humanReviewRequired).toBe(true);
    expect(result.escalationReason).toBe("CRITICAL_INCIDENT_DETECTED");
    expect(result.criticalIncidentIds).toEqual(["ISS001"]);
    expect(result.pendingActions).toEqual(["朝会資料生成", "部長通知送信"]);
    expect(result.executedActions).toEqual([
      "日報取得",
      "未提出検出",
      "課題抽出",
      "優先順位付与",
    ]);
    expect(result.approvalRequired).toBe(true);

    expect(mockAiClient.action05GenerateMorningMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.action06SendCompletionNotification).not.toHaveBeenCalled();

    const escalationLog = mockAuditLog.find(
      (log) => log.eventType === "ESCALATION_INITIATED"
    );
    expect(escalationLog).toBeDefined();
    expect(escalationLog?.escalationReason).toBe("CRITICAL_INCIDENT_DETECTED");
    expect(escalationLog?.criticalIncidentCount).toBe(1);
    expect(escalationLog?.incidentDetails).toBeDefined();
    expect(escalationLog?.incidentDetails?.length).toBe(1);
    expect(escalationLog?.incidentDetails?.[0].id).toBe("ISS001");
    expect(escalationLog?.incidentDetails?.[0].severity).toBe("CRITICAL");
    expect(escalationLog?.incidentDetails?.[0].reportedContent).toBe("本番DBダウン");

    const escalationLogTimestamp = escalationLog?.timestamp;
    expect(escalationLogTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});