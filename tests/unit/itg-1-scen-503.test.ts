import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-503: [error] 課題自動抽出・優先度判定機能 - チーム ID が null のときエラーになる
  test('should throw validation error when teamId is null', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: null as any,
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/teamId/);
  });
});