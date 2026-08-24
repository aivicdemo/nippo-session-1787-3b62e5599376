import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1175: [normal] 課題キーワード自動抽出・ランク付け機能 - 同じ入力で 2 回実行しても同じ抽出結果と信頼度スコアが返される
  test('should return identical extraction results and confidence scores when called twice with the same input', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 1, confidenceScore: 0.95 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    // 1回目の抽出実行
    const firstResult = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter
    );

    // 2回目の抽出実行（同一入力）
    const secondResult = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter
    );

    // 1回目と2回目の結果が完全に一致することを検証
    expect(firstResult.keywords.length).toBe(secondResult.keywords.length);
    expect(firstResult.keywords.length).toBe(1);

    // キーワード文字列が同じ順序で一致
    expect(firstResult.keywords[0].keyword).toBe(secondResult.keywords[0].keyword);
    expect(firstResult.keywords[0].keyword).toBe('システム障害');

    // 信頼度スコアが小数点以下4桁まで完全に一致
    expect(firstResult.keywords[0].confidenceScore).toBe(
      secondResult.keywords[0].confidenceScore
    );
    expect(firstResult.keywords[0].confidenceScore).toBe(0.95);

    // ランク付けも同じ
    expect(firstResult.keywords[0].rank).toBe(secondResult.keywords[0].rank);
    expect(firstResult.keywords[0].rank).toBe(1);

    // 抽出日時は異なる可能性があるため、型チェックのみ
    expect(typeof firstResult.extractedAt).toBe('object');
    expect(typeof secondResult.extractedAt).toBe('object');

    // 分析対象期間は同じ
    expect(firstResult.analysisperiodDays).toBe(secondResult.analysisperiodDays);
    expect(firstResult.analysisperiodDays).toBe(7);

    // 全キーワード数も同じ
    expect(firstResult.totalKeywordCount).toBe(secondResult.totalKeywordCount);
    expect(firstResult.totalKeywordCount).toBe(1);
  });
});