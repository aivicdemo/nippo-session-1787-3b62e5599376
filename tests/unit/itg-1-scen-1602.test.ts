import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

interface TextAnalysisServiceAdapter {
  extractKeywords(text: string): Promise<Array<{ keyword: string; frequency: number }>>;
}

describe('課題キーワード自動抽出機能', () => {
  // SCEN-1602
  test('前週の日報1件から課題キーワードを抽出し、1つの課題が出現頻度とともに返される', async () => {
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async (text: string) => {
        if (text.includes('データベース接続タイムアウト')) {
          return [
            {
              keyword: 'データベース接続タイムアウト',
              frequency: 2,
            },
          ];
        }
        return [];
      },
    };

    const testReportContent =
      '昨日やったこと: バグ修正対応、今日やること: テスト実施、抱えている課題: データベース接続タイムアウトが頻発している';

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter as any
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース接続タイムアウト');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});