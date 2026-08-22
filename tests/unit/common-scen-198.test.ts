import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-11-imp-1/prompts/action-04';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  let mockAiClient: Tx11Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      generateText: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-198
  test('should retrieve and present similar past issues and reference information when processing current daily reports', async () => {
    const executionTimestamp = new Date('2024-01-15T08:00:00Z');
    const teamId = 'team-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const pastReportDatabase = [
      {
        reportId: 'past-report-001',
        issueName: 'Database connection timeout',
        issueDescription: 'MySQL connection pool exhausted during peak load',
        issueDate: '2024-01-01T10:30:00Z',
        resolution: 'Increased connection pool size from 10 to 50',
        result: 'Resolved - Response time improved by 40%',
        memberId: 'member-A',
      },
      {
        reportId: 'past-report-002',
        issueName: 'Database connection timeout',
        issueDescription: 'Connection timeout when running batch process',
        issueDate: '2024-01-05T14:15:00Z',
        resolution: 'Added connection retry logic with exponential backoff',
        result: 'Resolved - Batch process completion rate improved to 99%',
        memberId: 'member-B',
      },
      {
        reportId: 'past-report-003',
        issueName: 'Database performance degradation',
        issueDescription: 'Slow query on user_logs table without proper index',
        issueDate: '2024-01-10T09:45:00Z',
        resolution: 'Created composite index on (user_id, timestamp)',
        result: 'Resolved - Query response time reduced from 5s to 100ms',
        memberId: 'member-C',
      },
    ];

    const currentReports = [
      {
        memberId: 'member-A',
        reportDate: '2024-01-15T08:30:00Z',
        issueText: 'Database queries are timing out when too many concurrent users access the system',
      },
      {
        memberId: 'member-B',
        reportDate: '2024-01-15T08:35:00Z',
        issueText: 'API endpoint response times increased significantly this morning',
      },
      {
        memberId: 'member-C',
        reportDate: '2024-01-15T08:40:00Z',
        issueText: 'User list page loads very slowly, suspect missing database index',
      },
    ];

    const similarIssuesSearchResults = [
      {
        exampleId: 'past-report-001',
        occurrenceDate: '2024-01-01T10:30:00Z',
        summary: 'Database connection timeout',
        overview: 'MySQL connection pool exhausted during peak load',
        countermeasure: 'Increased connection pool size from 10 to 50',
        result: 'Resolved - Response time improved by 40%',
      },
      {
        exampleId: 'past-report-002',
        occurrenceDate: '2024-01-05T14:15:00Z',
        summary: 'Database connection timeout',
        overview: 'Connection timeout when running batch process',
        countermeasure: 'Added connection retry logic with exponential backoff',
        result: 'Resolved - Batch process completion rate improved to 99%',
      },
      {
        exampleId: 'past-report-003',
        occurrenceDate: '2024-01-10T09:45:00Z',
        summary: 'Database performance degradation',
        overview: 'Slow query on user_logs table without proper index',
        countermeasure: 'Created composite index on (user_id, timestamp)',
        result: 'Resolved - Query response time reduced from 5s to 100ms',
      },
    ];

    (mockAiClient.generateText as jest.Mock).mockResolvedValue(
      JSON.stringify(similarIssuesSearchResults)
    );

    const input = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    const result = await runTx11Imp1Agent(input, mockAiClient, {
      pastReportDatabase,
      currentReports,
    });

    expect(result).toBeDefined();
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    const referenceIssues = result.prioritizedIssues.filter(
      (issue) => issue.referenceExamples && issue.referenceExamples.length > 0
    );

    expect(referenceIssues.length).toBeGreaterThan(0);

    referenceIssues.forEach((issue) => {
      if (issue.referenceExamples) {
        issue.referenceExamples.forEach((example) => {
          expect(example).toHaveProperty('exampleId');
          expect(example).toHaveProperty('occurrenceDate');
          expect(example).toHaveProperty('summary');
          expect(example).toHaveProperty('overview');
          expect(example).toHaveProperty('countermeasure');
          expect(example).toHaveProperty('result');

          expect(typeof example.exampleId).toBe('string');
          expect(typeof example.occurrenceDate).toBe('string');
          expect(typeof example.summary).toBe('string');
          expect(typeof example.overview).toBe('string');
          expect(typeof example.countermeasure).toBe('string');
          expect(typeof example.result).toBe('string');
        });
      }
    });

    expect((mockAiClient.generateText as jest.Mock).mock.calls.length).toBeGreaterThan(0);

    const callArgs = (mockAiClient.generateText as jest.Mock).mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(typeof callArgs[0]).toBe('string');

    const promptFromCall = callArgs[0];
    expect(promptFromCall).toContain('past');
    expect(promptFromCall).toContain('similar');

    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_04_PROMPT_VERSION).toBe('string');
    expect(ACTION_04_PROMPT_VERSION.length).toBeGreaterThan(0);

    const action04Prompt = buildAction04Prompt({
      currentIssueText: currentReports[0].issueText,
      pastDatabaseRecords: pastReportDatabase,
      memberId: currentReports[0].memberId,
    });

    expect(action04Prompt).toBeDefined();
    expect(typeof action04Prompt).toBe('string');
    expect(action04Prompt.length).toBeGreaterThan(0);
  });
});