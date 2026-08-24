import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・優先度判定機能", () => {
  // SCEN-541: [error] 課題キーワード自動抽出・優先度判定機能 - 発生頻度がnullまたはundefinedの場合、エラーを返す
  test("発生頻度がnullまたはundefinedの場合、適切なエラーを返す", async () => {
    const teamId = "team-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:00Z");
    const minFrequencyThreshold = 1;
    const requestUserId = "user-pm-001";

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Case 1: occurrence が null を返す場合
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValueOnce([
      {
        keyword: "API遅延",
        occurrence: null,
      },
    ]);

    const resultWithNull = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter
    );

    expect(resultWithNull).toEqual({
      success: false,
      errorCode: "ERR_OCCURRENCE_NULL",
      errorMessage: "課題キーワードの出現頻度が取得できません。手動入力をご利用ください",
    });

    // Case 2: occurrence が undefined を返す場合
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValueOnce([
      {
        keyword: "API遅延",
        occurrence: undefined,
      },
    ]);

    const resultWithUndefined = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter
    );

    expect(resultWithUndefined).toEqual({
      success: false,
      errorCode: "ERR_OCCURRENCE_UNDEFINED",
      errorMessage: "課題キーワードの出現頻度が取得できません。手動入力をご利用ください",
    });

    // extractKeywordsが2回呼び出されていることを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(
      2
    );
  });
});