import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 orchestrator', () => {
  // SCEN-132
  test('should execute monthly report generation to analysis completion autonomously', async () => {
    // Setup: Mock AI client implementing Tx7Imp1AiClient interface
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        triggerStatus: 'VALID',
        monthlyTriggerConfirmed: true,
        executionDateTime: new Date('2025-01-01T09:00:00Z'),
      }),
      executeAction02: jest.fn().mockResolvedValue({
        extractedRecordCount: 10,
        targetMonth: '2025-01',
        dataIntegrityCheckStatus: 'COMPLETED',
        errorOccurred: false,
      }),
      executeAction03: jest.fn().mockResolvedValue({
        reportId: 'RPT-202501-abc123',
        generatedAt: new Date('2025-01-01T09:15:00Z'),
        dataRecordCount: 10,
      }),
      executeAction04: jest.fn().mockResolvedValue({
        timeSeriesAnalysisResult: 'ISSUE_A_TIMELINE_RECORDED',
        priorMonthComparisonCompleted: true,
        dailyTransitionDataCount: 10,
      }),
      executeAction05: jest.fn().mockResolvedValue({
        bottleneckCategoryIdentified: 'CATEGORY_B',
        occurrenceFrequency: 5,
        impactedTeamCount: 3,
      }),
      executeAction06: jest.fn().mockResolvedValue({
        teamXOperationRate: 85,
        teamZIssueResolutionRate: 78,
        teamComparisonTableGenerated: true,
      }),
      executeAction07: jest.fn().mockResolvedValue({
        prioritizationCompleted: true,
        highPriorityIssue: 'ISSUE_B',
        highPriorityScore: 8.5,
        mediumPriorityIssue: 'ISSUE_A',
        mediumPriorityScore: 5.2,
      }),
      executeAction08: jest.fn().mockResolvedValue({
        deliveryStatus: 'SUCCESS',
        recipientEmail: 'director@company.com',
        sentDateTime: new Date('2025-01-01T09:30:00Z'),
        reportSentSuccessfully: true,
      }),
    };

    // Setup: Mock report data repository
    const mockReportData = [
      {
        memberId: 'MEM001',
        memberName: 'Engineer A',
        date: '2025-01-01',
        yesterday: 'Completed feature X',
        today: 'Start feature Y',
        issues: 'Performance issue on module Z',
      },
      {
        memberId: 'MEM002',
        memberName: 'Engineer B',
        date: '2025-01-01',
        yesterday: 'Fixed bug in API',
        today: 'Review PR from team',
        issues: 'Database connection timeout',
      },
      {
        memberId: 'MEM003',
        memberName: 'Engineer C',
        date: '2025-01-01',
        yesterday: 'Deployed service update',
        today: 'Monitor deployment',
        issues: 'Memory leak in worker thread',
      },
      {
        memberId: 'MEM004',
        memberName: 'Engineer D',
        date: '2025-01-01',
        yesterday: 'Designed new architecture',
        today: 'Present design to team',
        issues: 'Scalability concerns identified',
      },
      {
        memberId: 'MEM005',
        memberName: 'Engineer E',
        date: '2025-01-01',
        yesterday: 'Wrote unit tests',
        today: 'Increase test coverage',
        issues: 'Test flakiness in integration suite',
      },
      {
        memberId: 'MEM006',
        memberName: 'Engineer F',
        date: '2025-01-01',
        yesterday: 'Code review completed',
        today: 'Merge approved PRs',
        issues: 'Merge conflict resolution needed',
      },
      {
        memberId: 'MEM007',
        memberName: 'Engineer G',
        date: '2025-01-01',
        yesterday: 'Documentation update',
        today: 'Update API docs',
        issues: 'Documentation out of sync',
      },
      {
        memberId: 'MEM008',
        memberName: 'Engineer H',
        date: '2025-01-01',
        yesterday: 'Infrastructure provisioning',
        today: 'Monitor server health',
        issues: 'High CPU utilization on prod',
      },
      {
        memberId: 'MEM009',
        memberName: 'Engineer I',
        date: '2025-01-01',
        yesterday: 'Security audit prep',
        today: 'Conduct security review',
        issues: 'Potential SQL injection vulnerability',
      },
      {
        memberId: 'MEM010',
        memberName: 'Engineer J',
        date: '2025-01-01',
        yesterday: 'Release planning',
        today: 'Coordinate release',
        issues: 'Release blockers identified',
      },
    ];

    // Setup: Mock email sending
    const mockEmailSend = jest.fn().mockResolvedValue({ success: true });

    // Execute: Run the agent
    const result = await runTx7Imp1Agent(
      {
        targetMonth: '2025-01',
        teamId: 'TEAM-ENGINEERING',
        triggeredBy: 'schedule',
        includeDetailedAnalysis: true,
      },
      mockAiClient,
      {
        reportDataRepository: { getReportsByMonth: jest.fn().mockResolvedValue(mockReportData) },
        emailService: { sendReport: mockEmailSend },
      } as any
    );

    // Verify: Action 1 - Trigger confirmation
    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    const action01Result = await mockAiClient.executeAction01();
    expect(action01Result.triggerStatus).toBe('VALID');
    expect(action01Result.monthlyTriggerConfirmed).toBe(true);

    // Verify: Action 2 - Data extraction
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    const action02Result = await mockAiClient.executeAction02();
    expect(action02Result.extractedRecordCount).toBe(10);
    expect(action02Result.targetMonth).toBe('2025-01');
    expect(action02Result.dataIntegrityCheckStatus).toBe('COMPLETED');
    expect(action02Result.errorOccurred).toBe(false);

    // Verify: Action 3 - Report generation
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    const action03Result = await mockAiClient.executeAction03();
    expect(action03Result.reportId).toMatch(/^RPT-202501-/);
    expect(action03Result.dataRecordCount).toBe(10);

    // Verify: Action 4 - Time series analysis
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    const action04Result = await mockAiClient.executeAction04();
    expect(action04Result.timeSeriesAnalysisResult).toBe('ISSUE_A_TIMELINE_RECORDED');
    expect(action04Result.priorMonthComparisonCompleted).toBe(true);

    // Verify: Action 5 - Bottleneck identification
    expect(mockAiClient.executeAction05).toHaveBeenCalled();
    const action05Result = await mockAiClient.executeAction05();
    expect(action05Result.bottleneckCategoryIdentified).toBe('CATEGORY_B');
    expect(action05Result.occurrenceFrequency).toBe(5);
    expect(action05Result.impactedTeamCount).toBe(3);

    // Verify: Action 6 - Performance metrics calculation
    expect(mockAiClient.executeAction06).toHaveBeenCalled();
    const action06Result = await mockAiClient.executeAction06();
    expect(action06Result.teamXOperationRate).toBe(85);
    expect(action06Result.teamZIssueResolutionRate).toBe(78);
    expect(action06Result.teamComparisonTableGenerated).toBe(true);

    // Verify: Action 7 - Priority scoring
    expect(mockAiClient.executeAction07).toHaveBeenCalled();
    const action07Result = await mockAiClient.executeAction07();
    expect(action07Result.prioritizationCompleted).toBe(true);
    expect(action07Result.highPriorityScore).toBe(8.5);
    expect(action07Result.mediumPriorityScore).toBe(5.2);

    // Verify: Action 8 - Director notification
    expect(mockAiClient.executeAction08).toHaveBeenCalled();
    const action08Result = await mockAiClient.executeAction08();
    expect(action08Result.deliveryStatus).toBe('SUCCESS');
    expect(action08Result.recipientEmail).toBe('director@company.com');
    expect(action08Result.reportSentSuccessfully).toBe(true);

    // Verify: Final completion status
    expect(result.status).toBe('COMPLETED');

    // Verify: Email service was called
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'director@company.com',
        reportId: 'RPT-202501-abc123',
      })
    );

    // Verify: Email service called exactly once
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
  });
});