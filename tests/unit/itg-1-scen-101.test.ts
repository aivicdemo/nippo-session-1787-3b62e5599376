import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況（提出済み・未提出）をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-101
  test('[error] 提出期限時刻が不正な日時フォーマットのとき、エラーが発生する', () => {
    const invalidInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2026-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true
    };

    expect(() => {
      aggregateReportSubmissionStatus(invalidInput, '2026-13-45T30:70:90');
    }).toThrow(/日時フォーマット/);
  });
});