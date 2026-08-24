import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Display', () => {
  // SCEN-3035: [error] 本日の報告提出状況リアルタイム表示機能 - 報告提出状況テーブルからのデータ読み込みが null のとき、提出有無の判定ができずエラーになる
  test('should handle null data from report submission status table and trigger error handling', async () => {
    const testInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-admin-001',
      includeDelayedSubmissions: true,
    };

    // Mock the database query to return null, simulating data loading failure
    const mockDatabaseQuery = jest.fn().mockResolvedValue(null);

    // Attempt to call aggregateReportSubmissionStatus with mocked null data
    // The function should throw an error when null is encountered during processing
    const result = aggregateReportSubmissionStatus(
      testInput,
      mockDatabaseQuery as any
    );

    // Assert that the function either throws or returns an error state
    // when the database returns null
    await expect(result).rejects.toThrow(/報告提出状況テーブル/);
  });
});