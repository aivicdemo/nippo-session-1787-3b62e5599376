import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1603
  test('should extract and rank issue keywords from multiple reports by frequency in descending order', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'API仕様の調査遅延', frequency: 2 },
        { keyword: 'デプロイ環境の準備不足', frequency: 2 },
        { keyword: 'テスト環境不安定', frequency: 1 },
      ]),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(3);

    expect(result.keywords[0]).toEqual({
      keyword: 'API仕様の調査遅延',
      frequency: 2,
      rank: 1,
      keywordId: expect.any(String),
    });

    expect(result.keywords[1]).toEqual({
      keyword: 'デプロイ環境の準備不足',
      frequency: 2,
      rank: 1,
      keywordId: expect.any(String),
    });

    expect(result.keywords[2]).toEqual({
      keyword: 'テスト環境不安定',
      frequency: 1,
      rank: 3,
      keywordId: expect.any(String),
    });

    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );
    expect(result.keywords[1].frequency).toBeGreaterThanOrEqual(
      result.keywords[2].frequency
    );

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      input.teamId,
      input.startDate,
      input.endDate
    );
  });
});