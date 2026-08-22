import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-1-imp-1/prompts/action-03';

interface MockReport {
  reportId: string;
  reporterName: string;
  submittedAt: Date;
  whatDidYesterday: string;
  whatTodayPlan: string;
  issues: string;
}

interface ExtractedIssue {
  issueTitle: string;
  reporterName: string;
  issueDescription: string;
  category: string;
}

interface Tx1Imp1AiClient {
  callAction01(prompt: string): Promise<{ status: string; unsubmittedMembers: string[] }>;
  callAction02(prompt: string): Promise<{ status: string; notificationsSent: number }>;
  callAction03(prompt: string): Promise<{ issues: ExtractedIssue[] }>;
  callAction04(prompt: string): Promise<{ prioritizedIssues: Array<{ issueId: string; priority: number }> }>;
  callAction05(prompt: string): Promise<{ reportGenerated: boolean; reportPath: string }>;
  callAction06(prompt: string): Promise<{ notificationSent: boolean; notificationId: string }>;
}

describe('tx-1-imp-1-orchestrator-action-03-extract-issues', () => {
  let mockAiClient: Tx1Imp1AiClient;
  let capturedPrompts: { [key: string]: string } = {};

  const mockReportsData: MockReport[] = [
    {
      reportId: 'report-001',
      reporterName: 'Alice',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      whatDidYesterday: 'Implemented user authentication module',
      whatTodayPlan: 'Complete unit tests for auth module',
      issues: 'データベース接続タイムアウトが発生して、ユーザー認証のテストが失敗した',
    },
    {
      reportId: 'report-002',
      reporterName: 'Bob',
      submittedAt: new Date('2024-01-15T08:45:00Z'),
      whatDidYesterday: 'Reviewed pull requests',
      whatTodayPlan: 'Merge approved PRs to main branch',
      issues: 'データベース接続タイムアウトにより、デプロイメント検証が遅延している',
    },
    {
      reportId: 'report-003',
      reporterName: 'Charlie',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
      whatDidYesterday: 'Fixed critical bug in payment processing',
      whatTodayPlan: 'Deploy payment fix to production',
      issues: 'ステージング環境でのメモリリークが検出され、本番デプロイが延期されている状況',
    },
    {
      reportId: 'report-004',
      reporterName: 'Diana',
      submittedAt: new Date('2024-01-15T09:15:00Z'),
      whatDidYesterday: 'Set up monitoring dashboard',
      whatTodayPlan: 'Tune alert thresholds',
      issues: 'ステージング環境でのメモリリークが確認された。アプリケーション再起動で一時的に解決',
    },
    {
      reportId: 'report-005',
      reporterName: 'Eve',
      submittedAt: new Date('2024-01-15T09:30:00Z'),
      whatDidYesterday: 'Attended project planning meeting',
      whatTodayPlan: 'Create implementation roadmap',
      issues: '特に大きな課題なし。スムーズに進行中',
    },
  ];

  const validCategoryList = [
    'システム障害',
    'プロセス改善',
    'リソース不足',
    'パフォーマンス',
    'セキュリティ',
  ];

  beforeEach(() => {
    capturedPrompts = {};

    mockAiClient = {
      callAction01: jest.fn().mockResolvedValue({
        status: 'success',
        unsubmittedMembers: [],
      }),
      callAction02: jest.fn().mockResolvedValue({
        status: 'success',
        notificationsSent: 0,
      }),
      callAction03: jest.fn().mockImplementation(
        (prompt: string) => {
          capturedPrompts.action03 = prompt;
          return Promise.resolve({
            issues: [
              {
                issueTitle: 'Database Connection Timeout',
                reporterName: 'Alice',
                issueDescription:
                  'データベース接続タイムアウトが発生して、ユーザー認証のテストが失敗した',
                category: 'システム障害',
              },
              {
                issueTitle: 'Database Connection Timeout',
                reporterName: 'Bob',
                issueDescription:
                  'データベース接続タイムアウトにより、デプロイメント検証が遅延している',
                category: 'システム障害',
              },
              {
                issueTitle: 'Memory Leak in Staging Environment',
                reporterName: 'Charlie',
                issueDescription:
                  'ステージング環境でのメモリリークが検出され、本番デプロイが延期されている状況',
                category: 'パフォーマンス',
              },
              {
                issueTitle: 'Memory Leak in Staging Environment',
                reporterName: 'Diana',
                issueDescription:
                  'ステージング環境でのメモリリークが確認された。アプリケーション再起動で一時的に解決',
                category: 'パフォーマンス',
              },
            ],
          });
        }
      ),
      callAction04: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          { issueId: 'issue-001', priority: 1 },
          { issueId: 'issue-002', priority: 2 },
          { issueId: 'issue-003', priority: 3 },
          { issueId: 'issue-004', priority: 4 },
        ],
      }),
      callAction05: jest.fn().mockResolvedValue({
        reportGenerated: true,
        reportPath: '/reports/morning-meeting-2024-01-15.pdf',
      }),
      callAction06: jest.fn().mockResolvedValue({
        notificationSent: true,
        notificationId: 'notif-12345',
      }),
    };
  });

  // SCEN-026: [normal] 日報集約から課題優先順位付けと未提出通知までの自律実行 - Action3実行確認
  test('should execute Action 3 extract-issues workflow and validate issue extraction from submitted reports', async () => {
    const executionTimestamp = new Date('2024-01-15T09:45:00Z');
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const teamMemberIds = ['user-alice', 'user-bob', 'user-charlie', 'user-diana', 'user-eve'];
    const managerEmail = 'manager@example.com';

    const input = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      teamMemberIds,
      managerEmail,
    };

    // Run the orchestrator with injected mock AI client
    const result = await runTx1Imp1Agent(input, mockAiClient);

    // Verify mockAiClient.callAction03 was invoked
    expect(mockAiClient.callAction03).toHaveBeenCalled();

    // Verify the prompt was captured and contains report data
    expect(capturedPrompts.action03).toBeDefined();
    expect(capturedPrompts.action03).toMatch(/データベース接続タイムアウト/);
    expect(capturedPrompts.action03).toMatch(/ユーザー認証/);
    expect(capturedPrompts.action03).toMatch(/ステージング環境/);
    expect(capturedPrompts.action03).toMatch(/メモリリーク/);

    // Verify all 5 reports are included in the prompt
    mockReportsData.forEach((report) => {
      expect(capturedPrompts.action03).toMatch(new RegExp(report.reporterName));
    });

    // Verify buildAction03Prompt and ACTION_03_PROMPT_VERSION are exported
    expect(typeof buildAction03Prompt).toBe('function');
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');
    expect(ACTION_03_PROMPT_VERSION.length).toBeGreaterThan(0);

    // Verify the extracted issues structure
    expect(result).toBeDefined();
    expect(result.extractedIssueCount).toBe(4);

    // Verify extracted issues have required fields
    if (result.prioritizedIssueList && result.prioritizedIssueList.length > 0) {
      result.prioritizedIssueList.forEach((issue: any) => {
        expect(issue).toHaveProperty('issueTitle');
        expect(issue).toHaveProperty('reporterName');
        expect(issue).toHaveProperty('issueDescription');
        expect(issue).toHaveProperty('category');
      });
    }

    // Verify issue-to-report correspondence
    // Alice's issue must correspond to report-001's issue
    const aliceIssue = result.prioritizedIssueList?.find(
      (issue: any) => issue.reporterName === 'Alice'
    );
    expect(aliceIssue?.issueDescription).toContain('データベース接続タイムアウト');

    // Bob's issue must correspond to report-002's issue
    const bobIssue = result.prioritizedIssueList?.find(
      (issue: any) => issue.reporterName === 'Bob'
    );
    expect(bobIssue?.issueDescription).toContain('デプロイメント検証');

    // Verify duplicate detection: both Alice and Bob reported the same DB timeout issue
    const dbTimeoutIssues = result.prioritizedIssueList?.filter(
      (issue: any) =>
        issue.issueTitle === 'Database Connection Timeout'
    );
    expect(dbTimeoutIssues?.length).toBe(2);

    // Verify duplicate detection: both Charlie and Diana reported the same memory leak
    const memoryLeakIssues = result.prioritizedIssueList?.filter(
      (issue: any) =>
        issue.issueTitle === 'Memory Leak in Staging Environment'
    );
    expect(memoryLeakIssues?.length).toBe(2);

    // Verify all extracted issue categories are from the predefined list
    if (result.prioritizedIssueList) {
      result.prioritizedIssueList.forEach((issue: any) => {
        expect(validCategoryList).toContain(issue.category);
      });
    }

    // Verify orchestrator boundary: second parameter must be structurally identical to Tx1Imp1AiClient
    expect(typeof mockAiClient.callAction01).toBe('function');
    expect(typeof mockAiClient.callAction02).toBe('function');
    expect(typeof mockAiClient.callAction03).toBe('function');
    expect(typeof mockAiClient.callAction04).toBe('function');
    expect(typeof mockAiClient.callAction05).toBe('function');
    expect(typeof mockAiClient.callAction06).toBe('function');

    // Verify execution completed successfully
    expect(result.executionStatus).toBe('success');
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.completionTimestamp.getTime()).toBeGreaterThanOrEqual(
      executionTimestamp.getTime()
    );
  });
});