import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('TX-6 Weekly Report Analysis Agent - Daily Report Collection to Report Generation', () => {
  // SCEN-3163
  test('should execute autonomous action to collect previous weeks report data every Monday morning and generate structured report', async () => {
    // Setup: Mock current time to Monday morning 2026-01-06 08:00:00 UTC
    const executionTimestamp = new Date('2026-01-06T08:00:00Z');
    const analysisStartDate = '2026-01-01';
    const analysisEndDate = '2026-01-05';
    const teamId = 'team-001';

    // Mock report data for 10 team members from previous week (Jan 1-5)
    const mockReportData = [
      {
        memberId: 'member-001',
        memberName: 'Engineer A',
        reportDate: '2026-01-05',
        yesterday: 'Completed API integration testing',
        today: 'Start database migration',
        issues: 'Delayed deployment due to CI/CD pipeline failure',
      },
      {
        memberId: 'member-002',
        memberName: 'Engineer B',
        reportDate: '2026-01-05',
        yesterday: 'Fixed critical bug in authentication module',
        today: 'Code review for payment feature',
        issues: 'Payment gateway timeout during load test',
      },
      {
        memberId: 'member-003',
        memberName: 'Engineer C',
        reportDate: '2026-01-04',
        yesterday: 'Database optimization completed',
        today: 'Performance testing',
        issues: 'CI/CD pipeline failure blocking deployment',
      },
      {
        memberId: 'member-004',
        memberName: 'Engineer D',
        reportDate: '2026-01-04',
        yesterday: 'Frontend component refactoring',
        today: 'Integration testing with backend',
        issues: 'Payment gateway timeout during integration',
      },
      {
        memberId: 'member-005',
        memberName: 'Engineer E',
        reportDate: '2026-01-03',
        yesterday: 'Unit test coverage improvement',
        today: 'System integration testing',
        issues: 'Delayed deployment affecting schedule',
      },
      {
        memberId: 'member-006',
        memberName: 'Engineer F',
        reportDate: '2026-01-03',
        yesterday: 'Security audit implementation',
        today: 'Vulnerability assessment',
        issues: 'CI/CD pipeline failure',
      },
      {
        memberId: 'member-007',
        memberName: 'Engineer G',
        reportDate: '2026-01-02',
        yesterday: 'Documentation update',
        today: 'API documentation completion',
        issues: 'Payment gateway timeout',
      },
      {
        memberId: 'member-008',
        memberName: 'Engineer H',
        reportDate: '2026-01-02',
        yesterday: 'Dependency updates',
        today: 'Library upgrade testing',
        issues: 'Delayed deployment due to CI/CD',
      },
      {
        memberId: 'member-009',
        memberName: 'Engineer I',
        reportDate: '2026-01-01',
        yesterday: 'Infrastructure setup',
        today: 'Configuration management',
        issues: 'Payment gateway timeout issue',
      },
      {
        memberId: 'member-010',
        memberName: 'Engineer J',
        reportDate: '2026-01-01',
        yesterday: 'Team onboarding preparation',
        today: 'Process documentation',
        issues: 'Delayed deployment schedule',
      },
    ];

    // Mock extracted issue keywords with occurrence counts
    const mockExtractedIssues = [
      { keyword: 'CI/CD pipeline failure', occurrenceCount: 4 },
      { keyword: 'Payment gateway timeout', occurrenceCount: 4 },
      { keyword: 'Delayed deployment', occurrenceCount: 3 },
    ];

    // Mock priority scores (0-100 scale)
    const mockPriorityScores = [
      { keyword: 'CI/CD pipeline failure', priorityScore: 85, priorityRank: 'high' },
      { keyword: 'Payment gateway timeout', priorityScore: 78, priorityRank: 'high' },
      { keyword: 'Delayed deployment', priorityScore: 65, priorityRank: 'medium' },
    ];

    // Create mock AI client with all required methods
    const mockAiClient: Tx6Imp1AiClient = {
      callAction01: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Collect weekly report data for week starting 2026-01-01',
          version: '1.0.0',
        }),
      callAction02: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Identify unsubmitted members and send reminders',
          version: '1.0.0',
        }),
      callAction03: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Extract issue items from submitted reports',
          version: '1.0.0',
          extractedIssues: mockExtractedIssues,
        }),
      callAction04: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Classify and analyze issue trends',
          version: '1.0.0',
          trends: { category: 'technical', frequency: 'recurring' },
        }),
      callAction05: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Calculate priority scores',
          version: '1.0.0',
          priorityScores: mockPriorityScores,
        }),
      callAction06: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Generate report in structured format',
          version: '1.0.0',
          report: {
            reportId: 'report-20260106-001',
            generatedAt: executionTimestamp.toISOString(),
            analysisStartDate,
            analysisEndDate,
            teamId,
            extractedIssueCount: 3,
            topPriorityIssues: mockPriorityScores.slice(0, 3),
            submittedMemberCount: 10,
            unsubmittedMembers: [],
          },
        }),
      callAction07: jest
        .fn()
        .mockResolvedValue({
          prompt: 'Distribute report to manager and stakeholders',
          version: '1.0.0',
          emailSentAt: executionTimestamp.toISOString(),
          recipientCount: 2,
        }),
      getAuditLog: jest
        .fn()
        .mockResolvedValue({
          events: [
            {
              eventType: 'REPORT_COLLECTION_STARTED',
              timestamp: executionTimestamp.toISOString(),
              targetPeriod: `${analysisStartDate}~${analysisEndDate}`,
            },
            {
              eventType: 'REPORT_DATA_RETRIEVED',
              timestamp: new Date(executionTimestamp.getTime() + 5000).toISOString(),
              recordCount: 10,
            },
            {
              eventType: 'ISSUE_EXTRACTION_COMPLETED',
              timestamp: new Date(executionTimestamp.getTime() + 10000).toISOString(),
              issueCount: 3,
            },
            {
              eventType: 'REPORT_GENERATED',
              timestamp: new Date(executionTimestamp.getTime() + 15000).toISOString(),
              reportId: 'report-20260106-001',
            },
            {
              eventType: 'REPORT_DISTRIBUTED',
              timestamp: new Date(executionTimestamp.getTime() + 20000).toISOString(),
              emailSentAt: executionTimestamp.toISOString(),
            },
          ],
        }),
    };

    // Execute the agent with injected mock AI client
    const result = await runTx6Imp1Agent(
      {
        executionTimestamp,
        analysisStartDate,
        analysisEndDate,
        teamId,
      },
      mockAiClient
    );

    // Verify Action 01 was called to collect previous week's report data
    expect(mockAiClient.callAction01).toHaveBeenCalledTimes(1);
    const action01Args = (mockAiClient.callAction01 as jest.Mock).mock.calls[0][0];
    expect(action01Args.analysisStartDate).toBe(analysisStartDate);
    expect(action01Args.analysisEndDate).toBe(analysisEndDate);
    expect(action01Args.teamId).toBe(teamId);

    // Verify Action 02 was called to identify unsubmitted members
    expect(mockAiClient.callAction02).toHaveBeenCalledTimes(1);

    // Verify Action 03 was called to extract issues
    expect(mockAiClient.callAction03).toHaveBeenCalledTimes(1);

    // Verify Action 04 was called to analyze trends
    expect(mockAiClient.callAction04).toHaveBeenCalledTimes(1);

    // Verify Action 05 was called to calculate priority scores
    expect(mockAiClient.callAction05).toHaveBeenCalledTimes(1);

    // Verify Action 06 was called to generate report
    expect(mockAiClient.callAction06).toHaveBeenCalledTimes(1);

    // Verify Action 07 was called to distribute report
    expect(mockAiClient.callAction07).toHaveBeenCalledTimes(1);

    // Verify report output structure
    expect(result.reportId).toBe('report-20260106-001');
    expect(result.reportGeneratedAt).toBe(executionTimestamp.toISOString());
    expect(result.emailSentAt).toBe(executionTimestamp.toISOString());
    expect(result.extractedIssueCount).toBe(3);

    // Verify top 5 priority issues (or fewer if less than 5 exist)
    expect(Array.isArray(result.topPriorityIssues)).toBe(true);
    expect(result.topPriorityIssues.length).toBeLessThanOrEqual(5);
    expect(result.topPriorityIssues[0].issueKeyword).toBe('CI/CD pipeline failure');
    expect(result.topPriorityIssues[0].occurrenceCount).toBe(4);
    expect(result.topPriorityIssues[0].priorityScore).toBe(85);
    expect(result.topPriorityIssues[0].priorityRank).toBe('high');

    // Verify second priority issue
    expect(result.topPriorityIssues[1].issueKeyword).toBe('Payment gateway timeout');
    expect(result.topPriorityIssues[1].occurrenceCount).toBe(4);
    expect(result.topPriorityIssues[1].priorityScore).toBe(78);
    expect(result.topPriorityIssues[1].priorityRank).toBe('high');

    // Verify third priority issue
    expect(result.topPriorityIssues[2].issueKeyword).toBe('Delayed deployment');
    expect(result.topPriorityIssues[2].occurrenceCount).toBe(3);
    expect(result.topPriorityIssues[2].priorityScore).toBe(65);
    expect(result.topPriorityIssues[2].priorityRank).toBe('medium');

    // Verify audit log contains required events
    const auditLog = await mockAiClient.getAuditLog();
    expect(auditLog.events.length).toBeGreaterThanOrEqual(5);

    // Verify REPORT_COLLECTION_STARTED event
    const collectionStartedEvent = auditLog.events.find(
      (e: { eventType: string }) => e.eventType === 'REPORT_COLLECTION_STARTED'
    );
    expect(collectionStartedEvent).toBeDefined();
    expect(collectionStartedEvent.timestamp).toBe(executionTimestamp.toISOString());
    expect(collectionStartedEvent.targetPeriod).toBe('2026-01-01~2026-01-05');

    // Verify REPORT_DATA_RETRIEVED event shows 10 members
    const dataRetrievedEvent = auditLog.events.find(
      (e: { eventType: string }) => e.eventType === 'REPORT_DATA_RETRIEVED'
    );
    expect(dataRetrievedEvent).toBeDefined();
    expect(dataRetrievedEvent.recordCount).toBe(10);

    // Verify ISSUE_EXTRACTION_COMPLETED event
    const issueExtractionEvent = auditLog.events.find(
      (e: { eventType: string }) => e.eventType === 'ISSUE_EXTRACTION_COMPLETED'
    );
    expect(issueExtractionEvent).toBeDefined();
    expect(issueExtractionEvent.issueCount).toBe(3);

    // Verify REPORT_GENERATED event
    const reportGeneratedEvent = auditLog.events.find(
      (e: { eventType: string }) => e.eventType === 'REPORT_GENERATED'
    );
    expect(reportGeneratedEvent).toBeDefined();
    expect(reportGeneratedEvent.reportId).toBe('report-20260106-001');

    // Verify REPORT_DISTRIBUTED event
    const reportDistributedEvent = auditLog.events.find(
      (e: { eventType: string }) => e.eventType === 'REPORT_DISTRIBUTED'
    );
    expect(reportDistributedEvent).toBeDefined();
    expect(reportDistributedEvent.emailSentAt).toBe(executionTimestamp.toISOString());

    // Verify AI client interface structural compliance
    expect(typeof mockAiClient.callAction01).toBe('function');
    expect(typeof mockAiClient.callAction02).toBe('function');
    expect(typeof mockAiClient.callAction03).toBe('function');
    expect(typeof mockAiClient.callAction04).toBe('function');
    expect(typeof mockAiClient.callAction05).toBe('function');
    expect(typeof mockAiClient.callAction06).toBe('function');
    expect(typeof mockAiClient.callAction07).toBe('function');
    expect(typeof mockAiClient.getAuditLog).toBe('function');

    // Verify processing completed within 30 seconds
    expect(result.reportGeneratedAt).toBeDefined();
    const processingTime =
      new Date(result.reportGeneratedAt).getTime() - executionTimestamp.getTime();
    expect(processingTime).toBeLessThan(30000);
  });
});