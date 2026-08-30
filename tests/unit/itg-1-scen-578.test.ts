import { conductEngineerGroupTraining } from "../../src/logic/adoption-training-management";
import { type EngineerGroupTrainingInput, type EngineerGroupTrainingResult } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム", () => {
  // SCEN-578
  test("全エンジニア10名が統一された研修内容でアプリ操作を学習し、実習環境での一連操作を完了させる。evaluateEngineerOperationalProficiencyが設計された計算式の代表値を返す", () => {
    const trainingInput: EngineerGroupTrainingInput = {
      trainingSessionId: "SESSION-2024-001",
      engineerIds: [
        "ENG-001",
        "ENG-002",
        "ENG-003",
        "ENG-004",
        "ENG-005",
        "ENG-006",
        "ENG-007",
        "ENG-008",
        "ENG-009",
        "ENG-010",
      ],
      trainingDate: new Date("2024-01-15T09:00:00Z"),
      practiceEnvironmentUrl: "https://practice.example.com/training",
    };

    const result: EngineerGroupTrainingResult = conductEngineerGroupTraining(
      trainingInput
    );

    expect(result.trainingSessionId).toBe("SESSION-2024-001");
    expect(result.participantResults).toHaveLength(10);

    const eng001Result = result.participantResults.find(
      (r) => r.engineerId === "ENG-001"
    );
    expect(eng001Result).toBeDefined();
    if (eng001Result) {
      expect(eng001Result.operationSkillScore).toBe(100);
      expect(eng001Result.passJudgment).toBe(true);
    }

    expect(result.trainingCompletionStatus).toBe("completed");
  });
});