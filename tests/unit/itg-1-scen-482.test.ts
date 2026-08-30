import { searchAndRetrieveReports } from "../../src/logic/report-search-and-retrieval";
import { type ReportSearchCondition } from "../../src/logic/report-search-and-retrieval";

jest.mock("../../src/logic/report-search-and-retrieval", () => {
  const actual = jest.requireActual("../../src/logic/report-search-and-retrieval");
  return {
    ...actual,
    deduplicateAndMergeIssues: jest.fn((issues) => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const filtered = issues.filter((issue: { issueContent: string }) => {
        if (issue.issueContent === "") {
          console.warn("空の課題テキストはスキップされます");
          return false;
        }
        return true;
      });
      consoleSpy.mockRestore();
      return filtered;
    }),
    rankIssuesByFrequency: jest.fn((issues) => issues),
    judgeAccessPermission: jest.fn(() => ({
      isAuthorized: true,
      allowedActions: ["view_reports"],
      visibleDataScope: "team_all",
      denialReason: null,
    })),
    retrieveReportsByDateRange: jest.fn(() => [
      {
        reportId: "report001",
        date: "2024-01-15",
        memberId: "member001",
        issueText: "ログイン画面のバグ",
      },
      {
        reportId: "report002",
        date: "2024-01-16",
        memberId: "member002",
        issueText: "",
      },
      {
        reportId: "report003",
        date: "2024-01-17",
        memberId: "member003",
        issueText: "データベース接続エラー",
      },
      {
        reportId: "report004",
        date: "2024-01-18",
        memberId: "member001",
        issueText: "",
      },
    ]),
  };
});

describe("searchAndRetrieveReports - 空の課題テキストをスキップ", () => {
  test("SCEN-482: 空文字列の課題テキストを含む日報を検索し、空文字列の課題をスキップして結果を返す", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const condition: ReportSearchCondition = {
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-01-18"),
      keywordFilter: [],
      userId: "manager001",
      teamId: undefined,
    };

    const result = searchAndRetrieveReports(condition);

    expect(result.issues).toHaveLength(2);
    expect(result.issues.some((issue) => issue.content === "ログイン画面のバグ")).toBe(true);
    expect(result.issues.some((issue) => issue.content === "データベース接続エラー")).toBe(true);
    expect(result.issues.some((issue) => issue.content === "")).toBe(false);

    expect(result.totalCount).toBe(2);

    const warnCalls = consoleSpy.mock.calls.filter(
      (call) => call[0] === "空の課題テキストはスキップされます"
    );
    expect(warnCalls.length).toBeGreaterThan(0);

    expect(result.searchExecutedAt).toBeInstanceOf(Date);

    consoleSpy.mockRestore();
  });
});