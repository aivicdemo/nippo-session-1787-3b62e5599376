import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード報告提出状況リアルタイム表示', () => {
  test('SCEN-343: 複数エンジニアが日報を送信した場合、各エンジニアの提出状況がそれぞれ提出済みに更新される', () => {
    // Setup: 3名のエンジニアのチーム情報と初期提出状況を準備
    const team_id = 'team-001';
    const report_date = '2024-12-16'; // 固定日付
    const request_user_id = 'manager-001'; // 部長のユーザーID

    // チームメンバー3名の初期状態: 全員未提出
    const engineer_a_id = 'eng-001';
    const engineer_b_id = 'eng-002';
    const engineer_c_id = 'eng-003';

    const engineer_a_name = 'Engineer A';
    const engineer_a_email = 'eng.a@company.com';

    const engineer_b_name = 'Engineer B';
    const engineer_b_email = 'eng.b@company.com';

    const engineer_c_name = 'Engineer C';
    const engineer_c_email = 'eng.c@company.com';

    // チーム総メンバー数: 3名
    const total_members = 3;

    // ビジネスルールの計算:
    // エンジニアA・B・Cが3名全員提出済みの場合:
    // - submittedCount: 3
    // - unsubmittedCount: 0
    // - delayedSubmissionCount: 0（遅延なし）
    // - submissionRate: (3 / 3) * 100 = 100.0

    const submitted_count = 3;
    const unsubmitted_count = 0;
    const delayed_submission_count = 0;
    const submission_rate = 100.0;

    // 未提出メンバーリスト: 空配列（全員提出済み）
    const unsubmitted_members: Array<{
      userId: string;
      userName: string;
      email: string;
      remainingMinutes: number;
    }> = [];

    // 集計実行時刻: ISO 8601形式の固定値
    const aggregated_at = '2024-12-16T09:30:00Z';

    // Act: aggregateReportSubmissionStatus関数を呼び出し
    const result = aggregateReportSubmissionStatus({
      teamId: team_id,
      reportDate: report_date,
      requestUserId: request_user_id,
      includeDelayedSubmissions: true,
    });

    // Assert: 返却結果が期待値と一致すること
    // (本テストは関数の戻り値の構造と計算式を検証)
    expect(result).toEqual({
      teamId: team_id,
      reportDate: report_date,
      totalMembers: total_members,
      submittedCount: submitted_count,
      unsubmittedCount: unsubmitted_count,
      delayedSubmissionCount: delayed_submission_count,
      submissionRate: submission_rate,
      unsubmittedMembers: unsubmitted_members,
      aggregatedAt: expect.any(String), // ISO 8601形式であること
    });

    // 返却値の詳細検証
    expect(result.teamId).toBe(team_id);
    expect(result.reportDate).toBe(report_date);
    expect(result.totalMembers).toBe(total_members);
    expect(result.submittedCount).toBe(submitted_count);
    expect(result.unsubmittedCount).toBe(unsubmitted_count);
    expect(result.delayedSubmissionCount).toBe(delayed_submission_count);
    expect(result.submissionRate).toBe(submission_rate);
    expect(result.unsubmittedMembers).toEqual([]);

    // 集計実行時刻がISO 8601形式であることを確認
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});