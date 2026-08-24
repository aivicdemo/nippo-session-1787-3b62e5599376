import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1721
  test('対象期間の終了日が無効な日付形式のとき集約処理がエラーになる', async () => {
    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-13-45'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(async () => {
      await extractAndRankIssueKeywords(invalidInput);
    }).rejects.toThrow(/無効な形式/);
  });
});