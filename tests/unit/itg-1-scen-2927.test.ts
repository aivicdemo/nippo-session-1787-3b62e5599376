import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2927: 朝会報告テキスト内容がnullのとき、処理を中断してエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = extractAndRankIssueKeywords(
      {
        teamId: 'team-001',
        startDate: new Date('2024-01-08T00:00:00Z'),
        endDate: new Date('2024-01-14T23:59:59Z'),
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      },
      null,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toEqual({
      isError: true,
      errorCode: 'INVALID_INPUT_NULL',
      errorMessage: '朝会報告テキストがnullです。処理を中断します。',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});