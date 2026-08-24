import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアリング', () => {
  // SCEN-761: [error] 課題自動抽出・優先度判定機能 - 優先度スコアがundefinedのとき、エラーを返す
  test('priorityScoreがundefinedの場合、TypeError例外をスローする', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システムタイムアウト', frequency: 5 },
          { keyword: 'パフォーマンス低下', frequency: 3 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue(undefined),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/priorityScore|undefined/i);
  });
});