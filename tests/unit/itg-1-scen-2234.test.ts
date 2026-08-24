import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

// Mock for TextAnalysisServiceAdapter
interface MockTextAnalysisServiceAdapter {
  extractKeywords: jest.Mock;
  assessImpactScore: jest.Mock;
  classifyIssueSeverity: jest.Mock;
}

describe('extractAndRankIssueKeywords - Issue keyword extraction and ranking', () => {
  // SCEN-2234
  test('should throw error when input daily reports array is null', async () => {
    const mockTextAnalysisAdapter: MockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 3 },
          { keyword: 'performance', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    // Pass null as dailyReportsArray (simulating the error condition)
    expect(() => {
      extractAndRankIssueKeywords(
        null as any,
        invalidInput,
        mockTextAnalysisAdapter as any
      );
    }).toThrow(/入力値/);
  });
});