import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1722
  test('[error] 開始日が終了日より後の場合エラーになる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockImplementation((_keyword: string, _content: string, _startDate: Date, _endDate: Date) => {
        const start = new Date(_startDate);
        const end = new Date(_endDate);
        if (start > end) {
          const error = new Error('startDate must be before or equal to endDate');
          (error as any).code = 'INVALID_DATE_RANGE';
          throw error;
        }
        return { impactScore: 50 };
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-08-20T00:00:00Z'),
      endDate: new Date('2026-08-19T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/startDate must be before or equal to endDate/);
  });
});