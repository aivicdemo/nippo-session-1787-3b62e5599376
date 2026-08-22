import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-01';
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-02';
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-03';
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-04';
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-05';
import {
  buildAction06Prompt,
  ACTION_06_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-06';
import {
  buildAction07Prompt,
  ACTION_07_PROMPT_VERSION,
} from '../../src/agents/tx-11-imp-1/prompts/action-07';
import type {
  Tx11AgentInput,
  Tx11AgentOutput,
  SubmissionStatusSummary,
  PrioritizedIssue,
  NotificationRecord,
} from '../../src/agents/tx-11-imp-1/types';

// Mock AI Client
interface Tx11Imp1AiClient {
  callAction01(prompt: string, version: string): Promise<{
    totalMembers: number;
    submittedCount: number;
    unsubmittedMembers: string[];
  }>;
  callAction02(prompt: string, version: string): Promise<NotificationRecord[]>;
  callAction03(prompt: string, version: string): Promise<
    Array<{
      id: string;
      content: string;
      reporterId: string;
      severity: string;
    }>
  >;
  callAction04(prompt: string, version: string): Promise<
    Array<{
      issueId: string;
      pastIssues: Array<{
        id: string;
        content: string;
        resolution: string;
        resolutionDate: string;
      }>;
      similarCases: Array<{
        id: string;
        similarity: number;
        content: string;
      }>;
    }>
  >;
  callAction05(prompt: string, version: string): Promise<PrioritizedIssue[]>;
  callAction06(prompt: string, version: string): Promise<{
    emailDraft: string;
    submissionRate: number;
    unsubmittedList: string[];
    prioritizedIssueCount: number;
    estimatedTimeReduction: number;
  }>;
  callAction07(prompt: string, version: string): Promise<
    Array<{
      memberId: string;
      referenceInfo: string;
      formattedContent: string;
    }>
  >;
}

// Mock database
interface MockDatabase {
  memberReports: Array<{
    memberId: string;
    timestamp: Date;
    content: string;
    submitted: boolean;
  }>;
  pastIssues: Array<{
    id: string;
    content: string;
    resolution: string;
    resolutionDate: Date;
  }>;
  auditLog: Array<{
    timestamp: Date;
    action: string;
    details: Record<string, unknown>;
  }>;
  emailLog: Array<{
    recipient: string;
    subject: string;
    body: string;
    timestamp: Date;
  }>;
}

describe('Tx11Imp1Agent - Daily Report Collection and Priority Notification', () => {
  test('SCEN-200: Agent executes autonomous actions to collect reports, detect unsubmitted members, extract issues, prioritize them, and deliver summary email to manager', async () => {
    // Setup: Initialize fake AI client and mock database
    const mockDb: MockDatabase = {
      memberReports: [
        {
          memberId: 'memberA',
          timestamp: new Date('2024-01-15T07:00:00Z'),
          content: 'Completed task X. No issues.',
          submitted: true,
        },
        {
          memberId: 'memberB',
          timestamp: new Date('2024-01-15T06:59:00Z'),
          content: '',
          submitted: false,
        },
        {
          memberId: 'memberC',
          timestamp: new Date('2024-01-15T07:10:00Z'),
          content: 'Database connection timeout occurred. Issue recurring.',
          submitted: true,
        },
        {
          memberId: 'memberD',
          timestamp: new Date('2024-01-15T07:05:00Z'),
          content: 'Completed deployment. All tests passed.',
          submitted: true,
        },
        {
          memberId: 'memberE',
          timestamp: new Date('2024-01-15T06:30:00Z'),
          content: '',
          submitted: false,
        },
        {
          memberId: 'memberF',
          timestamp: new Date('2024-01-15T07:15:00Z'),
          content: 'API rate limiting issue detected.',
          submitted: true,
        },
        {
          memberId: 'memberG',
          timestamp: new Date('2024-01-15T07:08:00Z'),
          content: 'Code review completed. No blocking issues.',
          submitted: true,
        },
        {
          memberId: 'memberH',
          timestamp: new Date('2024-01-15T06:45:00Z'),
          content: '',
          submitted: false,
        },
        {
          memberId: 'memberI',
          timestamp: new Date('2024-01-15T07:20:00Z'),
          content: 'Feature development on track. Database connection timeout issue found.',
          submitted: true,
        },
        {
          memberId: 'memberJ',
          timestamp: new Date('2024-01-15T07:12:00Z'),
          content: 'Testing infrastructure issue resolved.',
          submitted: true,
        },
      ],
      pastIssues: [
        {
          id: 'past-issue-1',
          content: 'Database connection timeout',
          resolution: 'Increased connection pool size and added retry logic',
          resolutionDate: new Date('2024-01-10T14:00:00Z'),
        },
        {
          id: 'past-issue-2',
          content: 'Database connection timeout',
          resolution: 'Updated database driver version',
          resolutionDate: new Date('2024-01-05T10:30:00Z'),
        },
        {
          id: 'past-issue-3',
          content: 'API rate limiting issue',
          resolution: 'Implemented exponential backoff strategy',
          resolutionDate: new Date('2024-01-08T16:45:00Z'),
        },
        {
          id: 'past-issue-4',
          content: 'Network connectivity problem',
          resolution: 'Switched to redundant network path',
          resolutionDate: new Date('2023-12-28T09:15:00Z'),
        },
        {
          id: 'past-issue-5',
          content: 'API rate limiting issue',
          resolution: 'Added request batching and caching',
          resolutionDate: new Date('2023-12-20T13:20:00Z'),
        },
      ],
      auditLog: [],
      emailLog: [],
    };

    const fakeAiClient: Tx11Imp1AiClient = {
      callAction01: async (prompt: string, version: string) => {
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:30:00Z'),
          action: 'Action01_CheckSubmissionStatus',
          details: { promptVersion: version },
        });
        expect(version).toBe(ACTION_01_PROMPT_VERSION);
        return {
          totalMembers: 10,
          submittedCount: 7,
          unsubmittedMembers: ['memberB', 'memberE', 'memberH'],
        };
      },

      callAction02: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_02_PROMPT_VERSION);
        const notifications: NotificationRecord[] = [
          {
            recipientId: 'memberB',
            messageId: 'notif-001',
            sentAt: new Date('2024-01-15T07:32:00Z'),
            messageContent: 'Please submit your daily report',
            status: 'sent',
          },
          {
            recipientId: 'memberE',
            messageId: 'notif-002',
            sentAt: new Date('2024-01-15T07:32:00Z'),
            messageContent: 'Please submit your daily report',
            status: 'sent',
          },
          {
            recipientId: 'memberH',
            messageId: 'notif-003',
            sentAt: new Date('2024-01-15T07:32:00Z'),
            messageContent: 'Please submit your daily report',
            status: 'sent',
          },
        ];
        mockDb.emailLog.push({
          recipient: 'memberB',
          subject: 'Daily Report Reminder',
          body: 'Please submit your daily report',
          timestamp: new Date('2024-01-15T07:32:00Z'),
        });
        mockDb.emailLog.push({
          recipient: 'memberE',
          subject: 'Daily Report Reminder',
          body: 'Please submit your daily report',
          timestamp: new Date('2024-01-15T07:32:00Z'),
        });
        mockDb.emailLog.push({
          recipient: 'memberH',
          subject: 'Daily Report Reminder',
          body: 'Please submit your daily report',
          timestamp: new Date('2024-01-15T07:32:00Z'),
        });
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:32:00Z'),
          action: 'Action02_SendReminders',
          details: {
            promptVersion: version,
            notificationCount: 3,
            recipients: ['memberB', 'memberE', 'memberH'],
          },
        });
        return notifications;
      },

      callAction03: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_03_PROMPT_VERSION);
        const extractedIssues = [
          {
            id: 'issue-001',
            content: 'Database connection timeout',
            reporterId: 'memberC',
            severity: 'high',
          },
          {
            id: 'issue-002',
            content: 'API rate limiting issue',
            reporterId: 'memberF',
            severity: 'medium',
          },
          {
            id: 'issue-003',
            content: 'Database connection timeout',
            reporterId: 'memberI',
            severity: 'high',
          },
        ];
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:35:00Z'),
          action: 'Action03_ExtractIssues',
          details: {
            promptVersion: version,
            issueCount: 3,
          },
        });
        return extractedIssues;
      },

      callAction04: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_04_PROMPT_VERSION);
        const issuesWith_references = [
          {
            issueId: 'issue-001',
            pastIssues: [
              {
                id: 'past-issue-1',
                content: 'Database connection timeout',
                resolution: 'Increased connection pool size and added retry logic',
                resolutionDate: '2024-01-10T14:00:00Z',
              },
              {
                id: 'past-issue-2',
                content: 'Database connection timeout',
                resolution: 'Updated database driver version',
                resolutionDate: '2024-01-05T10:30:00Z',
              },
            ],
            similarCases: [
              {
                id: 'similar-001',
                similarity: 0.95,
                content: 'Connection pool exhaustion',
              },
              {
                id: 'similar-002',
                similarity: 0.87,
                content: 'Database latency spike',
              },
            ],
          },
          {
            issueId: 'issue-002',
            pastIssues: [
              {
                id: 'past-issue-3',
                content: 'API rate limiting issue',
                resolution: 'Implemented exponential backoff strategy',
                resolutionDate: '2024-01-08T16:45:00Z',
              },
              {
                id: 'past-issue-5',
                content: 'API rate limiting issue',
                resolution: 'Added request batching and caching',
                resolutionDate: '2023-12-20T13:20:00Z',
              },
            ],
            similarCases: [
              {
                id: 'similar-003',
                similarity: 0.92,
                content: 'Third-party API throttling',
              },
            ],
          },
          {
            issueId: 'issue-003',
            pastIssues: [
              {
                id: 'past-issue-1',
                content: 'Database connection timeout',
                resolution: 'Increased connection pool size and added retry logic',
                resolutionDate: '2024-01-10T14:00:00Z',
              },
              {
                id: 'past-issue-2',
                content: 'Database connection timeout',
                resolution: 'Updated database driver version',
                resolutionDate: '2024-01-05T10:30:00Z',
              },
            ],
            similarCases: [
              {
                id: 'similar-004',
                similarity: 0.89,
                content: 'Connection timeout under load',
              },
            ],
          },
        ];
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:38:00Z'),
          action: 'Action04_SearchPastIssues',
          details: {
            promptVersion: version,
            pastIssuesFound: 5,
            similarCasesFound: 4,
          },
        });
        return issuesWith_references;
      },

      callAction05: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_05_PROMPT_VERSION);
        const prioritizedIssues: PrioritizedIssue[] = [
          {
            id: 'issue-001',
            content: 'Database connection timeout',
            priority: 'high',
            severity: 'high',
            frequency: 3,
            occurrenceCount: 2,
            lastOccurredAt: new Date('2024-01-15T07:10:00Z'),
            impactScope: 'backend-services',
            estimatedResolutionTime: 120,
          },
          {
            id: 'issue-003',
            content: 'Database connection timeout',
            priority: 'high',
            severity: 'high',
            frequency: 3,
            occurrenceCount: 1,
            lastOccurredAt: new Date('2024-01-15T07:20:00Z'),
            impactScope: 'feature-development',
            estimatedResolutionTime: 120,
          },
          {
            id: 'issue-002',
            content: 'API rate limiting issue',
            priority: 'medium',
            severity: 'medium',
            frequency: 2,
            occurrenceCount: 2,
            lastOccurredAt: new Date('2024-01-15T07:15:00Z'),
            impactScope: 'api-layer',
            estimatedResolutionTime: 90,
          },
        ];
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:40:00Z'),
          action: 'Action05_PrioritizeIssues',
          details: {
            promptVersion: version,
            prioritizedCount: 3,
            highPriorityCount: 2,
            mediumPriorityCount: 1,
          },
        });
        return prioritizedIssues;
      },

      callAction06: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_06_PROMPT_VERSION);
        const emailDraft =
          'Subject: Daily Report Summary - 2024-01-15\n\n' +
          'Submission Rate: 70% (7/10 members)\n' +
          'Unsubmitted Members: memberB, memberE, memberH\n' +
          'Extracted Issues: 3 (2 high priority, 1 medium priority)\n' +
          'Estimated Meeting Time Reduction: 45 minutes\n\n' +
          'Priority Issues:\n' +
          '1. Database connection timeout (High, recurred 2 times)\n' +
          '2. API rate limiting issue (Medium, recurred 2 times)\n';
        mockDb.emailLog.push({
          recipient: 'manager@example.com',
          subject: 'Daily Report Summary - 2024-01-15',
          body: emailDraft,
          timestamp: new Date('2024-01-15T07:42:00Z'),
        });
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:42:00Z'),
          action: 'Action06_GenerateManagerSummary',
          details: {
            promptVersion: version,
            submissionRate: 0.7,
            unsubmittedCount: 3,
            prioritizedIssueCount: 3,
            estimatedTimeReduction: 45,
          },
        });
        return {
          emailDraft: emailDraft,
          submissionRate: 0.7,
          unsubmittedList: ['memberB', 'memberE', 'memberH'],
          prioritizedIssueCount: 3,
          estimatedTimeReduction: 45,
        };
      },

      callAction07: async (prompt: string, version: string) => {
        expect(version).toBe(ACTION_07_PROMPT_VERSION);
        const referenceInfoSets = [
          {
            memberId: 'memberA',
            referenceInfo:
              'No past issues. Continue current tasks. Estimated time savings: 15 minutes.',
            formattedContent:
              '<div class="reference-info"><h4>Reference Information</h4><p>No related issues found.</p></div>',
          },
          {
            memberId: 'memberC',
            referenceInfo:
              'Database connection timeout: Similar issue resolved on 2024-01-10 by increasing connection pool size.',
            formattedContent:
              '<div class="reference-info"><h4>Related Past Issue</h4><p>Database connection timeout resolved via connection pool adjustment (2024-01-10).</p></div>',
          },
          {
            memberId: 'memberF',
            referenceInfo:
              'API rate limiting: Similar issue resolved on 2024-01-08 using exponential backoff strategy.',
            formattedContent:
              '<div class="reference-info"><h4>Related Past Issue</h4><p>API rate limiting resolved via exponential backoff (2024-01-08).</p></div>',
          },
          {
            memberId: 'memberI',
            referenceInfo:
              'Database connection timeout: Same issue reported by memberC. See past resolutions from 2024-01-10 and 2024-01-05.',
            formattedContent:
              '<div class="reference-info"><h4>Duplicate Issue Alert</h4><p>Database connection timeout also reported by memberC. Previous resolutions: pool size increase (2024-01-10), driver update (2024-01-05).</p></div>',
          },
        ];
        mockDb.auditLog.push({
          timestamp: new Date('2024-01-15T07:45:00Z'),
          action: 'Action07_PrepareReferenceSets',
          details: {
            promptVersion: version,
            referenceSetCount: 4,
          },
        });
        return referenceInfoSets;
      },
    };

    // Test input
    const agentInput: Tx11AgentInput = {
      executionTimestamp: new Date('2024-01-15T07:30:00Z'),
      teamId: 'team-engineering',
      reportDeadlineTime: '08:00',
      managerEmail: 'manager@example.com',
    };

    // Execute agent
    const agentOutput: Tx11AgentOutput = await runTx11Imp1Agent(
      agentInput,
      fakeAiClient,
    );

    // Verify AI client interface compliance
    expect(fakeAiClient).toHaveProperty('callAction01');
    expect(fakeAiClient).toHaveProperty('callAction02');
    expect(fakeAiClient).toHaveProperty('callAction03');
    expect(fakeAiClient).toHaveProperty('callAction04');
    expect(fakeAiClient).toHaveProperty('callAction05');
    expect(fakeAiClient).toHaveProperty('callAction06');
    expect(fakeAiClient).toHaveProperty('callAction07');

    // Verify Action-01: Submission status check
    expect(agentOutput.submissionStatus.totalMembers).toBe(10);
    expect(agentOutput.submissionStatus.submittedCount).toBe(7);
    expect(agentOutput.submissionStatus.unsubmittedMembers).toEqual([
      'memberB',
      'memberE',
      'memberH',
    ]);

    // Verify Action-02: Reminders sent to unsubmitted members
    expect(agentOutput.notificationsSent).toHaveLength(3);
    expect(agentOutput.notificationsSent[0].recipientId).toBe('memberB');
    expect(agentOutput.notificationsSent[1].recipientId).toBe('memberE');
    expect(agentOutput.notificationsSent[2].recipientId).toBe('memberH');
    expect(agentOutput.notificationsSent[0].status).toBe('sent');

    // Verify Action-03 & Action-04: Issues extracted and past data retrieved
    expect(agentOutput.prioritizedIssues.length).toBeGreaterThan(0);

    // Verify Action-05: Issues prioritized by severity and frequency
    expect(agentOutput.prioritizedIssues[0].priority).toBe('high');
    expect(agentOutput.prioritizedIssues[0].severity).toBe('high');
    expect(agentOutput.prioritizedIssues[0].frequency).toBe(3);
    expect(agentOutput.prioritizedIssues[1].priority).toBe('high');
    expect(agentOutput.prioritizedIssues[2].priority).toBe('medium');

    // Verify issue recurrence detection
    const dbConnTimeoutIssues = agentOutput.prioritizedIssues.filter(
      (iss) => iss.content === 'Database connection timeout',
    );
    expect(dbConnTimeoutIssues.length).toBe(2);
    expect(dbConnTimeoutIssues[0].occurrenceCount).toBe(2);

    // Verify Action-06: Manager summary email generation
    expect(agentOutput.summaryEmailSent).toBe(true);

    // Verify manager summary contains submission rate
    const emailLog = mockDb.emailLog.find(
      (log) => log.recipient === 'manager@example.com',
    );
    expect(emailLog).toBeDefined();
    expect(emailLog!.body).toContain('70%');
    expect(emailLog!.body).toContain('7/10 members');

    // Verify manager summary contains unsubmitted members list
    expect(emailLog!.body).toContain('memberB');
    expect(emailLog!.body).toContain('memberE');
    expect(emailLog!.body).toContain('memberH');

    // Verify manager summary contains issue count and priority classification
    expect(emailLog!.body).toContain('3');
    expect(emailLog!.body).toContain('High');
    expect(emailLog!.body).toContain('Medium');

    // Verify manager summary contains time reduction estimate
    expect(emailLog!.body).toContain('45 minutes');

    // Verify Action-07: Member reference information prepared
    const memberReferenceRecords = mockDb.auditLog.filter(
      (log) => log.action === 'Action07_PrepareReferenceSets',
    );
    expect(memberReferenceRecords.length).toBeGreaterThan(0);
    const action07Details = memberReferenceRecords[0].details;
    expect(action07Details.referenceSetCount).toBe(4);

    // Verify audit log records execution order and counts
    const auditActions = mockDb.auditLog.map((log) => log.action);
    const action01Index = auditActions.indexOf('Action01_CheckSubmissionStatus');
    const action02Index = auditActions.indexOf('Action02_SendReminders');
    const action03Index = auditActions.indexOf('Action03_ExtractIssues');
    const action04Index = auditActions.indexOf('Action04_SearchPastIssues');
    const action05Index = auditActions.indexOf('Action05_PrioritizeIssues');
    const action06Index = auditActions.indexOf(
      'Action06_GenerateManagerSummary',
    );
    const action07Index = auditActions.indexOf('Action07_PrepareReferenceSets');

    expect(action01Index).toBeLessThan(action02Index);
    expect(action02Index).toBeLessThan(action03Index);
    expect(action03Index).toBeLessThan(action04Index);
    expect(action04Index).toBeLessThan(action05Index);
    expect(action05Index).toBeLessThan(action06Index);
    expect(action06Index).toBeLessThan(action07Index);

    // Verify audit log contains execution timestamp and team info
    expect(mockDb.auditLog[0].timestamp).toEqual(
      new Date('2024-01-15T07:30:00Z'),
    );
    expect(mockDb.auditLog[0].details.promptVersion).toBe(
      ACTION_01_PROMPT_VERSION,
    );

    // Verify Action-02 audit log details
    const action02Log = mockDb.auditLog.find(
      (log) => log.action === 'Action02_SendReminders',
    );
    expect(action02Log!.details.notificationCount).toBe(3);
    expect(action02Log!.details.recipients).toEqual([
      'memberB',
      'memberE',
      'memberH',
    ]);

    // Verify no actual external communication occurred (only stub logs)
    expect(mockDb.emailLog.length).toBe(4);
    const reminderEmails = mockDb.emailLog.filter(
      (log) => log.subject === 'Daily Report Reminder',
    );
    expect(reminderEmails.length).toBe(3);

    // Verify submission rate calculation: 7 submitted out of 10 total = 70%
    const submissionRateLog = mockDb.auditLog.find(
      (log) => log.action === 'Action06_GenerateManagerSummary',
    );
    expect(submissionRateLog!.details.submissionRate).toBe(0.7);

    // Verify prioritized issue count includes all extracted issues
    expect(submissionRateLog!.details.prioritizedIssueCount).toBe(3);

    // Verify unsubmitted member count matches
    expect(submissionRateLog!.details.unsubmittedCount).toBe(3);

    // Verify all actions completed successfully
    expect(agentOutput).toHaveProperty('submissionStatus');
    expect(agentOutput).toHaveProperty('prioritizedIssues');
    expect(agentOutput).toHaveProperty('notificationsSent');
    expect(agentOutput).toHaveProperty('summaryEmailSent');
  });
});