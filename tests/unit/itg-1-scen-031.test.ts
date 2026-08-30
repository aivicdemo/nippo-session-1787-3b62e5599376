import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";
import type { Tx10AdoptionTriggerInput } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("朝会報告管理システム - TX10 導入管理エージェント", () => {
  // SCEN-031: 部長向けガイド資料の生成時に必須項目が不足している場合
  test("部長向けガイド資料生成失敗時にManagerTrainingMaterialGenerationErrorをthrowする", async () => {
    const mockAiClient = {
      conductManagerTraining: jest.fn().mockResolvedValue({
        operatingProcedures: "", // 操作手順が空（必須項目不足）
        operatingRules: "チーム運用ルール",
        troubleshootingGuide: "トラブル対応方法",
      }),
      conductGroupTraining: jest.fn(),
      evaluateInitialReports: jest.fn(),
      verifyAdoptionReadiness: jest.fn(),
    };

    const input: Tx10AdoptionTriggerInput = {
      participantUserIds: ["eng001", "eng002"],
      minimumPreparationDays: 5,
      managerUserId: "mgr001",
      adoptionStartDate: "2024-02-01",
    };

    await expect(
      runTx10Imp1Agent(input, mockAiClient)
    ).rejects.toThrow(/ガイド資料/);
  });
});