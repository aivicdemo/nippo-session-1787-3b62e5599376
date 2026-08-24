import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1085
  test('課題キーワード抽出機能 - 日報テキストから抽出された課題キーワード発生頻度がちょうど1回で記録される', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(
        new Map([
          ['データベース接続エラー', 1]
        ])
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続エラー',
      frequency: 1,
      rank: 1
    });
    expect(result.totalKeywordCount).toBe(1);
    expect(result.keywords[0].frequency).toBe(1);
    expect(typeof result.keywords[0].frequency).toBe('number');
    expect(Number.isInteger(result.keywords[0].frequency)).toBe(true);
  });
});