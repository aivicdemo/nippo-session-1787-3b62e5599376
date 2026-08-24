import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-1732: should throw error when keyword frequency is negative', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: async () => ({
        keywords: [
          {
            keyword: 'デバッグ困難',
            frequency: -5,
            context: 'API呼び出し時に予期しない結果',
          },
          {
            keyword: 'パフォーマンス低下',
            frequency: 3,
            context: 'データベースクエリが遅い',
          },
        ],
        totalKeywordCount: 2,
      }),
      assessImpactScore: async (keyword: string) => 45,
      classifyIssueSeverity: async (content: string) => 'high',
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/発生頻度は0以上である必要があります/);
  });
});