import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1195
  test('ランク付けの対象キーワード配列が null のときエラーになる', async () => {
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: null,
        totalCount: 0,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 50,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    await expect(
      extractAndRankIssueKeywords(input, stubTextAnalysisServiceAdapter)
    ).rejects.toThrow(/null|keywords|Cannot read/i);
  });
});