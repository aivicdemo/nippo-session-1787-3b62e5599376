import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("朝会報告管理システム - 優先度スコア計算エンジン", () => {
  // SCEN-391: 優先度重み付けの合計が1.0でないときエラーが発生する
  test("should throw error when priority weights do not sum to 1.0", () => {
    const issueId = "issue-001";
    const frequency = 50;
    const impactScore = 60;
    const frequencyWeight = 0.5;
    const impactWeight = 0.3;

    expect(() =>
      calculatePriorityScoreForIssue({
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight,
      })
    ).toThrow(/優先度計算パラメータが不正です/);
  });
});