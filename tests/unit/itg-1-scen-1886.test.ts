import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能', () => {
  // SCEN-1886
  test('日付開始日が日付終了日より後の日付のとき、エラーが返される', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-12-31T00:00:00Z'),
      endDate: new Date('2026-01-01T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/開始日/);
  });
});