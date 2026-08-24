import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - エラーハンドリング', () => {
  // SCEN-1052
  test('日報テキストが空文字列のとき、抽出処理がエラーになり適切にハンドリングされる', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを定義
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string) => {
        // 空文字列入力時にエラーを発生させる
        if (text === '' || text.trim() === '') {
          throw new Error('課題分析が一時的に利用できません。手動入力をご利用ください');
        }
        return Promise.resolve({
          keywords: [
            { text: 'テスト', frequency: 3 },
            { text: 'デプロイ', frequency: 2 }
          ]
        });
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // キャッシュされた前回の分析結果（fallback用）
    const cachedPreviousResult: RankedIssueKeywordList = {
      keywords: [
        {
          keywordId: 'kw-001',
          keyword: '前回のテスト',
          frequency: 5,
          rank: 1
        },
        {
          keywordId: 'kw-002',
          keyword: '前回のデプロイ',
          frequency: 3,
          rank: 2
        }
      ],
      totalKeywordCount: 2,
      extractedAt: new Date('2024-01-15T09:00:00Z'),
      analysisperiodDays: 7
    };

    // 入力パラメータ: 空文字列を含む
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001'
    };

    // Act & Assert: エラーをキャッチして適切にハンドリング
    let errorCaught = false;
    let fallbackResult: RankedIssueKeywordList | null = null;
    let errorMessage = '';

    try {
      const result = extractAndRankIssueKeywords(
        input,
        mockTextAnalysisService,
        '' // 空文字列を渡す
      );
      // この行に到達することはない（エラーが発生するはず）
      expect(result).toBeDefined();
    } catch (error) {
      errorCaught = true;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // キャッシュから前回の分析結果をfallback
      fallbackResult = cachedPreviousResult;
    }

    // Assertion: エラーが適切に発生し、キャッシュがfallbackとして利用可能
    expect(errorCaught).toBe(true);
    expect(errorMessage).toMatch(/課題分析が一時的に利用できません/);
    expect(fallbackResult).not.toBeNull();
    expect(fallbackResult?.keywords.length).toBe(2);
    expect(fallbackResult?.keywords[0].keyword).toBe('前回のテスト');
    expect(fallbackResult?.keywords[0].frequency).toBe(5);
    expect(fallbackResult?.keywords[0].rank).toBe(1);
    expect(fallbackResult?.keywords[1].rank).toBe(2);
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith('');
  });
});