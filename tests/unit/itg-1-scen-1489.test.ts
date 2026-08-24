import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1489
  test('対象期間の終了日がnullのとき、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: null as any,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter),
    ).toThrow(/終了日|endDate/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});