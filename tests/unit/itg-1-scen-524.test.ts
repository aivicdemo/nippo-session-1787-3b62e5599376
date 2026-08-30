import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueDataArchivalItem } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - Archive and Retention Management', () => {
  test('SCEN-524: should throw InvalidRetentionPolicyError when issue createdAt is after current date', () => {
    const currentDate = new Date('2025-01-15T00:00:00Z');
    const futureDate = new Date('2025-01-16T00:00:00Z');

    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required'],
    };

    const issueDataWithFutureDate: IssueDataArchivalItem[] = [
      {
        issueExtractionResultId: 'issue-001',
        reportId: 'report-001',
        issueContent: 'Test issue content',
        createdAt: futureDate.toISOString(),
        priorityScore: 75,
        status: 'OPEN',
      },
    ];

    expect(() =>
      archiveAndManageIssueDataRetention(retentionPolicy, issueDataWithFutureDate, currentDate)
    ).toThrow(/作成日は現在日以前である必要があります/);
  });
});