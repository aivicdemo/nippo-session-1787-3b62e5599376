import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10Imp1AiClient } from "../../src/agents/tx-10-imp-1/orchestrator";
import { type Tx10AgentInput, type Tx10AgentOutput } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("Tx10Imp1Agent - 導入計画・研修実施・フィードバック対応の自動化・統合", () => {
  // SCEN-184
  test("導入スケジュール案が組織方針と矛盾する場合に副作用の確定前に人へ引き継ぐ", async () => {
    // Setup: 組織情報と現状データ
    const deploymentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date("2024-11-01T09:00:00Z"),
      participantList: [
        {
          userId: "mgr-001",
          role: "ProjectManager",
          email: "pm@company.com",
        },
        {
          userId: "dept-head-001",
          role: "Manager",
          email: "manager@company.com",
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          userId: `eng-${String(i + 1).padStart(3, "0")}`,
          role: "Engineer",
          email: `eng${i + 1}@company.com`,
        })),
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: "09:00",
    };

    // Setup: 矛盾するスケジュール案を返すFake AI Client
    const fakeAiClient: Tx10Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        schedulePlan: {
          deploymentStartDate: "2025-01-15",
          deploymentEndDate: "2024-12-31",
          trainingCompletionDate: "2024-12-20",
          productionStartDate: "2025-02-01",
          conflictIndicator: true,
          conflictDescription:
            "導入開始日が完了予定日より後になっています。導入終了日が過去日付です。",
        },
        organizationPolicyConflict: {
          detected: true,
          violatedPolicy: "システム導入は翌期度以降のみ",
          conflictReason:
            "現在の組織方針では2025年Q1での導入は認められていません。Q2以降の導入を推奨します。",
        },
      }),
      buildAction02Prompt: jest.fn(),
      buildAction03Prompt: jest.fn(),
      buildAction04Prompt: jest.fn(),
      buildAction05Prompt: jest.fn(),
      buildAction06Prompt: jest.fn(),
    };

    // Execute: runTx10Imp1Agent を実行
    const result = await runTx10Imp1Agent(
      deploymentInput,
      fakeAiClient
    );

    // Verify: ステータスがエラーで、エスカレーション発生
    expect(result.status).toBe("ERROR");
    expect(result.escalationTriggered).toBe(true);
    expect(result.escalationReason).toBe(
      "導入スケジュール案が組織方針と矛盾"
    );
    expect(result.affectedActions).toContain("action-01");

    // Verify: 副作用が実行されていないこと
    expect(result.trainingMaterials).toBeUndefined();
    expect(result.deploymentSchedule).toBeUndefined();
    expect(result.initialReportAnalysis).toBeUndefined();
    expect(result.onboardingApprovalStatus).toBeUndefined();

    // Verify: 人への引き継ぎタスクが作成されている
    expect(result.handoverToHuman).toBeDefined();
    expect(result.handoverToHuman?.status).toBe("AWAITING_HUMAN_DECISION");
    expect(result.handoverToHuman?.escalationReason).toContain("組織方針");
    expect(result.handoverToHuman?.conflictingScheduleDetails).toBeDefined();
    expect(
      result.handoverToHuman?.conflictingScheduleDetails?.deploymentStartDate
    ).toBe("2025-01-15");
    expect(
      result.handoverToHuman?.conflictingScheduleDetails?.deploymentEndDate
    ).toBe("2024-12-31");
    expect(
      result.handoverToHuman?.conflictingScheduleDetails?.organizationPolicy
    ).toBe("システム導入は翌期度以降のみ");
    expect(result.handoverToHuman?.awaitingHumanDecision).toBe(true);

    // Verify: buildAction02以降は呼び出されていないこと（副作用確定前に停止）
    expect(fakeAiClient.buildAction02Prompt).not.toHaveBeenCalled();
    expect(fakeAiClient.buildAction03Prompt).not.toHaveBeenCalled();
    expect(fakeAiClient.buildAction04Prompt).not.toHaveBeenCalled();
    expect(fakeAiClient.buildAction05Prompt).not.toHaveBeenCalled();
    expect(fakeAiClient.buildAction06Prompt).not.toHaveBeenCalled();

    // Verify: エラーメッセージに詳細情報が含まれている
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.message).toContain("矛盾");
    expect(result.errorDetails?.context).toBeDefined();
  });
});