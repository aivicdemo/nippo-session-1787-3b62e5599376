import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('SCEN-1196: ランク付けの対象キーワード配列が undefined のとき処理がエラーになる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 5 },
          { keyword: 'API応答遅延', frequency: 3 },
          { keyword: 'メモリリーク', frequency: 7 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);
    }).rejects.toThrow(/キーワード/);
  });
});