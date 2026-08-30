import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ保持期間管理', () => {
  test('SCEN-570: 集約対象期間の開始日が終了日より後のときはエラーを発生させる', () => {
    const invalidPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: [],
      aggregationPeriodStart: '2025-12-31',
      aggregationPeriodEnd: '2025-12-01',
    };

    expect(() => archiveAndManageIssueDataRetention(invalidPolicy)).toThrow(/集約期間/);
  });
});