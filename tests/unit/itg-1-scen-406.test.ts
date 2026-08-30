import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-406: [error] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する。 - 必須フィールドが3件以上のレコードで欠落しているときという明示された境界条件で複数のレコードで必須情報が不足しています。再連携が必要です
  test('should throw error when 3 or more records are missing required field (assignee)', () => {
    const toolIssueRecord1 = {
      externalToolIssueId: 'ISSUE-001',
      title: 'Bug in authentication module',
      status: 'Open',
      priority: 'High',
    };

    const toolIssueRecord2 = {
      externalToolIssueId: 'ISSUE-002',
      title: 'Performance optimization needed',
      status: 'In Progress',
      priority: 'Medium',
    };

    const toolIssueRecord3 = {
      externalToolIssueId: 'ISSUE-003',
      title: 'Database connection timeout',
      status: 'Open',
      priority: 'High',
    };

    const toolIssueRecord4 = {
      externalToolIssueId: 'ISSUE-004',
      title: 'API rate limit exceeded',
      status: 'Blocked',
      priority: 'Medium',
    };

    const toolIssueRecord5 = {
      externalToolIssueId: 'ISSUE-005',
      title: 'Memory leak in background worker',
      status: 'Open',
      priority: 'Critical',
    };

    const integrationResult = {
      sentIssueCount: 5,
      statusCode: 200,
      sentRecords: [
        toolIssueRecord1,
        toolIssueRecord2,
        toolIssueRecord3,
        toolIssueRecord4,
        toolIssueRecord5,
      ],
    };

    const expectedRecordCount = 5;
    const requiredFields = ['externalToolIssueId', 'title', 'status', 'priority'];

    const syncBatchId = 'batch-20240115-001';
    const originalExtractedIssues = [
      {
        issueId: 'extracted-001',
        issueContent: 'Bug in authentication module',
        priorityScore: 85,
        impactLevel: 'high' as const,
        extractedKeywords: ['bug', 'authentication'],
        reportDate: '2024-01-15',
        reporterId: 'eng-001',
        teamId: 'team-001',
      },
      {
        issueId: 'extracted-002',
        issueContent: 'Performance optimization needed',
        priorityScore: 65,
        impactLevel: 'medium' as const,
        extractedKeywords: ['performance', 'optimization'],
        reportDate: '2024-01-15',
        reporterId: 'eng-002',
        teamId: 'team-001',
      },
      {
        issueId: 'extracted-003',
        issueContent: 'Database connection timeout',
        priorityScore: 80,
        impactLevel: 'high' as const,
        extractedKeywords: ['database', 'timeout'],
        reportDate: '2024-01-15',
        reporterId: 'eng-003',
        teamId: 'team-001',
      },
      {
        issueId: 'extracted-004',
        issueContent: 'API rate limit exceeded',
        priorityScore: 70,
        impactLevel: 'medium' as const,
        extractedKeywords: ['api', 'rate limit'],
        reportDate: '2024-01-15',
        reporterId: 'eng-004',
        teamId: 'team-001',
      },
      {
        issueId: 'extracted-005',
        issueContent: 'Memory leak in background worker',
        priorityScore: 90,
        impactLevel: 'high' as const,
        extractedKeywords: ['memory', 'leak'],
        reportDate: '2024-01-15',
        reporterId: 'eng-005',
        teamId: 'team-001',
      },
    ];

    expect(() =>
      syncExtractedIssuesToExternalTool({
        syncBatchId,
        sentIssueCount: expectedRecordCount,
        toolRegisteredIssues: [
          toolIssueRecord1,
          toolIssueRecord2,
          toolIssueRecord3,
          toolIssueRecord4,
          toolIssueRecord5,
        ],
        originalExtractedIssues,
      }),
    ).toThrow(/複数のレコードで必須情報が不足しています/);
  });
});