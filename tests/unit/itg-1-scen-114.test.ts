import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('朝会開始予定時刻のちょうど5分前での提出状況リアルタイム表示', () => {
  // SCEN-114
  test('朝会開始予定時刻の5分前に到達した時点で、その時点でのスナップショットがリアルタイム表示される', () => {
    const team_id = 'team-001';
    const request_user_id = 'user-manager-001';
    const report_date = '2024-01-15';
    
    // 朝会開始予定時刻: 09:00、テスト時刻: 08:55
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00+09:00');
    const first_snapshot_time = new Date('2024-01-15T08:55:01+09:00');
    const second_snapshot_time = new Date('2024-01-15T08:56:00+09:00');

    // 5名のメンバーの提出状態を定義
    // ユーザーA: 昨日実績+今日予定+課題を送信完了（フル提出）
    // ユーザーB: 昨日実績+今日予定のみ送信完了（部分提出）
    // ユーザーC: 昨日実績のみ送信完了（最小提出）
    // ユーザーD,E: 未送信
    const submitted_members = [
      { user_id: 'user-a', submitted_at: new Date('2024-01-15T08:30:00+09:00'), completion_level: 'full' },
      { user_id: 'user-b', submitted_at: new Date('2024-01-15T08:45:00+09:00'), completion_level: 'partial' },
      { user_id: 'user-c', submitted_at: new Date('2024-01-15T08:50:00+09:00'), completion_level: 'minimal' }
    ];

    // 第1回: 08:55:01 のスナップショット取得
    const input_first: AggregateReportSubmissionStatusInput = {
      teamId: team_id,
      reportDate: report_date,
      requestUserId: request_user_id,
      includeDelayedSubmissions: false
    };

    const result_first: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input_first);

    // 8:55:01 での期待値
    // 総メンバー数: 5名
    // 提出済み: 3名（A, B, C）
    // 未提出: 2名（D, E）
    // 提出率: 60.0%
    expect(result_first.teamId).toBe(team_id);
    expect(result_first.reportDate).toBe(report_date);
    expect(result_first.totalMembers).toBe(5);
    expect(result_first.submittedCount).toBe(3);
    expect(result_first.unsubmittedCount).toBe(2);
    expect(result_first.delayedSubmissionCount).toBe(0);
    expect(result_first.submissionRate).toBe(60.0);

    // 08:55:01 のタイムスタンプが記録されていることを確認
    const first_aggregated_at_time = new Date(result_first.aggregatedAt);
    expect(first_aggregated_at_time.getHours()).toBe(8);
    expect(first_aggregated_at_time.getMinutes()).toBe(55);
    expect(first_aggregated_at_time.getSeconds()).toBe(1);

    // 未提出メンバーリストに D, E が含まれることを確認
    expect(result_first.unsubmittedMembers).toHaveLength(2);
    const unsubmitted_user_ids = result_first.unsubmittedMembers.map(m => m.userId);
    expect(unsubmitted_user_ids).toContain('user-d');
    expect(unsubmitted_user_ids).toContain('user-e');

    // 第2回: 08:56:00 のスナップショット取得（1分後）
    const input_second: AggregateReportSubmissionStatusInput = {
      teamId: team_id,
      reportDate: report_date,
      requestUserId: request_user_id,
      includeDelayedSubmissions: false
    };

    const result_second: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input_second);

    // 08:56:00 のタイムスタンプが記録されていることを確認
    // （実装によってはユーザーFが追加提出している可能性もある想定）
    const second_aggregated_at_time = new Date(result_second.aggregatedAt);
    expect(second_aggregated_at_time.getHours()).toBe(8);
    expect(second_aggregated_at_time.getMinutes()).toBe(56);
    expect(second_aggregated_at_time.getSeconds()).toBe(0);

    // 第1回と第2回のタイムスタンプが異なることを確認
    // これにより各スナップショット取得時刻が独立して記録されていることが示される
    expect(result_first.aggregatedAt).not.toBe(result_second.aggregatedAt);
    expect(first_aggregated_at_time.getTime() < second_aggregated_at_time.getTime()).toBe(true);
  });
});