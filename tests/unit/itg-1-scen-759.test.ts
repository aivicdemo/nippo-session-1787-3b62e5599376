import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出と優先度順位付け', () => {
  // SCEN-759
  test('優先度スコアが負の数のとき、エラーを返す', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    const reportTexts = [
      'システム障害で業務が停止している',
      'システム障害の復旧に時間がかかった',
      'システム障害による納期遅延が発生',
    ];

    expect(
      async () =>
        await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportTexts),
    ).rejects.toThrow(/優先度スコア|負/);
  });
});