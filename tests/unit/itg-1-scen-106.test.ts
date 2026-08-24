import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-106
  test('部長が対象チームに所属していないとき、権限なしエラーが発生する', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_X',
      reportDate: '2024-01-15',
      requestUserId: 'manager_001',
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/権限|アクセス/);
  });
});