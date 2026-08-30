import { conductEngineerGroupTraining } from "../../src/logic/adoption-training-management";

describe("朝会報告管理システム - 全エンジニア向け集合研修実施", () => {
  // SCEN-121
  test("実習参加エンジニア数が10名未満の場合、InsufficientParticipants エラーが発生する", () => {
    const trainingSessionId = "session-001";
    const engineerIds = [
      "eng-001",
      "eng-002",
      "eng-003",
      "eng-004",
      "eng-005",
      "eng-006",
      "eng-007",
      "eng-008",
      "eng-009",
    ];
    const trainingDate = new Date("2024-01-15T10:00:00Z");
    const practiceEnvironmentUrl = "https://practice.example.com";

    expect(() =>
      conductEngineerGroupTraining({
        trainingSessionId,
        engineerIds,
        trainingDate,
        practiceEnvironmentUrl,
      })
    ).toThrow(/不参加者/);
  });
});