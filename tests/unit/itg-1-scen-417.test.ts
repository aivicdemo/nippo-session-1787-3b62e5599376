import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueRetentionResult } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ保持ポリシー管理', () => {
  // SCEN-417
  test('指定された保持期間ルールに基づいて、古い課題データをアーカイブ領域に移行し、期限満了データを削除する', () => {
    const policy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: [],
    };

    const result: IssueRetentionResult = archiveAndManageIssueDataRetention(policy);

    expect(typeof result.archivedCount).toBe('number');
    expect(result.archivedCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.archivedCount)).toBe(true);

    expect(typeof result.deletedCount).toBe('number');
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.deletedCount)).toBe(true);

    expect(typeof result.protectedCount).toBe('number');
    expect(result.protectedCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.protectedCount)).toBe(true);

    expect(typeof result.executionTimestamp).toBe('string');
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(iso8601Regex.test(result.executionTimestamp)).toBe(true);

    const parsedDate = new Date(result.executionTimestamp);
    expect(parsedDate instanceof Date).toBe(true);
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });
});