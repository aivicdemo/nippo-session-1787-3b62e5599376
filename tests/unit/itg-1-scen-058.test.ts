import { applyColorCodeByPriorityRank } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine - Color Code Application", () => {
  // SCEN-058
  test("applyColorCodeByPriorityRank applies correct color codes based on priority rank for all display contexts", () => {
    // Pattern 1: High priority rank with dashboard context
    const result1 = applyColorCodeByPriorityRank({
      priorityRank: "高",
      issueId: "ISSUE-001",
      displayContext: "dashboard",
    });

    expect(result1.issueId).toBe("ISSUE-001");
    expect(result1.colorCode).toBe("#FF0000");
    expect(result1.priorityRank).toBe("高");
    expect(result1.colorLabel).toBe("赤");

    // Pattern 2: Medium priority rank with report context
    const result2 = applyColorCodeByPriorityRank({
      priorityRank: "中",
      issueId: "ISSUE-002",
      displayContext: "report",
    });

    expect(result2.issueId).toBe("ISSUE-002");
    expect(result2.colorCode).toBe("#FFFF00");
    expect(result2.priorityRank).toBe("中");
    expect(result2.colorLabel).toBe("黄");

    // Pattern 3: Low priority rank with list context
    const result3 = applyColorCodeByPriorityRank({
      priorityRank: "低",
      issueId: "ISSUE-003",
      displayContext: "list",
    });

    expect(result3.issueId).toBe("ISSUE-003");
    expect(result3.colorCode).toBe("#00AA00");
    expect(result3.priorityRank).toBe("低");
    expect(result3.colorLabel).toBe("緑");
  });
});