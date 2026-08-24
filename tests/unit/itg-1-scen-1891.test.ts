import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1891
  test('[error] 課題検索・ランク付け機能 - 日付終了日の値が不正なフォーマット（ISO 8601形式でない）のとき、フォーマットエラーが返される', () => {
    const invalidEndDateValues = [
      '2026-08-19',
      '2026/08/19',
      '20260819',
      '2026-08-19 10:30:00',
      '08-19-2026',
    ];

    invalidEndDateValues.forEach((invalidEndDate) => {
      const input = {
        teamId: 'team-001',
        startDate: new Date('2026-08-12T00:00:00.000Z'),
        endDate: invalidEndDate as any,
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      };

      expect(() => extractAndRankIssueKeywords(input)).toThrow(/ISO 8601/);
    });
  });
});