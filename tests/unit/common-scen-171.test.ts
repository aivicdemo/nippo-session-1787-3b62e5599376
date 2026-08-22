import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import type { Tx9AggregationRequest, Tx9AnalysisReport } from '../../src/agents/tx-9-imp-1/types';

describe('Tx9Imp1Agent', () => {
  it('SCEN-171: rejects malformed/ambiguous/low-confidence AI output and escalates to human review', async () => {
    const mockAiClient: Tx9Imp1AiClient = {
      extractReportData: jest.fn().mockResolvedValue({
        reportIds: ['rep001', 'rep002'],
        aggregationStartDate: '2024-01-01',
        aggregationEndDate: '2024-01-31',
        totalReportsCollected: 45,
        unreportedMemberIds: ['mem001', 'mem002'],
      }),

      extractIssuesFromReports: jest.fn().mockResolvedValue({
        issues: [
          {
            issueId: 'iss001',
            title: 'Database connection timeout',
            description: 'API response slow in production',
            detectedCount: 3,
            confidenceScore: 0.92,
          },
        ],
        extractionConfidence: 0.88,
      }),

      analyzeIssueTrends: jest.fn().mockResolvedValue({
        trendPatterns: [
          {
            patternId: 'pat001',
            issueIds: ['iss001'],
            frequency: 3,
            timeRange: { start: '2024-01-05', end: '2024-01-31' },
          },
        ],
        anomalies: [],
        trendAnalysisConfidence: 0.85,
      }),

      prioritizeIssues: jest.fn().mockResolvedValueOnce({
        prioritizedIssues: [
          {
            issueId: 'iss001',
            title: 'Database connection timeout',
            priority: 'high-low-mixed',
            priorityScore: NaN,
            rationale: 'Mixed priority signals',
            confidenceScore: 0.35,
          },
        ],
        prioritizationConfidence: 0.42,
      }),

      generateCountermeasures: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            countermeasureId: 'cm001',
            relatedIssueId: 'iss001',
            proposal: 'Increase DB pool size',
          },
          {
            countermeasureId: 'cm002',
            relatedIssueId: 'iss001',
            proposal: 'Decrease DB pool size',
          },
        ],
      }),

      generateAnalysisReport: jest.fn().mockResolvedValueOnce({
        reportId: null,
        aggregationPeriod: {},
        productivityMetrics: {},
        prioritizedIssues: undefined,
        recommendedCountermeasures: [],
        generatedAt: 'invalid-date',
      }),
    };

    const aggregationRequest: Tx9AggregationRequest = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-31',
      targetTeamIds: [],
      requestedByUserId: 'user001',
    };

    const result = await runTx9Imp1Agent(aggregationRequest, mockAiClient);

    expect(result.status).toBe('ESCALATION_TO_HUMAN_REVIEW');
    expect(result.workflowContinuation).toBe(false);
    expect(result.escalationContext).toBeDefined();

    const escalation = result.escalationContext;
    expect(escalation.rejectReason).toMatch(/スキーマ不合致|曖昧な優先度|確信度/i);
    expect(escalation.failedAiOutput).toBeDefined();
    expect(Array.isArray(escalation.failedAiOutput)).toBe(true);
    expect(escalation.failedAiOutput.length).toBeGreaterThan(0);

    expect(escalation.retryRecommended).toBe(true);
    expect(escalation.humanReviewRequired).toBe(true);
    expect(escalation.timestamp).toBeDefined();

    const rawData = escalation.rawAggregatedData;
    expect(rawData).toBeDefined();
    expect(rawData.aggregationStartDate).toBe('2024-01-01');
    expect(rawData.aggregationEndDate).toBe('2024-01-31');
    expect(rawData.totalReportsCollected).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(rawData.unreportedMemberIds)).toBe(true);

    expect(escalation.failureDetails).toBeDefined();
    expect(escalation.failureDetails.length).toBeGreaterThan(0);
    escalation.failureDetails.forEach((detail: any) => {
      expect(detail).toHaveProperty('stage');
      expect(detail).toHaveProperty('issue');
      expect(detail.stage).toMatch(/extraction|analysis|prioritization|report_generation/);
    });

    expect(result.analysisReport).toBeUndefined();
  });
});