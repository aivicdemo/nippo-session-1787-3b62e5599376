import { formatIssueListWithColorCoding } from "../../src/logic/dashboard-presentation";

describe("formatIssueListWithColorCoding", () => {
  // SCEN-067
  test("should throw EmptyIssueListError when issues array is empty", () => {
    const emptyIssues: Array<{
      issueId: string;
      issueContent: string;
      priorityScore: number;
      impactDegree: number;
      frequency: number;
    }> = [];

    expect(() => {
      formatIssueListWithColorCoding({
        issues: emptyIssues,
      });
    }).toThrow(/色分け対象の課題が存在しません。/);
  });
});