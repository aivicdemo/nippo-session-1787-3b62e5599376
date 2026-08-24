import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-500: [error] 課題自動抽出・優先度判定機能 - 日報報告者のユーザーID が null のときエラーになる
  test('ユーザーIDが null の日報を入力した場合、INVALID_USER_ID エラーを返却し外部サービス呼び出しを防止する', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: any = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: null,
    };

    expect(() =>
      extractAndRankIssueKeywords(invalidInput, mockTextAnalysisService)
    ).toThrow(/報告者のユーザーID|INVALID_USER_ID/);

    expect(mockTextAnalysisService.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});