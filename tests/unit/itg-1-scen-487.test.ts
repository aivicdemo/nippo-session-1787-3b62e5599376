import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  test('SCEN-487: textContentが null の場合エラーが発生する', () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // null の textContent を含む日報オブジェクトを作成
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // textContent が null の報告データ
    const reportWithNullContent = {
      reportingId: 'report-001',
      textContent: null as any,
      reportedAt: new Date('2024-01-10T09:00:00Z'),
    };

    // Act & Assert: null の textContent で呼び出すとエラーが発生する
    expect(() => {
      extractAndRankIssueKeywords(
        input,
        textAnalysisServiceStub,
        [reportWithNullContent]
      );
    }).toThrow(/テキスト内容が空です|Invalid input|textContent/);

    // スタブの extractKeywords は呼び出されない
    expect(textAnalysisServiceStub.extractKeywords).not.toHaveBeenCalled();
  });
});