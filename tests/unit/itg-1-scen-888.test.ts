import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-888: キーワード抽出時に端数が発生する相対度数が正しく丸められてランク付けに反映される', () => {
    // モック TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続', frequency: 0.3333 },
        { keyword: 'API仕様調査', frequency: 0.6667 },
        { keyword: 'ユーザー認証', frequency: 0.1111 }
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123'
    };

    // 関数呼び出し
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // 期待結果の検証
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    // ランク1: API仕様調査（67%、ランク高）
    expect(result.keywords[0].keyword).toBe('API仕様調査');
    expect(result.keywords[0].frequency).toBe(0.6667);
    expect(result.keywords[0].rank).toBe(1);

    // ランク2: データベース接続（33%、ランク中）
    expect(result.keywords[1].keyword).toBe('データベース接続');
    expect(result.keywords[1].frequency).toBe(0.3333);
    expect(result.keywords[1].rank).toBe(2);

    // ランク3: ユーザー認証（11%、ランク低）
    expect(result.keywords[2].keyword).toBe('ユーザー認証');
    expect(result.keywords[2].frequency).toBe(0.1111);
    expect(result.keywords[2].rank).toBe(3);

    // その他の検証
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});