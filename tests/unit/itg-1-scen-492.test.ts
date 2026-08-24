import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("extractAndRankIssueKeywords - TextAnalysisServiceAdapter timeout and retry", () => {
  test("SCEN-492: extractKeywords timeout triggers exponential backoff retry (3s, 10s, 30s) and succeeds on final attempt", async () => {
    const call_count_tracker = { count: 0 };
    const start_time = Date.now();

    const mock_adapter = {
      extractKeywords: jest.fn(async () => {
        call_count_tracker.count += 1;
        const attempt = call_count_tracker.count;

        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const timeout_error = new Error("API timeout");
          (timeout_error as any).code = "ECONNABORTED";
          throw timeout_error;
        }

        if (attempt === 2) {
          await new Promise((resolve) => setTimeout(resolve, 3100));
          const timeout_error = new Error("API timeout");
          (timeout_error as any).code = "ECONNABORTED";
          throw timeout_error;
        }

        if (attempt === 3) {
          await new Promise((resolve) => setTimeout(resolve, 10100));
          const timeout_error = new Error("API timeout");
          (timeout_error as any).code = "ECONNABORTED";
          throw timeout_error;
        }

        if (attempt === 4) {
          await new Promise((resolve) => setTimeout(resolve, 30100));
          return {
            keywords: ["データベース接続"],
            frequency: 1,
            extractedAt: "2024-01-15T09:30:00.000Z",
          };
        }

        throw new Error("Unexpected attempt count");
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-123",
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-15T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-456",
    };

    const report_texts = [
      "昨日は機能A開発、今日は機能B開発、課題：データベース接続が遅い",
    ];

    const result = await extractAndRankIssueKeywords(
      input,
      report_texts,
      mock_adapter as any
    );

    const elapsed_ms = Date.now() - start_time;

    expect(result).toEqual({
      keywords: [
        {
          keywordId: expect.any(String),
          keyword: "データベース接続",
          frequency: 1,
          rank: 1,
        },
      ],
      totalKeywordCount: 1,
      extractedAt: expect.any(Date),
      analysisperiodDays: 1,
    } as RankedIssueKeywordList);

    expect(call_count_tracker.count).toBe(4);

    expect(result.keywords[0].keyword).toBe("データベース接続");
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);

    expect(elapsed_ms).toBeGreaterThanOrEqual(43200);

    expect(mock_adapter.extractKeywords).toHaveBeenCalledTimes(4);
  });
});