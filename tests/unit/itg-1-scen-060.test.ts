import { applyColorCodeByPriorityRank } from "../../src/logic/priority-scoring-engine";

describe("applyColorCodeByPriorityRank", () => {
  test("SCEN-060: throws ColorCodeMappingError when color code definition is not found for priority rank", () => {
    const priorityRank = "高";
    const issueId = "ISSUE-001";
    const displayContext = "dashboard";

    expect(() =>
      applyColorCodeByPriorityRank(priorityRank, issueId, displayContext)
    ).toThrow(/色コード/);
  });
});