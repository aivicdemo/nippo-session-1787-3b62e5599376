import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能 - 影響度スコア計算エラー処理', () => {
  test('SCEN-1322: reporterTeamIdが空文字列のときInvalidTeamIdExceptionをスローする', () => {
    // 空文字列のteamIdを持つモック日報オブジェクト
    const reportWithEmptyTeamId = {
      reportId: 'report-001',
      reporterTeamId: '',
      reportDate: '2024-01-15',
      challenges: ['遅延', 'バグ'],
    };

    // TextAnalysisServiceAdapterのモック
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['遅延', 'バグ'],
        frequency: { '遅延': 2, 'バグ': 1 },
      }),
      assessImpactScore: jest.fn().mockImplementation((teamId: string) => {
        if (teamId === '') {
          throw new Error('InvalidTeamIdException: reporterTeamId must not be empty');
        }
        return 45;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    // extractAndRankIssueKeywordsを呼び出し、例外がスローされることを検証
    expect(() => {
      extractAndRankIssueKeywords(
        reportWithEmptyTeamId as any,
        mockTextAnalysisServiceAdapter as any
      );
    }).toThrow(/reporterTeamId must not be empty/);
  });
});