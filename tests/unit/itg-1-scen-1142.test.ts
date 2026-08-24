import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-1142
  test('チーム波及度スコアが-1のときは検証エラーになる', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue(-1),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const invalidScoreError = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    ).catch((error: Error) => error);

    expect(invalidScoreError).toBeInstanceOf(Error);
    expect(invalidScoreError.message).toMatch(
      /チーム波及度スコアは0以上100以下/,
    );
  });
});