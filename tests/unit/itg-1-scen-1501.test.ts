import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - extractAndRankIssueKeywords', () => {
  // SCEN-1501: [edge] 課題キーワード自動抽出・頻度ランク付け機能 - 前週7日間の日報から抽出したキーワードが発生頻度の降順で正確にランク付けされる
  test('should extract and rank issue keywords by frequency in descending order from 7-day report data', () => {
    // Arrange: モック化されたTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        'API呼び出し遅延': 7,
        'デプロイ失敗': 2,
        'ネットワーク接続': 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト用の7日分の日報データセット
    const reportDataset = [
      // 月曜日
      { date: new Date('2024-01-08'), challenges: ['API呼び出し遅延', 'デプロイ失敗'] },
      // 火曜日
      { date: new Date('2024-01-09'), challenges: ['API呼び出し遅延', 'ネットワーク接続'] },
      // 水曜日
      { date: new Date('2024-01-10'), challenges: ['API呼び出し遅延'] },
      // 木曜日
      { date: new Date('2024-01-11'), challenges: ['API呼び出し遅延', 'デプロイ失敗'] },
      // 金曜日
      { date: new Date('2024-01-12'), challenges: ['API呼び出し遅延'] },
      // 土曜日
      { date: new Date('2024-01-13'), challenges: ['API呼び出し遅延'] },
      // 日曜日
      { date: new Date('2024-01-14'), challenges: ['API呼び出し遅延'] },
    ];

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // Act: extractAndRankIssueKeywordsを呼び出す
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportDataset.flatMap(report => report.challenges)
    );

    // Assert: 頻度の降順でランク付けされていることを検証
    expect(result.keywords).toHaveLength(3);

    // 第1位: API呼び出し遅延（頻度7回）
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'API呼び出し遅延',
      frequency: 7,
      rank: 1,
    });

    // 第2位: デプロイ失敗（頻度2回）
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: 'デプロイ失敗',
      frequency: 2,
      rank: 2,
    });

    // 第3位: ネットワーク接続（頻度1回）
    expect(result.keywords[2]).toEqual({
      keywordId: expect.any(String),
      keyword: 'ネットワーク接続',
      frequency: 1,
      rank: 3,
    });

    // 全キーワード数を検証（フィルタ前）
    expect(result.totalKeywordCount).toBe(3);

    // 分析対象期間の日数を検証
    expect(result.analysisperiodDays).toBe(7);

    // 抽出実行日時が記録されていることを検証
    expect(result.extractedAt).toBeInstanceOf(Date);

    // モック呼び出しが期待通りに実行されたことを検証
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});