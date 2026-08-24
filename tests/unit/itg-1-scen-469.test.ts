import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワードの自動抽出・ランク付け機能', () => {
  // SCEN-469: [edge] 課題自動抽出・優先度判定機能 - 報告受付期限時刻の1秒後では集約処理が遅延なくトリガーされる
  test('報告受付期限時刻の1秒後に集約処理がトリガーされ遅延時間が500ms以内であること', async () => {
    // 固定時刻（期限が09:00:00の場合）
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    const triggerTime = new Date('2024-01-15T09:00:01Z');
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-15T23:59:59Z');
    const teamId = 'team-001';
    const requestUserId = 'user-001';

    // 複数の部員（3名以上）からの日報データを模擬
    const reportDataSet = [
      {
        memberId: 'member-001',
        report: 'データベース接続エラーが発生した。キャッシュ戦略の見直しが必要。',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        memberId: 'member-002',
        report: 'APIレスポンスが遅い。負荷分散の検討が課題。',
        submittedAt: new Date('2024-01-15T08:40:00Z'),
      },
      {
        memberId: 'member-003',
        report: 'データベース接続エラーが再度発生。復旧手順の標準化が必要。',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
    ];

    // TextAnalysisServiceAdapterをスタブ化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 2 },
        { keyword: 'キャッシュ戦略', frequency: 1 },
        { keyword: 'APIレスポンス遅延', frequency: 1 },
        { keyword: '負荷分散', frequency: 1 },
        { keyword: '復旧手順', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // 集約処理の開始タイムスタンプを記録
    const processingStartTime = triggerTime.getTime();

    // 入力データの準備
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    // extractAndRankIssueKeywords関数を呼び出し
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // 集約処理の完了時刻を取得
    const processingEndTime = new Date().getTime();
    const processingDelayMs = processingEndTime - processingStartTime;

    // 検証1: 遅延時間が500ms以内であること
    expect(processingDelayMs).toBeLessThanOrEqual(500);

    // 検証2: 課題キーワードが発生頻度でランク付けされていること
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].frequency).toBe(2); // 「データベース接続エラー」が最頻出
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');

    // 検証3: ランク付けが正しい順序で昇順になっていること
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].rank).toBeLessThan(result.keywords[i + 1].rank);
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(result.keywords[i + 1].frequency);
    }

    // 検証4: 抽出結果の統計情報が正確であること
    expect(result.totalKeywordCount).toBe(5); // 5つの一意なキーワード
    expect(result.analysisperiodDays).toBe(0); // 開始日と終了日が同日

    // 検証5: 抽出タイムスタンプが記録されていること
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt).toEqual(expect.any(Date));

    // 検証6: TextAnalysisServiceAdapterの呼び出しが正常に完了していること
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
  });
});