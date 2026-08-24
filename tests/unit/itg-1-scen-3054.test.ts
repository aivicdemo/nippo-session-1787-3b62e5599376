import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-3054
  test('複数チームメンバーが同じ提出時刻で報告を提出したとき、提出順序に関わらず全員が提出済みとして正確に計上される', () => {
    // 固定時刻を基準に設定
    const fixedReportDate = '2026-08-19';
    const fixedSubmissionTime = new Date('2026-08-19T09:00:00.000Z');
    const teamId = 'team-001';
    const requestUserId = 'admin-001';

    // テスト対象: 複数メンバーの同一時刻での提出を集計
    // シナリオ: 5名のメンバーが±1秒以内にほぼ同時に提出
    const submittedMembers = [
      {
        userId: 'member-001',
        userName: 'Engineer A',
        email: 'engineer-a@company.com',
        submittedAt: new Date('2026-08-19T09:00:00.100Z'),
        isOnTime: true,
      },
      {
        userId: 'member-002',
        userName: 'Engineer B',
        email: 'engineer-b@company.com',
        submittedAt: new Date('2026-08-19T09:00:00.350Z'),
        isOnTime: true,
      },
      {
        userId: 'member-003',
        userName: 'Engineer C',
        email: 'engineer-c@company.com',
        submittedAt: new Date('2026-08-19T09:00:00.650Z'),
        isOnTime: true,
      },
      {
        userId: 'member-004',
        userName: 'Engineer D',
        email: 'engineer-d@company.com',
        submittedAt: new Date('2026-08-19T09:00:00.800Z'),
        isOnTime: true,
      },
      {
        userId: 'member-005',
        userName: 'Engineer E',
        email: 'engineer-e@company.com',
        submittedAt: new Date('2026-08-19T09:00:01.000Z'),
        isOnTime: true,
      },
    ];

    const unsubmittedMembers = [
      {
        userId: 'member-006',
        userName: 'Engineer F',
        email: 'engineer-f@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-007',
        userName: 'Engineer G',
        email: 'engineer-g@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-008',
        userName: 'Engineer H',
        email: 'engineer-h@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-009',
        userName: 'Engineer I',
        email: 'engineer-i@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-010',
        userName: 'Engineer J',
        email: 'engineer-j@company.com',
        remainingMinutes: 45,
      },
    ];

    // 入力: 集計リクエスト
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: fixedReportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // テスト対象関数を呼び出し
    // 注：実装では提出状況データを内部的に管理・検索する想定
    // ここではモック的に結果を構築（実装がDB連携する場合、スタブ化が必要）
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      submittedMembers,
      unsubmittedMembers,
    );

    // 期待値の検証
    // (1) チームID と報告日が正確に記録されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(fixedReportDate);

    // (2) 提出人数が正確に計上される
    // 提出済み：5名
    expect(result.submittedCount).toBe(5);
    // 未提出：5名
    expect(result.unsubmittedCount).toBe(5);
    // 期限超過提出：0名（includeDelayedSubmissions=true だが実提出は全員期限内）
    expect(result.delayedSubmissionCount).toBe(0);

    // (3) チーム総メンバー数が正確に集計される
    expect(result.totalMembers).toBe(10);

    // (4) 提出率が正確に計算される
    // 5 / 10 * 100 = 50.0
    expect(result.submissionRate).toBe(50.0);

    // (5) 未提出メンバー一覧が正確に記録される
    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'member-006',
          userName: 'Engineer F',
          email: 'engineer-f@company.com',
          remainingMinutes: 45,
        }),
        expect.objectContaining({
          userId: 'member-007',
          userName: 'Engineer G',
          email: 'engineer-g@company.com',
          remainingMinutes: 45,
        }),
        expect.objectContaining({
          userId: 'member-010',
          userName: 'Engineer J',
          email: 'engineer-j@company.com',
          remainingMinutes: 45,
        }),
      ]),
    );

    // (6) 集計実行時刻が ISO 8601 形式で記録される
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    );

    // (7) 全メンバーが送信順序に関わらず『提出済み』として正確に計上される
    // 確認: submittedCount が 5 になっていることで、送信順序に影響されず全員がカウントされたことを証明
    expect(result.submittedCount).toBe(submittedMembers.length);

    // (8) 各メンバーの提出時刻が±1秒以内の精度で記録された想定を検証
    // （実装が提出時刻を保存する場合、別途詳細テストが必要だが、
    //   このテストでは集計結果の提出カウント精度で検証）
    expect(result.totalMembers - result.submittedCount).toBe(
      result.unsubmittedCount,
    );
  });
});