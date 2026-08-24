import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  let mockTextAnalysisService: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisService = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-829
  test('TextAnalysisServiceAdapterが正常応答した場合、抽出されたキーワードが発生頻度でランク付けされる', async () => {
    const mockExtractedKeywords = {
      keywords: [
        { word: '障害', frequency: 5 },
        { word: 'デバッグ', frequency: 3 },
        { word: 'テスト', frequency: 7 },
      ],
    };

    mockTextAnalysisService.extractKeywords.mockResolvedValue(mockExtractedKeywords);

    const reportText =
      '障害が発生した。デバッグを進めた。テストを実施。テストで障害を発見。テストの課題が残っている。テスト対応で障害対応。障害テスト実施。障害分析中。テスト継続';

    const result = await extractAndRankIssueKeywords(
      {
        teamId: 'team-001',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
        minFrequencyThreshold: 1,
        requestUserId: 'user-123',
      },
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'テスト',
      frequency: 7,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '障害',
      frequency: 5,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'デバッグ',
      frequency: 3,
      rank: 3,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(expect.any(Date));
    expect(result.analysisPeriodDays).toBe(7);
  });
});