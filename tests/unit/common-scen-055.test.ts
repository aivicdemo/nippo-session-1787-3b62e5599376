import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-055: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  // 監査ログに開始・各処理・引継ぎ・失敗・完了を監査記録に残す
  test("should record all audit events from start to completion for report collection and issue extraction workflow", async () => {
    const auditLogs: Array<{
      timestamp: string;
      eventType: string;
      status?: string;
      agentId?: string;
      actionName?: string;
      inputParameters?: Record<string, unknown>;
      outputSummary?: Record<string, unknown>;
      promptVersion?: string;
      submissionCount?: number;
      conversionSuccessCount?: number;
      conversionFailureCount?: number;
      extractionCount?: number;
      analysisRuleVersion?: string;
      highPriorityCount?: number;
      mediumPriorityCount?: number;
      lowPriorityCount?: number;
      unsubmittedMemberList?: string[];
      deliveryEmail?: string;
      emailBodyPreview?: string;
      deliveryStatus?: string;
      totalProcessingTimeMs?: number;
      allActionsCompletedFlag?: boolean;
    }> = [];

    const mockAiClient = {
      action01_confirmSubmissionStatus: jest
        .fn()
        .mockResolvedValue({
          receivedCount: 10,
          unreceivedCount: 3,
          timestamp: "2024-01-15T08:00:00Z",
        }),
      action02_unifyFormat: jest.fn().mockResolvedValue({
        processedCount: 10,
        successCount: 10,
        failureCount: 0,
        timestamp: "2024-01-15T08:05:00Z",
      }),
      action03_extractIssues: jest.fn().mockResolvedValue({
        extractedIssueCount: 15,
        analysisRuleVersion: "v2.1",
        timestamp: "2024-01-15T08:10:00Z",
      }),
      action04_prioritizeIssues: jest.fn().mockResolvedValue({
        highPriorityCount: 3,
        mediumPriorityCount: 8,
        lowPriorityCount: 4,
        timestamp: "2024-01-15T08:15:00Z",
      }),
      action05_identifyUnsubmitted: jest.fn().mockResolvedValue({
        unsubmittedMembers: ["user_002", "user_007", "user_015"],
        timestamp: "2024-01-15T08:20:00Z",
      }),
      action06_generateAndSendEmail: jest.fn().mockResolvedValue({
        deliveryEmail: "director@company.example.com",
        emailBodyPreview:
          "High Priority Issues: 3, Medium: 8, Low: 4. Unsubmitted members: 3",
        deliveryStatus: "SUCCESS",
        timestamp: "2024-01-15T08:25:00Z",
      }),
      recordAuditEvent: jest
        .fn()
        .mockImplementation(
          (
            eventType: string,
            status: string | undefined,
            agentId: string | undefined,
            details: Record<string, unknown>
          ) => {
            const timestamp = new Date().toISOString();
            auditLogs.push({
              timestamp,
              eventType,
              status,
              agentId,
              ...details,
            });
          }
        ),
    };

    const startTime = new Date("2024-01-15T08:00:00Z");
    const endTime = new Date("2024-01-15T08:25:00Z");
    const expectedProcessingTimeMs =
      endTime.getTime() - startTime.getTime();

    await detectAndNotifyUnsubmitted(mockAiClient as any);

    expect(auditLogs.length).toBe(8);

    const startEvent = auditLogs[0];
    expect(startEvent.eventType).toBe("ORCHESTRATOR_START");
    expect(startEvent.status).toBe("START");
    expect(startEvent.agentId).toBe("tx_2_imp_1");
    expect(startEvent.timestamp).toBeDefined();

    const action01Event = auditLogs[1];
    expect(action01Event.eventType).toBe("ACTION_01_EXECUTED");
    expect(action01Event.actionName).toBe("confirmSubmissionStatus");
    expect(action01Event.inputParameters).toEqual({
      targetDate: "2024-01-15",
    });
    expect(action01Event.outputSummary).toEqual({
      receivedCount: 10,
      unreceivedCount: 3,
    });
    expect(action01Event.promptVersion).toBe("ACTION_01_PROMPT_VERSION");

    const action02Event = auditLogs[2];
    expect(action02Event.eventType).toBe("ACTION_02_EXECUTED");
    expect(action02Event.actionName).toBe("unifyFormat");
    expect(action02Event.submissionCount).toBe(10);
    expect(action02Event.conversionSuccessCount).toBe(10);
    expect(action02Event.conversionFailureCount).toBe(0);
    expect(action02Event.promptVersion).toBe("ACTION_02_PROMPT_VERSION");

    const action03Event = auditLogs[3];
    expect(action03Event.eventType).toBe("ACTION_03_EXECUTED");
    expect(action03Event.actionName).toBe("extractIssues");
    expect(action03Event.extractionCount).toBe(15);
    expect(action03Event.analysisRuleVersion).toBe("v2.1");
    expect(action03Event.promptVersion).toBe("ACTION_03_PROMPT_VERSION");

    const action04Event = auditLogs[4];
    expect(action04Event.eventType).toBe("ACTION_04_EXECUTED");
    expect(action04Event.actionName).toBe("prioritizeIssues");
    expect(action04Event.highPriorityCount).toBe(3);
    expect(action04Event.mediumPriorityCount).toBe(8);
    expect(action04Event.lowPriorityCount).toBe(4);
    expect(action04Event.promptVersion).toBe("ACTION_04_PROMPT_VERSION");

    const action05Event = auditLogs[5];
    expect(action05Event.eventType).toBe("ACTION_05_EXECUTED");
    expect(action05Event.actionName).toBe("identifyUnsubmitted");
    expect(action05Event.unsubmittedMemberList).toEqual([
      "user_002",
      "user_007",
      "user_015",
    ]);
    expect(action05Event.promptVersion).toBe("ACTION_05_PROMPT_VERSION");

    const action06Event = auditLogs[6];
    expect(action06Event.eventType).toBe("ACTION_06_EXECUTED");
    expect(action06Event.actionName).toBe("generateAndSendEmail");
    expect(action06Event.deliveryEmail).toBe(
      "director@company.example.com"
    );
    expect(action06Event.emailBodyPreview).toBe(
      "High Priority Issues: 3, Medium: 8, Low: 4. Unsubmitted members: 3"
    );
    expect(action06Event.deliveryStatus).toBe("SUCCESS");
    expect(action06Event.promptVersion).toBe("ACTION_06_PROMPT_VERSION");

    const completeEvent = auditLogs[7];
    expect(completeEvent.eventType).toBe("ORCHESTRATOR_COMPLETE");
    expect(completeEvent.status).toBe("COMPLETE");
    expect(completeEvent.agentId).toBe("tx_2_imp_1");
    expect(completeEvent.allActionsCompletedFlag).toBe(true);
    expect(completeEvent.totalProcessingTimeMs).toBeGreaterThanOrEqual(0);

    for (let i = 1; i < auditLogs.length; i++) {
      const prevTime = new Date(auditLogs[i - 1].timestamp).getTime();
      const currTime = new Date(auditLogs[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }

    const eventTypes = auditLogs.map((log) => log.eventType);
    const uniqueEventTypes = new Set(eventTypes);
    expect(uniqueEventTypes.size).toBe(eventTypes.length);
  });
});