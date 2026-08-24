import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2919
  test('蓄積された複数日分の課題データから課題キーワードが正常に抽出される', () => {
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-13T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywords: Array<{ keyword: string; frequency: number }> = [];
        
        if (text.includes('データベース接続エラー')) {
          keywords.push({ keyword: 'データベース接続エラー', frequency: 2 });
        }
        if (text.includes('ネットワーク遅延')) {
          keywords.push({ keyword: 'ネットワーク遅延', frequency: 2 });
        }
        if (text.includes('メモリ不足')) {
          keywords.push({ keyword: 'メモリ不足', frequency: 1 });
        }
        if (text.includes('ディスク容量不足')) {
          keywords.push({ keyword: 'ディスク容量不足', frequency: 1 });
        }
        
        return keywords;
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBe(4);

    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);

    expect(result.keywords[1].keyword).toBe('ネットワーク遅延');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.keywords[2].keyword).toBe('メモリ不足');
    expect(result.keywords[2].frequency).toBe(1);
    expect(result.keywords[2].rank).toBe(3);

    expect(result.keywords[3].keyword).toBe('ディスク容量不足');
    expect(result.keywords[3].frequency).toBe(1);
    expect(result.keywords[3].rank).toBe(4);

    expect(result.totalKeywordCount).toBe(4);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(3);
  });
});