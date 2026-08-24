import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況の集計機能', () => {
  // SCEN-3033: [error] 本日の報告提出状況リアルタイム表示機能 - ユーザーIDリストが null のとき、対象メンバーの提出状況を判定できずエラーになる
  test('ユーザーIDリストが null の場合、メンバーリスト取得エラーが発生する', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'admin-user-001',
      includeDelayedSubmissions: true,
    };

    // ユーザーIDリストが null の状態でのエラー検証
    expect(() => aggregateReportSubmissionStatus(input, null)).toThrow(/メンバーリスト|メンバーID|メンバー/);
  });
});