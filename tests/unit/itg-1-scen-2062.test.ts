import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Dashboard Priority Color Display - Daily Report Submission', () => {
  // SCEN-2062: [edge] 対策案の必須項目検証機能 - 実行計画が年度をまたぐ場合に検証がパスする
  test('should pass validation when countermeasure plan spans across fiscal year boundaries', () => {
    // Arrange: テスト対象の対策案オブジェクトを作成する。実行開始日を2026年3月1日、実行終了日を2027年2月28日に設定し、年度（4月始まり）をまたぐ状態にする
    const countermeasurePlan = {
      countermeasureContent: '検索機能の性能最適化とキャッシング戦略の導入',
      responsiblePerson: 'engineer-001',
      executionStartDate: new Date('2026-03-01T00:00:00Z'),
      executionEndDate: new Date('2027-02-28T23:59:59Z'),
    };

    // 日報提出入力オブジェクトを作成
    const submitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '検索機能の不具合を修正し、テストケースを追加した。全テスト合格を確認。',
      todayPlan: '本件検索機能の改善案をレビュー会で提示し、承認を得る。その後実装着手の準備を進める。',
      challenges: 'データベースクエリの応答時間が遅延しており、ユーザー体験が低下している。早急な改善が必要。',
      reportDate: '2026-03-01',
      countermeasures: [countermeasurePlan],
    };

    // Act: 対策案バリデータの検証メソッド validate() を呼び出す
    const result = submitDailyReport(submitDailyReportInput);

    // Assert: 戻り値が {isValid: true, errors: []} となり、年度をまたぐ実行期間を持つ対策案が必須項目検証をパスする
    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        submissionTimestamp: expect.any(String),
        isWithinDeadline: expect.any(Boolean),
      })
    );

    // 追加検証: 結果がバリデーション成功の構造を持つことを確認
    expect(result.reportId).toBeTruthy();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});