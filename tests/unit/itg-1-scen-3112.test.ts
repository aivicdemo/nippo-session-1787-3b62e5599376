import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type {
  Tx2Imp1AiClient,
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from '../../src/agents/tx-2-imp-1/orchestrator';

describe('tx-2-imp-1 orchestrator - rollback on partial failure', () => {
  // SCEN-3112
  test('should rollback completed side effects when Action 3 fails during agent execution', async () => {
    const executionTimestamp = new Date('2024-01-15T08:55:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserIds = ['manager-001'];

    const mockAggregatedReports = [
      {
        memberId: 'member-001',
        memberName: 'Engineer A',
        yesterdayWork: 'Completed API design',
        todayPlan: 'Implement authentication',
        challenges: 'Database connection timeout issue',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
      },
      {
        memberId: 'member-002',
        memberName: 'Engineer B',
        yesterdayWork: 'Fixed UI bugs',
        todayPlan: 'Deploy to staging',
        challenges: 'Integration test failure with legacy system',
        submittedAt: new Date('2024-01-15T08:48:00Z'),
      },
      {
        memberId: 'member-003',
        memberName: 'Engineer C',
        yesterdayWork: 'Documentation update',
        todayPlan: 'Code review',
        challenges: 'Database connection timeout issue',
        submittedAt: new Date('2024-01-15T08:52:00Z'),
      },
      {
        memberId: 'member-004',
        memberName: 'Engineer D',
        yesterdayWork: 'Refactoring service layer',
        todayPlan: 'Performance testing',
        challenges: 'Memory leak detected in cache layer',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
      {
        memberId: 'member-005',
        memberName: 'Engineer E',
        yesterdayWork: 'Test automation setup',
        todayPlan: 'Execute regression tests',
        challenges: 'Test environment provisioning delays',
        submittedAt: new Date('2024-01-15T08:51:00Z'),
      },
      {
        memberId: 'member-006',
        memberName: 'Engineer F',
        yesterdayWork: 'Security audit review',
        todayPlan: 'Fix identified vulnerabilities',
        challenges: 'Database connection timeout issue',
        submittedAt: new Date('2024-01-15T08:49:00Z'),
      },
      {
        memberId: 'member-007',
        memberName: 'Engineer G',
        yesterdayWork: 'Deployment pipeline tuning',
        todayPlan: 'Monitoring setup',
        challenges: 'CI/CD pipeline timeout',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
      },
      {
        memberId: 'member-008',
        memberName: 'Engineer H',
        yesterdayWork: 'Database optimization',
        todayPlan: 'Query performance tuning',
        challenges: 'Query performance degradation',
        submittedAt: new Date('2024-01-15T08:47:00Z'),
      },
      {
        memberId: 'member-009',
        memberName: 'Engineer I',
        yesterdayWork: 'Infrastructure maintenance',
        todayPlan: 'Capacity planning',
        challenges: 'Database connection timeout issue',
        submittedAt: new Date('2024-01-15T08:53:00Z'),
      },
      {
        memberId: 'member-010',
        memberName: 'Engineer J',
        yesterdayWork: 'API documentation',
        todayPlan: 'Update versioning',
        challenges: 'API compatibility issues',
        submittedAt: new Date('2024-01-15T08:46:00Z'),
      },
    ];

    // Track which actions were invoked and side effects created
    const invocationTracker = {
      action01Called: false,
      action02Called: false,
      action03Called: false,
      action04Called: false,
      action05Called: false,
      action06Called: false,
      unifiedFormatRecordsCreated: 10,
      mappingEntriesCreated: 10,
    };

    const mockAiClient: Tx2Imp1AiClient = {
      async action01_fetchAggregatedReports(
        executionTime: Date,
        deadline: Date,
        teamIds: string[]
      ): Promise<unknown> {
        invocationTracker.action01Called = true;
        return {
          success: true,
          data: mockAggregatedReports,
        };
      },

      async action02_convertToUnifiedFormat(
        reports: unknown
      ): Promise<unknown> {
        invocationTracker.action02Called = true;
        invocationTracker.unifiedFormatRecordsCreated = 10;
        invocationTracker.mappingEntriesCreated = 10;
        return {
          success: true,
          unifiedReports: (reports as any[]).map((report, idx) => ({
            id: `unified-${idx}`,
            memberId: report.memberId,
            memberName: report.memberName,
            yesterdayWork: report.yesterdayWork,
            todayPlan: report.todayPlan,
            challenges: report.challenges,
            submittedAt: report.submittedAt,
            format_version: '1.0',
          })),
        };
      },

      async action03_extractKeywords(
        unifiedReports: unknown
      ): Promise<unknown> {
        invocationTracker.action03Called = true;
        // Simulate AI API failure (timeout, null response, etc.)
        throw new Error('TextAnalysisServiceAdapter timeout: API request exceeded 30 seconds');
      },

      async action04_calculatePriorityScores(
        extractedKeywords: unknown
      ): Promise<unknown> {
        invocationTracker.action04Called = true;
        return { success: true };
      },

      async action05_generateConfirmationEmail(
        prioritizedIssues: unknown,
        submittedCount: number
      ): Promise<unknown> {
        invocationTracker.action05Called = true;
        return { success: true };
      },

      async action06_sendConfirmationEmail(
        emailContent: unknown,
        managerIds: string[]
      ): Promise<unknown> {
        invocationTracker.action06Called = true;
        return { success: true };
      },
    };

    const input: Tx2Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      targetTeamIds,
      managerUserIds,
    };

    // Execute the agent and expect failure with rollback
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // Verify Action 1 and 2 were called (completed before failure)
    expect(invocationTracker.action01Called).toBe(true);
    expect(invocationTracker.action02Called).toBe(true);

    // Verify Action 3 was called and failed
    expect(invocationTracker.action03Called).toBe(true);

    // Verify Actions 4, 5, 6 were NOT called (stopped after Action 3 failure)
    expect(invocationTracker.action04Called).toBe(false);
    expect(invocationTracker.action05Called).toBe(false);
    expect(invocationTracker.action06Called).toBe(false);

    // Verify result indicates failure
    expect((result as any).success).toBe(false);
    expect((result as any).failedAction).toBe('ACTION_03');

    // Verify rollback was performed on completed side effects
    expect((result as any).rolledBackRecords).toBe(10);
    expect((result as any).rolledBackMappingEntries).toBe(10);

    // Verify error is structured and includes required metadata
    expect((result as any).timestamp).toBeDefined();
    expect((result as any).errorMessage).toMatch(/TextAnalysisServiceAdapter/);

    // Verify confirmation email was not sent
    expect((result as any).confirmationEmailSent).toBe(false);
  });
});