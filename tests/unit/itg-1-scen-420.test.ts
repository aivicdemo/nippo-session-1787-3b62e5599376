import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import type { IssueRetentionPolicy } from '../../src/logic/issue-data-persistence';

describe('Issue Data Retention Management', () => {
  test('SCEN-420: Should throw InvalidRetentionPolicyError when archiveDaysThreshold is 0', () => {
    const invalidPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 0,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required'],
    };

    expect(() => archiveAndManageIssueDataRetention(invalidPolicy)).toThrow(/保持期間ルール/);
  });
});