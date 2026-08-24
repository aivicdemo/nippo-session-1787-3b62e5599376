import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-549: [edge] 課題キーワード自動抽出・優先度判定機能 - 影響度スコアが下限超過（1）の課題が下限スコア課題より前に順序付けられる
  test('影響度スコア51の課題が影響度スコア50の課題より前に順序付けられること', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '課題A', frequency: 2 },
        { keyword: '課題B', frequency: 2 }
      ]),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        if (keyword === '課題A') return Promise.resolve(51);
        if (keyword === '課題B') return Promise.resolve(50);
        return Promise.resolve(0);
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const reportText = '課題A について報告があります。また課題B も報告されています。';

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      reportText
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe('課題A');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[1].keyword).toBe('課題B');
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});