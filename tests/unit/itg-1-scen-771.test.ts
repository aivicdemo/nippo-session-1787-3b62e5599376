import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-771: [error] 課題自動抽出・優先度判定機能 - 影響度スコアが数値型でないとき、エラーを返す
  test("影響度スコアが数値型でない場合、INVALID_SCORE_TYPEエラーを返す", () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "データベース接続エラー",
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const testCases = [
      { input: "85", type: "string" },
      { input: null, type: "object" },
      { input: undefined, type: "undefined" },
      { input: true, type: "boolean" },
      { input: {}, type: "object" },
      { input: [], type: "object" },
    ];

    testCases.forEach(({ input, type }) => {
      mockTextAnalysisService.assessImpactScore.mockResolvedValueOnce({
        keyword: "データベース接続エラー",
        impactScore: input,
      });

      const result = extractAndRankIssueKeywords(
        {
          teamId: "team-001",
          startDate: new Date("2024-01-01T00:00:00Z"),
          endDate: new Date("2024-01-07T23:59:59Z"),
          minFrequencyThreshold: 1,
          requestUserId: "user-001",
        },
        mockTextAnalysisService
      );

      expect(result).resolves.toMatchObject({
        code: "INVALID_SCORE_TYPE",
        message: "影響度スコアは0～100の数値である必要があります",
        receivedType: type,
      });
    });
  });
});