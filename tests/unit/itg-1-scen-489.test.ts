import { describe, it, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
    };
  });

  // SCEN-489: [error] 課題自動抽出・優先度判定機能 - チームメンバー情報が null のときエラーになる
  it('チームメンバー情報がnullの場合、チームメンバー情報不足エラーがthrowされること', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const teamMembers = null;

    expect(() => {
      extractAndRankIssueKeywords(input, teamMembers, mockTextAnalysisAdapter);
    }).toThrow(/チームメンバー情報/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});