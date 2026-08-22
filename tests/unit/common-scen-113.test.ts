import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-113: [normal] 日報収集から分析レポート生成までの自動実行 AIエージェント
  test('should deliver analysis report to department head and stakeholders with extracted issues, priority scores, and CSV attachment', async () => {
    const mockReportContent = {
      weekStartDate: '2024-01-08',
      weekEndDate: '2024-01-14',
      extractedIssues: [
        {
          id: 'ISSUE-001',
          title: '本番サーバーの応答遅延',
          category: '性能',
          description: 'DBクエリの最適化が必要',
          severity: 'high',
        },
        {
          id: 'ISSUE-002',
          title: 'デプロイプロセスの自動化',
          category: 'プロセス',
          description: '手作業ステップを削減',
          severity: 'medium',
        },
        {
          id: 'ISSUE-003',
          title: 'セキュリティ脆弱性対応',
          category: 'セキュリティ',
          description: 'OWASP Top10対策',
          severity: 'critical',
        },
      ],
      priorityScores: [
        { issueId: 'ISSUE-001', score: 85 },
        { issueId: 'ISSUE-002', score: 62 },
        { issueId: 'ISSUE-003', score: 95 },
      ],
      analysisMetadata: {
        reportSubmissionRate: 0.75,
        totalReportCount: 20,
        categoryCount: 3,
        trendsummary: '性能関連の課題が前週比で2件増加',
      },
    };

    const mockDepartmentHeadEmail = 'manager@company.com';
    const mockStakeholderEmails = [
      'stakeholder1@company.com',
      'stakeholder2@company.com',
    ];

    const mockEmailSendResponse = {
      success: true,
      deliveredCount: 3,
      timestamp: '2024-01-15T09:00:00Z',
      recipients: [mockDepartmentHeadEmail, ...mockStakeholderEmails],
    };

    const mockCsvContent =
      'IssueID,Title,Category,Severity,PriorityScore\nISSUE-001,本番サーバーの応答遅延,性能,high,85\nISSUE-002,デプロイプロセスの自動化,プロセス,medium,62\nISSUE-003,セキュリティ脆弱性対応,セキュリティ,critical,95';

    fetchMock.mockResponseOnce(JSON.stringify(mockEmailSendResponse), {
      status: 200,
    });

    const result = await sendUnsubmittedReminder({
      reportContent: mockReportContent,
      recipientType: 'department_head_and_stakeholders',
      departmentHeadEmail: mockDepartmentHeadEmail,
      stakeholderEmails: mockStakeholderEmails,
      csvData: mockCsvContent,
    });

    expect(result).toEqual({
      success: true,
      deliveredCount: 3,
      timestamp: '2024-01-15T09:00:00Z',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0];
    const requestUrl = callArgs[0];
    const requestInit = callArgs[1];

    expect(requestUrl).toMatch(/\/notification\/delivery/);
    expect(requestInit.method).toBe('POST');

    const requestBody = JSON.parse(requestInit.body);
    expect(requestBody.recipients).toContain(mockDepartmentHeadEmail);
    expect(requestBody.recipients).toContain('stakeholder1@company.com');
    expect(requestBody.recipients).toContain('stakeholder2@company.com');

    expect(requestBody.emailContent).toMatch(/前週の課題分析結果/);
    expect(requestBody.emailContent).toMatch(/優先度スコア/);
    expect(requestBody.emailContent).toMatch(/推奨対応/);

    expect(requestBody.attachment).toBeDefined();
    expect(requestBody.attachment.format).toBe('csv');
    expect(requestBody.attachment.data).toContain('IssueID');
    expect(requestBody.attachment.data).toContain('本番サーバーの応答遅延');
    expect(requestBody.attachment.data).toContain('85');

    expect(result.deliveredCount).toBeGreaterThanOrEqual(3);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    const emailContent = requestBody.emailContent;
    expect(emailContent).toContain('ISSUE-001');
    expect(emailContent).toContain('ISSUE-002');
    expect(emailContent).toContain('ISSUE-003');

    expect(requestBody).toHaveProperty('analysisMetadata');
    expect(requestBody.analysisMetadata.reportSubmissionRate).toBeGreaterThanOrEqual(0.7);
    expect(requestBody.analysisMetadata.categoryCount).toBeGreaterThanOrEqual(3);
  });
});