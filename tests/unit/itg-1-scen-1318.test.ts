import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1318
  test('日報テキストが空文字列のとき処理を中止し例外を発生させる', () => {
    // モックされたTextAnalysisServiceAdapter を作成
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 空文字列を入力として渡す
    const emptyReportText = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const requestUserId = 'user-123';

    // extractKeywordsメソッドが実行されないことを確認しつつ、
    // 例外が発生することを検証
    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold: 1,
          requestUserId,
        },
        emptyReportText,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/日報テキスト/);

    // モックの extractKeywords メソッドが呼び出されていないことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});