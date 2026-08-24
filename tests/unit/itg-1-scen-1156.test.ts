import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題データ有効性検証機能 - 重複排除ロジック', () => {
  // SCEN-1156
  test('抽出課題の重複排除時に、1文字異なるキーワードは別件として分類される', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'データベース接続',
          frequency: 2,
        },
        {
          keyword: 'データベース接続エラー',
          frequency: 1,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any,
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe('データベース接続');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('データベース接続エラー');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});