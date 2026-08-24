import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1715
  test('[error] 課題キーワード自動抽出・優先度スコア算出機能 - 日報データが null のとき抽出処理がエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const nullReportData = null;

    expect(() => {
      extractAndRankIssueKeywords(
        nullReportData as any,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/日報データ|null|Input/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});