import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2930
  test('報告者ユーザーID が null のとき、処理を中断してエラーを返す', async () => {
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-123',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: null as any,
    };

    await expect(() =>
      extractAndRankIssueKeywords(input, stubTextAnalysisAdapter)
    ).rejects.toThrow(/reporterUserId/);

    expect(stubTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});