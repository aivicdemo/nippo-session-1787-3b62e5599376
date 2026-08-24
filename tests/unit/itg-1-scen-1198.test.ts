import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能 - 信頼度スコア基準値直下の警告表示', () => {
  // SCEN-1198
  test('信頼度スコアが49.9の課題は警告フラグと警告メッセージ付きで返される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            text: 'データベース接続がタイムアウトする',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(49.9),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportTexts = [
      '昨日やったこと: DBクエリ最適化\n今日やること: レポート機能実装\n抱えている課題: データベース接続がタイムアウトする',
      '昨日やったこと: テスト実施\n今日やること: バグ修正\n抱えている課題: データベース接続がタイムアウトする',
      '昨日やったこと: ドキュメント作成\n今日やること: コードレビュー\n抱えている課題: データベース接続がタイムアウトする',
    ];

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      reportTexts
    );

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続がタイムアウトする',
      frequency: 3,
      rank: 1,
      confidenceScore: 49.9,
      isLowConfidence: true,
      warningMessage: expect.stringContaining('信頼度がスコア基準値'),
    });
    expect(result.keywords[0].warningMessage).toContain('50以上');
    expect(result.keywords[0].warningMessage).toContain('49.9');
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisPeriodDays).toBe(7);
  });
});