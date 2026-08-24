import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-2248
  it('出現頻度が0以下のキーワードを抽出時にエラーをスロー', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 0,
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

    const reportTexts = [
      'システム障害が発生した。システム障害の対応が必要。',
    ];

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportTexts)
    ).rejects.toThrow(/頻度|frequency/i);
  });
});