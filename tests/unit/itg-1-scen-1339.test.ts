import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-1339
  test('複数日報から同一キーワードが重複出現した場合、重複を含めて総発生回数で集計される', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('デバッグ') && text.includes('テスト') && text.includes('原因特定中')) {
          // 1日目の日報: データベース接続エラーが2回出現
          return Promise.resolve([
            { keyword: 'データベース接続エラー', frequency: 2 }
          ]);
        } else if (text.includes('テスト実施') && text.includes('本番環境確認') && text.includes('メモリリーク対応')) {
          // 2日目の日報: データベース接続エラーが3回、メモリリークが1回出現
          return Promise.resolve([
            { keyword: 'データベース接続エラー', frequency: 3 },
            { keyword: 'メモリリーク', frequency: 1 }
          ]);
        }
        return Promise.resolve([]);
      })
    };

    const input1: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const input2: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-16T00:00:00Z'),
      endDate: new Date('2024-01-16T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const reportText1 = '昨日やったこと：デバッグ。今日やること：テスト。抱えている課題：データベース接続エラーが発生。データベース接続エラーの原因特定中。';
    const reportText2 = '昨日やったこと：テスト実施。今日やること：本番環境確認。抱えている課題：データベース接続エラーが再発。データベース接続エラーと関連するメモリリークを検出。メモリリーク対応予定。';

    return Promise.all([
      extractAndRankIssueKeywords(input1, mockTextAnalysisAdapter, reportText1),
      extractAndRankIssueKeywords(input2, mockTextAnalysisAdapter, reportText2)
    ]).then(([result1, result2]: [RankedIssueKeywordList, RankedIssueKeywordList]) => {
      // 1日目の結果確認
      expect(result1.keywords).toHaveLength(1);
      expect(result1.keywords[0].keyword).toBe('データベース接続エラー');
      expect(result1.keywords[0].frequency).toBe(2);
      expect(result1.keywords[0].rank).toBe(1);
      expect(result1.totalKeywordCount).toBe(1);

      // 2日目の結果確認
      expect(result2.keywords).toHaveLength(2);
      // 発生頻度が高い順にソートされているはず（降順）
      expect(result2.keywords[0].keyword).toBe('データベース接続エラー');
      expect(result2.keywords[0].frequency).toBe(3);
      expect(result2.keywords[0].rank).toBe(1);
      expect(result2.keywords[1].keyword).toBe('メモリリーク');
      expect(result2.keywords[1].frequency).toBe(1);
      expect(result2.keywords[1].rank).toBe(2);
      expect(result2.totalKeywordCount).toBe(2);

      // 複数日報をマージした集計結果の期待値
      // データベース接続エラー: 1日目2回 + 2日目3回 = 5回
      // メモリリーク: 2日目1回 = 1回
      const mergedFrequencyDatabase = result1.keywords[0].frequency + result2.keywords[0].frequency;
      const mergedFrequencyMemory = result2.keywords[1].frequency;

      expect(mergedFrequencyDatabase).toBe(5);
      expect(mergedFrequencyMemory).toBe(1);
    });
  });
});