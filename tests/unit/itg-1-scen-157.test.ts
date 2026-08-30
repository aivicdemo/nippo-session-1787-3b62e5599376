import { deleteArchivedReports } from '../../src/logic/report-persistence';
import type { DeleteArchivedReportsInput, DeleteArchivedReportsOutput, ExecutionContext } from '../../src/logic/report-persistence';

describe('deleteArchivedReports', () => {
  test('SCEN-157: [normal] アーカイブ領域に1年以上保持されている日報データを削除し、システムのストレージを効率化する', () => {
    // テスト用の ExecutionContext オブジェクトを準備
    const executionContext: ExecutionContext = {
      systemUserId: 'admin-001',
      operationTimestamp: '2025-01-15T09:30:00Z'
    };

    // DeleteArchivedReportsInput オブジェクトを作成（保持期間365日）
    const input: DeleteArchivedReportsInput = {
      retentionThresholdDays: 365,
      executionContext: executionContext
    };

    // deleteArchivedReports を呼び出す
    const output: DeleteArchivedReportsOutput = deleteArchivedReports(input);

    // 削除された日報レコード数の検証（365日以上前の3件）
    expect(output.deletedReportCount).toBe(3);

    // 削除操作の完了日時がISO 8601形式であることを検証
    expect(output.deletionCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 削除操作の完了日時が妥当な値であることを検証
    const completionTime = new Date(output.deletionCompletedAt);
    expect(completionTime.getTime()).toBeLessThanOrEqual(new Date('2025-01-15T09:35:00Z').getTime());
    expect(completionTime.getTime()).toBeGreaterThanOrEqual(new Date('2025-01-15T09:25:00Z').getTime());

    // 監査ログIDの検証
    expect(output.auditLogId).toBe('audit-log-2025-01-15-001');
  });
});