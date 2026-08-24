import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  let mockTextAnalysisAdapter: any;

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1204: 発生頻度の降順でソートされた課題一覧において、最初の課題と最後の課題の発生頻度差が最大（降順が逆転していない）
  test('should return issue keywords ranked by frequency in descending order with maximum difference between first and last', async () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const mockExtractedKeywords = [
      {
        keywordId: 'keyword-001',
        keyword: 'API障害',
        frequency: 150,
      },
      {
        keywordId: 'keyword-002',
        keyword: 'デプロイ遅延',
        frequency: 85,
      },
      {
        keywordId: 'keyword-003',
        keyword: 'ドキュメント不足',
        frequency: 30,
      },
    ];

    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue(
      mockExtractedKeywords,
    );

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Act
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    // 最初の要素が最高頻度のキーワード『API障害』で頻度150であることを確認
    expect(result.keywords[0].keyword).toBe('API障害');
    expect(result.keywords[0].frequency).toBe(150);
    expect(result.keywords[0].rank).toBe(1);

    // 最後の要素が最低頻度のキーワード『ドキュメント不足』で頻度30であることを確認
    expect(result.keywords[2].keyword).toBe('ドキュメント不足');
    expect(result.keywords[2].frequency).toBe(30);
    expect(result.keywords[2].rank).toBe(3);

    // 最初と最後の発生頻度の差分が120（0以上）であることを確認
    const frequencyDifference =
      result.keywords[0].frequency - result.keywords[2].frequency;
    expect(frequencyDifference).toBe(120);
    expect(frequencyDifference).toBeGreaterThanOrEqual(0);

    // 全要素について隣接する2つの要素間で降順が逆転していないことを確認
    for (let i = 0; i < result.keywords.length - 1; i++) {
      const currentFrequency = result.keywords[i].frequency;
      const nextFrequency = result.keywords[i + 1].frequency;
      expect(currentFrequency).toBeGreaterThanOrEqual(nextFrequency);
    }

    // 期待される順序を確認（150 ≥ 85 ≥ 30）
    expect(result.keywords[0].frequency).toBe(150);
    expect(result.keywords[1].frequency).toBe(85);
    expect(result.keywords[2].frequency).toBe(30);

    // totalKeywordCount と extractedAt が正しく設定されていることを確認
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);

    // analysisPeriodDays が正しく計算されていることを確認（1月1日から1月7日の7日間）
    expect(result.analysisperiodDays).toBe(7);
  });
});