import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  test('SCEN-2723: 修正操作時刻が修正可能期間の前日以前のとき修正禁止エラーが発生する', () => {
    // Arrange: 修正可能期限が2026年1月10日に設定された報告記録
    const modificationDeadline = new Date('2026-01-10T09:00:00Z');

    // 現在日時を2026年1月8日（修正可能期限の前日以前）に設定
    const currentTimestamp = new Date('2026-01-08T14:30:00Z');

    // Act & Assert: 修正禁止エラーが発生することを検証
    expect(() => {
      validateReportModificationWindow({
        modificationDeadline,
        currentTimestamp,
      });
    }).toThrow(/修正可能期限/);
  });
});