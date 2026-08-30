import { describe, test, expect } from '@jest/globals';
import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - archiveAndManageIssueDataRetention', () => {
  test('SCEN-523: Should throw InvalidRetentionPolicyError when protectedDataCategories is empty', () => {
    const policy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: []
    };

    expect(() => archiveAndManageIssueDataRetention(policy)).toThrow(/保持期間ルール/);
  });
});