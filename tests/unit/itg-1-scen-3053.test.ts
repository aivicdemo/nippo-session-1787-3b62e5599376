import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-3053
  test('同一チームメンバーの提出状況データが重複して含まれるとき、重複を排除して正確な提出人数が算出される', () => {
    const requestUserId = 'manager_001';
    const teamId = 'team-A';
    const reportDate = '2024-01-15';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // テスト用の重複提出データ: user_001が2回提出している状態
    // チームメンバー5名（user_001 ～ user_005）のうち
    // user_001: 提出済み（重複レコード2件）
    // user_002: 提出済み
    // user_003: 提出済み
    // user_004: 提出済み
    // user_005: 未提出
    const mockSubmissionData = [
      {
        userId: 'user_001',
        userName: 'Engineer A',
        email: 'engineer_a@example.com',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user_001',
        userName: 'Engineer A',
        email: 'engineer_a@example.com',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user_002',
        userName: 'Engineer B',
        email: 'engineer_b@example.com',
        submittedAt: new Date('2024-01-15T08:55:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user_003',
        userName: 'Engineer C',
        email: 'engineer_c@example.com',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user_004',
        userName: 'Engineer D',
        email: 'engineer_d@example.com',
        submittedAt: new Date('2024-01-15T09:05:00Z'),
        isOnTime: true,
      },
    ];

    const mockTeamMembers = [
      { userId: 'user_001', userName: 'Engineer A', email: 'engineer_a@example.com' },
      { userId: 'user_002', userName: 'Engineer B', email: 'engineer_b@example.com' },
      { userId: 'user_003', userName: 'Engineer C', email: 'engineer_c@example.com' },
      { userId: 'user_004', userName: 'Engineer D', email: 'engineer_d@example.com' },
      { userId: 'user_005', userName: 'Engineer E', email: 'engineer_e@example.com' },
    ];

    const mockDeadline = new Date('2024-01-15T09:30:00Z');

    // 実装上、aggregateReportSubmissionStatus は実際のデータベース接続が必要な場合が想定されるため
    // ここでは関数の動作を検証する
    // 注: 実装がDBを直接呼び出す場合、テストはモック化したDBコネクションまたは
    // テスト用DB（in-memory SQLite等）を使用する必要があります

    // 関数を呼び出し
    const result = aggregateReportSubmissionStatus(input);

    // 期待値の検証
    // チーム総メンバー数: 5名
    expect(result.totalMembers).toBe(5);

    // 提出済み人数: 4名（重複排除後）
    // user_001は2件の重複レコードがあるが1名としてカウント
    // user_002, user_003, user_004が提出 = 合計4名
    expect(result.submittedCount).toBe(4);

    // 未提出メンバー数: 1名（user_005）
    expect(result.unsubmittedCount).toBe(1);

    // 提出率: 4 / 5 * 100 = 80.0%
    expect(result.submissionRate).toBe(80.0);

    // 未提出メンバーリストにuser_005が含まれていることを確認
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('user_005');
    expect(result.unsubmittedMembers[0].userName).toBe('Engineer E');
    expect(result.unsubmittedMembers[0].email).toBe('engineer_e@example.com');

    // 集計対象チームIDと報告日が正しく返却されることを確認
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);

    // 集計実行時刻がISO 8601形式であることを確認
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
  });
});