import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  test('SCEN-2240: reportDateが未定義の場合、エラーが発生する', () => {
    const reportWithoutDate = {
      userId: 'user001',
      yesterdayWork: 'タスクA完了',
      todayWork: 'タスクB実施',
      issues: '課題X',
      reportDate: undefined,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId: 'team-001',
          startDate: new Date('2024-01-08T00:00:00Z'),
          endDate: new Date('2024-01-14T23:59:59Z'),
          minFrequencyThreshold: 1,
          requestUserId: 'user-admin',
        },
        [reportWithoutDate as any],
        mockTextAnalysisAdapter
      )
    ).toThrow(/reportDate/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});