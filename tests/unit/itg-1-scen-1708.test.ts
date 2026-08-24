import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-1708
  test("should extract and rank issue keywords from multiple prior week reports with frequency aggregation", async () => {
    const teamId = "team-001";
    const requestUserId = "user-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        if (text.includes("API応答遅延")) {
          return Promise.resolve({
            keywords: [
              { keyword: "API応答遅延", frequency: 1 },
              { keyword: "リソース不足", frequency: 1 },
            ],
          });
        }
        if (text.includes("データベース接続タイムアウト")) {
          return Promise.resolve({
            keywords: [{ keyword: "データベース接続", frequency: 1 }],
          });
        }
        if (text.includes("API応答遅延") && text.includes("サーバーリソース不足")) {
          return Promise.resolve({
            keywords: [
              { keyword: "API応答遅延", frequency: 1 },
              { keyword: "リソース不足", frequency: 1 },
            ],
          });
        }
        return Promise.resolve({ keywords: [] });
      }),
      assessImpactScore: jest
        .fn()
        .mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: "high" }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const apiResponseDelayKeyword = result.keywords.find(
      (k) => k.keyword === "API応答遅延"
    );
    const databaseConnectionKeyword = result.keywords.find(
      (k) => k.keyword === "データベース接続"
    );
    const resourceShortageKeyword = result.keywords.find(
      (k) => k.keyword === "リソース不足"
    );

    expect(apiResponseDelayKeyword).toBeDefined();
    expect(apiResponseDelayKeyword?.frequency).toBe(2);
    expect(apiResponseDelayKeyword?.rank).toBe(1);

    expect(databaseConnectionKeyword).toBeDefined();
    expect(databaseConnectionKeyword?.frequency).toBe(1);
    expect(databaseConnectionKeyword?.rank).toBe(2);

    expect(resourceShortageKeyword).toBeDefined();
    expect(resourceShortageKeyword?.frequency).toBe(1);
    expect(resourceShortageKeyword?.rank).toBe(2);

    expect(result.totalKeywordCount).toBe(4);

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(result.keywords.every((k) => k.keywordId)).toBe(true);
    expect(result.keywords.every((k) => typeof k.rank === "number")).toBe(
      true
    );

    const sortedByFrequency = [...result.keywords].sort(
      (a, b) => b.frequency - a.frequency
    );
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1]?.frequency || 0
    );
  });
});