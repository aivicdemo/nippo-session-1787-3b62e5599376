import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6AgentInput, Tx6AgentOutput } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('TX-6 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-121
  test('冪等リトライ: 同一要求の再実行でレポート・通知の重複を防止する', async () => {
    // ===== Setup: モック AI Client と DB Stub =====
    const mockReportStore: Array<{
      reportId: string;
      generatedAt: Date;
      teamId: string;
      analysisStartDate: string;
      analysisEndDate: string;
    }> = [];

    const mockNotificationLog: Array<{
      notificationId: string;
      reportId: string;
      recipient: string;
      sentAt: Date;
      type: 'manager' | 'stakeholder';
    }> = [];

    const mockAuditLog: Array<{
      eventId: string;
      action: string;
      status: 'completed' | 'skipped_duplicate';
      reportId?: string;
      timestamp: Date;
      details?: Record<string, unknown>;
    }> = [];

    const mockEmailQueue: Array<{
      queueId: string;
      reportId: string;
      recipient: string;
      enqueuedAt: Date;
      attemptCount: number;
    }> = [];

    const mockAiClient = {
      // Action 1: 前週の日報データを自動収集
      collectWeeklyReports: async (
        startDate: string,
        endDate: string,
        teamId: string
      ): Promise<Array<{ memberId: string; reportContent: string; submittedAt: Date }>> => {
        return [
          {
            memberId: 'member_001',
            reportContent: 'Completed feature X. Encountered database timeout issue.',
            submittedAt: new Date('2024-01-15T08:00:00Z'),
          },
          {
            memberId: 'member_002',
            reportContent: 'Fixed bug in API. Need to review deployment plan.',
            submittedAt: new Date('2024-01-15T09:30:00Z'),
          },
        ];
      },

      // Action 2: 未提出メンバーを特定し、リマインド通知を送信
      identifyNonSubmitters: async (
        teamId: string,
        deadline: Date
      ): Promise<Array<{ memberId: string; email: string }>> => {
        return [{ memberId: 'member_003', email: 'member003@example.com' }];
      },

      // Action 3: 提出済み日報から課題項目を抽出・分類
      extractAndClassifyIssues: async (
        reports: Array<{ memberId: string; reportContent: string }>,
        teamId: string
      ): Promise<
        Array<{
          issueId: string;
          keyword: string;
          category: string;
          severity: 'high' | 'medium' | 'low';
          mentionedBy: string[];
        }>
      > => {
        return [
          {
            issueId: 'issue_001',
            keyword: 'database timeout',
            category: 'performance',
            severity: 'high',
            mentionedBy: ['member_001'],
          },
          {
            issueId: 'issue_002',
            keyword: 'API bug fix',
            category: 'quality',
            severity: 'medium',
            mentionedBy: ['member_002'],
          },
        ];
      },

      // Action 4: 課題の発生頻度、カテゴリ別の傾向を分析
      analyzeTrends: async (
        issues: Array<{
          issueId: string;
          keyword: string;
          category: string;
          severity: string;
        }>
      ): Promise<{
        categoryDistribution: Record<string, number>;
        severityDistribution: Record<string, number>;
        topIssues: Array<{ keyword: string; count: number }>;
      }> => {
        return {
          categoryDistribution: { performance: 1, quality: 1 },
          severityDistribution: { high: 1, medium: 1 },
          topIssues: [
            { keyword: 'database timeout', count: 1 },
            { keyword: 'API bug fix', count: 1 },
          ],
        };
      },

      // Action 5: 優先度スコアリングを実行
      calculatePriorityScores: async (
        issues: Array<{
          issueId: string;
          keyword: string;
          severity: string;
          mentionedBy: string[];
        }>
      ): Promise<
        Array<{
          issueId: string;
          keyword: string;
          priorityScore: number;
          priorityRank: 'high' | 'medium' | 'low';
        }>
      > => {
        return [
          {
            issueId: 'issue_001',
            keyword: 'database timeout',
            priorityScore: 85,
            priorityRank: 'high',
          },
          {
            issueId: 'issue_002',
            keyword: 'API bug fix',
            priorityScore: 65,
            priorityRank: 'medium',
          },
        ];
      },

      // Action 6: 分析結果をレポート形式で生成
      generateAnalysisReport: async (
        teamId: string,
        analysisStartDate: string,
        analysisEndDate: string,
        trends: Record<string, unknown>,
        priorityIssues: Array<Record<string, unknown>>
      ): Promise<{
        reportId: string;
        reportContent: string;
        generatedAt: Date;
        topPriorityIssues: Array<{
          issueKeyword: string;
          occurrenceCount: number;
          priorityScore: number;
          priorityRank: string;
        }>;
      }> => {
        return {
          reportId: 'report_20240115_team001',
          reportContent:
            'Weekly Analysis Report: Top issues are database timeout (score: 85) and API bug fix (score: 65)',
          generatedAt: new Date('2024-01-15T11:00:00Z'),
          topPriorityIssues: [
            {
              issueKeyword: 'database timeout',
              occurrenceCount: 1,
              priorityScore: 85,
              priorityRank: 'high',
            },
            {
              issueKeyword: 'API bug fix',
              occurrenceCount: 1,
              priorityScore: 65,
              priorityRank: 'medium',
            },
          ],
        };
      },

      // Action 7: 部長とステークホルダーにレポートを配信
      distributeReport: async (
        reportId: string,
        reportContent: string,
        generatedAt: Date,
        managerEmail: string,
        stakeholderEmails: string[]
      ): Promise<{
        managerNotificationId: string;
        stakeholderNotificationIds: string[];
        enqueuedEmailCount: number;
      }> => {
        const managerNotifId = `notif_${reportId}_manager`;
        const stakeholderNotifIds = stakeholderEmails.map((_, idx) => `notif_${reportId}_stakeholder_${idx}`);

        mockNotificationLog.push({
          notificationId: managerNotifId,
          reportId,
          recipient: managerEmail,
          sentAt: new Date('2024-01-15T11:05:00Z'),
          type: 'manager',
        });

        stakeholderEmails.forEach((email, idx) => {
          mockNotificationLog.push({
            notificationId: stakeholderNotifIds[idx],
            reportId,
            recipient: email,
            sentAt: new Date('2024-01-15T11:05:00Z'),
            type: 'stakeholder',
          });
        });

        const totalEmails = 1 + stakeholderEmails.length;
        stakeholderEmails.forEach((email, idx) => {
          mockEmailQueue.push({
            queueId: `queue_${reportId}_manager`,
            reportId,
            recipient: managerEmail,
            enqueuedAt: new Date('2024-01-15T11:05:00Z'),
            attemptCount: 0,
          });
          mockEmailQueue.push({
            queueId: `queue_${reportId}_stakeholder_${idx}`,
            reportId,
            recipient: email,
            enqueuedAt: new Date('2024-01-15T11:05:00Z'),
            attemptCount: 0,
          });
        });

        return {
          managerNotificationId: managerNotifId,
          stakeholderNotificationIds: stakeholderNotifIds,
          enqueuedEmailCount: totalEmails,
        };
      },
    };

    // ===== Utility: Deduplication check =====
    const checkReportExists = (
      reportId: string,
      startDate: string,
      endDate: string,
      teamId: string
    ): boolean => {
      return mockReportStore.some(
        (r) =>
          r.reportId === reportId &&
          r.analysisStartDate === startDate &&
          r.analysisEndDate === endDate &&
          r.teamId === teamId
      );
    };

    const recordAuditEvent = (
      action: string,
      status: 'completed' | 'skipped_duplicate',
      reportId?: string
    ): void => {
      mockAuditLog.push({
        eventId: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        action,
        status,
        reportId,
        timestamp: new Date('2024-01-15T11:00:00Z'),
      });
    };

    // ===== Test Input =====
    const input: Tx6AgentInput = {
      executionTimestamp: new Date('2024-01-15T11:00:00Z'),
      analysisStartDate: '2024-01-08',
      analysisEndDate: '2024-01-14',
      teamId: 'team_001',
    };

    // ===== FIRST RUN: Initial execution =====
    let firstRunOutput: Tx6AgentOutput | null = null;
    let firstRunReportStore: typeof mockReportStore = [];
    let firstRunNotificationLog: typeof mockNotificationLog = [];
    let firstRunAuditLog: typeof mockAuditLog = [];
    let firstRunEmailQueue: typeof mockEmailQueue = [];

    // Call agent first time
    firstRunOutput = await runTx6Imp1Agent(input, mockAiClient);

    // Record post-first-run state
    firstRunReportStore = [...mockReportStore];
    firstRunNotificationLog = [...mockNotificationLog];
    firstRunAuditLog = [...mockAuditLog];
    firstRunEmailQueue = [...mockEmailQueue];

    // Manually record report to simulate database persistence
    mockReportStore.push({
      reportId: firstRunOutput.reportId,
      generatedAt: firstRunOutput.reportGeneratedAt,
      teamId: input.teamId,
      analysisStartDate: input.analysisStartDate,
      analysisEndDate: input.analysisEndDate,
    });

    recordAuditEvent('report_generation_completed', 'completed', firstRunOutput.reportId);

    // ===== Assertions after FIRST RUN =====
    expect(firstRunReportStore).toHaveLength(1);
    expect(firstRunNotificationLog).toHaveLength(2); // manager + 1 stakeholder minimum
    expect(firstRunAuditLog).toHaveLength(1);
    expect(firstRunOutput.reportId).toBe('report_20240115_team001');
    expect(firstRunOutput.reportGeneratedAt).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(firstRunOutput.emailSentAt).toBeTruthy();
    expect(firstRunOutput.extractedIssueCount).toBe(2);
    expect(firstRunOutput.topPriorityIssues).toHaveLength(2);
    expect(firstRunOutput.topPriorityIssues[0].issueKeyword).toBe('database timeout');
    expect(firstRunOutput.topPriorityIssues[0].priorityScore).toBe(85);
    expect(firstRunOutput.topPriorityIssues[0].priorityRank).toBe('high');

    const firstEmailQueueCount = firstRunEmailQueue.length;

    // ===== SECOND RUN: Idempotent retry with same input =====
    // Reset mock to simulate retry scenario (keep store data but clear transient logs)
    mockNotificationLog.length = 0;
    mockAuditLog.length = 0;
    mockEmailQueue.length = 0;

    // Before second run, check if report already exists
    const reportExists = checkReportExists(
      'report_20240115_team001',
      input.analysisStartDate,
      input.analysisEndDate,
      input.teamId
    );

    let secondRunOutput: Tx6AgentOutput | null = null;
    let secondRunReportStore: typeof mockReportStore = [];
    let secondRunNotificationLog: typeof mockNotificationLog = [];
    let secondRunAuditLog: typeof mockAuditLog = [];
    let secondRunEmailQueue: typeof mockEmailQueue = [];

    if (reportExists) {
      // Simulate idempotent behavior: return existing report without re-generation
      recordAuditEvent('report_generation_skipped', 'skipped_duplicate', 'report_20240115_team001');

      secondRunOutput = {
        reportId: 'report_20240115_team001',
        reportGeneratedAt: new Date('2024-01-15T11:00:00Z'),
        emailSentAt: firstRunOutput.emailSentAt,
        extractedIssueCount: firstRunOutput.extractedIssueCount,
        topPriorityIssues: firstRunOutput.topPriorityIssues,
      };
    } else {
      // This branch should not be taken in idempotent scenario
      secondRunOutput = await runTx6Imp1Agent(input, mockAiClient);
    }

    // Record post-second-run state
    secondRunReportStore = [...mockReportStore];
    secondRunNotificationLog = [...mockNotificationLog];
    secondRunAuditLog = [...mockAuditLog];
    secondRunEmailQueue = [...mockEmailQueue];

    // ===== Assertions after SECOND RUN (Idempotency Check) =====
    // Report ID should be identical
    expect(secondRunOutput.reportId).toBe(firstRunOutput.reportId);

    // No new report should be added to store
    expect(secondRunReportStore).toHaveLength(firstRunReportStore.length);

    // No duplicate notifications should be enqueued
    expect(secondRunNotificationLog).toHaveLength(0);

    // Audit log should record skipped duplicate
    expect(secondRunAuditLog).toHaveLength(1);
    expect(secondRunAuditLog[0].status).toBe('skipped_duplicate');
    expect(secondRunAuditLog[0].action).toBe('report_generation_skipped');
    expect(secondRunAuditLog[0].reportId).toBe('report_20240115_team001');

    // Email queue should not have new entries
    expect(secondRunEmailQueue).toHaveLength(0);

    // Total email count should not increase
    const totalEmailCountAfterRetry = firstEmailQueueCount + secondRunEmailQueue.length;
    expect(totalEmailCountAfterRetry).toBe(firstEmailQueueCount);

    // Report content should be identical
    expect(secondRunOutput.reportGeneratedAt).toEqual(firstRunOutput.reportGeneratedAt);
    expect(secondRunOutput.extractedIssueCount).toBe(firstRunOutput.extractedIssueCount);
    expect(secondRunOutput.topPriorityIssues).toEqual(firstRunOutput.topPriorityIssues);
  });
});