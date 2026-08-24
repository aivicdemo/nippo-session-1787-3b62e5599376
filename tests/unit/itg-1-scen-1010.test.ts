import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('SCEN-1010: [normal] 課題キーワード自動抽出機能 - 日報から1つの課題キーワードだけが抽出される', () => {
    // モック化されたTextAnalysisServiceAdapterを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース障害',
            frequency: 1,
          },
        ],
        totalKeywordCount: 1,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト入力データ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // 日報テキスト（この値は実際には内部で保持されるが、呼び出し側で準備されるとする）
    const reportTexts = [
      '昨日はシステム保守。今日はテスト実施。課題：データベース障害が発生している',
    ];

    // 課題キーワード自動抽出機能を実行
    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      reportTexts
    );

    // 抽出結果の課題キーワード一覧を確認
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords[0].keyword).toBe('データベース障害');
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[0].rank).toBe(1);

    // 全キーワード数を確認
    expect(result.totalKeywordCount).toBe(1);

    // extractedAtがDate型であることを確認（固定値チェックは不要、型と実行タイミングのみ）
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数を確認（startDateから endDateまでの期間）
    // 2024-01-08 00:00:00 から 2024-01-14 23:59:59 までは7日間
    expect(result.analysisPeriodDays).toBe(7);
  });
});