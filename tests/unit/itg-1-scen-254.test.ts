import { describe, test, expect } from "@jest/globals";
import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine - calculatePriorityScoreForIssue", () => {
  // SCEN-254: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 影響を受けたメンバー数がチーム総人数を超えるときという明示された境界条件で影響度は最大1.0に調整されます
  test("should throw OutOfRangeScoreError when impactScore exceeds 0-100 range", () => {
    const issueId = "ISSUE-001";
    const frequency = 50;
    const impactScore = 150; // Out of range (0-100)
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    expect(() =>
      calculatePriorityScoreForIssue({
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight,
      })
    ).toThrow(/影響度スコア/);
  });
});