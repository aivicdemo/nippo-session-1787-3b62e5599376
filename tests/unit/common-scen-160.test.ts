import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { ExecutionContext } from '../../src/types/execution-context';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/types';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { generateWeeklyAnalysisReport } from '../../src/logic/analysis-reporting';

// Import required prompt modules to verify they export correct functions
import * as action01 from '../../src/agents/tx-9-imp-1/prompts/action-01';
import * as action02 from '../../src/agents/tx-9-imp-1/prompts/action-02';
import * as action03 from '../../src/agents/tx-9-imp-1/prompts/action-03';
import * as action04 from '../../src/agents/tx-9-imp-1/prompts/action-04';
import * as action05 from '../../src/agents/tx-9-imp-1/prompts/action-05';
import * as action06 from '../../src/agents/tx-9-imp-1/prompts/action-06';
import * as action07 from '../../src/agents/tx-9-imp-1/prompts/action-07';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-160
  test('should aggregate daily report data for specified period and execute autonomous action 1 as contracted', async () => {
    // Verify orchestrator module and exports
    expect(typeof runTx9Imp1Agent).toBe('function');
    
    // Verify prompt modules export required functions and constants
    expect(typeof action01.buildAction01Prompt).toBe('function');
    expect(typeof action01.ACTION_01_PROMPT_VERSION).toBe('string');
    
    expect(typeof action02.buildAction02Prompt).toBe('function');
    expect(typeof action02.ACTION_02_PROMPT_VERSION).toBe('string');
    
    expect(typeof action03.buildAction03Prompt).toBe('function');
    expect(typeof action03.ACTION_03_PROMPT_VERSION).toBe('string');
    
    expect(typeof action04.buildAction04Prompt).toBe('function');
    expect(typeof action04.ACTION_04_PROMPT_VERSION).toBe('string');
    
    expect(typeof action05.buildAction05Prompt).toBe('function');
    expect(typeof action05.ACTION_05_PROMPT_VERSION).toBe('string');
    
    expect(typeof action06.buildAction06Prompt).toBe('function');
    expect(typeof action06.ACTION_06_PROMPT_VERSION).toBe('string');
    
    expect(typeof action07.buildAction07Prompt).toBe('function');
    expect(typeof action07.ACTION_07_PROMPT_VERSION).toBe('string');

    // Setup execution context
    const executionStartTime = new Date('2024-12-15T09:00:00Z');
    const context: ExecutionContext = {
      agentId: 'tx-9-imp-1',
      executionId: 'exec-test-20241215-001',
      timestamp: executionStartTime,
      userId: 'manager-001',
      tenantId: 'tenant-test-001',
      requestId: 'req-test-20241215-001',
    };

    // Setup mock AI client that captures action 1 prompt
    let action01PromptCaptured: string | null = null;
    const mockAiClient: Tx9Imp1AiClient = {
      invokeAction01: async (prompt: string) => {
        action01PromptCaptured = prompt;
        // Return structured aggregated report data for 10 members
        return {
          aggregatedData: [
            {
              memberId: 'member-001',
              yesterday: 'Completed database optimization task',
              today: 'Continue performance testing',
              issue: 'Database query response time still above target',
            },
            {
              memberId: 'member-002',
              yesterday: 'Fixed authentication module bugs',
              today: 'Deploy auth service to staging',
              issue: 'Rate limiting configuration incomplete',
            },
            {
              memberId: 'member-003',
              yesterday: 'Updated API documentation',
              today: 'Review pull request comments',
              issue: 'API specification inconsistency with implementation',
            },
            {
              memberId: 'member-004',
              yesterday: 'Implemented caching layer',
              today: 'Monitor cache hit ratio metrics',
              issue: 'Cache invalidation strategy needs refinement',
            },
            {
              memberId: 'member-005',
              yesterday: 'Wrote unit tests for payment module',
              today: 'Add integration tests',
              issue: 'Payment gateway sandbox connectivity intermittent',
            },
            {
              memberId: 'member-006',
              yesterday: 'Reviewed security audit findings',
              today: 'Implement security patches',
              issue: 'SSL certificate renewal timeline critical',
            },
            {
              memberId: 'member-007',
              yesterday: 'Completed user interface redesign',
              today: 'Conduct usability testing',
              issue: 'Mobile responsive layout not matching requirements',
            },
            {
              memberId: 'member-008',
              yesterday: 'Optimized build pipeline',
              today: 'Document build process changes',
              issue: 'Build time reduction target missed by 15 percent',
            },
            {
              memberId: 'member-009',
              yesterday: 'Created monitoring dashboard prototype',
              today: 'Integrate with metrics backend',
              issue: 'Dashboard data refresh lag exceeds acceptable threshold',
            },
            {
              memberId: 'member-010',
              yesterday: 'Coordinated deployment schedule',
              today: 'Execute planned production release',
              issue: 'Rollback procedure documentation incomplete',
            },
          ],
          aggregationTimestamp: executionStartTime.toISOString(),
          periodStart: '2024-12-01',
          periodEnd: '2024-12-15',
          recordCount: 10,
        };
      },
      invokeAction02: async () => ({ status: 'pending' }),
      invokeAction03: async () => ({ status: 'pending' }),
      invokeAction04: async () => ({ status: 'pending' }),
      invokeAction05: async () => ({ status: 'pending' }),
      invokeAction06: async () => ({ status: 'pending' }),
      invokeAction07: async () => ({ status: 'pending' }),
    };

    // Execute agent with specified period
    const agentResult = await runTx9Imp1Agent(context, mockAiClient);

    // Verify action 1 prompt was generated with correct parameters
    expect(action01PromptCaptured).not.toBeNull();
    expect(action01PromptCaptured).toMatch(/2024-12-01/);
    expect(action01PromptCaptured).toMatch(/2024-12-15/);

    // Verify aggregated data contains all required fields
    expect(agentResult).toBeDefined();
    expect(agentResult.action1Result).toBeDefined();
    expect(agentResult.action1Result.status).toBe('completed');
    expect(agentResult.action1Result.aggregatedDataSet).toBeDefined();
    expect(agentResult.action1Result.aggregatedDataSet.length).toBe(10);

    // Verify each record contains all three required fields
    agentResult.action1Result.aggregatedDataSet.forEach((record: any) => {
      expect(record).toHaveProperty('memberId');
      expect(record).toHaveProperty('yesterday');
      expect(record).toHaveProperty('today');
      expect(record).toHaveProperty('issue');
    });

    // Verify aggregation timestamp is recorded
    expect(agentResult.action1Result.aggregationTimestamp).toBeDefined();
    const aggregationTime = new Date(agentResult.action1Result.aggregationTimestamp);
    expect(aggregationTime.getTime()).toBeGreaterThanOrEqual(
      executionStartTime.getTime()
    );
    expect(aggregationTime.getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );

    // Verify data quality validation flag is set
    expect(agentResult.action1Result.dataQualityValid).toBe(true);

    // Verify period information is correctly captured
    expect(agentResult.action1Result.periodStart).toBe('2024-12-01');
    expect(agentResult.action1Result.periodEnd).toBe('2024-12-15');

    // Call generateWeeklyAnalysisReport logic function with aggregated data
    const analysisResult = generateWeeklyAnalysisReport(
      agentResult.action1Result.aggregatedDataSet,
      {
        periodStart: new Date('2024-12-01'),
        periodEnd: new Date('2024-12-15'),
      }
    );

    // Verify analysis report is generated successfully
    expect(analysisResult).toBeDefined();
    expect(analysisResult.reportGenerated).toBe(true);
    expect(analysisResult.memberCount).toBe(10);
    expect(analysisResult.issueCount).toBeGreaterThan(0);
  });
});