import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1192
  test('信頼度スコアが100を超える場合にエラーがスローされる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバー障害', frequency: 3 },
        { keyword: '本番環境', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'サーバー障害',
        confidenceScore: 101,
        impactScore: 85,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = 'サーバー障害により本番環境が2時間停止した';

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter, reportText);
    }).rejects.toThrow(/課題信頼度スコアが無効な範囲です/);
  });
});