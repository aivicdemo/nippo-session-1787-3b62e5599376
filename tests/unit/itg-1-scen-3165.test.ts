import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3165: 提出済み日報から課題項目を抽出・分類する
  test('should extract and classify issues from submitted daily reports with audit logging', async () => {
    // Prepare sample daily reports with issues (10 members)
    const sampleReports = [
      {
        reporterId: 'eng_001',
        reporterName: 'Engineer Alice',
        reporterEmail: 'alice@company.com',
        submittedAt: new Date('2024-01-08T08:30:00Z'),
        yesterday: 'Completed API integration',
        today: 'Testing API responses',
        issues: 'System failure due to database timeout. Memory leak in worker process.',
      },
      {
        reporterId: 'eng_002',
        reporterName: 'Engineer Bob',
        reporterEmail: 'bob@company.com',
        submittedAt: new Date('2024-01-08T08:45:00Z'),
        yesterday: 'Fixed UI bugs',
        today: 'Implement pagination',
        issues: 'Progress delay on frontend module. Team member sick leave.',
      },
      {
        reporterId: 'eng_003',
        reporterName: 'Engineer Carol',
        reporterEmail: 'carol@company.com',
        submittedAt: new Date('2024-01-08T09:00:00Z'),
        yesterday: 'Database optimization',
        today: 'Query performance tuning',
        issues: 'System failure: index corruption detected.',
      },
      {
        reporterId: 'eng_004',
        reporterName: 'Engineer Dave',
        reporterEmail: 'dave@company.com',
        submittedAt: new Date('2024-01-08T09:15:00Z'),
        yesterday: 'Reviewed code',
        today: 'Deploy to staging',
        issues: 'Member shortage affecting sprint capacity.',
      },
      {
        reporterId: 'eng_005',
        reporterName: 'Engineer Eve',
        reporterEmail: 'eve@company.com',
        submittedAt: new Date('2024-01-08T08:50:00Z'),
        yesterday: 'Unit test writing',
        today: 'Integration testing',
        issues: 'Progress delay on test case completion.',
      },
      {
        reporterId: 'eng_006',
        reporterName: 'Engineer Frank',
        reporterEmail: 'frank@company.com',
        submittedAt: new Date('2024-01-08T09:05:00Z'),
        yesterday: 'Documentation update',
        today: 'API documentation',
        issues: 'System failure in CI/CD pipeline.',
      },
      {
        reporterId: 'eng_007',
        reporterName: 'Engineer Grace',
        reporterEmail: 'grace@company.com',
        submittedAt: new Date('2024-01-08T09:20:00Z'),
        yesterday: 'Security audit',
        today: 'Patch vulnerabilities',
        issues: 'Team member shortage. External API timeout issue.',
      },
      {
        reporterId: 'eng_008',
        reporterName: 'Engineer Henry',
        reporterEmail: 'henry@company.com',
        submittedAt: new Date('2024-01-08T08:40:00Z'),
        yesterday: 'Performance profiling',
        today: 'Optimize hot path',
        issues: 'System failure due to memory exhaustion.',
      },
      {
        reporterId: 'eng_009',
        reporterName: 'Engineer Ivy',
        reporterEmail: 'ivy@company.com',
        submittedAt: new Date('2024-01-08T09:10:00Z'),
        yesterday: 'Release preparation',
        today: 'Run smoke tests',
        issues: 'Progress delay on release validation.',
      },
      {
        reporterId: 'eng_010',
        reporterName: 'Engineer Jack',
        reporterEmail: 'jack@company.com',
        submittedAt: new Date('2024-01-08T09:25:00Z'),
        yesterday: 'Incident investigation',
        today: 'Root cause analysis',
        issues: 'System failure: database replication lag.',
      },
    ];

    // Mock AI client implementation
    const mockAiClient: Tx6Imp1AiClient = {
      buildAction03PromptAndExecute: jest.fn(async (input: string) => {
        // Simulate keyword extraction: "System failure" appears 4 times (eng_001, eng_003, eng_006, eng_008, eng_010)
        // "Progress delay" appears 3 times (eng_002, eng_005, eng_009)
        // "Team member shortage" appears 2 times (eng_004, eng_007)
        return {
          extractedKeywords: [
            {
              keyword: 'System failure',
              frequency: 5,
              severity: 'high',
              extractedFrom: [
                'eng_001',
                'eng_003',
                'eng_006',
                'eng_008',
                'eng_010',
              ],
            },
            {
              keyword: 'Progress delay',
              frequency: 3,
              severity: 'medium',
              extractedFrom: ['eng_002', 'eng_005', 'eng_009'],
            },
            {
              keyword: 'Team member shortage',
              frequency: 2,
              severity: 'high',
              extractedFrom: ['eng_004', 'eng_007'],
            },
          ],
          promptVersion: 'ACTION_03_PROMPT_VERSION_1_0',
          executedAt: new Date('2024-01-08T09:30:00Z'),
        };
      }),
    };

    // Execute orchestrator with mocked AI client
    const result = await runTx6Imp1Agent(sampleReports, mockAiClient);

    // Validate AI client was called with correct structure
    expect(mockAiClient.buildAction03PromptAndExecute).toHaveBeenCalled();
    const callArgs = (
      mockAiClient.buildAction03PromptAndExecute as jest.Mock
    ).mock.calls[0][0];
    expect(typeof callArgs).toBe('string');

    // Validate extracted keywords structure
    expect(result).toBeDefined();
    expect(result.extractedKeywords).toBeDefined();
    expect(Array.isArray(result.extractedKeywords)).toBe(true);
    expect(result.extractedKeywords.length).toBe(3);

    // Validate keyword classification rules
    const systemFailureIssue = result.extractedKeywords.find(
      (k) => k.keyword === 'System failure'
    );
    expect(systemFailureIssue).toBeDefined();
    expect(systemFailureIssue?.frequency).toBe(5);
    expect(systemFailureIssue?.severity).toBe('high');
    expect(systemFailureIssue?.extractedFrom.length).toBe(5);
    expect(systemFailureIssue?.extractedFrom).toContain('eng_001');
    expect(systemFailureIssue?.extractedFrom).toContain('eng_003');
    // Organization-wide issue marker: 5 or more reporters (10 members total)
    expect(systemFailureIssue?.isOrganizationWide).toBe(true);

    const progressDelayIssue = result.extractedKeywords.find(
      (k) => k.keyword === 'Progress delay'
    );
    expect(progressDelayIssue).toBeDefined();
    expect(progressDelayIssue?.frequency).toBe(3);
    expect(progressDelayIssue?.severity).toBe('medium');
    expect(progressDelayIssue?.extractedFrom.length).toBe(3);

    const teamMemberIssue = result.extractedKeywords.find(
      (k) => k.keyword === 'Team member shortage'
    );
    expect(teamMemberIssue).toBeDefined();
    expect(teamMemberIssue?.frequency).toBe(2);
    expect(teamMemberIssue?.severity).toBe('high');
    expect(teamMemberIssue?.extractedFrom.length).toBe(2);

    // Validate personal information is NOT exposed in results
    const resultString = JSON.stringify(result);
    expect(resultString).not.toContain('alice@company.com');
    expect(resultString).not.toContain('bob@company.com');
    expect(resultString).not.toContain('Engineer Alice');
    expect(resultString).not.toContain('Engineer Bob');
    expect(resultString).not.toContain('eng_001');
    expect(resultString).not.toContain('eng_002');

    // Validate audit logging
    expect(result.auditLog).toBeDefined();
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog.length).toBeGreaterThan(0);

    const action03AuditEntry = result.auditLog.find(
      (entry) =>
        entry.action === 'ACTION_03_EXECUTE' &&
        entry.timestamp instanceof Date
    );
    expect(action03AuditEntry).toBeDefined();
    expect(action03AuditEntry?.timestamp).toEqual(
      new Date('2024-01-08T09:30:00Z')
    );
    expect(typeof action03AuditEntry?.inputSize).toBe('number');
    expect(typeof action03AuditEntry?.outputSize).toBe('number');
    expect(action03AuditEntry?.inputSize).toBeGreaterThan(0);
    expect(action03AuditEntry?.outputSize).toBeGreaterThan(0);

    // Validate issue classification contract
    expect(result.issueClassification).toBeDefined();
    expect(result.issueClassification.frequentIssues).toBeDefined();
    expect(result.issueClassification.frequentIssues.length).toBeGreaterThan(0);
    expect(
      result.issueClassification.frequentIssues.some(
        (i) => i.keyword === 'System failure'
      )
    ).toBe(true);

    expect(result.issueClassification.organizationWideIssues).toBeDefined();
    expect(
      result.issueClassification.organizationWideIssues.some(
        (i) => i.keyword === 'System failure'
      )
    ).toBe(true);
  });
});