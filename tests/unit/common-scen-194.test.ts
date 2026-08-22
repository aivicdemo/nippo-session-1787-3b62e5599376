import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type {
  Tx11AgentInput,
  Tx11AgentOutput,
  SubmissionStatusSummary,
  PrioritizedIssue,
  NotificationRecord,
} from '../../src/agents/tx-11-imp-1/types';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-194: [normal] 日報収集・確認・催促の自動化エージェント AIエージェント
  test('should complete all 7 autonomous actions for daily report collection, confirmation, and reminders without human approval', async () => {
    // Initialize mock AI client
    const mockAiClient = {
      action01_getSubmissionStatus: jest.fn(),
      action02_sendReminderNotifications: jest.fn(),
      action03_extractIssues: jest.fn(),
      action04_searchPastIssues: jest.fn(),
      action05_prioritizeAndSummarize: jest.fn(),
      action06_sendManagerSummary: jest.fn(),
      action07_prepareReferenceInfo: jest.fn(),
    };

    // Mock data: 10 team members, 7 submitted, 3 unsubmitted
    const submittedMembers = ['M001', 'M002', 'M003', 'M004', 'M005', 'M006', 'M007'];
    const unsubmittedMembers = ['M008', 'M009', 'M010'];
    const totalMembers = 10;

    // Mock Action 1: Get submission status
    const submissionStatus: SubmissionStatusSummary = {
      totalMembers,
      submittedCount: 7,
      unsubmittedMembers,
    };
    mockAiClient.action01_getSubmissionStatus.mockResolvedValue({
      status: 'ACTION_01_COMPLETED',
      data: submissionStatus,
      timestamp: new Date('2024-01-15T08:00:00Z'),
    });

    // Mock Action 2: Send reminder notifications
    const reminderNotifications: NotificationRecord[] = [
      {
        memberId: 'M008',
        notificationType: 'REMINDER',
        sentAt: new Date('2024-01-15T08:05:00Z'),
        messageId: 'msg_001',
      },
      {
        memberId: 'M009',
        notificationType: 'REMINDER',
        sentAt: new Date('2024-01-15T08:05:00Z'),
        messageId: 'msg_002',
      },
      {
        memberId: 'M010',
        notificationType: 'REMINDER',
        sentAt: new Date('2024-01-15T08:05:00Z'),
        messageId: 'msg_003',
      },
    ];
    mockAiClient.action02_sendReminderNotifications.mockResolvedValue({
      status: 'ACTION_02_COMPLETED',
      data: {
        notificationsSent: reminderNotifications,
        totalCount: 3,
      },
      timestamp: new Date('2024-01-15T08:05:00Z'),
    });

    // Mock Action 3: Extract issues from submitted reports
    const extractedIssues = [
      { issueId: 'ISS_001', memberId: 'M001', content: 'Database connection timeout', extractedAt: new Date('2024-01-15T08:10:00Z') },
      { issueId: 'ISS_002', memberId: 'M002', content: 'API response delay', extractedAt: new Date('2024-01-15T08:10:00Z') },
      { issueId: 'ISS_003', memberId: 'M003', content: 'Memory leak in worker process', extractedAt: new Date('2024-01-15T08:10:00Z') },
      { issueId: 'ISS_004', memberId: 'M004', content: 'Database connection timeout', extractedAt: new Date('2024-01-15T08:10:00Z') },
      { issueId: 'ISS_005', memberId: 'M005', content: 'Test failure in deployment', extractedAt: new Date('2024-01-15T08:10:00Z') },
    ];
    mockAiClient.action03_extractIssues.mockResolvedValue({
      status: 'ACTION_03_COMPLETED',
      data: {
        extractedIssues,
        totalCount: 5,
      },
      timestamp: new Date('2024-01-15T08:10:00Z'),
    });

    // Mock Action 4: Search past issues and find matching cases
    const pastIssueMatches = [
      {
        currentIssueId: 'ISS_001',
        pastIssueId: 'PAST_001',
        matchType: 'EXACT',
        similarity: 0.95,
        resolutionMethod: 'Increased connection pool size to 50',
        resolutionDate: new Date('2024-01-08T00:00:00Z'),
      },
      {
        currentIssueId: 'ISS_002',
        pastIssueId: 'PAST_002',
        matchType: 'SIMILAR',
        similarity: 0.78,
        resolutionMethod: 'Optimized API response caching',
        resolutionDate: new Date('2024-01-10T00:00:00Z'),
      },
      {
        currentIssueId: 'ISS_004',
        pastIssueId: 'PAST_001',
        matchType: 'EXACT',
        similarity: 0.95,
        resolutionMethod: 'Increased connection pool size to 50',
        resolutionDate: new Date('2024-01-08T00:00:00Z'),
      },
    ];
    mockAiClient.action04_searchPastIssues.mockResolvedValue({
      status: 'ACTION_04_COMPLETED',
      data: {
        matches: pastIssueMatches,
        totalMatches: 3,
      },
      timestamp: new Date('2024-01-15T08:15:00Z'),
    });

    // Mock Action 5: Prioritize and create summary
    const prioritizedIssues: PrioritizedIssue[] = [
      {
        issueId: 'ISS_001',
        content: 'Database connection timeout',
        priority: 'HIGH',
        score: 85,
        frequency: 2,
        impact: 'CRITICAL',
      },
      {
        issueId: 'ISS_003',
        content: 'Memory leak in worker process',
        priority: 'HIGH',
        score: 82,
        frequency: 1,
        impact: 'CRITICAL',
      },
      {
        issueId: 'ISS_002',
        content: 'API response delay',
        priority: 'MEDIUM',
        score: 65,
        frequency: 1,
        impact: 'HIGH',
      },
      {
        issueId: 'ISS_005',
        content: 'Test failure in deployment',
        priority: 'MEDIUM',
        score: 58,
        frequency: 1,
        impact: 'MEDIUM',
      },
    ];
    mockAiClient.action05_prioritizeAndSummarize.mockResolvedValue({
      status: 'ACTION_05_COMPLETED',
      data: {
        summary: {
          prioritizedIssues,
          totalIssuesProcessed: 5,
          highPriorityCount: 2,
          mediumPriorityCount: 2,
          lowPriorityCount: 0,
        },
      },
      timestamp: new Date('2024-01-15T08:20:00Z'),
    });

    // Mock Action 6: Send manager summary
    mockAiClient.action06_sendManagerSummary.mockResolvedValue({
      status: 'ACTION_06_COMPLETED',
      data: {
        summaryEmailSent: true,
        managerEmail: 'manager@company.com',
        emailContent: {
          submissionStatus: '7/10',
          unsubmittedCount: 3,
          unsubmittedMembers: ['M008', 'M009', 'M010'],
          extractedIssueCount: 5,
          prioritizedIssuesList: prioritizedIssues,
          referenceInfo: pastIssueMatches,
        },
        messageId: 'msg_manager_001',
        sentAt: new Date('2024-01-15T08:25:00Z'),
      },
      timestamp: new Date('2024-01-15T08:25:00Z'),
    });

    // Mock Action 7: Prepare reference info for next report creation
    mockAiClient.action07_prepareReferenceInfo.mockResolvedValue({
      status: 'ACTION_07_COMPLETED',
      data: {
        referenceInfoPrepared: true,
        pastIssuesForReference: [
          {
            issueId: 'PAST_001',
            content: 'Database connection timeout',
            resolutionMethod: 'Increased connection pool size to 50',
            lastOccurrenceDate: new Date('2024-01-15T08:00:00Z'),
          },
          {
            issueId: 'PAST_002',
            content: 'API response delay',
            resolutionMethod: 'Optimized API response caching',
            lastOccurrenceDate: new Date('2024-01-15T08:00:00Z'),
          },
        ],
        similarCasesCount: 2,
      },
      timestamp: new Date('2024-01-15T08:30:00Z'),
    });

    // Prepare agent input
    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T08:00:00Z'),
      teamId: 'TEAM_001',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@company.com',
    };

    // Execute orchestrator function
    const result = await runTx11Imp1Agent(agentInput, mockAiClient as any);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.submissionStatus).toBeDefined();
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.notificationsSent).toBeDefined();
    expect(result.summaryEmailSent).toBe(true);

    // Verify Action 1: Submission status
    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(7);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(['M008', 'M009', 'M010']);

    // Verify Action 2: Reminder notifications sent to 3 unsubmitted members
    expect(result.notificationsSent).toHaveLength(3);
    expect(result.notificationsSent[0].memberId).toBe('M008');
    expect(result.notificationsSent[1].memberId).toBe('M009');
    expect(result.notificationsSent[2].memberId).toBe('M010');
    result.notificationsSent.forEach((notification) => {
      expect(notification.notificationType).toBe('REMINDER');
    });

    // Verify Action 3 & 4 & 5: Issues extracted and prioritized
    expect(result.prioritizedIssues).toHaveLength(4);
    
    // Verify high priority issues are present
    const highPriorityIssues = result.prioritizedIssues.filter(i => i.priority === 'HIGH');
    expect(highPriorityIssues).toHaveLength(2);
    
    // Verify issue priority scores
    expect(result.prioritizedIssues[0].score).toBe(85);
    expect(result.prioritizedIssues[0].priority).toBe('HIGH');
    expect(result.prioritizedIssues[2].score).toBe(65);
    expect(result.prioritizedIssues[2].priority).toBe('MEDIUM');

    // Verify issue frequency and impact
    const databaseTimeoutIssue = result.prioritizedIssues.find(i => i.issueId === 'ISS_001');
    expect(databaseTimeoutIssue).toBeDefined();
    expect(databaseTimeoutIssue?.frequency).toBe(2);
    expect(databaseTimeoutIssue?.impact).toBe('CRITICAL');

    // Verify Action 6: Manager summary email sent
    expect(result.summaryEmailSent).toBe(true);

    // Verify mock calls in order (orchestrated execution)
    expect(mockAiClient.action01_getSubmissionStatus).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action02_sendReminderNotifications).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action03_extractIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action04_searchPastIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action05_prioritizeAndSummarize).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action06_sendManagerSummary).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action07_prepareReferenceInfo).toHaveBeenCalledTimes(1);

    // Verify call order by checking execution order of mock calls
    const mockCalls = [
      { fn: mockAiClient.action01_getSubmissionStatus, name: 'action01' },
      { fn: mockAiClient.action02_sendReminderNotifications, name: 'action02' },
      { fn: mockAiClient.action03_extractIssues, name: 'action03' },
      { fn: mockAiClient.action04_searchPastIssues, name: 'action04' },
      { fn: mockAiClient.action05_prioritizeAndSummarize, name: 'action05' },
      { fn: mockAiClient.action06_sendManagerSummary, name: 'action06' },
      { fn: mockAiClient.action07_prepareReferenceInfo, name: 'action07' },
    ];

    let lastCallTime = -1;
    for (const mockCall of mockCalls) {
      expect(mockCall.fn).toHaveBeenCalled();
      const currentCallTime = mockCall.fn.mock.invocationCallOrder[0];
      expect(currentCallTime).toBeGreaterThan(lastCallTime);
      lastCallTime = currentCallTime;
    }

    // Verify email sending summary
    expect(result.notificationsSent).toHaveLength(3);
    expect(result.summaryEmailSent).toBe(true);
  });
});