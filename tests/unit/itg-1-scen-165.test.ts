import { retrieveIssueDataByCondition } from '../../src/logic/issue-data-persistence';
import type { IssueSearchCondition, DecryptedIssueData, DecryptedIssueDataList } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ永続化ロジック', () => {
  // SCEN-165: [normal] 検索条件（日付範囲、キーワード、ステータス）を受け取り、該当する課題データを復号化して返す
  test('SCEN-165: 検索条件に合致する課題データを復号化して返す', async () => {
    const searchCondition: IssueSearchCondition = {
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
      keywords: ['バグ', 'パフォーマンス'],
      statusList: ['対応中', '完了'],
      teamIdList: ['team-A'],
      priorityRankList: ['高']
    };

    const mockDecryptedIssues: DecryptedIssueData[] = [
      {
        issueId: 'issue-001',
        issueContent: 'ログイン画面でバグが発生している',
        priorityScore: 85,
        priorityRank: '高',
        colorCode: '#FF0000',
        status: '対応中',
        extractedDate: new Date('2026-08-15T09:00:00Z'),
        teamId: 'team-A',
        impactDegree: 90,
        occurrenceFrequency: 5
      },
      {
        issueId: 'issue-002',
        issueContent: 'パフォーマンス低下が報告されている',
        priorityScore: 78,
        priorityRank: '高',
        colorCode: '#FF0000',
        status: '完了',
        extractedDate: new Date('2026-08-20T10:30:00Z'),
        teamId: 'team-A',
        impactDegree: 75,
        occurrenceFrequency: 3
      },
      {
        issueId: 'issue-003',
        issueContent: 'APIレスポンスの遅延に伴うパフォーマンス問題',
        priorityScore: 72,
        priorityRank: '高',
        colorCode: '#FF0000',
        status: '対応中',
        extractedDate: new Date('2026-08-25T14:15:00Z'),
        teamId: 'team-A',
        impactDegree: 70,
        occurrenceFrequency: 4
      }
    ];

    const retrievedAtTime = new Date('2026-08-26T11:00:00Z');

    const result: DecryptedIssueDataList = {
      issues: mockDecryptedIssues,
      totalCount: 3,
      retrievedAt: retrievedAtTime
    };

    // Call the function with search condition
    const retrievedResult = await retrieveIssueDataByCondition(searchCondition);

    // (1) Verify issues array contains 3 decrypted issue data records
    expect(retrievedResult.issues).toHaveLength(3);

    // (2) Verify each issue status is one of ['対応中', '完了']
    retrievedResult.issues.forEach((issue: DecryptedIssueData) => {
      expect(['対応中', '完了']).toContain(issue.status);
    });

    // (3) Verify each issue priorityRank is '高'
    retrievedResult.issues.forEach((issue: DecryptedIssueData) => {
      expect(issue.priorityRank).toBe('高');
    });

    // (4) Verify each issue extractedDate is within range [2026-08-01, 2026-08-31]
    retrievedResult.issues.forEach((issue: DecryptedIssueData) => {
      expect(issue.extractedDate.getTime()).toBeGreaterThanOrEqual(searchCondition.startDate.getTime());
      expect(issue.extractedDate.getTime()).toBeLessThanOrEqual(searchCondition.endDate.getTime());
    });

    // (5) Verify each issue content contains one of keywords ['バグ', 'パフォーマンス']
    retrievedResult.issues.forEach((issue: DecryptedIssueData) => {
      const hasKeyword = searchCondition.keywords!.some((keyword: string) =>
        issue.issueContent.includes(keyword)
      );
      expect(hasKeyword).toBe(true);
    });

    // (6) Verify totalCount is 3
    expect(retrievedResult.totalCount).toBe(3);

    // (7) Verify retrievedAt is a Date instance with correct timestamp
    expect(retrievedResult.retrievedAt).toBeInstanceOf(Date);
    expect(retrievedResult.retrievedAt.getTime()).toBe(retrievedAtTime.getTime());
  });
});