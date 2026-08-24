import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-1317
  test('日報テキストが null のとき処理を中止し例外を発生させる', () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
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

    const invalidReportText: string | null = null;

    expect(() => {
      extractAndRankIssueKeywords(
        invalidReportText as unknown as string,
        input,
        textAnalysisServiceAdapterStub
      );
    }).toThrow(/テキストが空またはnull|null値/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.assessImpactScore).not.toHaveBeenCalled();
    expect(textAnalysisServiceAdapterStub.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});