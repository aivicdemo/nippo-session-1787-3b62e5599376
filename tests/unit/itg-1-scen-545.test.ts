import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-545
  test('発生頻度が閾値超過（例：4回）の課題キーワードが上位ランクに分類される', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        'データベース接続エラー': 4,
        'ネットワーク遅延': 2,
        'ディスク容量不足': 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 4,
      requestUserId: 'user-001',
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    expect(result.keywords).toHaveLength(3);

    const databaseErrorKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );
    expect(databaseErrorKeyword).toBeDefined();
    expect(databaseErrorKeyword?.frequency).toBe(4);
    expect(databaseErrorKeyword?.rank).toBe(1);

    const networkDelayKeyword = result.keywords.find(
      (k) => k.keyword === 'ネットワーク遅延'
    );
    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.frequency).toBe(2);
    expect(networkDelayKeyword?.rank).toBe(2);

    const diskSpaceKeyword = result.keywords.find(
      (k) => k.keyword === 'ディスク容量不足'
    );
    expect(diskSpaceKeyword).toBeDefined();
    expect(diskSpaceKeyword?.frequency).toBe(1);
    expect(diskSpaceKeyword?.rank).toBe(3);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});