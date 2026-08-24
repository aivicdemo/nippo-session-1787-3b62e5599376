import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - チームメンバーID検証', () => {
  // SCEN-748
  test('チームメンバーIDがundefinedのとき、INVALID_MEMBER_IDエラーを返す', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: undefined as any,
    };

    expect(() => 
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).toThrow(/チームメンバーID/);

    expect(mockTextAnalysisService.extractKeywords).not.toHaveBeenCalled();
  });
});