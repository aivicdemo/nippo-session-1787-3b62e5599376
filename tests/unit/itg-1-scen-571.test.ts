import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence', () => {
  // SCEN-571
  test('should throw InvalidRetentionPolicyError when aggregationPeriodStart is in the future relative to current time', () => {
    const currentTime = new Date('2026-01-15T12:00:00Z');
    const mockNow = jest.spyOn(Date, 'now').mockReturnValue(currentTime.getTime());

    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: [],
      aggregationPeriodStart: '2026-01-20',
      aggregationPeriodEnd: '2026-02-15'
    };

    expect(() => archiveAndManageIssueDataRetention(retentionPolicy)).toThrow(/集約期間は過去の日付範囲で指定してください/);

    mockNow.mockRestore();
  });
});