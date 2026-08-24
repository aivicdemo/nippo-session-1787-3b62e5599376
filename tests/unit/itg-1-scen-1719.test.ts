import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1719
  test('対象期間の終了日が null のとき集約処理がエラーになる', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: null as any,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(input, textAnalysisServiceAdapterStub)
    ).toThrow(/終了日/);

    expect(textAnalysisServiceAdapterStub.extractKeywords).not.toHaveBeenCalled();
    expect(
      textAnalysisServiceAdapterStub.assessImpactScore
    ).not.toHaveBeenCalled();
    expect(
      textAnalysisServiceAdapterStub.classifyIssueSeverity
    ).not.toHaveBeenCalled();
  });
});