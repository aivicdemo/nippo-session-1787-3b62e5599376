import { applyColorCodeByPriorityRank } from "../../src/logic/priority-scoring-engine";

describe("applyColorCodeByPriorityRank", () => {
  test("SCEN-059: should throw InvalidPriorityRankError when priorityRank is not one of '高', '中', '低'", () => {
    const invalidInput = {
      priorityRank: "超高" as any,
      issueId: "ISSUE-001",
      displayContext: "dashboard" as const,
    };

    expect(() => applyColorCodeByPriorityRank(invalidInput)).toThrow(
      /優先度ランク/
    );
  });
});