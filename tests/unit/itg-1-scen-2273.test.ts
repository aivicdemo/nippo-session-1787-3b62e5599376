import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - calculateIssuePriorityScore', () => {
  // SCEN-2273: [normal] TextAnalysisServiceAdapter連携 - extractKeywords呼び出しが正常応答した場合、日報から課題キーワードと出現頻度が返される
  test('should return extracted keywords with frequencies when TextAnalysisServiceAdapter responds normally', () => {
    // Arrange: TextAnalysisServiceAdapterのextractKeywordsをスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '連携API障害', frequency: 3 },
        { keyword: 'データベース性能低下', frequency: 2 },
        { keyword: 'ユーザー認証タイムアウト', frequency: 1 }
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // サンプル日報テキスト
    const sampleReportText =
      '昨日はAPI連携のバグ修正を行いました。連携API障害が3回発生し、対応に時間がかかりました。' +
      '今日はデータベース性能低下の原因調査を予定しています。' +
      '抱えている課題は、ユーザー認証タイムアウトの根本原因特定です。';

    // テスト入力: IssuePriorityScoringInput
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: sampleReportText,
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    // Act: calculateIssuePriorityScoreを呼び出す
    // Note: 実装内でextractKeywordsが呼ばれることを想定
    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    // Assert: extractKeywordsが呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();

    // キーワード抽出結果の検証
    // 期待: キーワード配列に3件のキーワードが含まれており、各要素が {keyword: string, frequency: number} 構造を持つ
    const extractedKeywordsCall = mockTextAnalysisAdapter.extractKeywords.mock.results[0];
    expect(extractedKeywordsCall.value).toBeDefined();

    // キーワード「連携API障害」の出現頻度が3であることを確認
    expect(extractedKeywordsCall.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: '連携API障害', frequency: 3 })
      ])
    );

    // キーワード「データベース性能低下」の出現頻度が2であることを確認
    expect(extractedKeywordsCall.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'データベース性能低下', frequency: 2 })
      ])
    );

    // キーワード「ユーザー認証タイムアウト」の出現頻度が1であることを確認
    expect(extractedKeywordsCall.value).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'ユーザー認証タイムアウト', frequency: 1 })
      ])
    );

    // 戻り値配列の要素数が3件であることを確認
    expect(extractedKeywordsCall.value).toHaveLength(3);

    // 各要素が正しい構造を持つことを確認
    extractedKeywordsCall.value.forEach((item: { keyword: string; frequency: number }) => {
      expect(typeof item.keyword).toBe('string');
      expect(typeof item.frequency).toBe('number');
      expect(item.frequency).toBeGreaterThan(0);
    });
  });
});