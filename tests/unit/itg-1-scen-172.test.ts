import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ保持管理', () => {
  // SCEN-172
  test('アーカイブ移行時に課題データの整合性検証に失敗した場合、処理を中止して例外を発生させる', () => {
    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required'],
      aggregationPeriodStart: '2024-01-01T00:00:00Z',
      aggregationPeriodEnd: '2024-01-31T23:59:59Z',
    };

    expect(() => {
      archiveAndManageIssueDataRetention(retentionPolicy);
    }).toThrow(/整合性検証/);
  });
});