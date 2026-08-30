import { syncExtractedIssuesToExternalTool } from "../../src/logic/existing-tool-integration";

describe("既存ツール連携処理", () => {
  // SCEN-398: [error] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する。 - 連携試行回数が0以下または負の数のときという明示された境界条件で試行回数は1以上である必要があります
  test("integrationAttemptが0のとき、試行回数は1以上である必要があります というエラーをスローする", () => {
    const integrationAttemptParam = 0;
    const errorTypeParam = "timeout";
    const extractedIssueDataParam = [
      {
        issueId: "issue-001",
        issueContent: "This is a test issue that needs to be resolved",
        priorityScore: 75,
        impactLevel: "high" as const,
        extractedKeywords: ["bug", "critical"],
        reportDate: "2024-01-15",
        reporterId: "eng-001",
        teamId: "team-001",
      },
    ];
    const toolConnectionConfigParam = {
      apiEndpoint: "https://jira.example.com/rest/api/2",
      authToken: "test-token-12345",
      toolType: "jira" as const,
    };

    expect(() =>
      syncExtractedIssuesToExternalTool(
        integrationAttemptParam,
        errorTypeParam,
        extractedIssueDataParam,
        toolConnectionConfigParam
      )
    ).toThrow(/試行回数は1以上である必要があります/);
  });
});