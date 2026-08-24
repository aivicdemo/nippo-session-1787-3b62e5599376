import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-2936: キーワード辞書データが null のとき、処理を中断してエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
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

    const reportTextSample = '昨日は機能A開発、今日はバグ修正予定、課題は依存ライブラリのバージョン競合';

    expect(() =>
      extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/課題キーワード辞書/);
  });
});