import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1184
  test('抽出キーワードの発生頻度が null のとき処理がエラーになる', async () => {
    const reportText = 'システムが遅い。システムエラーが多い。システム改善が必要';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter: Partial<TextAnalysisServiceAdapter> = {
      extractKeywords: jest.fn(async () => {
        return [
          {
            keyword: 'システム',
            frequency: null,
            rank: undefined,
          },
        ];
      }),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as TextAnalysisServiceAdapter
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    expect(result).toMatchObject({
      error: expect.stringMatching(/分析/),
    });
  });
});