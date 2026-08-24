import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('朝会報告AIエージェント - tx-11-imp-1', () => {
  // SCEN-3239
  test('朝会用サマリーを部長に事前配信する', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '09:30';
    const managerEmail = 'manager@example.com';

    // Mock data: past 7 days of reports (5 submitted reports with extracted issues)
    const pastReportsData = [
      {
        reportId: 'report-001',
        submittedBy: 'eng-001',
        submittedAt: new Date('2024-01-08T08:45:00Z'),
        yesterdayAccomplishment: 'Completed API integration testing',
        todayPlan: 'Deploy to staging environment',
        challenges: 'Database connection timeout issues persist',
        extractedIssues: [
          {
            keywordId: 'kw-db-timeout',
            keyword: 'Database timeout',
            frequency: 2,
            impactScore: 75,
            severity: 'high'
          }
        ]
      },
      {
        reportId: 'report-002',
        submittedBy: 'eng-002',
        submittedAt: new Date('2024-01-09T08:30:00Z'),
        yesterdayAccomplishment: 'Unit tests for auth module',
        todayPlan: 'Code review for payment integration',
        challenges: 'Team member on leave, workload increase',
        extractedIssues: [
          {
            keywordId: 'kw-staffing',
            keyword: 'Resource shortage',
            frequency: 3,
            impactScore: 60,
            severity: 'medium'
          }
        ]
      },
      {
        reportId: 'report-003',
        submittedBy: 'eng-003',
        submittedAt: new Date('2024-01-10T09:15:00Z'),
        yesterdayAccomplishment: 'Fixed critical memory leak',
        todayPlan: 'Performance optimization',
        challenges: 'Database connection timeout issues',
        extractedIssues: [
          {
            keywordId: 'kw-db-timeout',
            keyword: 'Database timeout',
            frequency: 1,
            impactScore: 75,
            severity: 'high'
          }
        ]
      },
      {
        reportId: 'report-004',
        submittedBy: 'eng-004',
        submittedAt: new Date('2024-01-11T08:50:00Z'),
        yesterdayAccomplishment: 'Refactored logging module',
        todayPlan: 'Infrastructure maintenance',
        challenges: 'Deployment process fragile, needs automation',
        extractedIssues: [
          {
            keywordId: 'kw-deploy-auto',
            keyword: 'Deployment automation',
            frequency: 2,
            impactScore: 50,
            severity: 'medium'
          }
        ]
      },
      {
        reportId: 'report-005',
        submittedBy: 'eng-005',
        submittedAt: new Date('2024-01-12T09:00:00Z'),
        yesterdayAccomplishment: 'Documentation update complete',
        todayPlan: 'Sprint planning preparation',
        challenges: 'Database connection timeout issues',
        extractedIssues: [
          {
            keywordId: 'kw-db-timeout',
            keyword: 'Database timeout',
            frequency: 1,
            impactScore: 75,
            severity: 'high'
          }
        ]
      }
    ];

    // Current day submission status
    const submissionStatus = {
      totalMembers: 10,
      submittedCount: 8,
      unsubmittedMembers: ['eng-009', 'eng-010'],
      submittedReports: [
        {
          reportId: 'report-today-001',
          submittedBy: 'eng-001',
          submittedAt: new Date('2024-01-15T08:15:00Z'),
          yesterdayAccomplishment: 'Continued database optimization',
          todayPlan: 'Deploy optimization changes',
          challenges: 'Database connection timeout still occurring',
          extractedIssues: [
            {
              keywordId: 'kw-db-timeout',
              keyword: 'Database timeout',
              frequency: 1,
              impactScore: 75,
              severity: 'high'
            }
          ]
        },
        {
          reportId: 'report-today-002',
          submittedBy: 'eng-002',
          submittedAt: new Date('2024-01-15T08:25:00Z'),
          yesterdayAccomplishment: 'Code review completed',
          todayPlan: 'Payment integration testing',
          challenges: 'Resource allocation challenging',
          extractedIssues: [
            {
              keywordId: 'kw-staffing',
              keyword: 'Resource shortage',
              frequency: 1,
              impactScore: 60,
              severity: 'medium'
            }
          ]
        },
        {
          reportId: 'report-today-003',
          submittedBy: 'eng-003',
          submittedAt: new Date('2024-01-15T08:20:00Z'),
          yesterdayAccomplishment: 'Performance analysis',
          todayPlan: 'Optimization implementation',
          challenges: 'Database timeout blocking progress',
          extractedIssues: [
            {
              keywordId: 'kw-db-timeout',
              keyword: 'Database timeout',
              frequency: 1,
              impactScore: 75,
              severity: 'high'
            }
          ]
        }
      ]
    };

    // Past issue master data (20 historical issues for reference)
    const pastIssueMasterData = [
      { issueId: 'issue-past-001', keyword: 'Database timeout', lastOccurrence: new Date('2024-01-12T09:00:00Z'), resolutionDays: 3 },
      { issueId: 'issue-past-002', keyword: 'Resource shortage', lastOccurrence: new Date('2024-01-11T08:00:00Z'), resolutionDays: 5 },
      { issueId: 'issue-past-003', keyword: 'Deployment automation', lastOccurrence: new Date('2024-01-10T10:00:00Z'), resolutionDays: 7 }
    ];

    // Mock AI client
    const mockAiClient = {
      buildAction01Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 1 prompt',
        version: '1.0'
      }),
      buildAction02Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 2 prompt',
        version: '1.0'
      }),
      buildAction03Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 3 prompt',
        version: '1.0'
      }),
      buildAction04Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 4 prompt',
        version: '1.0'
      }),
      buildAction05Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 5 prompt',
        version: '1.0'
      }),
      buildAction06Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 6 prompt - morning summary',
        version: '1.0'
      }),
      buildAction07Prompt: jest.fn().mockResolvedValue({
        prompt: 'Action 7 prompt',
        version: '1.0'
      }),
      callAiModel: jest.fn().mockResolvedValue({
        summaryId: 'summary-20240115-001',
        generatedAt: '2024-01-15T08:30:00Z',
        targetManager: managerEmail,
        issuesRanked: [
          {
            id: 'ranked-issue-001',
            title: 'Database timeout',
            severity: 'high',
            impactScore: 75,
            frequency: 3,
            proposedAction: 'Review database connection pool configuration and apply optimization',
            relatedPastIssues: ['issue-past-001'],
            affectedCount: 3
          },
          {
            id: 'ranked-issue-002',
            title: 'Resource shortage',
            severity: 'medium',
            impactScore: 60,
            frequency: 2,
            proposedAction: 'Adjust sprint allocation and team capacity planning',
            relatedPastIssues: ['issue-past-002'],
            affectedCount: 2
          },
          {
            id: 'ranked-issue-003',
            title: 'Deployment automation',
            severity: 'medium',
            impactScore: 50,
            frequency: 1,
            proposedAction: 'Evaluate CI/CD pipeline improvements and implement automation',
            relatedPastIssues: ['issue-past-003'],
            affectedCount: 1
          }
        ],
        unsubmittedMembers: [
          {
            memberId: 'eng-009',
            name: 'Member 9',
            submissionDeadline: reportDeadlineTime
          },
          {
            memberId: 'eng-010',
            name: 'Member 10',
            submissionDeadline: reportDeadlineTime
          }
        ],
        meetingPreparationTimeEstimate: 12
      })
    };

    // Mock NotificationServiceAdapter
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        deliveryStatus: 'success',
        sentAt: new Date('2024-01-15T08:31:00Z')
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'Database timeout', frequency: 3, confidence: 0.95 },
          { keyword: 'Resource shortage', frequency: 2, confidence: 0.88 },
          { keyword: 'Deployment automation', frequency: 1, confidence: 0.82 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        scores: {
          'Database timeout': 75,
          'Resource shortage': 60,
          'Deployment automation': 50
        }
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classifications: {
          'Database timeout': 'high',
          'Resource shortage': 'medium',
          'Deployment automation': 'medium'
        }
      })
    };

    // Audit log storage mock
    const auditLogs = [];
    const mockAuditLogger = {
      log: jest.fn((logEntry) => {
        auditLogs.push(logEntry);
        return Promise.resolve();
      })
    };

    // Input to orchestrator
    const agentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail
    };

    // Execute agent with mocked dependencies
    const result = await runTx11Imp1Agent(agentInput, mockAiClient, mockNotificationService, mockTextAnalysisService, mockAuditLogger);

    // Assertions: basic execution status
    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');

    // Assertion: Action 6 (morning summary distribution) was called
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalled();

    // Assertion: generated summary structure
    expect(result.summaryEmailSent).toBe(true);
    expect(result.submissionStatus).toBeDefined();
    expect(result.submissionStatus.totalMembers).toBe(10);
    expect(result.submissionStatus.submittedCount).toBe(8);
    expect(result.submissionStatus.unsubmittedMembers).toEqual(['eng-009', 'eng-010']);

    // Assertion: prioritized issues ranking and structure
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(3);

    // Verify issue ordering: high → medium → low
    expect(result.prioritizedIssues[0].severity).toBe('high');
    expect(result.prioritizedIssues[0].impactScore).toBe(75);
    expect(result.prioritizedIssues[0].title).toBe('Database timeout');

    expect(result.prioritizedIssues[1].severity).toBe('medium');
    expect(result.prioritizedIssues[1].impactScore).toBe(60);
    expect(result.prioritizedIssues[1].title).toBe('Resource shortage');

    expect(result.prioritizedIssues[2].severity).toBe('medium');
    expect(result.prioritizedIssues[2].impactScore).toBe(50);
    expect(result.prioritizedIssues[2].title).toBe('Deployment automation');

    // Assertion: impact scores are in valid range
    result.prioritizedIssues.forEach((issue) => {
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
    });

    // Assertion: recurring issues have review proposal in action
    const dbTimeoutIssue = result.prioritizedIssues.find((i) => i.title === 'Database timeout');
    expect(dbTimeoutIssue).toBeDefined();
    if (dbTimeoutIssue) {
      expect(dbTimeoutIssue.proposedAction).toMatch(/configuration|optimization/i);
      expect(dbTimeoutIssue.relatedPastIssues).toBeDefined();
      expect(dbTimeoutIssue.relatedPastIssues.length).toBeGreaterThan(0);
    }

    // Assertion: notification service was called with manager email
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: managerEmail,
        notificationType: 'morning_summary'
      })
    );

    // Assertion: unsubmitted members are included in summary
    expect(result.notificationsSent).toBeDefined();
    expect(result.notificationsSent.length).toBeGreaterThan(0);

    // Assertion: audit log recorded the action execution
    expect(auditLogs.length).toBeGreaterThan(0);
    const action06Log = auditLogs.find((log) => log.actionId === 'action-06');
    expect(action06Log).toBeDefined();
    if (action06Log) {
      expect(action06Log.executionTimestamp).toBeDefined();
      expect(action06Log.deliveryStatus).toBe('success');
      expect(typeof action06Log.generatedSummaryId).toBe('string');
    }

    // Assertion: summary prep time estimate is reasonable
    expect(typeof result.meetingPreparationTimeEstimate).toBe('number');
    expect(result.meetingPreparationTimeEstimate).toBeLessThanOrEqual(15);
  });
});