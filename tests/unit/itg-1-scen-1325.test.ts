import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  test('SCEN-1325: キーワード発生頻度が負の数のとき処理を中止し例外を発生させる', async () => {
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: -5,
          },
        ],
        totalCount: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportingTexts = ['システム障害が発生。システム障害の対応を進めた'];

    await expect(
      extractAndRankIssueKeywords(input, reportingTexts, stubTextAnalysisAdapter)
    ).rejects.toThrow(/出現頻度|KeywordFrequencyValidationError|frequency|negative/i);
  });
});