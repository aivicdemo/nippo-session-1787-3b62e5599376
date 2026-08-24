import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付けの検証', () => {
  // SCEN-755: [error] 課題自動抽出・優先度判定機能 - 影響度スコアが0未満のとき、エラーを返す
  test('影響度スコアが負の値(-5)のとき、INVALID_IMPACT_SCOREエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース障害',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース障害',
        impactScore: -5,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    return extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter).then(
      () => {
        fail('エラーをスローする必要があります');
      },
      (error: any) => {
        expect(error).toHaveProperty('code', 'INVALID_IMPACT_SCORE');
        expect(error).toHaveProperty('message', '影響度スコアは0以上100以下である必要があります');
        expect(error).toHaveProperty('details.receivedScore', -5);
      }
    );
  });
});