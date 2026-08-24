import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度判定 - 同一優先度スコア時の順序付けエラー', () => {
  // SCEN-504
  test('同一優先度スコアを持つ複数課題の並ぶ順序が未定義の場合、エラーをスローする', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const mockAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 5 },
        { keyword: 'メモリリーク', frequency: 5 },
        { keyword: 'ネットワークタイムアウト', frequency: 5 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 5, impactScore: 75 },
        { keyword: 'メモリリーク', frequency: 5, impactScore: 75 },
        { keyword: 'ネットワークタイムアウト', frequency: 5, impactScore: 75 }
      ]),
      classifyIssueSeverity: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', severity: 'high' },
        { keyword: 'メモリリーク', severity: 'high' },
        { keyword: 'ネットワークタイムアウト', severity: 'high' }
      ])
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockAdapter as any)
    ).toThrow(/タイブレーカー|順序/);
  });
});