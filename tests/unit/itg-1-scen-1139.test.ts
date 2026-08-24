import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Frequency Validation', () => {
  // SCEN-1139: [error] 抽出課題データ有効性検証機能 - 出現頻度が負数のデータがあるとき検証エラーになる
  test('should throw validation error when extracted keywords contain negative frequency', async () => {
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '課題A', frequency: -5 },
          { keyword: '課題B', frequency: 3 },
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

    const reportText = '昨日は機能Aの実装を行いました。今日は機能Bの実装を予定しています。課題として機能Cのバグが発生しています';

    await expect(
      extractAndRankIssueKeywords(input, stubTextAnalysisServiceAdapter, reportText)
    ).rejects.toThrow(/出現頻度|INVALID_FREQUENCY_NEGATIVE/);
  });
});