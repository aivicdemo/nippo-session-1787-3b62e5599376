import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-2997: 抽出されたキーワードの発生頻度が null のとき、ランク付けロジックがエラーになる
  test('should throw error when keyword frequency is null during ranking', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { term: 'システムダウン', frequency: null },
          { term: 'エラー', frequency: 5 },
        ],
        confidence: 0.75,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const reportText =
      'システムダウンにより業務が停止。データベース接続エラーが頻発している';

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportText);
    }).rejects.toThrow(/null|frequency/i);
  });
});