import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1716
  test('[error] 日報データが空文字列のとき抽出処理がエラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation((text: string) => {
        if (text === '') {
          const error = new Error('Validation failed: empty input text');
          (error as any).name = 'ValidationError';
          throw error;
        }
        return Promise.resolve([
          { keyword: 'テスト', frequency: 1 },
        ]);
      }),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const emptyReportContent = '';

    let thrownError: Error | null = null;
    let result: RankedIssueKeywordList | null = null;

    try {
      result = await extractAndRankIssueKeywords(
        input,
        emptyReportContent,
        mockTextAnalysisServiceAdapter,
      );
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/Validation|empty/i);
    expect(result).toBeNull();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith('');
  });
});