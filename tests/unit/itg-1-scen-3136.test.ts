import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { type Tx4AgentExecutionRequest, type Tx4AgentExecutionResult } from '../../src/agents/tx-4-imp-1/types';

describe('Tx4Imp1Agent - Escalation for Multi-Department Issues', () => {
  // SCEN-3136
  test('should escalate to human review when multi-department issue is detected before side effects are committed', async () => {
    // Prepare mock AI client that simulates multi-department cross-impact scenario
    const mockAiClient = {
      // Action 1: Aggregate dashboard data from multiple systems
      aggregateDashboardData: jest.fn().mockResolvedValue({
        aggregatedMetrics: [
          {
            departmentId: 'sales-dept',
            metricType: 'revenue_target',
            currentValue: 8500000,
            targetValue: 10000000,
            variance: -1500000,
            status: 'behind_schedule'
          },
          {
            departmentId: 'dev-dept',
            metricType: 'release_timeline',
            currentValue: 85,
            targetValue: 100,
            variance: -15,
            status: 'delayed'
          },
          {
            departmentId: 'planning-dept',
            metricType: 'resource_allocation',
            currentValue: 70,
            targetValue: 100,
            variance: -30,
            status: 'constrained'
          }
        ],
        unsubmittedMembers: ['eng-003', 'eng-007'],
        lastUpdatedAt: new Date('2024-01-15T09:00:00Z').toISOString()
      }),

      // Action 2: Extract issues from aggregated data
      extractIssues: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'issue-001',
            keywordId: 'kw-revenue-shortfall',
            title: 'Sales revenue target shortfall',
            description: 'Sales department 15% behind revenue target',
            departmentId: 'sales-dept',
            severity: 'high',
            confidence: 0.92
          },
          {
            issueId: 'issue-002',
            keywordId: 'kw-release-delay',
            title: 'Release delivery delay',
            description: 'Development department 15% behind release timeline',
            departmentId: 'dev-dept',
            severity: 'high',
            confidence: 0.95
          },
          {
            issueId: 'issue-003',
            keywordId: 'kw-resource-constraint',
            title: 'Resource allocation constraint',
            description: 'Planning department resource allocation below target',
            departmentId: 'planning-dept',
            severity: 'medium',
            confidence: 0.88
          }
        ],
        extractionTimestamp: new Date('2024-01-15T09:05:00Z').toISOString()
      }),

      // Action 3: Assess risks including cross-department dependencies
      assessRisks: jest.fn().mockResolvedValue({
        riskAssessments: [
          {
            issueId: 'issue-001',
            riskScore: 78,
            impactRadius: ['dev-dept', 'planning-dept'],
            isMultiDepartmentImpact: true,
            rootCauseIndicators: ['resource_bottleneck', 'dependency_delay'],
            estimatedResolutionDays: 12
          },
          {
            issueId: 'issue-002',
            riskScore: 82,
            impactRadius: ['sales-dept', 'planning-dept'],
            isMultiDepartmentImpact: true,
            rootCauseIndicators: ['resource_shortage', 'priority_conflict'],
            estimatedResolutionDays: 14
          },
          {
            issueId: 'issue-003',
            riskScore: 65,
            impactRadius: ['sales-dept', 'dev-dept'],
            isMultiDepartmentImpact: true,
            rootCauseIndicators: ['allocation_mismatch'],
            estimatedResolutionDays: 8
          }
        ],
        assessmentTimestamp: new Date('2024-01-15T09:10:00Z').toISOString()
      }),

      // Action 4: Prioritize issues and detect escalation conditions
      prioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            rank: 1,
            issueId: 'issue-002',
            priorityScore: 82,
            priorityRank: 'high',
            assignedDepartment: 'dev-dept',
            relatedDepartments: ['sales-dept', 'planning-dept'],
            escalationRequired: true,
            escalationReason: 'MULTI_DEPARTMENT_ISSUE',
            requiresHumanReview: true
          },
          {
            rank: 2,
            issueId: 'issue-001',
            priorityScore: 78,
            priorityRank: 'high',
            assignedDepartment: 'sales-dept',
            relatedDepartments: ['dev-dept', 'planning-dept'],
            escalationRequired: true,
            escalationReason: 'MULTI_DEPARTMENT_ISSUE',
            requiresHumanReview: true
          },
          {
            rank: 3,
            issueId: 'issue-003',
            priorityScore: 65,
            priorityRank: 'medium',
            assignedDepartment: 'planning-dept',
            relatedDepartments: ['sales-dept', 'dev-dept'],
            escalationRequired: true,
            escalationReason: 'MULTI_DEPARTMENT_ISSUE',
            requiresHumanReview: true
          }
        ],
        detectedEscalationConditions: [
          {
            conditionType: 'MULTI_DEPARTMENT_ISSUE',
            affectedDepartments: ['sales-dept', 'dev-dept', 'planning-dept'],
            issueCount: 3,
            totalAffectedIssues: ['issue-001', 'issue-002', 'issue-003'],
            requiresManagerReview: true
          }
        ],
        priorityTimestamp: new Date('2024-01-15T09:15:00Z').toISOString()
      })
    };

    // Prepare mock NotificationServiceAdapter for escalation notification
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        deliveryStatus: 'sent',
        recipientId: 'mgr-001',
        timestamp: new Date('2024-01-15T09:20:00Z').toISOString()
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        status: 'scheduled'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:20:00Z').toISOString()
      })
    };

    // Test input
    const executionRequest: Tx4AgentExecutionRequest = {
      teamId: 'team-001',
      managerId: 'mgr-001',
      reportDate: '2024-01-15',
      meetingStartTime: '09:30'
    };

    // Execute agent
    const result = await runTx4Imp1Agent(executionRequest, mockAiClient as any, mockNotificationAdapter as any);

    // Verify that escalation flag is set
    expect(result.escalationFlag).toBe(true);
    expect(result.escalationReason).toBe('MULTI_DEPARTMENT_ISSUE');
    expect(result.pendingHumanReview).toBe(true);

    // Verify that escalation notification was sent to manager
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'mgr-001',
        notificationType: 'ESCALATION',
        escalationReason: 'MULTI_DEPARTMENT_ISSUE'
      })
    );

    // Verify that dashboard material was NOT created (side effect 1)
    expect(result.dashboardMaterialCreated).toBe(false);

    // Verify that member notifications were NOT sent (side effect 2)
    expect(result.memberNotificationsSent).toBe(false);

    // Verify that dashboard material table record was not inserted
    expect(result.dashboardRecordId).toBeUndefined();

    // Verify that morning report queue entry was not registered
    expect(result.reportQueueEntryId).toBeUndefined();

    // Verify that AI client actions were called in correct order
    expect(mockAiClient.aggregateDashboardData).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient.assessRisks).toHaveBeenCalledTimes(1);
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalledTimes(1);

    // Verify call order: aggregateDashboardData -> extractIssues -> assessRisks -> prioritizeIssues
    expect(mockAiClient.aggregateDashboardData.mock.invocationCallOrder[0])
      .toBeLessThan(mockAiClient.extractIssues.mock.invocationCallOrder[0]);
    expect(mockAiClient.extractIssues.mock.invocationCallOrder[0])
      .toBeLessThan(mockAiClient.assessRisks.mock.invocationCallOrder[0]);
    expect(mockAiClient.assessRisks.mock.invocationCallOrder[0])
      .toBeLessThan(mockAiClient.prioritizeIssues.mock.invocationCallOrder[0]);

    // Verify that Action 5, 6, 7 were NOT called
    expect(result.countermeasurePlanGenerated).toBe(false);

    // Verify execution metadata
    expect(result.executionId).toBeDefined();
    expect(result.completionTimestamp).toBeInstanceOf(Date);
    expect(result.aggregatedReportCount).toBeGreaterThanOrEqual(0);
    expect(result.extractedIssueCount).toBe(3);

    // Verify that prioritized issues contain escalation metadata
    expect(result.prioritizedIssues).toHaveLength(3);
    expect(result.prioritizedIssues[0]).toMatchObject({
      escalationRequired: true,
      escalationReason: 'MULTI_DEPARTMENT_ISSUE',
      requiresHumanReview: true
    });

    // Verify notification was sent with correct escalation context
    const escalationNotification = mockNotificationAdapter.sendReminderNotification.mock.calls[0][0];
    expect(escalationNotification.escalationContext).toMatchObject({
      affectedDepartments: ['sales-dept', 'dev-dept', 'planning-dept'],
      totalAffectedIssues: ['issue-001', 'issue-002', 'issue-003']
    });

    // Verify that summary email for manager was NOT sent (blocked by escalation)
    expect(result.summaryEmailSent).toBe(false);
  });
});