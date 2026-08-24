import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication and Normalization', () => {
  // SCEN-2232: [normal] 課題の重複検出と正規化 - 集約・抽出処理を同じ入力データで2回実行した場合、両回とも同じ正規化リストが生成される

  it('should produce identical normalized keyword lists when extraction is performed twice on the same input data', () => {
    // Arrange: テスト用の入力データセット（同一の日報テキスト3件）を準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // 決定論的な結果を返すようにモック化
        const keywords = [
          { keyword: 'database_connection_timeout', frequency: 3 },
          { keyword: 'データベース接続タイムアウト', frequency: 3 },
          { keyword: 'DB timeout', frequency: 3 },
          { keyword: 'bug_fix_completed', frequency: 1 },
          { keyword: 'feature_development_started', frequency: 1 }
        ];
        return Promise.resolve(keywords);
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'database_connection_timeout': 85,
          'データベース接続タイムアウト': 85,
          'DB timeout': 85,
          'bug_fix_completed': 40,
          'feature_development_started': 45
        };
        return Promise.resolve(scoreMap[keyword] || 50);
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        if (text.includes('timeout') || text.includes('タイムアウト')) {
          return Promise.resolve('高');
        }
        return Promise.resolve('中');
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:00Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001'
    };

    // Act: 1回目の実行
    let firstRunResult: RankedIssueKeywordList | null = null;
    extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
      .then((result) => {
        firstRunResult = result;
      });

    // Wait for first run to complete
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        // Act: 2回目の実行（同じ入力データで再度実行）
        mockTextAnalysisServiceAdapter.extractKeywords.mockClear();
        mockTextAnalysisServiceAdapter.assessImpactScore.mockClear();
        mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockClear();

        // Restore the same mock behavior
        mockTextAnalysisServiceAdapter.extractKeywords.mockImplementation((text: string) => {
          const keywords = [
            { keyword: 'database_connection_timeout', frequency: 3 },
            { keyword: 'データベース接続タイムアウト', frequency: 3 },
            { keyword: 'DB timeout', frequency: 3 },
            { keyword: 'bug_fix_completed', frequency: 1 },
            { keyword: 'feature_development_started', frequency: 1 }
          ];
          return Promise.resolve(keywords);
        });

        mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation((keyword: string) => {
          const scoreMap: Record<string, number> = {
            'database_connection_timeout': 85,
            'データベース接続タイムアウト': 85,
            'DB timeout': 85,
            'bug_fix_completed': 40,
            'feature_development_started': 45
          };
          return Promise.resolve(scoreMap[keyword] || 50);
        });

        mockTextAnalysisServiceAdapter.classifyIssueSeverity.mockImplementation((text: string) => {
          if (text.includes('timeout') || text.includes('タイムアウト')) {
            return Promise.resolve('高');
          }
          return Promise.resolve('中');
        });

        const secondRunResult = await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

        // Assert: 1回目と2回目の正規化リストが完全に一致することを検証
        if (!firstRunResult) {
          throw new Error('First run result is null');
        }

        // キーワード数が同じ
        expect(secondRunResult.keywords.length).toBe(firstRunResult.keywords.length);

        // 各キーワードの内容が同じ順序で一致
        secondRunResult.keywords.forEach((keyword, index) => {
          const firstKeyword = firstRunResult!.keywords[index];
          expect(keyword.keyword).toBe(firstKeyword.keyword);
          expect(keyword.frequency).toBe(firstKeyword.frequency);
          expect(keyword.rank).toBe(firstKeyword.rank);
          expect(keyword.keywordId).toBe(firstKeyword.keywordId);
        });

        // 全体の集計数が同じ
        expect(secondRunResult.totalKeywordCount).toBe(firstRunResult.totalKeywordCount);

        // 分析期間の日数が同じ
        expect(secondRunResult.analysisperiodDays).toBe(firstRunResult.analysisperiodDays);

        resolve();
      }, 100);
    });
  });
});