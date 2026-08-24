import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2932
  test('[error] TextAnalysisServiceAdapter.extractKeywords が失敗したとき、キャッシュから前回結果を取得し、新規日報は手動入力に切り替える', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // キャッシュに前回の分析結果を準備
    const cachedPreviousResult: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'kw-001',
          keyword: 'データベース接続',
          frequency: 3,
          rank: 1,
        },
        {
          keywordId: 'kw-002',
          keyword: 'パフォーマンス改善',
          frequency: 2,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-14T09:00:00Z'),
      analysisperiodDays: 7,
    };

    // 入力データを準備
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act: extractAndRankIssueKeywords を呼び出す
    // TextAnalysisServiceAdapter が 3 回失敗し、キャッシュから前回結果を返す想定
    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      cachedPreviousResult
    );

    // Assert: 検証内容
    // 1. API 呼び出しが 3 回試行されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // 2. キャッシュから前回結果が返されたことを確認
    expect(result).toEqual({
      keywords: [
        {
          keywordId: 'kw-001',
          keyword: 'データベース接続',
          frequency: 3,
          rank: 1,
        },
        {
          keywordId: 'kw-002',
          keyword: 'パフォーマンス改善',
          frequency: 2,
          rank: 2,
        },
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-14T09:00:00Z'),
      analysisperiodDays: 7,
    });

    // 3. 結果に isFromCache フラグがあれば確認
    expect((result as any).isFromCache).toBe(true);

    // 4. エラーメッセージ情報が含まれていることを確認
    expect((result as any).errorMessage).toMatch(/課題分析が一時的に利用できません/);

    // 5. 新規日報用の手動入力フラグが設定されていることを確認
    expect((result as any).requiresManualInput).toBe(true);
  });
});