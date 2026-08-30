import { describe, test, expect } from "@jest/globals";
import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";
import type { IssuePriorityScoringInput } from "../../src/logic/priority-scoring-engine";

describe("calculatePriorityScoreForIssue", () => {
  // SCEN-268: [edge] 波及メンバー数がチーム全体を超えるときの境界条件で impactScore が範囲外（0～100）で入力される場合、エラーを発生させて拒否する
  test("should throw error when impactScore exceeds valid range (0-100)", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 150,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /影響度スコア/
    );
  });
});