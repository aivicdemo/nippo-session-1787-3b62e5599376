import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Prioritization - TextAnalysisServiceAdapter Classification Error Handling", () => {
  // SCEN-3078: [edge] OpenAI API GPT-5.6連携 - TextAnalysisServiceAdapterが想定外の分類値を受けた場合、高・中・低の定義済み値以外は業務結果として通らない

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject unexpected classification values and trigger retry logic, then fail after max retries", async () => {
    // Setup: Mock TextAnalysisServiceAdapter with invalid classification values
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "システム起動失敗", frequency: 5 },
          { keyword: "メモリ不足", frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce("critical")
        .mockResolvedValueOnce("urgent")
        .mockResolvedValueOnce("1"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-07T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-123",
    };

    // Execute: Call extractAndRankIssueKeywords with mock adapter
    let caughtError: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = await extractAndRankIssueKeywords(input, mockAdapter as any);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Adapter was called for classification (retried 3 times)
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);

    // Verify: Error should contain indication that classification is invalid
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/分類値が無効/);

    // Verify: Result should be null/undefined or indicate rejection
    expect(result).toBeNull();
  });

  test("should accept valid classification values and return ranked keywords", async () => {
    // Setup: Mock TextAnalysisServiceAdapter with valid classification values
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "データベース接続失敗", frequency: 8 },
          { keyword: "API応答遅延", frequency: 5 },
          { keyword: "メモリリーク", frequency: 3 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue("高"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-002",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 2,
      requestUserId: "user-456",
    };

    // Execute: Call extractAndRankIssueKeywords with valid mock adapter
    const result = await extractAndRankIssueKeywords(input, mockAdapter as any);

    // Verify: Result should be valid RankedIssueKeywordList
    expect(result).toBeTruthy();
    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].frequency).toBe(8);
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });

  test("should handle null classification value from adapter and fail gracefully", async () => {
    // Setup: Mock adapter returning null for classification
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: "ネットワーク障害", frequency: 4 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 60,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-003",
      startDate: new Date("2024-01-15T00:00:00Z"),
      endDate: new Date("2024-01-21T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-789",
    };

    // Execute: Call extractAndRankIssueKeywords
    let caughtError: Error | null = null;

    try {
      await extractAndRankIssueKeywords(input, mockAdapter as any);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Should retry 3 times and then fail
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/分類値が無効/);
  });

  test("should handle undefined classification value from adapter and fail gracefully", async () => {
    // Setup: Mock adapter returning undefined for classification
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: "認証エラー", frequency: 2 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 50,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-004",
      startDate: new Date("2024-01-22T00:00:00Z"),
      endDate: new Date("2024-01-28T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-101",
    };

    // Execute: Call extractAndRankIssueKeywords
    let caughtError: Error | null = null;

    try {
      await extractAndRankIssueKeywords(input, mockAdapter as any);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Should retry 3 times with exponential backoff (3s, 10s, 30s intervals)
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/分類値が無効/);
  });

  test("should handle empty string classification value from adapter and fail gracefully", async () => {
    // Setup: Mock adapter returning empty string for classification
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: "パフォーマンス低下", frequency: 6 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 70,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce("")
        .mockResolvedValueOnce(""),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-005",
      startDate: new Date("2024-01-29T00:00:00Z"),
      endDate: new Date("2024-02-04T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-202",
    };

    // Execute: Call extractAndRankIssueKeywords
    let caughtError: Error | null = null;

    try {
      await extractAndRankIssueKeywords(input, mockAdapter as any);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Should reject empty string and fail after retries
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/分類値が無効/);
  });

  test("should handle numeric string classification value from adapter and fail gracefully", async () => {
    // Setup: Mock adapter returning numeric string for classification
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [{ keyword: "セキュリティ脆弱性", frequency: 4 }],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 90,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce("1")
        .mockResolvedValueOnce("2")
        .mockResolvedValueOnce("3"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-006",
      startDate: new Date("2024-02-05T00:00:00Z"),
      endDate: new Date("2024-02-11T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-303",
    };

    // Execute: Call extractAndRankIssueKeywords
    let caughtError: Error | null = null;

    try {
      await extractAndRankIssueKeywords(input, mockAdapter as any);
    } catch (error) {
      caughtError = error as Error;
    }

    // Verify: Should reject numeric strings and fail after retries
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalledTimes(3);
    expect(caughtError).toBeTruthy();
    expect(caughtError?.message).toMatch(/分類値が無効/);
  });

  test("should succeed on third retry when adapter returns valid value", async () => {
    // Setup: Mock adapter that fails twice then succeeds on third try
    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "デプロイメント失敗", frequency: 7 },
          { keyword: "ビルドエラー", frequency: 4 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
      }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValueOnce("invalid_value")
        .mockResolvedValueOnce("高")
        .mockResolvedValueOnce("高"),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-007",
      startDate: new Date("2024-02-12T00:00:00Z"),
      endDate: new Date("2024-02-18T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-404",
    };

    // Execute: Call extractAndRankIssueKeywords
    const result = await extractAndRankIssueKeywords(input, mockAdapter as any);

    // Verify: Should succeed after retrying and getting valid value
    expect(mockAdapter.classifyIssueSeverity).toHaveBeenCalled();
    expect(result).toBeTruthy();
    expect(result.keywords).toHaveLength(1);
  });
});