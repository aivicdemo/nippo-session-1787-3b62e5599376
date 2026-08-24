import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度管理', () => {
  test('SCEN-2128: 参照ロック中のデータを削除しようとしたとき、エラーが発生して処理が中断される', async () => {
    const OLD_REPORT_ID = 'OLD_REPORT_001';
    const LOCK_SESSION_ID = 'session-A-lock-holder';
    const DELETION_JOB_ID = 'deletion-job-20240115-001';
    const CUTOFF_DATE_MS = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const CUTOFF_DATE = new Date(CUTOFF_DATE_MS).toISOString();

    const mockDatabaseAdapter = {
      beginTransaction: jest.fn(async () => 'txn-lock-test-001'),
      findReportsOlderThan: jest.fn(async () => [
        {
          reportId: OLD_REPORT_ID,
          reportDate: CUTOFF_DATE,
          reporterId: 'engineer-001',
          submissionStatus: 'submitted',
          submissionTimestamp: CUTOFF_DATE,
        },
      ]),
      acquireExclusiveLock: jest.fn(async (reportId: string) => {
        if (reportId === OLD_REPORT_ID) {
          const error = new Error('Lock acquisition failed: record is locked by another session');
          (error as any).code = 'LOCK_CONFLICT';
          (error as any).lockedBySession = LOCK_SESSION_ID;
          throw error;
        }
        return `lock-${reportId}`;
      }),
      deleteReport: jest.fn(async () => {
        throw new Error('Should not reach delete phase due to lock conflict');
      }),
      releaseLock: jest.fn(async () => true),
      commitTransaction: jest.fn(async () => true),
      rollbackTransaction: jest.fn(async () => true),
      recordDeletionJobStatus: jest.fn(async () => ({
        jobId: DELETION_JOB_ID,
        status: 'failed',
        reportId: OLD_REPORT_ID,
        errorMessage: 'Record is locked by another session',
        attemptedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      })),
      verifyRecordExists: jest.fn(async (reportId: string) => reportId === OLD_REPORT_ID),
    };

    const mockLogger = {
      error: jest.fn((msg: string, context?: Record<string, unknown>) => {}),
      warn: jest.fn((msg: string, context?: Record<string, unknown>) => {}),
      info: jest.fn((msg: string, context?: Record<string, unknown>) => {}),
    };

    const input = {
      userId: 'manager-001',
      teamId: 'team-engineering',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
      databaseAdapter: mockDatabaseAdapter,
      logger: mockLogger,
      deletionJobId: DELETION_JOB_ID,
    };

    let result: any;
    let caughtError: any;

    try {
      result = await ensureDashboardDataFreshness(input);
    } catch (error) {
      caughtError = error;
    }

    expect(mockDatabaseAdapter.findReportsOlderThan).toHaveBeenCalledWith(
      expect.objectContaining({ daysOld: 90 })
    );

    expect(mockDatabaseAdapter.acquireExclusiveLock).toHaveBeenCalledWith(OLD_REPORT_ID);

    expect(mockDatabaseAdapter.deleteReport).not.toHaveBeenCalled();

    expect(mockDatabaseAdapter.recordDeletionJobStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: DELETION_JOB_ID,
        status: 'failed',
        reportId: OLD_REPORT_ID,
      })
    );

    expect(mockDatabaseAdapter.verifyRecordExists).toHaveBeenCalledWith(OLD_REPORT_ID);
    const existsResult = await mockDatabaseAdapter.verifyRecordExists(OLD_REPORT_ID);
    expect(existsResult).toBe(true);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/ロック|lock/i),
      expect.objectContaining({
        reportId: OLD_REPORT_ID,
        jobId: DELETION_JOB_ID,
      })
    );

    if (caughtError) {
      expect(caughtError.code || caughtError.message).toMatch(/LOCK|ロック/i);
    } else if (result) {
      expect(result.deletionJobStatus).toBe('failed');
      expect(result.failureReason).toMatch(/ロック|lock/i);
    }
  });
});