import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-837
  test('TextAnalysisServiceAdapterのextractKeywordsが失敗したときキャッシュから前回結果を返す振る舞いになる', async () => {
    // モック用のTextAnalysisServiceAdapter
    let callCount = 0;
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        throw new Error('Network error: API call failed');
      }),
      assessImpactScore: jest.fn(async () => 0),
      classifyIssueSeverity: jest.fn(async () => 'low'),
    };

    // キャッシュに前回の分析結果を保存
    const cachedKeywords = {
      keywords: [
        { keywordId: 'kw-001', keyword: 'バグ', frequency: 5, rank: 1 },
        { keywordId: 'kw-002', keyword: 'パフォーマンス', frequency: 3, rank: 2 },
        { keywordId: 'kw-003', keyword: '設計', frequency: 2, rank: 3 },
      ],
      totalKeywordCount: 3,
      extractedAt: new Date('2024-01-15T08:00:00Z'),
      analysisperiodDays: 7,
    };

    const mockCache = {
      get: jest.fn((key: string) => {
        if (key === 'issue_keywords_cache') {
          return cachedKeywords;
        }
        return null;
      }),
      set: jest.fn(),
    };

    // 入力データ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 日報テキスト（新規）
    const reportTexts = [
      '昨日はバグ修正、今日もバグ対応予定、課題は納期',
    ];

    // 関数を呼び出す
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      mockCache,
      reportTexts
    );

    // API呼び出しの再試行確認（3回失敗することを検証）
    // 再試行間隔: 3秒・10秒・30秒なので、最大で3回試行される
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // キャッシュから前回の結果が返却されることを検証
    expect(result).toEqual(cachedKeywords);
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0]).toEqual({
      keywordId: 'kw-001',
      keyword: 'バグ',
      frequency: 5,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keywordId: 'kw-002',
      keyword: 'パフォーマンス',
      frequency: 3,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keywordId: 'kw-003',
      keyword: '設計',
      frequency: 2,
      rank: 3,
    });
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toEqual(new Date('2024-01-15T08:00:00Z'));
    expect(result.analysisperiodDays).toBe(7);

    // キャッシュ参照を検証
    expect(mockCache.get).toHaveBeenCalledWith('issue_keywords_cache');
  });
});