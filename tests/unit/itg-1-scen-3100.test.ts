import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-2-imp-1/prompts/action-04';

describe('Tx2Imp1Agent - Action 4 Priority Color Coding', () => {
  // SCEN-3100
  test('should apply priority-based color coding to extracted issues in correct order', async () => {
    const mockAiClient = {
      generateAction01: jest.fn().mockResolvedValue({
        totalMembers: 10,
        submittedMembers: 9,
        unsubmittedMembers: 1,
        unsubmittedMemberIds: ['member-010'],
      }),
      generateAction02: jest.fn().mockResolvedValue({
        standardizedReports: [
          {
            memberId: 'member-001',
            reportDate: new Date('2024-01-15T09:00:00Z'),
            yesterday: 'Completed DB migration',
            today: 'Testing migration results',
            challenges: 'Database connection timeout issue',
          },
          {
            memberId: 'member-002',
            reportDate: new Date('2024-01-15T09:00:00Z'),
            yesterday: 'Fixed API endpoint',
            today: 'Deploy to staging',
            challenges: 'Database connection timeout issue',
          },
          {
            memberId: 'member-003',
            reportDate: new Date('2024-01-15T09:00:00Z'),
            yesterday: 'Code review completed',
            today: 'Merge pull requests',
            challenges: 'Memory leak in production detected',
          },
        ],
      }),
      generateAction03: jest.fn().mockResolvedValue({
        extractedIssues: [
          {
            issueId: 'issue-001',
            keyword: 'Database connection timeout',
            occurrenceCount: 2,
            extractedText: 'Database connection timeout issue',
          },
          {
            issueId: 'issue-002',
            keyword: 'Memory leak',
            occurrenceCount: 1,
            extractedText: 'Memory leak in production detected',
          },
          {
            issueId: 'issue-003',
            keyword: 'API deployment',
            occurrenceCount: 1,
            extractedText: 'Deploy to staging',
          },
        ],
      }),
      generateAction04: jest.fn().mockResolvedValue({
        prioritizedAndColoredIssues: [
          {
            issueId: 'issue-001',
            priorityLevel: 'HIGH',
            colorCode: '#FF0000',
            extractedText: 'Database connection timeout issue',
            occurrenceCount: 2,
          },
          {
            issueId: 'issue-002',
            priorityLevel: 'MEDIUM',
            colorCode: '#FFA500',
            extractedText: 'Memory leak in production detected',
            occurrenceCount: 1,
          },
          {
            issueId: 'issue-003',
            priorityLevel: 'LOW',
            colorCode: '#90EE90',
            extractedText: 'Deploy to staging',
            occurrenceCount: 1,
          },
        ],
      }),
      generateAction05: jest.fn().mockResolvedValue({
        confirmationEmailGenerated: true,
        emailContent: {
          reportDate: new Date('2024-01-15'),
          submissionSummary: '9/10 members submitted',
          topPriorityChallenges: [
            {
              issueId: 'issue-001',
              priorityLevel: 'HIGH',
              colorCode: '#FF0000',
              extractedText: 'Database connection timeout issue',
            },
            {
              issueId: 'issue-002',
              priorityLevel: 'MEDIUM',
              colorCode: '#FFA500',
              extractedText: 'Memory leak in production detected',
            },
          ],
        },
      }),
      generateAction06: jest.fn().mockResolvedValue({
        emailSent: true,
        recipientCount: 1,
        sendTimestamp: new Date('2024-01-15T09:15:00Z'),
      }),
    };

    const input = {
      executionTimestamp: new Date('2024-01-15T08:55:00Z'),
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      targetTeamIds: ['team-001'],
      managerUserIds: ['manager-001'],
    };

    const output = await runTx2Imp1Agent(input, mockAiClient);

    expect(mockAiClient.generateAction04).toHaveBeenCalled();
    const action04CallArgs = mockAiClient.generateAction04.mock.calls[0];
    expect(action04CallArgs).toBeDefined();
    const promptArg = action04CallArgs[0];
    expect(typeof promptArg).toBe('string');

    expect(output.aggregatedReportCount).toBe(9);
    expect(output.extractedIssueCount).toBe(3);

    expect(output.prioritizedIssues).toHaveLength(3);

    const highPriorityIssue = output.prioritizedIssues[0];
    expect(highPriorityIssue.priorityLevel).toBe('HIGH');
    expect(highPriorityIssue.colorCode).toBe('#FF0000');
    expect(highPriorityIssue.issueId).toBe('issue-001');
    expect(highPriorityIssue.extractedText).toBe('Database connection timeout issue');

    const mediumPriorityIssue = output.prioritizedIssues[1];
    expect(mediumPriorityIssue.priorityLevel).toBe('MEDIUM');
    expect(mediumPriorityIssue.colorCode).toBe('#FFA500');
    expect(mediumPriorityIssue.issueId).toBe('issue-002');
    expect(mediumPriorityIssue.extractedText).toBe('Memory leak in production detected');

    const lowPriorityIssue = output.prioritizedIssues[2];
    expect(lowPriorityIssue.priorityLevel).toBe('LOW');
    expect(lowPriorityIssue.colorCode).toBe('#90EE90');
    expect(lowPriorityIssue.issueId).toBe('issue-003');
    expect(lowPriorityIssue.extractedText).toBe('Deploy to staging');

    expect(output.confirmationEmailSent).toBe(true);

    expect(ACTION_04_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_04_PROMPT_VERSION).toBe('string');

    expect(buildAction04Prompt).toBeDefined();
    expect(typeof buildAction04Prompt).toBe('function');

    const builtPrompt = buildAction04Prompt(
      mockAiClient.generateAction03.mock.results[0].value.extractedIssues,
      []
    );
    expect(typeof builtPrompt).toBe('string');
    expect(builtPrompt.length).toBeGreaterThan(0);
  });
});