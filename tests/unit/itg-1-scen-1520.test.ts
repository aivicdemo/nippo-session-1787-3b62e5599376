import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1520
  test('課題優先度スコア算出機能 - 日報データの配列が空配列のときエラーが発生する', () => {
    const emptyReportData: never[] = [];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() => {
      calculateIssuePriorityScore(emptyReportData, mockTextAnalysisServiceAdapter);
    }).toThrow(/日報データが空です/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});