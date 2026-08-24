import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-2271: [normal] 課題影響度判定機能 - 抽出されたキーワードが複数件の場合、全キーワードのチーム波及度スコアが集計され優先度スコアが算出される
  test('複数キーワードのチーム波及度スコアが集計されて優先度スコアが算出される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'キーワードA', frequency: 3 },
          { keyword: 'キーワードB', frequency: 2 },
          { keyword: 'キーワードC', frequency: 1 }
        ],
        totalCount: 6
      }),
      assessImpactScore: jest.fn()
        .mockReturnValueOnce(80)
        .mockReturnValueOnce(60)
        .mockReturnValueOnce(40),
      classifyIssueSeverity: jest.fn()
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'キーワードAとキーワードB、キーワードCが含まれている課題テキスト',
      occurrenceFrequency: 6,
      impactScore: 70,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001'
    };

    // Act: 優先度スコア計算機能を実行
    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    // Assert: extractKeywordsが1回呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(input.issueContent);

    // Assert: assessImpactScoreが3回（キーワード数分）呼び出されたことを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenNthCalledWith(1, 'キーワードA', input.teamId);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenNthCalledWith(2, 'キーワードB', input.teamId);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenNthCalledWith(3, 'キーワードC', input.teamId);

    // Assert: 結果の構造を検証
    expect(result).toHaveProperty('issueId', 'issue-001');
    expect(result).toHaveProperty('priorityScore');
    expect(result).toHaveProperty('priorityRank');
    expect(result).toHaveProperty('scoreBreakdown');
    expect(result).toHaveProperty('colorCode');
    expect(result).toHaveProperty('calculatedAt');

    // Assert: 優先度スコアが有効な数値であることを確認（1～100）
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // Assert: スコア内訳にすべての要素が含まれていることを確認
    expect(result.scoreBreakdown).toHaveProperty('frequencyScore');
    expect(result.scoreBreakdown).toHaveProperty('impactScore');
    expect(result.scoreBreakdown).toHaveProperty('resolutionDifficultyScore');
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');

    // Assert: スコア計算が複数スコアの集計結果であることを確認
    // 複数キーワード（3件）のスコア（80、60、40）が集計されて優先度スコアが算出されている
    expect(result.scoreBreakdown.impactScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);

    // Assert: 優先度ランクが正しい値であることを確認
    expect(['高', '中', '低']).toContain(result.priorityRank);

    // Assert: 色コードが正しい値であることを確認
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);

    // Assert: calculatedAtがISO 8601形式であることを確認
    expect(typeof result.calculatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.calculatedAt)).toBe(true);
  });
});