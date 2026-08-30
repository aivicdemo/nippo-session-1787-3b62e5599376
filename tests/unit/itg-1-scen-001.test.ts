import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('朝会報告管理システム - tx-1-imp-1 エージェント', () => {
  test('SCEN-001: [normal] 毎日定時に日報データを自動集約し、未提出者を検出して通知を送信し、報告された課題を優先度付けして朝会資料を自動生成する', async () => {
    // 代表的な正常入力を準備
    const executionTimestamp = new Date('2026-08-20T08:00:00Z');
    const input: Tx1Imp1AgentInput = {
      executionTimestamp: executionTimestamp,
      reportDeadlineTime: '09:00',
      targetTeamIds: [],
      managerEmailAddresses: ['manager@example.com'],
    };

    // モックされた AIClient を準備
    const mockAiClient = {
      getSubmissionStatus: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedCount: 9,
        unsubmittedCount: 1,
        unsubmittedMemberIds: ['eng005'],
      }),
      aggregateReportsByPeriod: jest.fn().mockResolvedValue({
        reports: [
          {
            employeeId: 'eng001',
            employeeName: 'Engineer One',
            yesterday: 'Implemented feature X',
            today: 'Review PR for feature Y',
            issue: 'Build server is slow',
            submittedAt: new Date('2026-08-20T08:15:00Z'),
          },
          {
            employeeId: 'eng002',
            employeeName: 'Engineer Two',
            yesterday: 'Wrote unit tests',
            today: 'Deploy to staging',
            issue: 'Test environment down',
            submittedAt: new Date('2026-08-20T08:20:00Z'),
          },
          {
            employeeId: 'eng003',
            employeeName: 'Engineer Three',
            yesterday: 'Fixed bug in auth module',
            today: 'Code review',
            issue: 'Database connection timeout',
            submittedAt: new Date('2026-08-20T08:25:00Z'),
          },
          {
            employeeId: 'eng004',
            employeeName: 'Engineer Four',
            yesterday: 'Updated documentation',
            today: 'Refactor API',
            issue: 'Build server is slow',
            submittedAt: new Date('2026-08-20T08:30:00Z'),
          },
          {
            employeeId: 'eng006',
            employeeName: 'Engineer Six',
            yesterday: 'Integrated payment service',
            today: 'Testing integration',
            issue: 'API rate limiting issues',
            submittedAt: new Date('2026-08-20T08:35:00Z'),
          },
          {
            employeeId: 'eng007',
            employeeName: 'Engineer Seven',
            yesterday: 'Optimized query performance',
            today: 'Monitor production',
            issue: 'Build server is slow',
            submittedAt: new Date('2026-08-20T08:40:00Z'),
          },
          {
            employeeId: 'eng008',
            employeeName: 'Engineer Eight',
            yesterday: 'Updated dependencies',
            today: 'Security audit',
            issue: 'Dependency vulnerability detected',
            submittedAt: new Date('2026-08-20T08:45:00Z'),
          },
          {
            employeeId: 'eng009',
            employeeName: 'Engineer Nine',
            yesterday: 'Fixed memory leak',
            today: 'Performance testing',
            issue: 'Build server is slow',
            submittedAt: new Date('2026-08-20T08:50:00Z'),
          },
          {
            employeeId: 'eng010',
            employeeName: 'Engineer Ten',
            yesterday: 'Added monitoring',
            today: 'Incident response prep',
            issue: 'Alert system misconfigured',
            submittedAt: new Date('2026-08-20T08:55:00Z'),
          },
        ],
        aggregatedCount: 9,
      }),
      extractAndRankIssuesFromReports: jest.fn().mockResolvedValue({
        issues: [
          {
            issueId: 'issue001',
            issueContent: 'Build server is slow',
            occurrenceCount: 4,
            affectedMembers: ['eng001', 'eng004', 'eng006', 'eng009'],
            frequency: 4,
          },
          {
            issueId: 'issue002',
            issueContent: 'Test environment down',
            occurrenceCount: 1,
            affectedMembers: ['eng002'],
            frequency: 1,
          },
          {
            issueId: 'issue003',
            issueContent: 'Database connection timeout',
            occurrenceCount: 1,
            affectedMembers: ['eng003'],
            frequency: 1,
          },
        ],
      }),
      calculateIssuePriorityScores: jest.fn().mockResolvedValue([
        {
          issueId: 'issue001',
          issueContent: 'Build server is slow',
          priorityScore: 85,
          priorityRank: 'high',
          colorCode: 'red',
          occurrenceFrequency: 4,
          impactDegree: 80,
        },
        {
          issueId: 'issue002',
          issueContent: 'Test environment down',
          priorityScore: 45,
          priorityRank: 'medium',
          colorCode: 'yellow',
          occurrenceFrequency: 1,
          impactDegree: 20,
        },
        {
          issueId: 'issue003',
          issueContent: 'Database connection timeout',
          priorityScore: 42,
          priorityRank: 'medium',
          colorCode: 'yellow',
          occurrenceFrequency: 1,
          impactDegree: 20,
        },
      ]),
      sendDailyReminderNotifications: jest.fn().mockResolvedValue({
        notificationsSent: 1,
        failedMemberIds: [],
      }),
      generateAndSendManagerConfirmationEmail: jest.fn().mockResolvedValue({
        emailsSent: 1,
        timestamp: new Date('2026-08-20T08:58:00Z'),
      }),
      prepareDashboardData: jest.fn().mockResolvedValue({
        dashboardDataUrl: 'https://dashboard.example.com/data/2026-08-20/abc123xyz',
      }),
    };

    // runTx1Imp1Agent を呼び出し
    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(input, mockAiClient);

    // 期待結果を検証
    expect(result.executionStatus).toBe('success');
    expect(result.aggregatedReportCount).toBe(9);
    expect(result.unsubmittedMemberCount).toBe(1);
    expect(result.extractedIssueCount).toBe(3);
    expect(result.prioritizedIssueList).toHaveLength(3);
    expect(result.prioritizedIssueList[0]).toEqual({
      issueId: 'issue001',
      issueContent: 'Build server is slow',
      priorityScore: 85,
      priorityRank: 'high',
      colorCode: 'red',
      occurrenceFrequency: 4,
      impactDegree: 80,
    });
    expect(result.prioritizedIssueList[1]).toEqual({
      issueId: 'issue002',
      issueContent: 'Test environment down',
      priorityScore: 45,
      priorityRank: 'medium',
      colorCode: 'yellow',
      occurrenceFrequency: 1,
      impactDegree: 20,
    });
    expect(result.prioritizedIssueList[2]).toEqual({
      issueId: 'issue003',
      issueContent: 'Database connection timeout',
      priorityScore: 42,
      priorityRank: 'medium',
      colorCode: 'yellow',
      occurrenceFrequency: 1,
      impactDegree: 20,
    });
    expect(result.notificationsSent).toBe(1);
    expect(result.confirmationEmailsSent).toBe(1);
    expect(result.dashboardDataUrl).toBe('https://dashboard.example.com/data/2026-08-20/abc123xyz');
    expect(result.executionEndTimestamp.getTime()).toBeGreaterThan(executionTimestamp.getTime());

    // モックの呼び出しが想定通りに実行されたことを確認
    expect(mockAiClient.getSubmissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        targetTeamIds: [],
        reportDeadlineTime: '09:00',
      })
    );
    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalled();
    expect(mockAiClient.extractAndRankIssuesFromReports).toHaveBeenCalled();
    expect(mockAiClient.calculateIssuePriorityScores).toHaveBeenCalled();
    expect(mockAiClient.sendDailyReminderNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        unsubmittedMemberIds: ['eng005'],
      })
    );
    expect(mockAiClient.generateAndSendManagerConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        managerEmailAddresses: ['manager@example.com'],
        prioritizedIssues: expect.any(Array),
      })
    );
    expect(mockAiClient.prepareDashboardData).toHaveBeenCalled();
  });
});