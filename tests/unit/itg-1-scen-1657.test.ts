import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - ランク付け順序の正規化', () => {
  // SCEN-1657
  test('逆順で返されたキーワードが昇順（出現頻度高い順）に並び替えられる', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: 'サーバーダウン', frequency: 2 },
        { keyword: 'ネットワーク遅延', frequency: 1 },
        { keyword: 'データベース接続エラー', frequency: 1 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe('サーバーダウン');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('データベース接続エラー');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('ネットワーク遅延');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});