import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題検索・ランク付け機能', () => {
  // SCEN-1892
  test('キーワードが最大文字数を超える長さのとき、入力値エラーが返される', () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';
    
    // 最大文字数を100文字と定義し、101文字のキーワードを入力
    const oversizedKeyword = 'a'.repeat(101);
    
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
      keyword: oversizedKeyword
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/最大文字数/);
  });
});