import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - TextAnalysisServiceAdapter タイムアウトエラー伝播', () => {
  // SCEN-2995
  test('TextAnalysisServiceAdapter の extractKeywords がタイムアウトしたときエラーが正しく伝播される', async () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const timeoutError = new Error('課題分析が一時的に利用できません。手動入力をご利用ください');
            timeoutError.name = 'TimeoutError';
            reject(timeoutError);
          }, 31000);
        });
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    try {
      jest.useFakeTimers();
      const promise = extractAndRankIssueKeywords(input, textAnalysisServiceAdapterStub);
      jest.advanceTimersByTime(31000);
      await promise;
      fail('TimeoutError should have been thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.name).toBe('TimeoutError');
        expect(error.message).toMatch(/課題分析が一時的に利用できません/);
      }
    } finally {
      jest.useRealTimers();
    }

    expect(textAnalysisServiceAdapterStub.extractKeywords).toHaveBeenCalledTimes(1);
  });
});