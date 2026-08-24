import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-753: [error] 課題自動抽出・優先度判定機能 - 発生頻度がnullのとき、エラーを返す
  test('発生頻度がnullのときにエラーを返す', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: null,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = 'システムAの障害が発生している';

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/発生頻度/);
    expect(result).not.toHaveProperty('keywords');
    expect(result).not.toHaveProperty('totalKeywordCount');
    expect(result).not.toHaveProperty('extractedAt');
    expect(result).not.toHaveProperty('analysisperiodDays');
  });
});