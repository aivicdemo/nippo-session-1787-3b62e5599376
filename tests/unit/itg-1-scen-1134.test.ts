import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - extractAndRankIssueKeywords', () => {
  // SCEN-1134
  test('should throw TypeError when extracted challenge data is null', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).toThrow(TypeError);

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).toThrow(/抽出課題データがnullまたは未定義/);
  });
});