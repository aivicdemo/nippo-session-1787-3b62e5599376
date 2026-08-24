import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-485
  test('日報集約データが null のときエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const nullAggregatedReports = null as any;

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() => {
      extractAndRankIssueKeywords(input, nullAggregatedReports, mockTextAnalysisAdapter);
    }).toThrow(/集約データ|null|未定義/);
  });
});