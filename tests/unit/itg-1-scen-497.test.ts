import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題自動抽出・優先度判定機能 - 発生頻度バリデーション', () => {
  // SCEN-497: [error] 課題自動抽出・優先度判定機能 - 発生頻度が負の数のときエラーになる
  test('発生頻度が負の数のときValidationErrorを投げる', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを定義
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: '障害',
            frequency: -5,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert: 発生頻度が負の数のときエラーが投げられることを確認
    expect(() => {
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).toThrow(/発生頻度/);
  });
});