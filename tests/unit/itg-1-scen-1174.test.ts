import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・ランク付け機能", () => {
  // SCEN-1174
  test("日報から複数の課題キーワードが抽出された場合、すべてが発生頻度順にランク付けされて返される", () => {
    // Arrange
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keyword1: 5,
        keyword2: 3,
        keyword3: 8,
        keyword4: 2,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportDate1 = new Date("2024-01-15T09:00:00Z");
    const reportDate2 = new Date("2024-01-14T09:00:00Z");

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-15T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    // Act
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert
    expect(result.keywords).toHaveLength(4);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: "keyword3",
      frequency: 8,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: "keyword1",
      frequency: 5,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: "keyword2",
      frequency: 3,
      rank: 3,
    });
    expect(result.keywords[3]).toEqual({
      keywordId: expect.any(String),
      keyword: "keyword4",
      frequency: 2,
      rank: 4,
    });

    expect(result.totalKeywordCount).toBe(4);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(8);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});