import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-746: [error] 課題自動抽出・優先度判定機能 - チームメンバーIDが空配列のとき、エラーを返す
  test('チームメンバーIDが空配列の場合、INVALID_TEAM_MEMBERSエラーを返す', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
      teamMemberIds: [],
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).toThrow(/チームメンバーID/);

    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});