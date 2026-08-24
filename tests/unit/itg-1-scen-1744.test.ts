import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  test('SCEN-1744: 影響度スコアが境界値直下（49/100）のとき低優先度に分類される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 3 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(49),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium')
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    
    const assessmentCall = mockTextAnalysisAdapter.assessImpactScore.mock.calls[0];
    expect(assessmentCall[0]).toMatchObject({
      keyword: 'データベース接続エラー'
    });

    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0]).toMatchObject({
      keyword: 'データベース接続エラー',
      frequency: 3,
      rank: 1
    });

    expect(result.keywords[0].impactScore).toBe(49);
    expect(result.keywords[0].priorityRank).toBe('低');
    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});