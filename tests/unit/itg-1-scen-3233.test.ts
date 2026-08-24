import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('TX-11-IMP-1: Daily Report Collection, Confirmation & Reminder Automation Agent', () => {
  // SCEN-3233
  test('should complete normal workflow for daily report collection, issue extraction, prioritization and manager notification without manual approval', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-engineering-001';
    const reportDeadlineTime = '09:00';
    const morningMeetingStartTime = '08:30';
    const managerEmail = 'manager@company.com';

    const memberIds = [
      'member-001',
      'member-002',
      'member-003',
      'member-004',
      'member-005',
      'member-006',
      'member-007',
      'member-008',
      'member-009',
      'member-010',
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'success',
        deliveryTimestamp: executionTimestamp.toISOString(),
        recipientId: '',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ status: 'scheduled' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'DBパフォーマンス低下', frequency: 3 },
          { keyword: 'テスト工程遅延', frequency: 2 },
          { keyword: 'ネットワーク接続エラー', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 78,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const fakeAiClient: Tx11Imp1AiClient = {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      performSubmissionStatusCheck: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedCount: 0,
        unsubmittedMembers: memberIds,
      }),
      performReminderNotificationDispatch: jest.fn().mockResolvedValue({
        notificationsSent: 10,
        successCount: 10,
        failureCount: 0,
      }),
      performIssueExtraction: jest.fn().mockResolvedValue({
        extractedIssuesCount: 10,
        issuesList: [
          {
            issueId: 'issue-001',
            keyword: 'DBパフォーマンス低下',
            occurrenceCount: 3,
            reportIds: ['report-001', 'report-003', 'report-005'],
          },
          {
            issueId: 'issue-002',
            keyword: 'テスト工程遅延',
            occurrenceCount: 2,
            reportIds: ['report-002', 'report-004'],
          },
          {
            issueId: 'issue-003',
            keyword: 'ネットワーク接続エラー',
            occurrenceCount: 1,
            reportIds: ['report-006'],
          },
        ],
      }),
      performReferenceExampleRetrieval: jest.fn().mockResolvedValue({
        retrievedExamplesCount: 3,
        referenceExamples: [
          {
            exampleId: 'ref-001',
            issueKeyword: 'DBパフォーマンス低下',
            previousOccurrenceDate: '2024-10-15',
            resolutionContent: 'インデックス追加により解決',
          },
          {
            exampleId: 'ref-002',
            issueKeyword: 'テスト工程遅延',
            previousOccurrenceDate: '2024-09-20',
            resolutionContent: 'テスト並列化実装',
          },
          {
            exampleId: 'ref-003',
            issueKeyword: 'ネットワーク接続エラー',
            previousOccurrenceDate: '2024-08-10',
            resolutionContent: 'DNS設定修正',
          },
        ],
      }),
      performIssuePrioritization: jest.fn().mockResolvedValue({
        prioritizedIssuesCount: 3,
        prioritizedIssuesList: [
          {
            issueId: 'issue-001',
            keyword: 'DBパフォーマンス低下',
            impactScore: 85,
            severity: 'high',
            frequency: 3,
          },
          {
            issueId: 'issue-002',
            keyword: 'テスト工程遅延',
            impactScore: 72,
            severity: 'medium',
            frequency: 2,
          },
          {
            issueId: 'issue-003',
            keyword: 'ネットワーク接続エラー',
            impactScore: 45,
            severity: 'low',
            frequency: 1,
          },
        ],
        summaryStats: {
          totalIssuesExtracted: 10,
          highPriorityCount: 1,
          mediumPriorityCount: 1,
          lowPriorityCount: 1,
        },
      }),
      performSummaryGeneration: jest.fn().mockResolvedValue({
        summaryGenerated: true,
        summaryId: 'summary-001',
        generatedTimestamp: executionTimestamp.toISOString(),
        summaryContent: {
          extractedIssuesCount: 10,
          prioritizedIssuesCount: 3,
          referenceExamplesCount: 3,
          highPriorityCount: 1,
          mediumPriorityCount: 1,
          lowPriorityCount: 1,
        },
      }),
      performManagerSummaryDistribution: jest.fn().mockResolvedValue({
        distributionStatus: 'successful',
        recipientEmail: managerEmail,
        deliveryTimestamp: executionTimestamp.toISOString(),
        summaryPayload: {
          summaryType: 'morning_meeting_brief',
          extractedIssuesCount: 10,
          prioritizedIssuesCount: 3,
          referenceExamplesCount: 3,
        },
      }),
      performReferenceInfoPresentation: jest.fn().mockResolvedValue({
        presentationStatus: 'completed',
        referencesProvidedCount: 1,
        similarIssuesCount: 5,
      }),
      recordAuditLog: jest.fn().mockResolvedValue({
        logId: 'audit-log-001',
        recordedTimestamp: executionTimestamp.toISOString(),
      }),
      performRollback: jest.fn().mockResolvedValue({
        rollbackStatus: 'success',
        reversedActionsCount: 1,
      }),
    };

    const result = await runTx11Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportDeadlineTime,
        morningMeetingStartTime,
      },
      fakeAiClient,
    );

    expect(result.executionStatus).toBe('success');
    expect(result.submissionStatusSummary.totalMembers).toBe(10);
    expect(result.submissionStatusSummary.submittedCount).toBe(0);
    expect(result.submissionStatusSummary.unsubmittedMembers).toEqual(memberIds);

    expect(result.prioritizedIssuesList).toHaveLength(3);
    expect(result.prioritizedIssuesList[0]).toMatchObject({
      issueId: 'issue-001',
      keyword: 'DBパフォーマンス低下',
      impactScore: 85,
      severity: 'high',
      frequency: 3,
    });
    expect(result.prioritizedIssuesList[1]).toMatchObject({
      issueId: 'issue-002',
      keyword: 'テスト工程遅延',
      impactScore: 72,
      severity: 'medium',
      frequency: 2,
    });
    expect(result.prioritizedIssuesList[2]).toMatchObject({
      issueId: 'issue-003',
      keyword: 'ネットワーク接続エラー',
      impactScore: 45,
      severity: 'low',
      frequency: 1,
    });

    expect(result.notificationsSent).toHaveLength(11);
    expect(result.notificationsSent.filter((n) => n.recipientType === 'member')).toHaveLength(10);
    expect(result.notificationsSent.filter((n) => n.recipientType === 'manager')).toHaveLength(1);

    result.notificationsSent.forEach((notification) => {
      expect(notification.deliveryStatus).toBe('successful');
      expect(notification.sentTimestamp).toBeDefined();
    });

    expect(result.summaryEmailSent).toBe(true);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(11);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();

    expect(fakeAiClient.performSubmissionStatusCheck).toHaveBeenCalledWith({
      executionTimestamp,
      teamId,
      reportDeadlineTime,
    });

    expect(fakeAiClient.performReminderNotificationDispatch).toHaveBeenCalledWith({
      unsubmittedMemberIds: memberIds,
      teamId,
      reportDeadlineTime,
    });

    expect(fakeAiClient.performIssueExtraction).toHaveBeenCalledWith({
      reportCount: 0,
      teamId,
    });

    expect(fakeAiClient.performIssuePrioritization).toHaveBeenCalledWith({
      extractedIssuesCount: 10,
      teamId,
    });

    expect(fakeAiClient.performManagerSummaryDistribution).toHaveBeenCalledWith({
      managerEmail,
      summaryId: 'summary-001',
      teamId,
      executionTimestamp,
    });

    expect(result.auditLogEntries).toBeDefined();
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'DAILY_SUBMISSION_CHECK',
        status: 'completed',
        timestamp: expect.any(String),
      }),
    );
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'REMINDER_NOTIFICATIONS_SENT',
        notificationCount: 10,
        status: 'all_successful',
        timestamp: expect.any(String),
      }),
    );
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'ISSUE_EXTRACTION',
        issueCount: 10,
        status: 'completed',
        timestamp: expect.any(String),
      }),
    );
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'ISSUE_PRIORITIZATION',
        issueCount: 3,
        status: 'completed',
        timestamp: expect.any(String),
      }),
    );
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'SUMMARY_DISTRIBUTION',
        recipient: 'manager@company.com',
        status: 'successful',
        timestamp: expect.any(String),
      }),
    );
    expect(result.auditLogEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'REFERENCE_INFO_PROVIDED',
        referencesCount: 1,
        status: 'completed',
        timestamp: expect.any(String),
      }),
    );
  });
});