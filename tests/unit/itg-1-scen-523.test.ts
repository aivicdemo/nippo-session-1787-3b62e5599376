import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking", () => {
  // SCEN-523: [normal] 課題自動抽出・優先度判定機能 - TextAnalysisServiceAdapterが正常応答した場合、抽出キーワードの発生頻度が正しく集計される
  test("should extract and rank issue keywords with correct frequency aggregation when adapter returns successfully", async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "サーバー", frequency: 3 },
          { keyword: "課題", frequency: 2 },
          { keyword: "対応", frequency: 1 },
        ],
        totalKeywordsExtracted: 3,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-21T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const sampleReportText =
      "昨日は販売資料の修正と顧客対応を実施。今日は新規提案資料の作成と打ち合わせ予定。課題：サーバーのパフォーマンス低下が続いており、サーバーのメモリ使用率が高い。サーバー環境の改善が急務。";

    const result: RankedIssueKeywordList =
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: "サーバー",
      frequency: 3,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: "課題",
      frequency: 2,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: "対応",
      frequency: 1,
      rank: 3,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      input.teamId,
      input.startDate,
      input.endDate,
      input.requestUserId
    );
  });
});