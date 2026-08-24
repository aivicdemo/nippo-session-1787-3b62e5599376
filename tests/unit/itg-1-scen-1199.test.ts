import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1199: [edge] 課題キーワード抽出・ランク付け機能 - 信頼度スコアが基準値直上（50.1）の課題は警告表示されない
  test('信頼度スコア50.1の課題は警告表示なしで通常表示される', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバー応答が遅い', frequency: 3 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(50.1),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium')
    };

    const reportTexts = [
      'サーバー応答が遅い問題が発生した',
      'サーバー応答が遅い状態が続いている',
      'サーバー応答が遅い'
    ];

    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold,
        requestUserId
      },
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(1);
    const extractedKeyword = result.keywords[0];
    expect(extractedKeyword.keyword).toBe('サーバー応答が遅い');
    expect(extractedKeyword.frequency).toBe(3);
    expect(extractedKeyword.rank).toBe(1);

    expect(extractedKeyword).not.toHaveProperty('hasWarning');
    expect(extractedKeyword).not.toHaveProperty('warningLabel');
    expect(extractedKeyword).not.toHaveProperty('highlightColor');

    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});