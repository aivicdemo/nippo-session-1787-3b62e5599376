import { describe, it, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("extractAndRankIssueKeywords - チーム波及度スコア検証", () => {
  it("SCEN-1141: チーム波及度スコアが欠落している場合、検証エラーが発生する", async () => {
    // スタブの準備：TextAnalysisServiceAdapter の代役
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: "ネットワーク遅延",
          frequency: 3,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(null), // チーム波及度スコアが null
      classifyIssueSeverity: jest.fn().mockResolvedValue("高"),
    };

    // 入力データの準備
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    // 検証エラーが発生することを確認
    await expect(
      extractAndRankIssueKeywords(input, textAnalysisServiceStub)
    ).rejects.toThrow(/チーム波及度スコア/);
  });
});