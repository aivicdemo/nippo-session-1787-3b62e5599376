import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 orchestrator', () => {
  // SCEN-137
  test('should detect low-confidence and ambiguous AI output and escalate without presenting to director', async () => {
    // Arrange: Create a fake AI client that returns low-confidence, ambiguous analysis
    const fakeAiClient: Tx7Imp1AiClient = {
      validateAiOutput: jest.fn().mockResolvedValue({
        isValid: false,
        confidence: 0.35,
        reason: 'ambiguous_reasoning',
        details: 'Analysis result can be interpreted in multiple ways; confidence below threshold'
      }),
      action01GetReportTrigger: jest.fn().mockResolvedValue({
        triggerId: 'monthly-20240101',
        targetMonth: '2024-01',
        teamId: 'team-001',
        triggeredBy: 'schedule',
        includeDetailedAnalysis: true
      }),
      action02ExtractData: jest.fn().mockResolvedValue({
        totalReports: 45,
        reportIds: ['rep-001', 'rep-002'],
        extractedAt: new Date('2024-01-01T08:00:00Z').toISOString()
      }),
      action03GenerateReport: jest.fn().mockResolvedValue({
        reportId: 'rpt-2024-01-001',
        generatedAt: new Date('2024-01-01T08:15:00Z').toISOString(),
        topPriorityChallenges: [
          {
            challengeId: 'ch-001',
            title: 'Database performance',
            priority: 1,
            score: 92
          }
        ]
      }),
      action04AnalyzeTimeSeries: jest.fn().mockResolvedValue({
        timeSeriesData: [
          {
            date: '2024-01-01',
            bottleneckSeverity: 0.65,
            issueCount: 3
          }
        ],
        improvementTrend: 'stable',
        confidence: 0.35,
        reasoning: 'Multiple interpretations possible'
      }),
      action05AnalyzeBottleneck: jest.fn().mockResolvedValue({
        bottleneckId: 'bn-001',
        description: 'Integration delays'
      }),
      action06AnalyzeTeamMetrics: jest.fn().mockResolvedValue({
        teamId: 'team-001',
        resolutionSpeed: 3.2,
        reportSubmissionRate: 0.88
      }),
      action07PreparePresentation: jest.fn().mockResolvedValue({
        presentationId: 'pres-001',
        prepared: true
      }),
      action08PresentToDirector: jest.fn().mockResolvedValue({
        directorNotified: true
      })
    };

    const auditLog: Array<{ event: string; timestamp: string; data: unknown }> = [];

    const logAuditEvent = (event: string, data: unknown) => {
      auditLog.push({
        event,
        timestamp: new Date('2024-01-01T08:30:00Z').toISOString(),
        data
      });
    };

    // Act: Run agent with fake AI client returning low-confidence output
    const result = await runTx7Imp1Agent(
      { targetMonth: '2024-01', teamId: 'team-001', triggeredBy: 'schedule' },
      fakeAiClient,
      logAuditEvent
    );

    // Assert: Verify validation was called
    expect(fakeAiClient.validateAiOutput).toHaveBeenCalled();

    // Assert: Verify agent detected low confidence and escalated
    expect(result).toEqual(
      expect.objectContaining({
        code: 'AI_OUTPUT_REJECTED',
        reason: 'ambiguous_reasoning',
        confidence: 0.35
      })
    );

    // Assert: Verify Action 8 (presentToDirector) was NOT called
    expect(fakeAiClient.action08PresentToDirector).not.toHaveBeenCalled();

    // Assert: Verify escalation event was logged
    const escalationEvent = auditLog.find((e) =>
      e.event.includes('ESCALATION')
    );
    expect(escalationEvent).toBeDefined();
    expect(escalationEvent?.event).toMatch(/ESCALATION/);
    expect(escalationEvent?.data).toEqual(
      expect.objectContaining({
        reason: 'ambiguous_reasoning',
        confidence: 0.35
      })
    );

    // Assert: Verify system is in safe hold state (not presenting report)
    expect(result.escalated).toBe(true);
    expect(result.status).toBe('human_review_required');
  });
});