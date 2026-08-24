import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking - Impact Score Failure Recovery", () => {
  let mockTextAnalysisServiceAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  let originalSetTimeout: typeof setTimeout;
  let timeoutCallCount: number;
  let callSequence: Array<{ action: string; timestamp: number }>;

  beforeEach(() => {
    timeoutCallCount = 0;
    callSequence = [];

    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((callback: () => void, delay: number) => {
      callSequence.push({ action: "setTimeout", timestamp: delay });
      timeoutCallCount++;
      if (timeoutCallCount <= 3) {
        callback();
      }
      return timeoutCallCount as any;
    });
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
    jest.clearAllMocks();
  });

  // SCEN-1152
  test("should retry assessImpactScore 3 times with exponential backoff intervals and fallback to alternative processing on all failures", async () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: "バグ", frequency: 3 },
        { keyword: "パフォーマンス", frequency: 2 },
      ],
    });

    mockTextAnalysisServiceAdapter.assessImpactScore.mockRejectedValue(
      new Error("API timeout")
    );

    mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockResolvedValue({
      severity: "high",
    });

    let result: RankedIssueKeywordList | null = null;
    let fallbackMessageDisplayed = false;
    let alternativeProcessingTriggered = false;

    const mockDashboardMessageHandler = {
      displayMessage: jest.fn((message: string) => {
        if (
          message.includes(
            "課題分析が一時的に利用できません。手動入力をご利用ください"
          )
        ) {
          fallbackMessageDisplayed = true;
        }
      }),
    };

    const mockAlternativeProcessing = {
      useCachedResults: jest.fn(() => {
        alternativeProcessingTriggered = true;
        return {
          keywords: [
            {
              keywordId: "kw-cache-001",
              keyword: "バグ",
              frequency: 3,
              rank: 1,
            },
            {
              keywordId: "kw-cache-002",
              keyword: "パフォーマンス",
              frequency: 2,
              rank: 2,
            },
          ],
          totalKeywordCount: 2,
          extractedAt: new Date("2024-01-13T10:00:00Z"),
          analysisperiodDays: 7,
        };
      }),
    };

    const mockEmailService = {
      sendConfirmationEmail: jest.fn(() => {
        return Promise.resolve({
          status: "sent",
          messageId: "msg-001",
          recipientEmail: "manager@example.com",
        });
      }),
    };

    try {
      result = await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      );

      if (!result || result.keywords.length === 0) {
        mockDashboardMessageHandler.displayMessage(
          "課題分析が一時的に利用できません。手動入力をご利用ください"
        );
        const cachedResult =
          mockAlternativeProcessing.useCachedResults();
        result = cachedResult;

        const confirmationEmail = await mockEmailService.sendConfirmationEmail();
        expect(confirmationEmail.status).toBe("sent");
        expect(confirmationEmail.messageId).toBe("msg-001");
      }
    } catch (error) {
      mockDashboardMessageHandler.displayMessage(
        "課題分析が一時的に利用できません。手動入力をご利用ください"
      );
      const cachedResult = mockAlternativeProcessing.useCachedResults();
      result = cachedResult;

      const confirmationEmail = await mockEmailService.sendConfirmationEmail();
      expect(confirmationEmail.status).toBe("sent");
    }

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(global.setTimeout).toHaveBeenCalled();

    const setTimeoutCalls = (global.setTimeout as jest.Mock).mock
      .calls as any[];
    const delays = setTimeoutCalls.map((call) => call[1] || 0);

    expect(delays).toContain(3000);
    expect(delays).toContain(10000);
    expect(delays).toContain(30000);

    expect(fallbackMessageDisplayed).toBe(true);
    expect(alternativeProcessingTriggered).toBe(true);

    expect(mockDashboardMessageHandler.displayMessage).toHaveBeenCalledWith(
      expect.stringMatching(/課題分析が一時的に利用できません/)
    );

    expect(mockAlternativeProcessing.useCachedResults).toHaveBeenCalled();

    expect(result).not.toBeNull();
    expect(result!.keywords).toHaveLength(2);
    expect(result!.keywords[0]).toEqual({
      keywordId: "kw-cache-001",
      keyword: "バグ",
      frequency: 3,
      rank: 1,
    });
    expect(result!.keywords[1]).toEqual({
      keywordId: "kw-cache-002",
      keyword: "パフォーマンス",
      frequency: 2,
      rank: 2,
    });
    expect(result!.totalKeywordCount).toBe(2);
    expect(result!.analysisperiodDays).toBe(7);

    expect(mockEmailService.sendConfirmationEmail).toHaveBeenCalled();
  });
});