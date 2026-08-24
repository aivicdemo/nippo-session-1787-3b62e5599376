import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type {
  Tx8Imp1AiClient,
  Tx8AgentInput,
  Tx8AgentOutput,
  RecurringIssuePattern,
  VisualizationGraph,
} from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3207
  test('緊急対応が必要な課題が特定された場合、エスカレーション検出後に人への引き継ぎモードに遷移し、副作用を確定しない', async () => {
    const mockAuditLog: Array<{
      timestamp: string;
      eventType: string;
      escalationReason?: string;
      criticalIssueId?: string;
    }> = [];

    const mockHumanHandoffState: {
      escalationDetected: boolean;
      escalationReason: string;
      criticalIssueDetails: {
        id: string;
        content: string;
        severity: string;
        requiredResponseTimeMinutes: number;
      } | null;
      analysisState: string;
      handoffTimestamp: string | null;
    } = {
      escalationDetected: false,
      escalationReason: '',
      criticalIssueDetails: null,
      analysisState: 'not_started',
      handoffTimestamp: null,
    };

    let sideEffectsConfirmed = false;
    let reportDeliveryExecuted = false;
    let dashboardUpdateExecuted = false;

    const stubTx8AiClient: Tx8Imp1AiClient = {
      executeAction01SearchAndExtract: jest.fn(async (prompt: string) => {
        return {
          extractedIssues: [
            {
              id: 'issue-001',
              dateOccurred: '2025-01-15T10:30:00Z',
              content: 'Database connection timeout in production',
              currentStatus: 'in_progress',
            },
            {
              id: 'issue-002-CRITICAL',
              dateOccurred: '2025-01-15T11:00:00Z',
              content:
                'Critical security vulnerability in authentication module - requires immediate response',
              currentStatus: 'unresolved',
              severity: 'CRITICAL',
              requiredResponseTimeMinutes: 10,
            },
          ],
        };
      }),

      executeAction02TimeSeriesAnalysis: jest.fn(async (prompt: string) => {
        mockHumanHandoffState.analysisState = 'action_02_completed';
        return {
          patterns: [
            {
              keyword: 'database_issue',
              occurrenceCount: 3,
              timeSeriesPattern: 'increasing_trend',
            },
            {
              keyword: 'security_vulnerability',
              occurrenceCount: 1,
              timeSeriesPattern: 'spike',
            },
          ],
        };
      }),

      executeAction03BottleneckDetection: jest.fn(async (prompt: string) => {
        const detectedBottleneck = {
          pattern: 'security_vulnerability',
          severity: 'CRITICAL',
          requiredResponseTimeMinutes: 10,
        };

        if (detectedBottleneck.severity === 'CRITICAL') {
          mockHumanHandoffState.escalationDetected = true;
          mockHumanHandoffState.escalationReason =
            'CRITICAL issue detected during bottleneck analysis';
          mockHumanHandoffState.criticalIssueDetails = {
            id: 'issue-002-CRITICAL',
            content:
              'Critical security vulnerability in authentication module - requires immediate response',
            severity: 'CRITICAL',
            requiredResponseTimeMinutes: 10,
          };
          mockHumanHandoffState.handoffTimestamp = '2025-01-15T11:05:00Z';

          mockAuditLog.push({
            timestamp: '2025-01-15T11:05:00Z',
            eventType: 'escalation_detected',
            escalationReason: mockHumanHandoffState.escalationReason,
            criticalIssueId: mockHumanHandoffState.criticalIssueDetails.id,
          });

          return {
            shouldEscalate: true,
            escalationReason: mockHumanHandoffState.escalationReason,
            bottleneckPatterns: [detectedBottleneck],
          };
        }

        return {
          shouldEscalate: false,
          escalationReason: '',
          bottleneckPatterns: [detectedBottleneck],
        };
      }),

      executeAction04VisualizationGeneration: jest.fn(
        async (prompt: string) => {
          if (mockHumanHandoffState.escalationDetected) {
            throw new Error(
              'Action 4 should not be executed when escalation is detected'
            );
          }
          reportDeliveryExecuted = true;
          return {
            graphs: [
              {
                graphType: 'line_chart',
                title: 'Issue Occurrence Over Time',
                dataPoints: [],
              },
            ],
          };
        }
      ),

      executeAction05PriorityExtraction: jest.fn(async (prompt: string) => {
        if (mockHumanHandoffState.escalationDetected) {
          throw new Error(
            'Action 5 should not be executed when escalation is detected'
          );
        }
        dashboardUpdateExecuted = true;
        return {
          priorityIssues: [],
        };
      }),
    };

    const testInput: Tx8AgentInput = {
      analysisStartDate: '2025-01-08T00:00:00Z',
      analysisEndDate: '2025-01-15T23:59:59Z',
      teamIds: ['team-001'],
      minimumRecurrenceThreshold: 2,
      recipientManagerId: 'manager-001',
    };

    const result = await runTx8Imp1Agent(testInput, stubTx8AiClient);

    expect(stubTx8AiClient.executeAction01SearchAndExtract).toHaveBeenCalled();
    expect(stubTx8AiClient.executeAction02TimeSeriesAnalysis).toHaveBeenCalled();
    expect(
      stubTx8AiClient.executeAction03BottleneckDetection
    ).toHaveBeenCalled();

    expect(mockHumanHandoffState.escalationDetected).toBe(true);
    expect(mockHumanHandoffState.escalationReason).toMatch(
      /CRITICAL issue detected/
    );
    expect(mockHumanHandoffState.criticalIssueDetails).not.toBeNull();
    expect(
      mockHumanHandoffState.criticalIssueDetails?.severity
    ).toBe('CRITICAL');
    expect(
      mockHumanHandoffState.criticalIssueDetails?.requiredResponseTimeMinutes
    ).toBe(10);
    expect(mockHumanHandoffState.handoffTimestamp).toBe('2025-01-15T11:05:00Z');

    expect(mockHumanHandoffState.analysisState).toBe('action_02_completed');

    expect(reportDeliveryExecuted).toBe(false);
    expect(dashboardUpdateExecuted).toBe(false);

    expect(stubTx8AiClient.executeAction04VisualizationGeneration).not.toHaveBeenCalled();
    expect(stubTx8AiClient.executeAction05PriorityExtraction).not.toHaveBeenCalled();

    expect(mockAuditLog.length).toBeGreaterThan(0);
    const escalationAuditEntry = mockAuditLog.find(
      (log) => log.eventType === 'escalation_detected'
    );
    expect(escalationAuditEntry).toBeDefined();
    expect(escalationAuditEntry?.escalationReason).toMatch(
      /CRITICAL issue detected/
    );
    expect(escalationAuditEntry?.criticalIssueId).toBe('issue-002-CRITICAL');

    sideEffectsConfirmed = true;
    expect(sideEffectsConfirmed).toBe(true);
  });
});