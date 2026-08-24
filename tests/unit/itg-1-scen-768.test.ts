import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - extractAndRankIssueKeywords', () => {
  // SCEN-768
  test('正規化対象の課題テキストがnullのとき、エラーを返す', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
      normalizeIssueText: jest.fn().mockReturnValue(null)
    };

    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).toThrow(/nullまたは不正な形式/);
  });
});