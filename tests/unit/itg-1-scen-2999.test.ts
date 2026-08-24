import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - キーワード配列の必須フィールド検証', () => {
  test('SCEN-2999: 抽出されたキーワード配列の要素に必須フィールド(キーワード)が欠落しているとき、ランク付けロジックがエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: 'API障害', occurrenceFrequency: 5 },
        { occurrenceFrequency: 3 }
      ]),
      assessImpactScore: jest.fn().mockReturnValue(75)
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    expect(() => 
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/keyword/i);
  });
});