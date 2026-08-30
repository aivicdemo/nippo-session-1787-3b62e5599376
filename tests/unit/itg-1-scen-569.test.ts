import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';

describe('archiveAndManageIssueDataRetention', () => {
  // SCEN-569: [normal] 指定された保持期間ルールに基づいて、古い課題データをアーカイブ領域に移行し、期限満了データを削除する
  test('should correctly categorize report records into active retention, archive, and delete based on policy', () => {
    const reportingPeriodStartDate = new Date('2026-01-01T00:00:00Z');
    const reportingPeriodEndDate = new Date('2026-01-31T23:59:59Z');
    const currentDate = new Date('2026-02-15T00:00:00Z');

    const allReportRecords = [
      {
        reportDate: new Date('2026-01-15T00:00:00Z'),
        employeeId: 'emp_A',
        content: 'タスク完了',
      },
      {
        reportDate: new Date('2026-01-25T00:00:00Z'),
        employeeId: 'emp_B',
        content: '会議実施',
      },
      {
        reportDate: new Date('2025-12-01T00:00:00Z'),
        employeeId: 'emp_C',
        content: '課題検出',
      },
      {
        reportDate: new Date('2025-02-01T00:00:00Z'),
        employeeId: 'emp_D',
        content: '対応完了',
      },
      {
        reportDate: new Date('2026-02-05T00:00:00Z'),
        employeeId: 'emp_E',
        content: '新規報告',
      },
    ];

    const result = archiveAndManageIssueDataRetention(
      reportingPeriodStartDate,
      reportingPeriodEndDate,
      currentDate,
      allReportRecords
    );

    expect(result.activeRetentionRecords).toHaveLength(2);
    expect(result.activeRetentionRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportDate: new Date('2026-01-15T00:00:00Z'),
          employeeId: 'emp_A',
          content: 'タスク完了',
        }),
        expect.objectContaining({
          reportDate: new Date('2026-01-25T00:00:00Z'),
          employeeId: 'emp_B',
          content: '会議実施',
        }),
      ])
    );

    expect(result.archiveRecords).toHaveLength(1);
    expect(result.archiveRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportDate: new Date('2025-12-01T00:00:00Z'),
          employeeId: 'emp_C',
          content: '課題検出',
        }),
      ])
    );

    expect(result.deleteRecords).toHaveLength(1);
    expect(result.deleteRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportDate: new Date('2025-02-01T00:00:00Z'),
          employeeId: 'emp_D',
          content: '対応完了',
        }),
      ])
    );

    expect(result.retentionPolicy).toBe(
      '集約期間内を現用、期間外をアーカイブ、1年超過を削除'
    );
  });
});