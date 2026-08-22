import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import type { Tx8AgentInput, Tx8AgentOutput } from "../../src/agents/tx-8-imp-1/types";
import type { Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/ai-client";

describe("tx-8-imp-1 orchestrator", () => {
  // SCEN-157
  test("should execute complete lifecycle from issue search to visualization report with audit logging", async () => {
    const auditLogs: Array<{
      timestamp: string;
      traceId: string;
      sessionId: string;
      agentExecutionId: string;
      eventType: string;
      actionName?: string;
      userId: string;
      details: Record<string, unknown>;
    }> = [];

    const sessionId = "sess-test-20240115-001";
    const agentExecutionId = "exec-tx8-20240115-001";
    const traceId = "trace-20240115-001";
    const userId = "user-manager-001";

    const mockAiClient: Tx8Imp1AiClient = {
      callAction01SearchAndExtract: async () => {
        auditLogs.push({
          timestamp: "2024-01-15T09:00:00Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_START",
          actionName: "Action 1: Search and Extract Issues",
          userId,
          details: {
            systemName: "朝会報告管理システム",
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const extractedIssues = [
          { id: "issue-001", title: "Database connection timeout", severity: "high" },
          { id: "issue-002", title: "Memory leak in worker process", severity: "high" },
          { id: "issue-003", title: "API response slow", severity: "medium" },
          { id: "issue-004", title: "Disk space warning", severity: "low" },
          { id: "issue-005", title: "Database connection timeout recurrence", severity: "high" },
        ];

        auditLogs.push({
          timestamp: "2024-01-15T09:00:05Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_COMPLETE",
          actionName: "Action 1: Search and Extract Issues",
          userId,
          details: {
            extractedIssueCount: 5,
            systemName: "朝会報告管理システム",
          },
        });

        return {
          issues: extractedIssues,
          totalCount: 5,
        };
      },

      callAction02AnalyzeRecurrencePattern: async () => {
        auditLogs.push({
          timestamp: "2024-01-15T09:00:10Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_START",
          actionName: "Action 2: Analyze Recurrence Pattern",
          userId,
          details: {},
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        auditLogs.push({
          timestamp: "2024-01-15T09:00:15Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_COMPLETE",
          actionName: "Action 2: Analyze Recurrence Pattern",
          userId,
          details: {
            detectedPatternCount: 2,
            patterns: [
              {
                patternId: "pattern-001",
                type: "database_issue",
                frequency: 3,
              },
              {
                patternId: "pattern-002",
                type: "performance_issue",
                frequency: 2,
              },
            ],
          },
        });

        return {
          patterns: [
            { patternId: "pattern-001", type: "database_issue", frequency: 3 },
            { patternId: "pattern-002", type: "performance_issue", frequency: 2 },
          ],
          totalPatternCount: 2,
        };
      },

      callAction03IdentifyBottleneck: async () => {
        auditLogs.push({
          timestamp: "2024-01-15T09:00:20Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_START",
          actionName: "Action 3: Identify Bottleneck Pattern",
          userId,
          details: {},
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        auditLogs.push({
          timestamp: "2024-01-15T09:00:25Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_COMPLETE",
          actionName: "Action 3: Identify Bottleneck Pattern",
          userId,
          details: {
            bottleneckPatternCount: 3,
            bottlenecks: [
              { bottleneckId: "bn-001", category: "infrastructure", severity: "critical" },
              { bottleneckId: "bn-002", category: "performance", severity: "high" },
              { bottleneckId: "bn-003", category: "capacity", severity: "medium" },
            ],
          },
        });

        return {
          bottlenecks: [
            { bottleneckId: "bn-001", category: "infrastructure", severity: "critical" },
            { bottleneckId: "bn-002", category: "performance", severity: "high" },
            { bottleneckId: "bn-003", category: "capacity", severity: "medium" },
          ],
          totalBottleneckCount: 3,
        };
      },

      callAction04GenerateVisualization: async () => {
        auditLogs.push({
          timestamp: "2024-01-15T09:00:30Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_START",
          actionName: "Action 4: Generate Visualization Report",
          userId,
          details: {},
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const reportId = "rpt-viz-20240115-001";
        const generatedAt = "2024-01-15T09:00:35Z";

        auditLogs.push({
          timestamp: generatedAt,
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_COMPLETE",
          actionName: "Action 4: Generate Visualization Report",
          userId,
          details: {
            reportId,
            generatedAt,
            chartCount: 4,
          },
        });

        return {
          reportId,
          generatedAt,
          chartCount: 4,
        };
      },

      callAction05ExtractHighPriority: async () => {
        auditLogs.push({
          timestamp: "2024-01-15T09:00:40Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_START",
          actionName: "Action 5: Extract High Priority Issues",
          userId,
          details: {},
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        const highPriorityIssues = [
          { id: "issue-001", title: "Database connection timeout", priority: "high" },
          { id: "issue-002", title: "Memory leak in worker process", priority: "high" },
          { id: "issue-005", title: "Database connection timeout recurrence", priority: "high" },
        ];

        auditLogs.push({
          timestamp: "2024-01-15T09:00:45Z",
          traceId,
          sessionId,
          agentExecutionId,
          eventType: "ACTION_COMPLETE",
          actionName: "Action 5: Extract High Priority Issues",
          userId,
          details: {
            highPriorityIssueCount: 3,
            issues: highPriorityIssues,
          },
        });

        return {
          highPriorityIssues,
          totalHighPriorityCount: 3,
        };
      },
    };

    const input: Tx8AgentInput = {
      analysisPeriodStartDate: "2024-01-08T00:00:00Z",
      analysisPeriodEndDate: "2024-01-15T23:59:59Z",
      managerEmail: "manager@company.com",
      minimumDataThreshold: 10,
    };

    auditLogs.push({
      timestamp: "2024-01-15T09:00:00Z",
      traceId,
      sessionId,
      agentExecutionId,
      eventType: "AGENT_START",
      userId,
      details: {
        analysisPeriodStartDate: "2024-01-08T00:00:00Z",
        analysisPeriodEndDate: "2024-01-15T23:59:59Z",
        managerEmail: "manager@company.com",
      },
    });

    const result = await runTx8Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe("rpt-viz-20240115-001");
    expect(result.analysisStatus).toBe("completed");
    expect(result.recurringIssueCount).toBe(2);
    expect(result.reportDeliveryStatus).toBe("sent");

    auditLogs.push({
      timestamp: "2024-01-15T09:00:50Z",
      traceId,
      sessionId,
      agentExecutionId,
      eventType: "HANDOFF_NEXT_ORCHESTRATOR",
      userId,
      details: {
        nextStep: "部長への提示処理への遷移",
        reportId: result.reportId,
      },
    });

    const completionTime = Date.parse("2024-01-15T09:00:50Z") - Date.parse("2024-01-15T09:00:00Z");

    auditLogs.push({
      timestamp: "2024-01-15T09:00:50Z",
      traceId,
      sessionId,
      agentExecutionId,
      eventType: "AGENT_COMPLETE",
      userId,
      details: {
        status: "SUCCESS",
        processingTimeMs: completionTime,
        reportId: result.reportId,
      },
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(12);

    const agentStartLog = auditLogs.find((log) => log.eventType === "AGENT_START");
    expect(agentStartLog).toBeDefined();
    expect(agentStartLog?.traceId).toBe(traceId);
    expect(agentStartLog?.sessionId).toBe(sessionId);
    expect(agentStartLog?.agentExecutionId).toBe(agentExecutionId);
    expect(agentStartLog?.userId).toBe(userId);

    const action1StartLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 1: Search and Extract Issues"
    );
    expect(action1StartLog).toBeDefined();
    expect(action1StartLog?.traceId).toBe(traceId);
    expect(action1StartLog?.sessionId).toBe(sessionId);
    expect(action1StartLog?.agentExecutionId).toBe(agentExecutionId);

    const action1CompleteLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_COMPLETE" && log.actionName === "Action 1: Search and Extract Issues"
    );
    expect(action1CompleteLog).toBeDefined();
    expect(action1CompleteLog?.details.extractedIssueCount).toBe(5);
    expect(action1CompleteLog?.traceId).toBe(traceId);
    expect(action1CompleteLog?.sessionId).toBe(sessionId);
    expect(action1CompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const action2StartLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 2: Analyze Recurrence Pattern"
    );
    expect(action2StartLog).toBeDefined();
    expect(action2StartLog?.traceId).toBe(traceId);
    expect(action2StartLog?.sessionId).toBe(sessionId);
    expect(action2StartLog?.agentExecutionId).toBe(agentExecutionId);

    const action2CompleteLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_COMPLETE" && log.actionName === "Action 2: Analyze Recurrence Pattern"
    );
    expect(action2CompleteLog).toBeDefined();
    expect(action2CompleteLog?.details.detectedPatternCount).toBe(2);
    expect(action2CompleteLog?.traceId).toBe(traceId);
    expect(action2CompleteLog?.sessionId).toBe(sessionId);
    expect(action2CompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const action3StartLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 3: Identify Bottleneck Pattern"
    );
    expect(action3StartLog).toBeDefined();
    expect(action3StartLog?.traceId).toBe(traceId);
    expect(action3StartLog?.sessionId).toBe(sessionId);
    expect(action3StartLog?.agentExecutionId).toBe(agentExecutionId);

    const action3CompleteLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_COMPLETE" && log.actionName === "Action 3: Identify Bottleneck Pattern"
    );
    expect(action3CompleteLog).toBeDefined();
    expect(action3CompleteLog?.details.bottleneckPatternCount).toBe(3);
    expect(action3CompleteLog?.traceId).toBe(traceId);
    expect(action3CompleteLog?.sessionId).toBe(sessionId);
    expect(action3CompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const action4StartLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 4: Generate Visualization Report"
    );
    expect(action4StartLog).toBeDefined();
    expect(action4StartLog?.traceId).toBe(traceId);
    expect(action4StartLog?.sessionId).toBe(sessionId);
    expect(action4StartLog?.agentExecutionId).toBe(agentExecutionId);

    const action4CompleteLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_COMPLETE" && log.actionName === "Action 4: Generate Visualization Report"
    );
    expect(action4CompleteLog).toBeDefined();
    expect(action4CompleteLog?.details.reportId).toBe("rpt-viz-20240115-001");
    expect(action4CompleteLog?.details.generatedAt).toBe("2024-01-15T09:00:35Z");
    expect(action4CompleteLog?.details.chartCount).toBe(4);
    expect(action4CompleteLog?.traceId).toBe(traceId);
    expect(action4CompleteLog?.sessionId).toBe(sessionId);
    expect(action4CompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const action5StartLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 5: Extract High Priority Issues"
    );
    expect(action5StartLog).toBeDefined();
    expect(action5StartLog?.traceId).toBe(traceId);
    expect(action5StartLog?.sessionId).toBe(sessionId);
    expect(action5StartLog?.agentExecutionId).toBe(agentExecutionId);

    const action5CompleteLog = auditLogs.find(
      (log) =>
        log.eventType === "ACTION_COMPLETE" && log.actionName === "Action 5: Extract High Priority Issues"
    );
    expect(action5CompleteLog).toBeDefined();
    expect(action5CompleteLog?.details.highPriorityIssueCount).toBe(3);
    expect(action5CompleteLog?.traceId).toBe(traceId);
    expect(action5CompleteLog?.sessionId).toBe(sessionId);
    expect(action5CompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const handoffLog = auditLogs.find((log) => log.eventType === "HANDOFF_NEXT_ORCHESTRATOR");
    expect(handoffLog).toBeDefined();
    expect(handoffLog?.traceId).toBe(traceId);
    expect(handoffLog?.sessionId).toBe(sessionId);
    expect(handoffLog?.agentExecutionId).toBe(agentExecutionId);
    expect(handoffLog?.details.nextStep).toBe("部長への提示処理への遷移");

    const agentCompleteLog = auditLogs.find((log) => log.eventType === "AGENT_COMPLETE");
    expect(agentCompleteLog).toBeDefined();
    expect(agentCompleteLog?.details.status).toBe("SUCCESS");
    expect(agentCompleteLog?.details.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(agentCompleteLog?.traceId).toBe(traceId);
    expect(agentCompleteLog?.sessionId).toBe(sessionId);
    expect(agentCompleteLog?.agentExecutionId).toBe(agentExecutionId);

    const allLogs = auditLogs;
    for (const log of allLogs) {
      expect(log.traceId).toBe(traceId);
      expect(log.sessionId).toBe(sessionId);
      expect(log.agentExecutionId).toBe(agentExecutionId);
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(log.userId).toBe(userId);
    }

    const action1Index = allLogs.findIndex(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 1: Search and Extract Issues"
    );
    const action2Index = allLogs.findIndex(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 2: Analyze Recurrence Pattern"
    );
    const action3Index = allLogs.findIndex(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 3: Identify Bottleneck Pattern"
    );
    const action4Index = allLogs.findIndex(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 4: Generate Visualization Report"
    );
    const action5Index = allLogs.findIndex(
      (log) =>
        log.eventType === "ACTION_START" && log.actionName === "Action 5: Extract High Priority Issues"
    );

    expect(action1Index).toBeLessThan(action2Index);
    expect(action2Index).toBeLessThan(action3Index);
    expect(action3Index).toBeLessThan(action4Index);
    expect(action4Index).toBeLessThan(action5Index);
  });
});