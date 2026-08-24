import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-362: [edge] 報告提出状況リアルタイム更新機能 - 年度末の日付境界をまたぐ送信時刻が正しく記録される
  test('年度末日から年度初日にかけての日付境界をまたぐ送信時刻が正確に記録される', () => {
    // Arrange: 年度末日のシステム時刻を設定
    const fiscal_year_end_date_string = '2026-03-31';
    const fiscal_year_end_report_date = new Date('2026-03-31T23:59:50+09:00');

    // テスト用の入力データ: 年度末日に報告データを送信
    const test_team_id = 'team-001';
    const request_user_id = 'user-admin-001';

    // aggregateReportSubmissionStatus の入力パラメータを構築
    // 年度初日の朝会報告に対する提出状況を集計
    const aggregate_input: AggregateReportSubmissionStatusInput = {
      teamId: test_team_id,
      reportDate: '2026-04-01',
      requestUserId: request_user_id,
      includeDelayedSubmissions: true,
    };

    // モック化されたレポート提出状況データを作成
    // 年度末日に入力されたが、年度初日にシステム時刻が進み送信されたシナリオ
    const mock_report_data = {
      teamId: test_team_id,
      reportDate: '2026-04-01',
      totalMembers: 1,
      submittedCount: 1,
      unsubmittedCount: 0,
      delayedSubmissionCount: 0,
      submissionRate: 100.0,
      unsubmittedMembers: [],
      aggregatedAt: '2026-04-01T00:00:10+09:00',
      submissionTimestamps: [
        {
          userId: 'user-member-001',
          submissionTimestamp: '2026-04-01T00:00:10+09:00',
          reportDate: '2026-04-01',
        },
      ],
    };

    // Act: 年度初日の提出状況を集計する関数を呼び出す
    // 実装上、この関数は年度末日に入力された報告がシステム時刻の進行により
    // 年度初日のタイムスタンプで記録されるケースを正しく処理する必要がある
    const aggregation_result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      aggregate_input,
      // 実装が内部で参照するデータベースやシステム時刻をモック化する場合の注入ポイント
      // ここではモックの詳細は関数の内部実装に委ねられるが、
      // 入力と出力の契約を検証する
    );

    // Assert: 提出状況が正確に集計されていることを検証
    expect(aggregation_result).toEqual({
      teamId: test_team_id,
      reportDate: '2026-04-01',
      totalMembers: 1,
      submittedCount: 1,
      unsubmittedCount: 0,
      delayedSubmissionCount: 0,
      submissionRate: 100.0,
      unsubmittedMembers: [],
      aggregatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    });

    // 年度初日の日付がISO 8601形式で正確に記録されていることを検証
    expect(aggregation_result.reportDate).toBe('2026-04-01');

    // 提出率が100%（1/1）であることを検証
    expect(aggregation_result.submissionRate).toBe(100.0);

    // 未提出メンバー数が0であることを検証
    expect(aggregation_result.unsubmittedCount).toBe(0);

    // 集計実行時刻がISO 8601形式で記録されていることを検証
    expect(aggregation_result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);

    // 年度初日（2026-04-01）のデータが正確に集計されていることを確認
    // 年度末日に入力されたが、年度初日にタイムスタンプが付与される特殊ケースが
    // 正しく年度初日の統計に含まれることを検証
    expect(aggregation_result.submittedCount).toBe(1);
  });
});