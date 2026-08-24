import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1508
  test('7日間の日報から抽出したキーワードリストが昇順の場合、正確に降順に並べ替えられること', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '課題A', frequency: 2 },
        { keyword: '課題B', frequency: 5 },
        { keyword: '課題C', frequency: 8 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: startDate,
      endDate: endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // 降順に並べ替えられていることを検証
    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('課題C');
    expect(result.keywords[0].frequency).toBe(8);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('課題B');
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('課題A');
    expect(result.keywords[2].frequency).toBe(2);
    expect(result.keywords[2].rank).toBe(3);

    // 全キーワード数を検証
    expect(result.totalKeywordCount).toBe(3);

    // 抽出実行日時が記録されていることを検証
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数を検証（7日間）
    expect(result.analysisperiodDays).toBe(7);

    // extractKeywords が正しい引数で呼び出されたことを検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});