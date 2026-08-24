import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking - Frequency Below Threshold', () => {
  // SCEN-1337: [edge] 課題キーワード自動抽出機能 - 課題キーワード発生頻度が閾値未満（例：4回）で下位ランクに分類される
  test('should classify keyword with frequency below threshold as low-rank issue', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続エラー',
          frequency: 3,
        },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 4,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: 'team-001',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
      })
    );

    expect(result.keywords).toHaveLength(0);
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(7);
    expect(typeof result.extractedAt).toBe('string');
  });
});