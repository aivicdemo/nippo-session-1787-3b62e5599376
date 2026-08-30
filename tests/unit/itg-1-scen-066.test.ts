import { formatIssueListWithColorCoding } from "../../src/logic/dashboard-presentation";

describe("formatIssueListWithColorCoding", () => {
  test("SCEN-066: throws InvalidPriorityScoreError when priorityScore is outside 0-100 range", () => {
    const issuesWithInvalidScore = [
      {
        issueId: "issue-001",
        issueContent: "Test issue",
        priorityScore: -5,
        impactDegree: 5,
        frequency: 2,
      },
    ];

    expect(() =>
      formatIssueListWithColorCoding({
        issues: issuesWithInvalidScore,
      })
    ).toThrow(/優先度スコアが無効な値です。0～100の範囲で指定してください。/);
  });
});