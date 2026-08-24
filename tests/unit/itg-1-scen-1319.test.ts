import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-1319
  test('抽出対象の日報IDがnullのとき例外を発生させる', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn()
    };

    expect(() =>
      extractAndRankIssueKeywords(
        null as any,
        input,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/日報ID/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});