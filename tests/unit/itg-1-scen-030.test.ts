import { runTx10Imp1Agent } from "../../src/agents/tx-10-imp-1/orchestrator";

describe("Tx10Imp1Agent - 導入スケジュール自動策定エラーハンドリング", () => {
  test("SCEN-030: 参加者リストが空または準備期間が不正な場合、スケジュール策定に失敗する", async () => {
    // テストケース1: participantUserIds が空配列
    try {
      await runTx10Imp1Agent({
        participantUserIds: [],
        minimumPreparationDays: 5,
        managerUserId: "manager-001",
        adoptionStartDate: "2025-01-20",
      });
      fail("テストケース1: 例外がスローされるべき");
    } catch (error) {
      expect((error as Error).message).toMatch(/導入スケジュール策定に失敗しました/);
      expect((error as Error).message).toMatch(/参加者情報と準備期間を確認してください/);
    }

    // テストケース2: minimumPreparationDays が負数
    try {
      await runTx10Imp1Agent({
        participantUserIds: ["eng-001", "eng-002"],
        minimumPreparationDays: -1,
        managerUserId: "manager-001",
        adoptionStartDate: "2025-01-20",
      });
      fail("テストケース2: 例外がスローされるべき");
    } catch (error) {
      expect((error as Error).message).toMatch(/導入スケジュール策定に失敗しました/);
      expect((error as Error).message).toMatch(/参加者情報と準備期間を確認してください/);
    }

    // テストケース3: minimumPreparationDays が整数ではない
    try {
      await runTx10Imp1Agent({
        participantUserIds: ["eng-001", "eng-002"],
        minimumPreparationDays: 3.5,
        managerUserId: "manager-001",
        adoptionStartDate: "2025-01-20",
      });
      fail("テストケース3: 例外がスローされるべき");
    } catch (error) {
      expect((error as Error).message).toMatch(/導入スケジュール策定に失敗しました/);
      expect((error as Error).message).toMatch(/参加者情報と準備期間を確認してください/);
    }

    // テストケース4: 正常系（境界値）- minimumPreparationDays=0（最小許容値）
    const validResult = await runTx10Imp1Agent({
      participantUserIds: ["eng-001"],
      minimumPreparationDays: 0,
      managerUserId: "manager-001",
      adoptionStartDate: "2025-01-20",
    });

    expect(validResult).toBeDefined();
    expect(validResult.adoptionSchedule).toBeDefined();
    expect(validResult.adoptionSchedule.scheduleId).toBeDefined();
    expect(validResult.adoptionSchedule.startDate).toBe("2025-01-20");
    expect(validResult.adoptionSchedule.endDate).toBeDefined();
    expect(Array.isArray(validResult.adoptionSchedule.milestones)).toBe(true);
    expect(validResult.adoptionSchedule.milestones.length).toBeGreaterThan(0);
  });
});