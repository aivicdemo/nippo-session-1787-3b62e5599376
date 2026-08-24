import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-2798
  test('月をまたぐ期間における報告提出状況の集計が正確に行われる', () => {
    // テストデータ準備
    // 前月（2024年11月）に5件、当月（2024年12月）に8件の提出記録
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';
    const reportDate = '2024-12-15'; // 集計対象の報告日

    // 前月分の提出記録（2024年11月1日～11月30日）
    const submissionRecordsNovember = [
      {
        userId: 'user-001',
        teamId: teamId,
        reportDate: '2024-11-01',
        submittedAt: new Date('2024-11-01T08:30:00Z'),
      },
      {
        userId: 'user-002',
        teamId: teamId,
        reportDate: '2024-11-05',
        submittedAt: new Date('2024-11-05T09:00:00Z'),
      },
      {
        userId: 'user-003',
        teamId: teamId,
        reportDate: '2024-11-10',
        submittedAt: new Date('2024-11-10T08:45:00Z'),
      },
      {
        userId: 'user-004',
        teamId: teamId,
        reportDate: '2024-11-15',
        submittedAt: new Date('2024-11-15T09:15:00Z'),
      },
      {
        userId: 'user-005',
        teamId: teamId,
        reportDate: '2024-11-20',
        submittedAt: new Date('2024-11-20T08:50:00Z'),
      },
    ];

    // 当月分の提出記録（2024年12月1日～12月31日）
    const submissionRecordsDecember = [
      {
        userId: 'user-001',
        teamId: teamId,
        reportDate: '2024-12-01',
        submittedAt: new Date('2024-12-01T08:30:00Z'),
      },
      {
        userId: 'user-002',
        teamId: teamId,
        reportDate: '2024-12-02',
        submittedAt: new Date('2024-12-02T09:00:00Z'),
      },
      {
        userId: 'user-003',
        teamId: teamId,
        reportDate: '2024-12-05',
        submittedAt: new Date('2024-12-05T08:45:00Z'),
      },
      {
        userId: 'user-004',
        teamId: teamId,
        reportDate: '2024-12-10',
        submittedAt: new Date('2024-12-10T09:15:00Z'),
      },
      {
        userId: 'user-005',
        teamId: teamId,
        reportDate: '2024-12-12',
        submittedAt: new Date('2024-12-12T08:50:00Z'),
      },
      {
        userId: 'user-006',
        teamId: teamId,
        reportDate: '2024-12-15',
        submittedAt: new Date('2024-12-15T08:35:00Z'),
      },
      {
        userId: 'user-007',
        teamId: teamId,
        reportDate: '2024-12-18',
        submittedAt: new Date('2024-12-18T09:10:00Z'),
      },
      {
        userId: 'user-008',
        teamId: teamId,
        reportDate: '2024-12-20',
        submittedAt: new Date('2024-12-20T08:55:00Z'),
      },
    ];

    // 集計対象期間の設定
    // 入力パラメータ
    const input = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // 関数呼び出し
    // 注：実装では内部的にデータベースから指定チーム・期間の提出履歴を取得
    // テストではモック化したデータを想定
    const result = aggregateReportSubmissionStatus(input);

    // 期待結果の検証
    // 総提出件数 = 13件（前月5件 + 当月8件）
    expect(result.totalSubmissions).toBe(13);

    // 前月の提出件数が正確に集計されている
    expect(result.submissionsByMonth).toEqual(
      expect.objectContaining({
        '2024-11': {
          submittedCount: 5,
          totalRecords: submissionRecordsNovember.length,
        },
      })
    );

    // 当月の提出件数が正確に集計されている
    expect(result.submissionsByMonth).toEqual(
      expect.objectContaining({
        '2024-12': {
          submittedCount: 8,
          totalRecords: submissionRecordsDecember.length,
        },
      })
    );

    // 集計結果がReportSubmissionStatusSummary型に準拠していることを確認
    expect(result).toEqual(
      expect.objectContaining({
        teamId: teamId,
        reportDate: reportDate,
        totalMembers: expect.any(Number),
        submittedCount: expect.any(Number),
        unsubmittedCount: expect.any(Number),
        delayedSubmissionCount: expect.any(Number),
        submissionRate: expect.any(Number),
        unsubmittedMembers: expect.any(Array),
        aggregatedAt: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
        ),
      })
    );

    // 提出率の計算が正確であることを確認
    // 提出率は 0～100 の範囲で、小数第1位まで
    expect(result.submissionRate).toBeGreaterThanOrEqual(0);
    expect(result.submissionRate).toBeLessThanOrEqual(100);
    expect(result.submissionRate % 0.1).toBeLessThan(0.01);

    // 集計実行時刻がISO 8601形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 月をまたぐ期間の集計が一貫性を保っていることを確認
    const totalFromMonthly =
      (result.submissionsByMonth['2024-11']?.submittedCount || 0) +
      (result.submissionsByMonth['2024-12']?.submittedCount || 0);
    expect(result.submittedCount).toBeGreaterThanOrEqual(totalFromMonthly);
  });
});