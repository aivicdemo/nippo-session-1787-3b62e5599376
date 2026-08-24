import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-548: [edge] 課題キーワード自動抽出・優先度判定機能 - 影響度スコアがちょうど下限（0）の課題が最低優先度として順序付けられる
  test('影響度スコア0の課題が最後尾に配置され最低優先度として分類される', () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keywordId: 'kw-001',
            keyword: '高優先課題',
            frequency: 5,
            impactScore: 75,
          },
          {
            keywordId: 'kw-002',
            keyword: '中程度課題',
            frequency: 3,
            impactScore: 50,
          },
          {
            keywordId: 'kw-003',
            keyword: '最低優先課題',
            frequency: 2,
            impactScore: 0,
          },
        ],
        totalKeywordCount: 3,
        extractedAt: new Date('2024-01-15T10:30:00Z'),
        analysisPeriodDays: 7,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
    };

    const result = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    const lowestPriorityKeyword = result.keywords[result.keywords.length - 1];
    expect(lowestPriorityKeyword.keywordId).toBe('kw-003');
    expect(lowestPriorityKeyword.keyword).toBe('最低優先課題');
    expect(lowestPriorityKeyword.impactScore).toBe(0);
    expect(lowestPriorityKeyword.rank).toBe(3);

    const secondKeyword = result.keywords[1];
    expect(secondKeyword.keywordId).toBe('kw-002');
    expect(secondKeyword.impactScore).toBe(50);
    expect(secondKeyword.rank).toBe(2);

    const firstKeyword = result.keywords[0];
    expect(firstKeyword.keywordId).toBe('kw-001');
    expect(firstKeyword.impactScore).toBe(75);
    expect(firstKeyword.rank).toBe(1);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
  });
});