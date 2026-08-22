import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import { type Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/orchestrator";
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from "../../src/agents/tx-3-imp-1/orchestrator";

describe("tx-3-imp-1 orchestrator", () => {
  // SCEN-070
  test("should record audit events in chronological order from START through COMPLETED for aggregated report processing with priority-based task list generation", async () => {
    const auditLog: Array<{
      eventType: string;
      timestamp: Date;
      agentId: string;
      actionNumber?: number;
      reportAggregationId: string;
      processingResult: "success" | "failure";
      processingTimeMs?: number;
    }> = [];

    const mockAiClient: Tx3Imp1AiClient = {
      executeAction01ExtractKeywords: jest.fn(async () => ({
        keywords: ["遅延", "品質低下", "顧客クレーム"],
        extractedAt: new Date("2024-01-15T09:00:00Z"),
      })),
      executeAction02ClassifyCategories: jest.fn(async () => ({
        classifications: [
          { keyword: "遅延", category: "納期" },
          { keyword: "品質低下", category: "品質" },
          { keyword: "顧客クレーム", category: "顧客満足度" },
        ],
        classifiedAt: new Date("2024-01-15T09:01:00Z"),
      })),
      executeAction03JudgePriority: jest.fn(async () => ({
        prioritizedIssues: [
          {
            keyword: "顧客クレーム",
            category: "顧客満足度",
            impactRange: "high",
            urgency: "critical",
            recurrenceRisk: "high",
            priorityScore: 95,
            priorityLevel: "high",
          },
          {
            keyword: "品質低下",
            category: "品質",
            impactRange: "medium",
            urgency: "high",
            recurrenceRisk: "medium",
            priorityScore: 78,
            priorityLevel: "medium",
          },
          {
            keyword: "遅延",
            category: "納期",
            impactRange: "low",
            urgency: "medium",
            recurrenceRisk: "low",
            priorityScore: 45,
            priorityLevel: "low",
          },
        ],
        judgedAt: new Date("2024-01-15T09:02:00Z"),
      })),
      executeAction04GeneratePriorityList: jest.fn(async () => ({
        priorityListHtml:
          "<h1>優先度別課題一覧</h1><table><tr><td>顧客クレーム</td><td>95</td></tr></table>",
        generatedAt: new Date("2024-01-15T09:03:00Z"),
      })),
      executeAction05SendEmail: jest.fn(async () => ({
        emailSent: true,
        recipientEmail: "manager@example.com",
        sentAt: new Date("2024-01-15T09:04:00Z"),
      })),
    };

    const mockReportAggregationId = "agg-20240115-001";
    const mockManagerEmail = "manager@example.com";
    const mockAnalysisExecutionTime = new Date("2024-01-15T09:00:00Z");

    const mockInput: Tx3Imp1AgentInput = {
      reportAggregationId: mockReportAggregationId,
      analysisExecutionTime: mockAnalysisExecutionTime,
      managerEmail: mockManagerEmail,
      priorityThresholds: {
        highPriorityMinScore: 80,
        mediumPriorityMinScore: 50,
      },
    };

    let startEventRecorded = false;
    let action01EventRecorded = false;
    let action02EventRecorded = false;
    let action03EventRecorded = false;
    let action04EventRecorded = false;
    let action05EventRecorded = false;
    let completedEventRecorded = false;

    const captureAuditEvent = (
      eventType: string,
      actionNumber?: number,
      processingTimeMs?: number
    ) => {
      const event = {
        eventType,
        timestamp: new Date("2024-01-15T09:05:00Z"),
        agentId: "tx_3_imp_1",
        actionNumber,
        reportAggregationId: mockReportAggregationId,
        processingResult: "success" as const,
        processingTimeMs,
      };
      auditLog.push(event);

      if (eventType === "START") {
        startEventRecorded = true;
      } else if (eventType === "ACTION_01_EXECUTED") {
        action01EventRecorded = true;
      } else if (eventType === "ACTION_02_EXECUTED") {
        action02EventRecorded = true;
      } else if (eventType === "ACTION_03_EXECUTED") {
        action03EventRecorded = true;
      } else if (eventType === "ACTION_04_EXECUTED") {
        action04EventRecorded = true;
      } else if (eventType === "ACTION_05_EXECUTED") {
        action05EventRecorded = true;
      } else if (eventType === "COMPLETED") {
        completedEventRecorded = true;
      }
    };

    captureAuditEvent("START", undefined, 0);
    captureAuditEvent("ACTION_01_EXECUTED", 1, 100);
    captureAuditEvent("ACTION_02_EXECUTED", 2, 80);
    captureAuditEvent("ACTION_03_EXECUTED", 3, 150);
    captureAuditEvent("ACTION_04_EXECUTED", 4, 120);
    captureAuditEvent("ACTION_05_EXECUTED", 5, 200);
    captureAuditEvent("COMPLETED", undefined, 650);

    const result: Tx3Imp1AgentOutput = await runTx3Imp1Agent(mockInput, mockAiClient);

    expect(startEventRecorded).toBe(true);
    expect(action01EventRecorded).toBe(true);
    expect(action02EventRecorded).toBe(true);
    expect(action03EventRecorded).toBe(true);
    expect(action04EventRecorded).toBe(true);
    expect(action05EventRecorded).toBe(true);
    expect(completedEventRecorded).toBe(true);

    expect(auditLog).toHaveLength(7);

    expect(auditLog[0].eventType).toBe("START");
    expect(auditLog[0].agentId).toBe("tx_3_imp_1");
    expect(auditLog[0].reportAggregationId).toBe(mockReportAggregationId);
    expect(auditLog[0].processingResult).toBe("success");

    expect(auditLog[1].eventType).toBe("ACTION_01_EXECUTED");
    expect(auditLog[1].actionNumber).toBe(1);
    expect(auditLog[1].processingTimeMs).toBe(100);

    expect(auditLog[2].eventType).toBe("ACTION_02_EXECUTED");
    expect(auditLog[2].actionNumber).toBe(2);
    expect(auditLog[2].processingTimeMs).toBe(80);

    expect(auditLog[3].eventType).toBe("ACTION_03_EXECUTED");
    expect(auditLog[3].actionNumber).toBe(3);
    expect(auditLog[3].processingTimeMs).toBe(150);

    expect(auditLog[4].eventType).toBe("ACTION_04_EXECUTED");
    expect(auditLog[4].actionNumber).toBe(4);
    expect(auditLog[4].processingTimeMs).toBe(120);

    expect(auditLog[5].eventType).toBe("ACTION_05_EXECUTED");
    expect(auditLog[5].actionNumber).toBe(5);
    expect(auditLog[5].processingTimeMs).toBe(200);

    expect(auditLog[6].eventType).toBe("COMPLETED");
    expect(auditLog[6].processingTimeMs).toBe(650);

    for (let i = 1; i < auditLog.length; i++) {
      expect(auditLog[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        auditLog[i - 1].timestamp.getTime()
      );
    }

    expect(result).toBeDefined();
    expect(result.extractedIssues).toBeDefined();
    expect(result.prioritizedIssueList).toBeDefined();
    expect(result.emailSendStatus).toBeDefined();
    expect(result.executionTimestamp).toBeDefined();

    expect(Array.isArray(result.extractedIssues)).toBe(true);
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
  });
});