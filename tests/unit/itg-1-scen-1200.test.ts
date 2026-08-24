import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能 - 発生頻度が同一の複数課題の提示順序安定性', () => {
  // SCEN-1200
  test('発生頻度が同一の複数課題が抽出された場合、提示順序が安定している', () => {
    // モック用のTextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '課題A', frequency: 5 },
        { keyword: '課題B', frequency: 5 },
        { keyword: '課題C', frequency: 5 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const testInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    // 1回目の実行
    const result1 = extractAndRankIssueKeywords(testInput, mockTextAnalysisServiceAdapter);
    const order1 = result1.keywords.map((kw) => kw.keyword);

    // 2回目の実行
    const result2 = extractAndRankIssueKeywords(testInput, mockTextAnalysisServiceAdapter);
    const order2 = result2.keywords.map((kw) => kw.keyword);

    // 3回目の実行
    const result3 = extractAndRankIssueKeywords(testInput, mockTextAnalysisServiceAdapter);
    const order3 = result3.keywords.map((kw) => kw.keyword);

    // 3回すべての実行で同じ順序が保持されることを検証
    expect(order1).toEqual(order2);
    expect(order2).toEqual(order3);

    // 出現頻度が同一の複数課題が同じ順序で提示されることを検証
    expect(result1.keywords).toHaveLength(3);
    expect(result1.keywords[0].keyword).toBe('課題A');
    expect(result1.keywords[0].frequency).toBe(5);
    expect(result1.keywords[0].rank).toBe(1);

    expect(result1.keywords[1].keyword).toBe('課題B');
    expect(result1.keywords[1].frequency).toBe(5);
    expect(result1.keywords[1].rank).toBe(2);

    expect(result1.keywords[2].keyword).toBe('課題C');
    expect(result1.keywords[2].frequency).toBe(5);
    expect(result1.keywords[2].rank).toBe(3);

    // 各実行結果のmetadataが正しいことを検証
    expect(result1.totalKeywordCount).toBe(3);
    expect(result1.extractedAt).toBeInstanceOf(Date);
    expect(result1.analysisperiodDays).toBe(7);
  });
});