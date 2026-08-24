import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  test('SCEN-1088: 複数の日報に同一キーワードが出現し、発生頻度の順序が高い順に並ぶ', () => {
    // TextAnalysisServiceAdapter のモック定義
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 日報A: 「データベース障害が発生。データベース対応が必要」
    // モック戻り値: キーワード抽出結果
    const dailyReportA_keywords = [
      { keyword: 'データベース', frequency: 2 },
      { keyword: '障害', frequency: 1 },
    ];

    // 日報B: 「データベースのバックアップ確認。データベース移行予定」
    // モック戻り値: キーワード抽出結果
    const dailyReportB_keywords = [
      { keyword: 'データベース', frequency: 2 },
      { keyword: 'バックアップ', frequency: 1 },
    ];

    // 日報C: 「ネットワーク遅延。対応検討中」
    // モック戻り値: キーワード抽出結果
    const dailyReportC_keywords = [
      { keyword: '対応', frequency: 1 },
    ];

    // モックの戻り値を設定：3件の日報に対応
    mockTextAnalysisService.extractKeywords
      .mockReturnValueOnce(dailyReportA_keywords)
      .mockReturnValueOnce(dailyReportB_keywords)
      .mockReturnValueOnce(dailyReportC_keywords);

    // 入力データ: 複数の日報テキスト
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-10T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // 複数の日報データをシミュレート
    const dailyReports = [
      { text: 'データベース障害が発生。データベース対応が必要', reportedAt: new Date('2024-01-08T09:00:00Z') },
      { text: 'データベースのバックアップ確認。データベース移行予定', reportedAt: new Date('2024-01-09T09:00:00Z') },
      { text: 'ネットワーク遅延。対応検討中', reportedAt: new Date('2024-01-10T09:00:00Z') },
    ];

    // 課題キーワード抽出機能を実行
    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // 期待結果: 同一キーワード『データベース』が最上位に配置され、出現頻度4回（日報Aで2回 + 日報Bで2回）
    // その後『障害』『バックアップ』『対応』が各1回の同一頻度で続く

    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);

    // 最上位キーワードの検証：『データベース』が1位で頻度4回
    expect(result.keywords[0].keyword).toBe('データベース');
    expect(result.keywords[0].frequency).toBe(4);
    expect(result.keywords[0].rank).toBe(1);

    // 2位以降の検証：『障害』『バックアップ』『対応』が各1回で順序は発生頻度順
    // 同じ頻度のキーワードは登場順序で整列される想定
    const otherKeywords = result.keywords.slice(1);
    const expectedOtherFrequencies = [1, 1, 1];
    
    otherKeywords.forEach((kw, index) => {
      expect(kw.frequency).toBe(expectedOtherFrequencies[index]);
      expect(kw.rank).toBe(index + 2);
    });

    // 総キーワード数の確認（重複排除後：4種類）
    expect(result.totalKeywordCount).toBe(4);

    // 抽出時刻が記録されているか確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数を確認（1/8 00:00 ～ 1/10 23:59 = 3日）
    expect(result.analysisperiodDays).toBe(3);

    // モックが正しく呼ばれたか確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledTimes(3);
  });
});