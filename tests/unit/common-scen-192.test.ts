import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import type {
  Tx10Imp1AiClient,
} from "../../src/agents/tx-10-imp-1/orchestrator";
import type {
  Tx10AgentInput,
  Tx10AgentOutput,
  DeploymentParticipant,
  DeploymentSchedule,
  TrainingMaterial,
  InitialReportAnalysisResult,
  OnboardingApprovalStatus,
  FeedbackItem,
} from "../../src/agents/tx-10-imp-1/orchestrator";

interface AuditLogEntry {
  eventId: string;
  transactionId: string;
  timestamp: Date;
  actionId: string;
  statusCode: string;
  executorId: string;
  relatedResourceId: string;
  [key: string]: unknown;
}

interface FakeAiClientState {
  auditLog: AuditLogEntry[];
  lastTransactionId: string;
  approvalStatus: OnboardingApprovalStatus;
}

describe("tx-10-imp-1 orchestrator", () => {
  // SCEN-192: 導入計画・研修実施・フィードバック対応の自動化・統合 - 監査記録に9つのイベントが時系列順に記録される
  test("SCEN-192: should record all 9 audit events in chronological order for complete deployment workflow", async () => {
    const auditLogStorage: AuditLogEntry[] = [];
    const transactionStartTime = new Date("2024-01-15T09:00:00Z");
    const transactionId = `tx_10_imp_1_20240115_090000_12345`;

    // Fake AI Client implementation
    const fakeAiClient: Tx10Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue("Action 1 prompt"),
      callAction01: jest.fn(async () => ({
        deploymentSchedule: {
          initiationDate: new Date("2024-01-15"),
          phaseDeadlines: [
            new Date("2024-01-22"),
            new Date("2024-01-29"),
            new Date("2024-02-05"),
          ],
          productionStartDate: new Date("2024-02-12"),
        } as DeploymentSchedule,
      })),

      buildAction02Prompt: jest.fn().mockReturnValue("Action 2 prompt"),
      callAction02: jest.fn(async () => ({
        trainingMaterials: [
          {
            title: "Manager Operation Guide",
            content: "Guide content for manager",
            targetRole: "Manager",
          } as TrainingMaterial,
        ],
      })),

      buildAction03Prompt: jest.fn().mockReturnValue("Action 3 prompt"),
      callAction03: jest.fn(async () => ({
        trainingMaterials: [
          {
            title: "Engineer Training Material",
            content: "Training content for engineers",
            targetRole: "Engineer",
          } as TrainingMaterial,
        ],
      })),

      buildAction04Prompt: jest.fn().mockReturnValue("Action 4 prompt"),
      callAction04: jest.fn(async () => ({
        initialReportAnalysis: {
          submissionRate: 100,
          dataQualityScore: 95,
          formatUniformityScore: 98,
          feedbackItems: [],
        } as InitialReportAnalysisResult,
      })),

      buildAction05Prompt: jest.fn().mockReturnValue("Action 5 prompt"),
      callAction05: jest.fn(async () => ({
        initialReportAnalysis: {
          submissionRate: 100,
          dataQualityScore: 95,
          formatUniformityScore: 98,
          feedbackItems: [
            {
              targetUserId: "ENG001",
              category: "format",
              suggestion: "Add more detail to achievement",
            } as FeedbackItem,
          ],
        } as InitialReportAnalysisResult,
      })),

      buildAction06Prompt: jest.fn().mockReturnValue("Action 6 prompt"),
      callAction06: jest.fn(async () => ({
        onboardingApprovalStatus: {
          approvalStatus: "approved",
          approvedBy: "MGR001",
          approvedAt: new Date("2024-01-15T10:30:00Z"),
          canProceedToProduction: true,
        } as OnboardingApprovalStatus,
      })),

      recordAuditEvent: jest.fn(async (event: AuditLogEntry) => {
        auditLogStorage.push(event);
      }),
    };

    const input: Tx10AgentInput = {
      deploymentInitiationTimestamp: transactionStartTime,
      participantList: [
        {
          userId: "PM001",
          role: "ProjectManager",
          email: "pm@example.com",
        },
        {
          userId: "MGR001",
          role: "Manager",
          email: "mgr@example.com",
        },
        ...Array.from({ length: 8 }, (_, i) => ({
          userId: `ENG${String(i + 1).padStart(3, "0")}`,
          role: "Engineer",
          email: `eng${i + 1}@example.com`,
        })),
      ] as DeploymentParticipant[],
      preparationDaysRequired: 7,
      reportingDeadlineTime: "09:00",
    };

    // Execute the orchestrator
    const result: Tx10AgentOutput = await runTx10Imp1Agent(
      input,
      fakeAiClient,
      {
        transactionId,
        executorId: "SYS_AGENT",
        onAuditEventRecorded: (event: AuditLogEntry) => {
          auditLogStorage.push(event);
        },
      }
    );

    // Verify audit log has exactly 9 events
    expect(auditLogStorage).toHaveLength(9);

    // Event 1: AIエージェント実行開始
    const event1 = auditLogStorage[0];
    expect(event1.actionId).toBe("AGENT_START");
    expect(event1.statusCode).toBe("SUCCESS");
    expect(event1.transactionId).toBe(transactionId);
    expect(event1.eventId).toBeDefined();
    expect(event1.timestamp).toBeDefined();
    expect(event1.executorId).toBe("SYS_AGENT");
    expect(event1.relatedResourceId).toBeDefined();

    // Event 2: 導入スケジュール案生成完了 (Action 1)
    const event2 = auditLogStorage[1];
    expect(event2.actionId).toBe("A1");
    expect(event2.statusCode).toBe("SUCCESS");
    expect(event2.transactionId).toBe(transactionId);
    expect((event2 as any).contentHash).toBeDefined();
    expect((event2 as any).promptVersion).toBeDefined();

    // Event 3: 部長向け研修資料生成完了 (Action 2)
    const event3 = auditLogStorage[2];
    expect(event3.actionId).toBe("A2");
    expect(event3.statusCode).toBe("SUCCESS");
    expect(event3.transactionId).toBe(transactionId);
    expect((event3 as any).resourceId).toBeDefined();

    // Event 4: エンジニア向け研修教材生成完了 (Action 3)
    const event4 = auditLogStorage[3];
    expect(event4.actionId).toBe("A3");
    expect(event4.statusCode).toBe("SUCCESS");
    expect(event4.transactionId).toBe(transactionId);
    expect((event4 as any).targetCount).toBe(10);
    expect((event4 as any).version).toBeDefined();

    // Event 5: 初回報告データ分析完了 (Action 4)
    const event5 = auditLogStorage[4];
    expect(event5.actionId).toBe("A4");
    expect(event5.statusCode).toBe("SUCCESS");
    expect(event5.transactionId).toBe(transactionId);
    expect((event5 as any).analyzedRecords).toBe(10);
    expect((event5 as any).evaluationVersion).toBeDefined();

    // Event 6: フィードバック案作成完了 (Action 5)
    const event6 = auditLogStorage[5];
    expect(event6.actionId).toBe("A5");
    expect(event6.statusCode).toBe("SUCCESS");
    expect(event6.transactionId).toBe(transactionId);
    expect((event6 as any).feedbackCandidateId).toBeDefined();
    expect((event6 as any).affectedMemberCount).toBe(10);

    // Event 7: 部長による承認実施
    const event7 = auditLogStorage[6];
    expect(event7.actionId).toBe("APPROVAL");
    expect(event7.statusCode).toBe("APPROVED");
    expect(event7.transactionId).toBe(transactionId);
    expect((event7 as any).approverRole).toBe("Manager");
    expect((event7 as any).approvedAt).toBeDefined();

    // Event 8: フィードバック自動配信完了 (Action 6)
    const event8 = auditLogStorage[7];
    expect(event8.actionId).toBe("A6");
    expect(event8.statusCode).toBe("SUCCESS");
    expect(event8.transactionId).toBe(transactionId);
    expect((event8 as any).distributedMemberCount).toBe(10);
    expect((event8 as any).distributedAt).toBeDefined();

    // Event 9: AIエージェント実行完了
    const event9 = auditLogStorage[8];
    expect(event9.actionId).toBe("AGENT_COMPLETE");
    expect(event9.statusCode).toBe("SUCCESS");
    expect(event9.transactionId).toBe(transactionId);
    expect((event9 as any).totalDuration).toBeDefined();
    expect((event9 as any).finalStatus).toBe("COMPLETED");

    // Verify chronological order: timestamps should be monotonically increasing
    for (let i = 1; i < auditLogStorage.length; i++) {
      expect(auditLogStorage[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        auditLogStorage[i - 1].timestamp.getTime()
      );
    }

    // Verify all events have required fields
    for (const event of auditLogStorage) {
      expect(event.eventId).toBeDefined();
      expect(event.eventId).not.toBe("");
      expect(event.transactionId).toBe(transactionId);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.actionId).toBeDefined();
      expect(event.statusCode).toBeDefined();
      expect(event.executorId).toBeDefined();
      expect(event.relatedResourceId).toBeDefined();
    }

    // Verify result contains expected deployment output
    expect(result).toBeDefined();
    expect(result.deploymentSchedule).toBeDefined();
    expect(result.trainingMaterials).toBeDefined();
    expect(result.initialReportAnalysis).toBeDefined();
    expect(result.onboardingApprovalStatus).toBeDefined();

    // Verify AI client methods were called in correct sequence
    expect(fakeAiClient.callAction01).toHaveBeenCalled();
    expect(fakeAiClient.callAction02).toHaveBeenCalled();
    expect(fakeAiClient.callAction03).toHaveBeenCalled();
    expect(fakeAiClient.callAction04).toHaveBeenCalled();
    expect(fakeAiClient.callAction05).toHaveBeenCalled();
    expect(fakeAiClient.callAction06).toHaveBeenCalled();
  });
});