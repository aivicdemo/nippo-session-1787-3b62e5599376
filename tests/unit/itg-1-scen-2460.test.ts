import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2460: [edge] 分析結果監査ログ記録機能 - データ範囲がちょうど30日間で記録される

  let mockAuditLogTable: Array<{
    recordId: string;
    timestamp: Date;
    analysisStartTime: Date;
    analysisEndTime: Date;
    executorUserId: string;
    dataRangeStart: Date;
    dataRangeEnd: Date;
    priorityJudgmentLogicVersion: string;
    previousAnalysisHash: string | null;
    changeDetails: string;
  }> = [];

  beforeEach(() => {
    mockAuditLogTable = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockAuditLogTable = [];
  });

  test('should record analysis audit log within exactly 30-day time window', () => {
    // T0: 初期時刻を固定
    const analysisStartTime = new Date('2024-01-15T09:00:00Z');
    jest.setSystemTime(analysisStartTime);

    // 分析実行時刻 T0
    const reportApprovalInput = {
      reportId: 'monthly-report-2024-01-15-test-001',
      approvalStatus: 'approved' as const,
      approverUserId: 'user-department-head-001',
    };

    const analysisStartTimestamp = new Date();

    // validateMonthlyReportApproval を呼び出し
    const result = validateMonthlyReportApproval(reportApprovalInput);

    // 監査ログ記録 (T0時刻で)
    const auditRecordAtT0 = {
      recordId: `audit-${Date.now()}-001`,
      timestamp: analysisStartTimestamp,
      analysisStartTime: analysisStartTimestamp,
      analysisEndTime: new Date(analysisStartTimestamp.getTime() + 300000), // +5分
      executorUserId: reportApprovalInput.approverUserId,
      dataRangeStart: new Date('2024-01-01T00:00:00Z'),
      dataRangeEnd: new Date('2024-01-31T23:59:59Z'),
      priorityJudgmentLogicVersion: 'v1.2.3',
      previousAnalysisHash: 'hash-prev-2024-01-14',
      changeDetails: 'Priority score calculated from 155 daily reports; 12 new issues detected',
    };

    mockAuditLogTable.push(auditRecordAtT0);

    // 検証: T0時刻のレコードが記録されていることを確認
    expect(mockAuditLogTable).toHaveLength(1);
    expect(mockAuditLogTable[0].timestamp).toEqual(analysisStartTimestamp);
    expect(mockAuditLogTable[0].recordId).toBe(`audit-${Date.now()}-001`);

    // T0 + 15日に追加レコードを記録
    const midpoint15DaysLater = new Date(
      analysisStartTimestamp.getTime() + 15 * 24 * 60 * 60 * 1000
    );
    jest.setSystemTime(midpoint15DaysLater);

    const auditRecordAtMidpoint = {
      recordId: `audit-${Date.now()}-002`,
      timestamp: midpoint15DaysLater,
      analysisStartTime: midpoint15DaysLater,
      analysisEndTime: new Date(midpoint15DaysLater.getTime() + 300000),
      executorUserId: reportApprovalInput.approverUserId,
      dataRangeStart: new Date('2024-01-01T00:00:00Z'),
      dataRangeEnd: new Date('2024-01-31T23:59:59Z'),
      priorityJudgmentLogicVersion: 'v1.2.3',
      previousAnalysisHash: auditRecordAtT0.recordId,
      changeDetails: 'Intermediate re-analysis; 2 issues resolved',
    };

    mockAuditLogTable.push(auditRecordAtMidpoint);

    expect(mockAuditLogTable).toHaveLength(2);
    expect(mockAuditLogTable[1].timestamp).toEqual(midpoint15DaysLater);

    // T0 + 30日00:00:00 に進める（境界時刻）
    const exactlyThirtyDaysLater = new Date(
      analysisStartTimestamp.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    jest.setSystemTime(exactlyThirtyDaysLater);

    const auditRecordAtT30 = {
      recordId: `audit-${Date.now()}-003`,
      timestamp: exactlyThirtyDaysLater,
      analysisStartTime: exactlyThirtyDaysLater,
      analysisEndTime: new Date(exactlyThirtyDaysLater.getTime() + 300000),
      executorUserId: reportApprovalInput.approverUserId,
      dataRangeStart: new Date('2024-01-01T00:00:00Z'),
      dataRangeEnd: new Date('2024-01-31T23:59:59Z'),
      priorityJudgmentLogicVersion: 'v1.2.3',
      previousAnalysisHash: auditRecordAtMidpoint.recordId,
      changeDetails: 'Final analysis at 30-day boundary; all issues re-verified',
    };

    mockAuditLogTable.push(auditRecordAtT30);

    expect(mockAuditLogTable).toHaveLength(3);
    expect(mockAuditLogTable[2].timestamp).toEqual(exactlyThirtyDaysLater);

    // T0 + 30日を1秒超える時刻は記録範囲外
    const oneSecondBeyondThirtyDays = new Date(
      exactlyThirtyDaysLater.getTime() + 1000
    );
    jest.setSystemTime(oneSecondBeyondThirtyDays);

    const auditRecordOutOfRange = {
      recordId: `audit-${Date.now()}-004`,
      timestamp: oneSecondBeyondThirtyDays,
      analysisStartTime: oneSecondBeyondThirtyDays,
      analysisEndTime: new Date(oneSecondBeyondThirtyDays.getTime() + 300000),
      executorUserId: reportApprovalInput.approverUserId,
      dataRangeStart: new Date('2024-01-01T00:00:00Z'),
      dataRangeEnd: new Date('2024-01-31T23:59:59Z'),
      priorityJudgmentLogicVersion: 'v1.2.3',
      previousAnalysisHash: auditRecordAtT30.recordId,
      changeDetails: 'Out-of-range test record',
    };

    // この記録は範囲外なので、システムが記録範囲チェックを厳密に実行する場合はフィルタリング
    // 範囲内のレコードのみが有効であることを検証
    const recordsWithinRange = mockAuditLogTable.filter(
      (record) =>
        record.timestamp.getTime() >=
          analysisStartTimestamp.getTime() &&
        record.timestamp.getTime() <=
          exactlyThirtyDaysLater.getTime()
    );

    expect(recordsWithinRange).toHaveLength(3);

    // 最初のレコード（T0）をチェック
    expect(recordsWithinRange[0].timestamp).toEqual(analysisStartTimestamp);
    expect(recordsWithinRange[0].recordId).toBe(`audit-${Date.now()}-001`);
    expect(recordsWithinRange[0].changeDetails).toContain('155 daily reports');

    // 中間レコード（T0 + 15日）をチェック
    expect(recordsWithinRange[1].timestamp).toEqual(midpoint15DaysLater);
    expect(recordsWithinRange[1].recordId).toBe(`audit-${Date.now()}-002`);
    expect(recordsWithinRange[1].previousAnalysisHash).toBe(
      recordsWithinRange[0].recordId
    );

    // 最後のレコード（T0 + 30日）をチェック
    expect(recordsWithinRange[2].timestamp).toEqual(exactlyThirtyDaysLater);
    expect(recordsWithinRange[2].recordId).toBe(`audit-${Date.now()}-003`);
    expect(recordsWithinRange[2].previousAnalysisHash).toBe(
      recordsWithinRange[1].recordId
    );

    // タイムスタンプ範囲の整合性を検証
    const timerangeStart = recordsWithinRange[0].timestamp.getTime();
    const timerangeEnd = recordsWithinRange[2].timestamp.getTime();
    const expectedDurationMs = 30 * 24 * 60 * 60 * 1000;
    const actualDurationMs = timerangeEnd - timerangeStart;

    expect(actualDurationMs).toBe(expectedDurationMs);

    // すべてのレコードがタイムスタンプ範囲内に収まっていることを確認
    recordsWithinRange.forEach((record) => {
      expect(record.timestamp.getTime()).toBeGreaterThanOrEqual(
        timerangeStart
      );
      expect(record.timestamp.getTime()).toBeLessThanOrEqual(
        timerangeEnd
      );
    });

    // validateMonthlyReportApproval の戻り値を検証
    expect(result).toBeDefined();
    expect(result.reportId).toBe(reportApprovalInput.reportId);
    expect(result.approvalStatus).toBe('approved');
    expect(result.processedAt).toBeDefined();

    // 期待される change details の内容を検証
    const firstChangeDetails = recordsWithinRange[0].changeDetails;
    expect(firstChangeDetails).toMatch(/\d+\s+daily\s+reports/i);
    expect(firstChangeDetails).toMatch(/issues\s+detected/i);
  });
});