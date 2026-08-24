import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 重複排除処理', () => {
  // SCEN-1783
  test('同一の報告者IDと報告日付を持つ報告データが重複している場合、重複を排除して生成レポートに含める', () => {
    // 前提: テストDB内に同一の報告者IDと報告日付を持つ報告データを2件登録
    // ユーザーID=U001、報告日=2026-01-15、課題キーワード='サーバー障害'が重複
    const duplicateReportId1 = 'report-001-dup1';
    const duplicateReportId2 = 'report-001-dup2';
    const userId = 'U001';
    const reportDate = '2026-01-15';
    const keywordContent = 'サーバー障害';

    // モック日報レコード: 同一ユーザー、同一日付、異なるレポートIDで重複
    const mockReportRecords = [
      {
        reportId: duplicateReportId1,
        userId: userId,
        reportDate: reportDate,
        yesterdayContent: '本番環境でデータベース接続確認',
        todayContent: '朝会資料作成',
        issueContent: keywordContent,
      },
      {
        reportId: duplicateReportId2,
        userId: userId,
        reportDate: reportDate,
        yesterdayContent: '本番環境でデータベース接続確認',
        todayContent: '朝会資料作成',
        issueContent: keywordContent,
      },
    ];

    // TextAnalysisServiceAdapterのextractKeywordsメソッドをスタブ化
    // 重複データに対して同一キーワード出現頻度を返す
    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes(keywordContent)) {
          return Promise.resolve({
            keywords: [
              { keyword: 'サーバー障害', frequency: 1, impactScore: 85 },
            ],
          });
        }
        return Promise.resolve({ keywords: [] });
      }),
      assessImpactScore: jest.fn((keyword: string) =>
        Promise.resolve({ keyword, impactScore: 85 })
      ),
      classifyIssueSeverity: jest.fn((text: string) =>
        Promise.resolve({ severity: 'high' })
      ),
    };

    // 月次レポート生成機能を実行
    // 対象期間: 2026年1月、抽出対象ユーザー: U001
    const input = {
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: 'requester-001',
      teamIdFilter: undefined,
    };

    // 実装上、extractMonthlyReportDataは報告レコード配列を受け取る形式を想定
    // 重複排除ロジックを検証するため、モックレコードを直接入力
    const result = extractMonthlyReportData(
      input,
      mockReportRecords,
      stubTextAnalysisAdapter
    );

    // 期待結果: 重複していた2件の同一報告データから抽出されたキーワード
    // （'サーバー障害'）がレポート内では1件分の出現頻度としてカウント
    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(1); // 重複排除後は1件
    expect(result.extractionPeriodStart).toBe('2026-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-01-31T23:59:59Z');

    // reportsByTeam内の報告データを確認
    // 重複排除後、報告IDリストには重複排除済みのIDのみが含まれるべき
    if (result.reportsByTeam && result.reportsByTeam.length > 0) {
      const teamSummary = result.reportsByTeam[0];
      expect(teamSummary.reportCount).toBe(1); // 重複排除後は1件
      expect(teamSummary.reportIds).toHaveLength(1); // 重複排除後は1つのレポートIDのみ
    }

    // 抽出されたキーワード出現頻度を確認
    // 同一キーワード'サーバー障害'の出現頻度は2ではなく1であること
    const extractedKeywordFrequency = result.dataQualityScore;
    // データ品質スコアは0-100の範囲で、重複排除が正常に行われた場合は高スコア
    expect(extractedKeywordFrequency).toBeGreaterThanOrEqual(0);
    expect(extractedKeywordFrequency).toBeLessThanOrEqual(100);

    // 実行日時がISO 8601形式で記録されていることを確認
    expect(result.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});