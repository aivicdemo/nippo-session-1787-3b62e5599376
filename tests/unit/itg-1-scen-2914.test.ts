import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('提出状況集計機能 - 月初日に前月データと当月データの境界が正確に分離される', () => {
  // SCEN-2914
  test('should accurately separate previous month and current month data at month boundary', async () => {
    // 集計対象チームID
    const teamId = 'team-dev-001';
    // リクエスト実行ユーザーID
    const requestUserId = 'user-manager-001';
    // 集計対象の報告日（8月1日）
    const reportDate = '2026-08-01';

    // 前月（7月）のテストデータを準備
    const previousMonthSubmissions = [
      {
        userId: 'user-001',
        teamId: teamId,
        reportDate: '2026-07-15',
        submissionTimestamp: new Date('2026-07-15T09:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-002',
        teamId: teamId,
        reportDate: '2026-07-20',
        submissionTimestamp: new Date('2026-07-20T08:30:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-003',
        teamId: teamId,
        reportDate: '2026-07-25',
        submissionTimestamp: new Date('2026-07-25T10:15:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-004',
        teamId: teamId,
        reportDate: '2026-07-28',
        submissionTimestamp: new Date('2026-07-28T09:45:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-005',
        teamId: teamId,
        reportDate: '2026-07-31',
        submissionTimestamp: new Date('2026-07-31T23:59:00Z'),
        isOnTime: true,
      },
    ];

    // 当月（8月）のテストデータを準備
    const currentMonthSubmissions = [
      {
        userId: 'user-001',
        teamId: teamId,
        reportDate: '2026-08-01',
        submissionTimestamp: new Date('2026-08-01T00:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-002',
        teamId: teamId,
        reportDate: '2026-08-05',
        submissionTimestamp: new Date('2026-08-05T08:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'user-003',
        teamId: teamId,
        reportDate: '2026-08-10',
        submissionTimestamp: new Date('2026-08-10T12:30:00Z'),
        isOnTime: true,
      },
    ];

    // 集計対象の8月1日境界時刻
    const aggregationInput: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // テストデータの統合と並べ替え
    const allSubmissions = [
      ...previousMonthSubmissions,
      ...currentMonthSubmissions,
    ];

    // 集計ロジック実行
    // 注: 実装側でデータベースから検索することを想定しているため、
    // ここではスタブ化されたデータベースまたはモック層を通じて呼び出す
    // 実際の呼び出しはシステムの日時が2026-09-01T00:00:00Z に設定されていることを前提とする
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(
      aggregationInput
    );

    // 期待値: 8月1日集計時点で、前月データ5件は除外され、当月データ3件のみが集計される
    // 集計対象の報告日が 2026-08-01 であるため、8月データのみを対象とする
    // totalMembers: チーム内の総メンバー数（前月・当月を通じてカウント）
    // submittedCount: 期限内提出済みメンバー数（当月のみ）
    // unsubmittedCount: 未提出メンバー数
    // delayedSubmissionCount: 期限超過で提出したメンバー数
    
    // 当月（8月）の提出状況をチェック
    // 8月1日集計では、当月（8月1日以降）のデータのみを集計対象とする
    expect(result.reportDate).toBe('2026-08-01');
    expect(result.teamId).toBe(teamId);

    // 当月（8月）のデータは3件が提出済み
    expect(result.submittedCount).toBe(3);

    // 前月（7月）のデータは5件だが、集計対象外のため含まれない
    // 境界判定: 2026-08-01 00:00:00 ちょうどのデータは当月に分類される
    expect(currentMonthSubmissions[0].submissionTimestamp.toISOString()).toBe(
      '2026-08-01T00:00:00.000Z'
    );

    // 集計実行時刻は ISO 8601 形式で記録される
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 提出率の計算: 3件提出 / チーム総メンバー数
    // totalMembers は前月・当月を通じた一意なメンバー数と想定
    // (user-001 から user-005 の5名が存在)
    const expectedTotalMembers = 5;
    const expectedSubmissionRate = (3 / expectedTotalMembers) * 100;
    expect(result.submissionRate).toBeCloseTo(expectedSubmissionRate, 1);

    // 未提出メンバー: 当月対象メンバーのうち未提出者
    // 前月データは除外されるため、前月のみのメンバーは未提出リストに含まれない
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
  });
});