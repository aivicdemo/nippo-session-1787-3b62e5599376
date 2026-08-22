import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type {
  Tx4AgentExecutionRequest,
  Tx4AgentExecutionResult,
} from '../../src/agents/tx-4-imp-1/types';

// Mock AI Client for Tx4Imp1Agent
interface MockAiClientCall {
  actionId: string;
  promptVersion: string;
  inputData: unknown;
}

const createMockTx4Imp1AiClient = () => {
  const calls: MockAiClientCall[] = [];
  
  return {
    calls,
    async callAction01(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '01', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        aggregatedData: [
          { reportId: 'R001', status: 'submitted', completedAt: '2024-01-15T09:00:00Z' },
          { reportId: 'R002', status: 'submitted', completedAt: '2024-01-15T09:15:00Z' },
        ],
      });
    },
    async callAction02(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '02', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        extractedIssues: [
          {
            id: 'ISSUE_A',
            title: 'Critical System Outage',
            importance: 'high',
            urgency: 'high',
            affectedArea: 'production',
          },
          {
            id: 'ISSUE_B',
            title: 'Minor UI Bug',
            importance: 'low',
            urgency: 'high',
            affectedArea: 'frontend',
          },
          {
            id: 'ISSUE_C',
            title: 'Performance Degradation',
            importance: 'high',
            urgency: 'low',
            affectedArea: 'backend',
          },
          {
            id: 'ISSUE_D',
            title: 'Documentation Typo',
            importance: 'low',
            urgency: 'low',
            affectedArea: 'documentation',
          },
        ],
      });
    },
    async callAction03(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '03', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        riskAssessment: [
          { issueId: 'ISSUE_A', riskScore: 9.5, recurrenceRisk: 0.3 },
          { issueId: 'ISSUE_B', riskScore: 2.1, recurrenceRisk: 0.8 },
          { issueId: 'ISSUE_C', riskScore: 6.8, recurrenceRisk: 0.5 },
          { issueId: 'ISSUE_D', riskScore: 0.5, recurrenceRisk: 0.1 },
        ],
      });
    },
    async callAction04(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '04', promptVersion: version, inputData: prompt });
      // Prioritize by importance and urgency: importance=high + urgency=high > others
      return JSON.stringify({
        prioritizedIssues: [
          {
            rank: 1,
            issueId: 'ISSUE_A',
            title: 'Critical System Outage',
            priorityLevel: 'P0',
            importanceScore: 10,
            urgencyScore: 10,
            rationale: 'Both importance and urgency are high - critical path blocker',
          },
          {
            rank: 2,
            issueId: 'ISSUE_B',
            title: 'Minor UI Bug',
            priorityLevel: 'P1',
            importanceScore: 2,
            urgencyScore: 9,
            rationale: 'High urgency despite low importance - must address quickly',
          },
          {
            rank: 3,
            issueId: 'ISSUE_C',
            title: 'Performance Degradation',
            priorityLevel: 'P2',
            importanceScore: 9,
            urgencyScore: 3,
            rationale: 'High importance but lower urgency - can be scheduled',
          },
          {
            rank: 4,
            issueId: 'ISSUE_D',
            title: 'Documentation Typo',
            priorityLevel: 'P3',
            importanceScore: 1,
            urgencyScore: 1,
            rationale: 'Both low importance and urgency - backlog item',
          },
        ],
      });
    },
    async callAction05(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '05', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        countermeasurePlan: {
          planId: 'PLAN_001',
          recommendedActions: [
            'Immediate rollback of latest deployment',
            'Escalate to on-call engineer',
            'Schedule hotfix review',
          ],
          estimatedResolutionDays: 0.5,
          assignedOwner: 'on-call-engineer',
        },
      });
    },
    async callAction06(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '06', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        dashboardReport: {
          reportId: 'REPORT_001',
          generatedAt: '2024-01-15T09:30:00Z',
          issuesSummary: {
            totalCount: 4,
            criticalCount: 1,
            unsubmittedMembers: [],
          },
        },
      });
    },
    async callAction07(prompt: string, version: string): Promise<string> {
      calls.push({ actionId: '07', promptVersion: version, inputData: prompt });
      return JSON.stringify({
        notificationSent: true,
        notificationId: 'NOTIF_001',
      });
    },
  };
};

describe('Tx4Imp1Agent - Dashboard Analysis to Issue Instruction Autonomous Execution', () => {
  // SCEN-076
  test('should execute Action 4 (automatic priority ranking by importance and urgency) according to contract', async () => {
    const mockAiClient = createMockTx4Imp1AiClient();
    
    const executionRequest: Tx4AgentExecutionRequest = {
      executionTimestamp: new Date('2024-01-15T09:30:00Z'),
      targetDate: '2024-01-15',
      executorUserId: 'user-dept-head-001',
      teamId: 'team-engineering-001',
    };

    // Execute the orchestrator with mock AI client
    // The orchestrator should internally call action-04 and receive prioritized issues
    const result: Tx4AgentExecutionResult = await runTx4Imp1Agent(
      executionRequest,
      mockAiClient as any
    );

    // Verify that Action 04 was called
    const action04Call = mockAiClient.calls.find((call) => call.actionId === '04');
    expect(action04Call).toBeDefined();

    // Verify that ACTION_04_PROMPT_VERSION was correctly set
    expect(action04Call?.promptVersion).toBeDefined();
    expect(typeof action04Call?.promptVersion).toBe('string');
    expect(action04Call?.promptVersion.length).toBeGreaterThan(0);

    // Verify the order of prioritized issues matches contract expectations
    expect(result.prioritizedIssues).toBeDefined();
    expect(result.prioritizedIssues.length).toBe(4);

    // Rank 1: Importance=high, Urgency=high (ISSUE_A)
    expect(result.prioritizedIssues[0].issueId).toBe('ISSUE_A');
    expect(result.prioritizedIssues[0].importanceScore).toBe(10);
    expect(result.prioritizedIssues[0].urgencyScore).toBe(10);
    expect(result.prioritizedIssues[0].priorityLevel).toBe('P0');

    // Rank 2: Importance=low, Urgency=high (ISSUE_B)
    expect(result.prioritizedIssues[1].issueId).toBe('ISSUE_B');
    expect(result.prioritizedIssues[1].importanceScore).toBe(2);
    expect(result.prioritizedIssues[1].urgencyScore).toBe(9);
    expect(result.prioritizedIssues[1].priorityLevel).toBe('P1');

    // Rank 3: Importance=high, Urgency=low (ISSUE_C)
    expect(result.prioritizedIssues[2].issueId).toBe('ISSUE_C');
    expect(result.prioritizedIssues[2].importanceScore).toBe(9);
    expect(result.prioritizedIssues[2].urgencyScore).toBe(3);
    expect(result.prioritizedIssues[2].priorityLevel).toBe('P2');

    // Rank 4: Importance=low, Urgency=low (ISSUE_D)
    expect(result.prioritizedIssues[3].issueId).toBe('ISSUE_D');
    expect(result.prioritizedIssues[3].importanceScore).toBe(1);
    expect(result.prioritizedIssues[3].urgencyScore).toBe(1);
    expect(result.prioritizedIssues[3].priorityLevel).toBe('P3');

    // Verify metadata (ID, importance score, urgency score, rationale) exists for all issues
    result.prioritizedIssues.forEach((issue) => {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.importanceScore).toBeDefined();
      expect(typeof issue.importanceScore).toBe('number');
      expect(issue.urgencyScore).toBeDefined();
      expect(typeof issue.urgencyScore).toBe('number');
      expect(issue.rationale).toBeDefined();
      expect(typeof issue.rationale).toBe('string');
      expect(issue.priorityLevel).toBeDefined();
      expect(typeof issue.priorityLevel).toBe('string');
    });

    // Verify aggregated report count matches expected
    expect(result.aggregatedReportCount).toBe(2);

    // Verify extracted issue count matches expected
    expect(result.extractedIssueCount).toBe(4);

    // Verify countermeasure plan was generated
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBe('PLAN_001');
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions.length).toBeGreaterThan(0);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBe(0.5);
    expect(result.countermeasurePlan.assignedOwner).toBe('on-call-engineer');

    // Verify summary email was sent
    expect(result.summaryEmailSent).toBe(true);

    // Verify execution result contains proper timestamps
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp instanceof Date).toBe(true);

    // Verify all actions were called in expected order
    expect(mockAiClient.calls.length).toBeGreaterThanOrEqual(7);
    expect(mockAiClient.calls[0].actionId).toBe('01');
    expect(mockAiClient.calls[1].actionId).toBe('02');
    expect(mockAiClient.calls[2].actionId).toBe('03');
    expect(mockAiClient.calls[3].actionId).toBe('04');
    expect(mockAiClient.calls[4].actionId).toBe('05');
    expect(mockAiClient.calls[5].actionId).toBe('06');
    expect(mockAiClient.calls[6].actionId).toBe('07');
  });
});