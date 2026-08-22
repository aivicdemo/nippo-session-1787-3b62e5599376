import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-01';
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-02';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-03';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-04';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-05';

describe('tx-8-imp-1 orchestrator', () => {
  // SCEN-147
  test('should execute autonomous actions in sequence and generate visualization report with audit trail', async () => {
    const mockAuditLog: Array<{
      actionNumber: number;
      promptVersion: string;
      input: string;
      output: string;
      timestamp: string;
    }> = [];

    const mockTx8Imp1AiClient = {
      invokeAiModel: jest.fn(async (promptVersion: string, promptText: string) => {
        const timestamp = new Date().toISOString();

        if (promptVersion === ACTION_01_PROMPT_VERSION) {
          mockAuditLog.push({
            actionNumber: 1,
            promptVersion: ACTION_01_PROMPT_VERSION,
            input: promptText,
            output: 'action-01-response',
            timestamp,
          });
          return {
            extractedIssues: [
              {
                issueId: 'ISSUE-001',
                title: 'Database connection timeout',
                firstReportedDate: '2024-01-01',
                lastReportedDate: '2024-01-10',
                occurrenceCount: 5,
              },
              {
                issueId: 'ISSUE-002',
                title: 'API rate limiting',
                firstReportedDate: '2024-01-02',
                lastReportedDate: '2024-01-12',
                occurrenceCount: 8,
              },
              {
                issueId: 'ISSUE-003',
                title: 'Memory leak in background service',
                firstReportedDate: '2024-01-05',
                lastReportedDate: '2024-01-11',
                occurrenceCount: 3,
              },
            ],
          };
        }

        if (promptVersion === ACTION_02_PROMPT_VERSION) {
          mockAuditLog.push({
            actionNumber: 2,
            promptVersion: ACTION_02_PROMPT_VERSION,
            input: promptText,
            output: 'action-02-response',
            timestamp,
          });
          return {
            recurrencePatterns: [
              {
                patternId: 'PATTERN-001',
                issueIds: ['ISSUE-001', 'ISSUE-002'],
                pattern: 'Infrastructure degradation under load',
                frequency: 'Weekly on Mondays',
                timeSeriesData: [
                  { week: '2024-W01', count: 2 },
                  { week: '2024-W02', count: 3 },
                  { week: '2024-W03', count: 5 },
                  { week: '2024-W04', count: 4 },
                ],
              },
              {
                patternId: 'PATTERN-002',
                issueIds: ['ISSUE-003'],
                pattern: 'Gradual resource exhaustion',
                frequency: 'Sporadic',
                timeSeriesData: [
                  { week: '2024-W01', count: 0 },
                  { week: '2024-W02', count: 1 },
                  { week: '2024-W03', count: 1 },
                  { week: '2024-W04', count: 1 },
                ],
              },
            ],
          };
        }

        if (promptVersion === ACTION_03_PROMPT_VERSION) {
          mockAuditLog.push({
            actionNumber: 3,
            promptVersion: ACTION_03_PROMPT_VERSION,
            input: promptText,
            output: 'action-03-response',
            timestamp,
          });
          return {
            bottleneckTrends: [
              {
                bottleneckId: 'BN-001',
                category: 'Infrastructure',
                severity: 'high',
                trend: 'increasing',
                changePercentage: 25,
                timeSeriesData: [
                  { date: '2024-01-01', severity: 'low' },
                  { date: '2024-01-05', severity: 'medium' },
                  { date: '2024-01-10', severity: 'high' },
                ],
              },
              {
                bottleneckId: 'BN-002',
                category: 'Resource Management',
                severity: 'medium',
                trend: 'stable',
                changePercentage: 0,
                timeSeriesData: [
                  { date: '2024-01-01', severity: 'medium' },
                  { date: '2024-01-05', severity: 'medium' },
                  { date: '2024-01-10', severity: 'medium' },
                ],
              },
            ],
          };
        }

        if (promptVersion === ACTION_04_PROMPT_VERSION) {
          mockAuditLog.push({
            actionNumber: 4,
            promptVersion: ACTION_04_PROMPT_VERSION,
            input: promptText,
            output: 'action-04-response',
            timestamp,
          });
          return {
            reportId: 'REPORT-2024-01-15-001',
            visualizationData: {
              recurrenceAnalysis: {
                patterns: 2,
                affectedIssues: 3,
                mostCommonPattern: 'PATTERN-001',
              },
              bottleneckTimeseries: {
                highSeverity: [
                  { timestamp: '2024-01-10T09:00:00Z', count: 5 },
                  { timestamp: '2024-01-12T14:30:00Z', count: 4 },
                ],
                mediumSeverity: [
                  { timestamp: '2024-01-10T10:00:00Z', count: 3 },
                  { timestamp: '2024-01-12T15:00:00Z', count: 3 },
                ],
              },
              trendChart: {
                dataPoints: 4,
                xAxis: ['2024-W01', '2024-W02', '2024-W03', '2024-W04'],
                yAxis: [2, 3, 5, 4],
              },
            },
          };
        }

        if (promptVersion === ACTION_05_PROMPT_VERSION) {
          mockAuditLog.push({
            actionNumber: 5,
            promptVersion: ACTION_05_PROMPT_VERSION,
            input: promptText,
            output: 'action-05-response',
            timestamp,
          });
          return {
            prioritizedIssues: [
              {
                priority: 'high',
                issues: [
                  {
                    issueId: 'ISSUE-001',
                    title: 'Database connection timeout',
                    priority: 'high',
                    emphasis: true,
                    recurrenceCount: 5,
                  },
                  {
                    issueId: 'ISSUE-002',
                    title: 'API rate limiting',
                    priority: 'high',
                    emphasis: true,
                    recurrenceCount: 8,
                  },
                ],
              },
              {
                priority: 'medium',
                issues: [
                  {
                    issueId: 'ISSUE-003',
                    title: 'Memory leak in background service',
                    priority: 'medium',
                    emphasis: false,
                    recurrenceCount: 3,
                  },
                ],
              },
              {
                priority: 'low',
                issues: [],
              },
            ],
          };
        }

        throw new Error(`Unknown prompt version: ${promptVersion}`);
      }),
    };

    const agentInput = {
      analysisPeriodStartDate: '2024-01-01',
      analysisPeriodEndDate: '2024-01-15',
      managerEmail: 'manager@example.com',
      minimumDataThreshold: 10,
    };

    const result = await runTx8Imp1Agent(agentInput, mockTx8Imp1AiClient);

    // Verify all 5 actions were executed in order
    expect(mockAuditLog).toHaveLength(5);
    expect(mockAuditLog[0].actionNumber).toBe(1);
    expect(mockAuditLog[0].promptVersion).toBe(ACTION_01_PROMPT_VERSION);
    expect(mockAuditLog[1].actionNumber).toBe(2);
    expect(mockAuditLog[1].promptVersion).toBe(ACTION_02_PROMPT_VERSION);
    expect(mockAuditLog[2].actionNumber).toBe(3);
    expect(mockAuditLog[2].promptVersion).toBe(ACTION_03_PROMPT_VERSION);
    expect(mockAuditLog[3].actionNumber).toBe(4);
    expect(mockAuditLog[3].promptVersion).toBe(ACTION_04_PROMPT_VERSION);
    expect(mockAuditLog[4].actionNumber).toBe(5);
    expect(mockAuditLog[4].promptVersion).toBe(ACTION_05_PROMPT_VERSION);

    // Verify prompts were generated and passed to AI client
    expect(mockTx8Imp1AiClient.invokeAiModel).toHaveBeenCalledTimes(5);
    expect(mockAuditLog[0].input).toContain(
      buildAction01Prompt(agentInput.analysisPeriodStartDate, agentInput.analysisPeriodEndDate).substring(0, 50)
    );
    expect(mockAuditLog[3].input).toContain(
      buildAction04Prompt(
        agentInput.analysisPeriodStartDate,
        agentInput.analysisPeriodEndDate
      ).substring(0, 50)
    );

    // Verify returned visualization report structure
    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBe('REPORT-2024-01-15-001');

    expect(result).toHaveProperty('recurrencePatternAnalysis');
    expect(result.recurrencePatternAnalysis).toHaveProperty('patterns');
    expect(result.recurrencePatternAnalysis.patterns).toBe(2);
    expect(result.recurrencePatternAnalysis).toHaveProperty('affectedIssueCount');
    expect(result.recurrencePatternAnalysis.affectedIssueCount).toBe(3);
    expect(result.recurrencePatternAnalysis).toHaveProperty('timeSeriesData');
    expect(Array.isArray(result.recurrencePatternAnalysis.timeSeriesData)).toBe(true);

    expect(result).toHaveProperty('bottleneckTrendData');
    expect(result.bottleneckTrendData).toHaveProperty('highSeverity');
    expect(result.bottleneckTrendData).toHaveProperty('mediumSeverity');
    expect(Array.isArray(result.bottleneckTrendData.highSeverity)).toBe(true);
    expect(result.bottleneckTrendData.highSeverity.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('prioritizedIssuesList');
    expect(result.prioritizedIssuesList).toHaveProperty('high');
    expect(result.prioritizedIssuesList).toHaveProperty('medium');
    expect(result.prioritizedIssuesList).toHaveProperty('low');
    expect(Array.isArray(result.prioritizedIssuesList.high)).toBe(true);
    expect(result.prioritizedIssuesList.high.length).toBe(2);
    expect(result.prioritizedIssuesList.high[0].emphasis).toBe(true);
    expect(result.prioritizedIssuesList.high[1].emphasis).toBe(true);
    expect(Array.isArray(result.prioritizedIssuesList.medium)).toBe(true);
    expect(result.prioritizedIssuesList.medium.length).toBe(1);
    expect(result.prioritizedIssuesList.low.length).toBe(0);

    expect(result).toHaveProperty('generatedTimestamp');
    expect(typeof result.generatedTimestamp).toBe('string');
    const generatedDate = new Date(result.generatedTimestamp);
    expect(generatedDate.toISOString()).toBeDefined();

    // Verify audit log structure
    expect(result).toHaveProperty('auditLog');
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBe(5);

    // Verify each audit log entry
    result.auditLog.forEach((entry, index) => {
      expect(entry).toHaveProperty('actionNumber');
      expect(entry.actionNumber).toBe(index + 1);
      expect(entry).toHaveProperty('promptVersion');
      expect(entry).toHaveProperty('executedAt');
      expect(entry).toHaveProperty('status');
      expect(entry.status).toBe('completed');
    });

    // Verify action sequence in audit log
    expect(result.auditLog[0].promptVersion).toBe(ACTION_01_PROMPT_VERSION);
    expect(result.auditLog[1].promptVersion).toBe(ACTION_02_PROMPT_VERSION);
    expect(result.auditLog[2].promptVersion).toBe(ACTION_03_PROMPT_VERSION);
    expect(result.auditLog[3].promptVersion).toBe(ACTION_04_PROMPT_VERSION);
    expect(result.auditLog[4].promptVersion).toBe(ACTION_05_PROMPT_VERSION);
  });
});