import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/analysis-reporting';
import type { WeeklyReportInput, AnalysisResult, ValidationError } from '../../src/logic/analysis-reporting';

// Mock types and interfaces
interface MockAuditLog {
  eventType: string;
  timestamp: string;
  executionId: string;
  details: Record<string, unknown>;
}

interface EscalationTask {
  executionId: string;
  escalationType: string;
  detectedIssues: string[];
  anomalyExamples: Record<string, unknown>;
  timestamp: string;
  status: 'pending_review' | 'resolved';
}

describe('generateWeeklyAnalysisReport - Escalation on Validation Failure', () => {
  let mockAuditLogs: MockAuditLog[];
  let mockEscalationTasks: EscalationTask[];
  const executionId = 'exec-20240115-001';
  const reportTimestamp = '2024-01-15T11:00:00Z';

  beforeEach(() => {
    mockAuditLogs = [];
    mockEscalationTasks = [];
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T11:00:00Z'));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // SCEN-115
  test('should detect contradictory analysis results and escalate to manager without distributing report', async () => {
    // Setup: Valid prior actions 1-5 completion state
    const validCollectedReports = [
      {
        memberId: 'mem001',
        reportDate: '2024-01-08',
        content: 'Fixed database connection issue',
        status: 'submitted',
      },
      {
        memberId: 'mem002',
        reportDate: '2024-01-08',
        content: 'Resolved authentication bug in login module',
        status: 'submitted',
      },
      {
        memberId: 'mem003',
        reportDate: '2024-01-08',
        content: 'Database connection issue persists in prod',
        status: 'submitted',
      },
      {
        memberId: 'mem004',
        reportDate: '2024-01-08',
        content: 'Network latency causing timeouts',
        status: 'submitted',
      },
      {
        memberId: 'mem005',
        reportDate: '2024-01-08',
        content: 'Authentication bug appeared again',
        status: 'submitted',
      },
      {
        memberId: 'mem006',
        reportDate: '2024-01-09',
        content: 'Database backup failed',
        status: 'submitted',
      },
      {
        memberId: 'mem007',
        reportDate: '2024-01-09',
        content: 'Fixed network timeout issue',
        status: 'submitted',
      },
      {
        memberId: 'mem008',
        reportDate: '2024-01-09',
        content: 'Database connection issue affecting reports',
        status: 'submitted',
      },
      {
        memberId: 'mem009',
        reportDate: '2024-01-09',
        content: 'Login module stability improved',
        status: 'submitted',
      },
      {
        memberId: 'mem010',
        reportDate: '2024-01-09',
        content: 'Resolved network latency root cause',
        status: 'submitted',
      },
    ];

    // Setup: Contradictory analysis result with anomalies
    const contradictoryAnalysisResult: AnalysisResult = {
      executionId,
      reportTimestamp,
      dataQuality: 'valid',
      priorActionsCompleted: ['action-01', 'action-02', 'action-03', 'action-04', 'action-05'],
      issueCategories: {
        database: {
          category: 'database',
          occurrenceCount: 3,
          recurrenceFlag: true,
        },
        authentication: {
          category: 'authentication',
          occurrenceCount: 3,
          recurrenceFlag: true,
        },
        network: {
          category: 'network',
          occurrenceCount: 3,
          recurrenceFlag: true,
        },
        infrastructure: {
          category: 'infrastructure',
          occurrenceCount: 1,
          recurrenceFlag: false,
        },
      },
      // Anomaly 1: Same issue counted in multiple categories (database)
      categoryIssueMapping: {
        database: ['issue-db-001', 'issue-db-001', 'issue-db-002'],
        authentication: ['issue-auth-001', 'issue-auth-002', 'issue-auth-002'],
        network: ['issue-net-001', 'issue-net-002', 'issue-net-003'],
        infrastructure: ['issue-inf-001'],
      },
      priorityScores: {
        // Anomaly 2: Priority scores outside valid range [1-5]
        'issue-db-001': -1,
        'issue-auth-001': 999,
        'issue-net-001': 4,
        'issue-db-002': 3,
        'issue-auth-002': 2,
        'issue-net-002': 5,
        'issue-net-003': 1,
        'issue-inf-001': 2,
      },
      // Anomaly 3: Frequency mismatch (occurrenceCount vs actual list length)
      frequencyData: {
        database: {
          expectedCount: 3,
          actualCount: 2, // Contradiction: should be 3 or 2
        },
        authentication: {
          expectedCount: 3,
          actualCount: 3,
        },
        network: {
          expectedCount: 3,
          actualCount: 3,
        },
        infrastructure: {
          expectedCount: 1,
          actualCount: 1,
        },
      },
      extractedIssues: [
        { id: 'issue-db-001', category: 'database', priority: -1, recurrent: true },
        { id: 'issue-auth-001', category: 'authentication', priority: 999, recurrent: true },
        { id: 'issue-net-001', category: 'network', priority: 4, recurrent: true },
      ],
    };

    // Input for function call
    const input: WeeklyReportInput = {
      executionId,
      weekStartDate: '2024-01-08',
      weekEndDate: '2024-01-14',
      reportTimestamp,
      collectedReports: validCollectedReports,
      analysisResult: contradictoryAnalysisResult,
      onValidationFailure: (
        issues: ValidationError[],
        anomalies: Record<string, unknown>,
        taskId: string,
      ) => {
        // Record escalation task
        mockEscalationTasks.push({
          executionId,
          escalationType: 'VALIDATION_FAILED',
          detectedIssues: issues.map((err) => err.message),
          anomalyExamples: anomalies,
          timestamp: reportTimestamp,
          status: 'pending_review',
        });

        // Record audit log
        mockAuditLogs.push({
          eventType: 'Escalation: VALIDATION_FAILED',
          timestamp: reportTimestamp,
          executionId,
          details: {
            taskId,
            issueCount: issues.length,
            anomalyTypes: Object.keys(anomalies),
            distributionStatus: 'blocked',
          },
        });
      },
    };

    // Execute function
    const result = await generateWeeklyAnalysisReport(input);

    // Assertion 1: Function detects contradictory data
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors.length).toBeGreaterThan(0);

    // Assertion 2: Specific anomalies detected
    const detectedAnomalies = result.anomalyDetails || {};
    expect(detectedAnomalies).toHaveProperty('priorityScoreOutOfRange');
    expect(detectedAnomalies).toHaveProperty('frequencyMismatch');
    expect(detectedAnomalies).toHaveProperty('duplicateCategoryMapping');

    // Assertion 3: Escalation task created
    expect(mockEscalationTasks).toHaveLength(1);
    const escalationTask = mockEscalationTasks[0];
    expect(escalationTask.executionId).toBe(executionId);
    expect(escalationTask.escalationType).toBe('VALIDATION_FAILED');
    expect(escalationTask.status).toBe('pending_review');
    expect(escalationTask.timestamp).toBe(reportTimestamp);

    // Assertion 4: Detected issues include specific contradictions
    expect(escalationTask.detectedIssues).toContain(
      expect.stringMatching(/priority.*score/i),
    );
    expect(escalationTask.detectedIssues).toContain(
      expect.stringMatching(/frequency.*mismatch/i),
    );
    expect(escalationTask.detectedIssues).toContain(
      expect.stringMatching(/duplicate.*category/i),
    );

    // Assertion 5: Anomaly examples include concrete values
    expect(escalationTask.anomalyExamples).toHaveProperty('outOfRangeScores');
    expect(escalationTask.anomalyExamples.outOfRangeScores).toEqual(
      expect.objectContaining({
        'issue-db-001': -1,
        'issue-auth-001': 999,
      }),
    );
    expect(escalationTask.anomalyExamples).toHaveProperty('frequencyMismatches');
    expect(escalationTask.anomalyExamples.frequencyMismatches).toEqual(
      expect.objectContaining({
        database: { expected: 3, actual: 2 },
      }),
    );

    // Assertion 6: Audit log recorded with all required fields
    expect(mockAuditLogs).toHaveLength(1);
    const auditLog = mockAuditLogs[0];
    expect(auditLog.eventType).toBe('Escalation: VALIDATION_FAILED');
    expect(auditLog.timestamp).toBe(reportTimestamp);
    expect(auditLog.executionId).toBe(executionId);
    expect(auditLog.details).toHaveProperty('taskId');
    expect(auditLog.details).toHaveProperty('issueCount');
    expect(auditLog.details.issueCount).toBeGreaterThan(0);
    expect(auditLog.details).toHaveProperty('anomalyTypes');
    expect(auditLog.details.distributionStatus).toBe('blocked');

    // Assertion 7: Report distribution is NOT executed
    expect(result.distributionStatus).toBe('blocked');
    expect(result.reportWasDistributed).toBe(false);

    // Assertion 8: System remains in waiting state for manual review
    expect(result.systemState).toBe('awaiting_manual_review');

    // Assertion 9: All prior actions marked as completed
    expect(result.completedActions).toEqual([
      'action-01',
      'action-02',
      'action-03',
      'action-04',
      'action-05',
    ]);

    // Assertion 10: Action 6 and 7 not executed
    expect(result.completedActions).not.toContain('action-06');
    expect(result.completedActions).not.toContain('action-07');
  });
});