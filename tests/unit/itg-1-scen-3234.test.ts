import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - Daily Report Collection, Confirmation, and Reminder Automation', () => {
  let mockAiClient: any;
  let mockNotificationService: any;
  let mockAuditLogger: any;
  let mockReportDatabase: any;

  beforeEach(() => {
    mockReportDatabase = {
      getTeamMembers: jest.fn().mockResolvedValue([
        { userId: 'member-001', email: 'member001@example.com', teamId: 'team-dev' },
        { userId: 'member-002', email: 'member002@example.com', teamId: 'team-dev' },
        { userId: 'member-003', email: 'member003@example.com', teamId: 'team-dev' },
        { userId: 'member-004', email: 'member004@example.com', teamId: 'team-dev' },
        { userId: 'member-005', email: 'member005@example.com', teamId: 'team-dev' },
        { userId: 'member-006', email: 'member006@example.com', teamId: 'team-dev' },
        { userId: 'member-007', email: 'member007@example.com', teamId: 'team-dev' },
        { userId: 'member-008', email: 'member008@example.com', teamId: 'team-dev' },
        { userId: 'member-009', email: 'member009@example.com', teamId: 'team-dev' },
        { userId: 'member-010', email: 'member010@example.com', teamId: 'team-dev' },
      ]),
      getSubmissionStatus: jest.fn().mockResolvedValue({
        submittedMemberIds: ['member-001', 'member-002', 'member-003', 'member-004', 'member-005'],
        unsubmittedMemberIds: ['member-006', 'member-007', 'member-008', 'member-009', 'member-010'],
        checkTimestamp: new Date('2024-03-15T09:00:00Z'),
      }),
      getSubmittedReports: jest.fn().mockResolvedValue([
        {
          userId: 'member-001',
          yesterdayDone: 'Completed feature A',
          todayPlan: 'Continue feature A testing',
          issues: 'Database connection timeout issue',
          submittedAt: new Date('2024-03-15T08:30:00Z'),
        },
        {
          userId: 'member-002',
          yesterdayDone: 'Bug fixes in module B',
          todayPlan: 'Review bug fixes',
          issues: 'API response delay observed',
          submittedAt: new Date('2024-03-15T08:45:00Z'),
        },
        {
          userId: 'member-003',
          yesterdayDone: 'Documentation update',
          todayPlan: 'Deploy to staging',
          issues: 'Deployment script error',
          submittedAt: new Date('2024-03-15T08:15:00Z'),
        },
        {
          userId: 'member-004',
          yesterdayDone: 'Code review completed',
          todayPlan: 'Merge pull requests',
          issues: 'Merge conflicts in feature branch',
          submittedAt: new Date('2024-03-15T08:50:00Z'),
        },
        {
          userId: 'member-005',
          yesterdayDone: 'Performance testing',
          todayPlan: 'Analyze results',
          issues: 'Memory leak suspected in cache layer',
          submittedAt: new Date('2024-03-15T08:20:00Z'),
        },
      ]),
    };

    mockAuditLogger = {
      logAction: jest.fn().mockResolvedValue({
        logId: 'audit-log-001',
        actionType: 'SUBMISSION_STATUS_CHECK',
        timestamp: new Date('2024-03-15T09:00:00Z'),
      }),
    };

    mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'sent',
      }),
    };

    mockAiClient = {
      action01_checkSubmissionStatus: jest
        .fn()
        .mockResolvedValue({
          submittedCount: 5,
          unsubmittedCount: 5,
          unsubmittedMembers: ['member-006', 'member-007', 'member-008', 'member-009', 'member-010'],
          submittedMembers: ['member-001', 'member-002', 'member-003', 'member-004', 'member-005'],
          checkTimestamp: '2024-03-15T09:00:00Z',
          promptVersion: 'ACTION_01_PROMPT_VERSION_1.0',
        }),
      action02_sendReminderNotifications: jest
        .fn()
        .mockResolvedValue({
          notificationsSent: 5,
          failedNotifications: 0,
          notificationIds: ['notif-006', 'notif-007', 'notif-008', 'notif-009', 'notif-010'],
          promptVersion: 'ACTION_02_PROMPT_VERSION_1.0',
        }),
      action03_extractIssuesFromReports: jest
        .fn()
        .mockResolvedValue({
          extractedIssues: [
            {
              keyword: 'Database connection timeout',
              frequency: 1,
              severity: 'high',
              affectedMembers: ['member-001'],
            },
            {
              keyword: 'API response delay',
              frequency: 1,
              severity: 'medium',
              affectedMembers: ['member-002'],
            },
            {
              keyword: 'Deployment script error',
              frequency: 1,
              severity: 'high',
              affectedMembers: ['member-003'],
            },
            {
              keyword: 'Merge conflicts',
              frequency: 1,
              severity: 'medium',
              affectedMembers: ['member-004'],
            },
            {
              keyword: 'Memory leak suspected',
              frequency: 1,
              severity: 'critical',
              affectedMembers: ['member-005'],
            },
          ],
          totalIssuesExtracted: 5,
          promptVersion: 'ACTION_03_PROMPT_VERSION_1.0',
        }),
      action04_rankIssuesByPriority: jest
        .fn()
        .mockResolvedValue({
          prioritizedIssues: [
            {
              keyword: 'Memory leak suspected',
              priority: 1,
              priorityScore: 95,
              severity: 'critical',
              frequency: 1,
              recommendedAction: 'Immediate investigation required',
            },
            {
              keyword: 'Database connection timeout',
              priority: 2,
              priorityScore: 85,
              severity: 'high',
              frequency: 1,
              recommendedAction: 'Check database connection pool settings',
            },
            {
              keyword: 'Deployment script error',
              priority: 3,
              priorityScore: 80,
              severity: 'high',
              frequency: 1,
              recommendedAction: 'Review deployment script logic',
            },
            {
              keyword: 'API response delay',
              priority: 4,
              priorityScore: 60,
              severity: 'medium',
              frequency: 1,
              recommendedAction: 'Profile API endpoints',
            },
            {
              keyword: 'Merge conflicts',
              priority: 5,
              priorityScore: 55,
              severity: 'medium',
              frequency: 1,
              recommendedAction: 'Coordinate with team members',
            },
          ],
          promptVersion: 'ACTION_04_PROMPT_VERSION_1.0',
        }),
      action05_generateMorningBriefSummary: jest
        .fn()
        .mockResolvedValue({
          briefSummary: {
            reportingDate: '2024-03-15',
            submissionSummary: {
              totalMembers: 10,
              submittedCount: 5,
              unsubmittedCount: 5,
              submissionRate: 50,
              unsubmittedMembers: ['member-006', 'member-007', 'member-008', 'member-009', 'member-010'],
            },
            topIssues: [
              {
                rank: 1,
                keyword: 'Memory leak suspected',
                priorityScore: 95,
                severity: 'critical',
              },
              {
                rank: 2,
                keyword: 'Database connection timeout',
                priorityScore: 85,
                severity: 'high',
              },
              {
                rank: 3,
                keyword: 'Deployment script error',
                priorityScore: 80,
                severity: 'high',
              },
            ],
            summaryHtml:
              '<div>Morning Brief for 2024-03-15</div><ul><li>Submission: 5/10</li><li>Critical Issue: Memory leak suspected</li></ul>',
          },
          promptVersion: 'ACTION_05_PROMPT_VERSION_1.0',
        }),
      action06_notifyManagerWithBrief: jest
        .fn()
        .mockResolvedValue({
          notificationId: 'manager-notif-001',
          status: 'sent',
          sentTo: 'manager@example.com',
          sentAt: '2024-03-15T09:00:00Z',
          promptVersion: 'ACTION_06_PROMPT_VERSION_1.0',
        }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3234
  it('should execute daily report collection, member submission status confirmation, and prepare morning brief for manager', async () => {
    const executionTimestamp = new Date('2024-03-15T09:00:00Z');
    const agentInput: Tx11AgentInput = {
      executionTimestamp,
      teamId: 'team-dev',
      reportDeadlineTime: '08:59',
      managerEmail: 'manager@example.com',
    };

    const result: Tx11AgentOutput = await runTx11Imp1Agent(agentInput, mockAiClient);

    expect(mockAiClient.action01_checkSubmissionStatus).toHaveBeenCalled();

    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(5);
    expect(result.submissionStatus.unsubmittedMembers).toEqual([
      'member-006',
      'member-007',
      'member-008',
      'member-009',
      'member-010',
    ]);

    expect(mockAiClient.action02_sendReminderNotifications).toHaveBeenCalled();

    expect(result.notificationsSent).toHaveLength(5);
    expect(result.notificationsSent[0]).toEqual({
      userId: expect.stringMatching(/^member-00[6-9]$|^member-010$/),
      notificationId: expect.stringMatching(/^notif-/),
      status: 'sent',
    });

    expect(mockAiClient.action03_extractIssuesFromReports).toHaveBeenCalled();

    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(5);
    expect(result.prioritizedIssues[0].keyword).toBe('Memory leak suspected');
    expect(result.prioritizedIssues[0].priorityScore).toBe(95);
    expect(result.prioritizedIssues[0].severity).toBe('critical');

    expect(result.prioritizedIssues[1].keyword).toBe('Database connection timeout');
    expect(result.prioritizedIssues[1].priorityScore).toBe(85);
    expect(result.prioritizedIssues[1].severity).toBe('high');

    expect(result.prioritizedIssues[2].keyword).toBe('Deployment script error');
    expect(result.prioritizedIssues[2].priorityScore).toBe(80);
    expect(result.prioritizedIssues[2].severity).toBe('high');

    expect(result.prioritizedIssues[3].keyword).toBe('API response delay');
    expect(result.prioritizedIssues[3].priorityScore).toBe(60);
    expect(result.prioritizedIssues[3].severity).toBe('medium');

    expect(result.prioritizedIssues[4].keyword).toBe('Merge conflicts');
    expect(result.prioritizedIssues[4].priorityScore).toBe(55);
    expect(result.prioritizedIssues[4].severity).toBe('medium');

    expect(mockAiClient.action04_rankIssuesByPriority).toHaveBeenCalled();

    expect(mockAiClient.action05_generateMorningBriefSummary).toHaveBeenCalled();

    expect(mockAiClient.action06_notifyManagerWithBrief).toHaveBeenCalled();

    expect(result.summaryEmailSent).toBe(true);

    const auditLogCall = mockAuditLogger.logAction.mock.calls[0];
    expect(auditLogCall).toBeDefined();
  });
});