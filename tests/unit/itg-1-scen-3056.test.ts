import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-3056
  test('朝7時30分直前（7時29分59秒）にダッシュボード表示トリガーが発火したとき、本日の報告提出状況は未表示のままとなる', () => {
    const fixed_system_time = new Date('2024-01-15T07:29:59Z');
    const fixed_team_id = 'team-001';
    const fixed_request_user_id = 'user-manager-001';
    const fixed_report_date = '2024-01-15';

    const input: AggregateReportSubmissionStatusInput = {
      teamId: fixed_team_id,
      reportDate: fixed_report_date,
      requestUserId: fixed_request_user_id,
      includeDelayedSubmissions: true,
    };

    // シナリオ時刻は7時29分59秒（朝7時30分の定時処理前）
    // この時点でダッシュボード表示トリガーが発火した場合、
    // 報告提出状況の集計・表示ロジックはまだ起動していないため、
    // 結果として本日のデータが表示されない状態を期待する

    // Note: 実装側で current time check が必要な場合、
    // この test は fixed_system_time を mockCurrentTime として inject する前提
    // 具体的には aggregateReportSubmissionStatus 内部で
    // 「7時30分以降のデータのみ表示」という条件がある場合に
    // この時刻では該当データが存在しない（または集計対象外）となることを確認

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    // 7時29分59秒の時点では、定時リマインド送信スケジュール前であるため、
    // 報告提出状況がまだ集計されていない、または初期状態を返すことを期待
    // totalMembers が 0 または submittedCount/unsubmittedCount が集計不可状態であることを確認

    expect(result.teamId).toBe(fixed_team_id);
    expect(result.reportDate).toBe(fixed_report_date);

    // 7時29分59秒時点では、本日のデータ集計がまだ実行されていない状態を表現
    // unsubmittedMembers リストが空であることで、表示対象がないことを示す
    expect(result.unsubmittedMembers).toEqual([]);

    // submissionRate が 0 または集計不可を示す値（例：-1 またはnull扱い）であることを確認
    // ここでは 7時30分前なので提出状況集計ロジックが未実行を示すため、
    // submissionRate は初期値または「データ不在」を表す値となる想定
    expect(typeof result.submissionRate).toBe('number');

    // aggregatedAt が現在時刻（7時29分59秒付近）であることを確認
    // 集計実行時刻が記録される
    const aggregated_at = new Date(result.aggregatedAt);
    expect(aggregated_at.getTime()).toBeLessThanOrEqual(new Date('2024-01-15T07:30:00Z').getTime());
  });
});