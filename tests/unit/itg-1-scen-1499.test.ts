import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1499
  test('キーワードの発生頻度が0以下のときの値が含まれたとき、エラーを返す', () => {
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async () => {
        return [
          { keyword: 'バグ', frequency: -1 },
          { keyword: '対応', frequency: 2 },
        ];
      },
      assessImpactScore: async () => 50,
      classifyIssueSeverity: async () => 'high',
    };

    const reportText = '昨日はバグ対応、今日もバグ対応、バグが多い';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    expect(async () => {
      await extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold,
          requestUserId,
        },
        mockTextAnalysisAdapter
      );
    }).rejects.toThrow(/発生頻度/);
  });
});