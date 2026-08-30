import { retrieveIssueDataByCondition, type IssueSearchCondition } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - Search Condition Validation', () => {
  // SCEN-166
  test('should throw InvalidSearchConditionError when startDate is after endDate and keywords contain empty string', () => {
    const invalidCondition: IssueSearchCondition = {
      startDate: new Date('2026-08-20T00:00:00Z'),
      endDate: new Date('2026-08-19T00:00:00Z'),
      keywords: [''],
    };

    expect(() => retrieveIssueDataByCondition(invalidCondition)).toThrow(/検索条件が無効です。日付範囲とキーワードを確認してください。/);
  });
});