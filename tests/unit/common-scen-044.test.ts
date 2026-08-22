import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock types and interfaces
interface PrioritizedIssue {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
  description: string;
}

interface ColorCodedPriorityLevel {
  level: 'high' | 'medium' | 'low';
  color: string;
  items: PrioritizedIssue[];
}

interface ColorCodedResult {
  priorityLevels: ColorCodedPriorityLevel[];
}

interface DailyReportData {
  memberId: string;
  memberName: string;
  reportContent: string;
  submittedAt: Date;
  extractedIssues: string[];
  extractedRisks: string[];
  extractedAchievements: string[];
}

interface AggregatedReportData {
  submittedMembersCount: number;
  unsubmittedMembersCount: number;
  reportDataList: DailyReportData[];
}

interface Tx2Imp1AiClient {
  buildAction01Prompt: jest.Mock<string>;
  buildAction02Prompt: jest.Mock<string>;
  buildAction03Prompt: jest.Mock<string>;
  buildAction04Prompt: jest.Mock<string>;
  buildAction05Prompt: jest.Mock<string>;
  buildAction06Prompt: jest.Mock<string>;
  callAiModel: jest.Mock<Promise<ColorCodedResult>>;
}

describe('Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行', () => {
  let mockAiClient: Tx2Imp1AiClient;
  let aggregatedReportData: AggregatedReportData;

  beforeEach(() => {
    // Initialize mock AI client
    mockAiClient = {
      buildAction01Prompt: jest.fn(() => 'Action 01 Prompt'),
      buildAction02Prompt: jest.fn(() => 'Action 02 Prompt'),
      buildAction03Prompt: jest.fn(() => 'Action 03 Prompt'),
      buildAction04Prompt: jest.fn((data: DailyReportData[], version: string) => {
        return `Action 04 Prompt with version ${version}`;
      }),
      buildAction05Prompt: jest.fn(() => 'Action 05 Prompt'),
      buildAction06Prompt: jest.fn(() => 'Action 06 Prompt'),
      callAiModel: jest.fn(async () => ({
        priorityLevels: [
          {
            level: 'high' as const,
            color: '#FF0000',
            items: [
              {
                id: 'issue-001',
                title: 'Customer payment system down',
                priority: 'high' as const,
                color: '#FF0000',
                description: 'Critical payment gateway failure',
              },
              {
                id: 'issue-002',
                title: 'Database connection timeout',
                priority: 'high' as const,
                color: '#FF0000',
                description: 'Production database intermittent failures',
              },
            ],
          },
          {
            level: 'medium' as const,
            color: '#FFA500',
            items: [
              {
                id: 'issue-003',
                title: 'API response time degradation',
                priority: 'medium' as const,
                color: '#FFA500',
                description: 'Response time increased by 30%',
              },
              {
                id: 'issue-004',
                title: 'Memory leak in worker process',
                priority: 'medium' as const,
                color: '#FFA500',
                description: 'Memory usage growing over time',
              },
            ],
          },
          {
            level: 'low' as const,
            color: '#00FF00',
            items: [
              {
                id: 'issue-005',
                title: 'Documentation update needed',
                priority: 'low' as const,
                color: '#00FF00',
                description: 'API documentation outdated',
              },
            ],
          },
        ],
      })),
    };

    // Prepare test dataset: 10 members, half submitted
    aggregatedReportData = {
      submittedMembersCount: 10,
      unsubmittedMembersCount: 0,
      reportDataList: [
        {
          memberId: 'member-001',
          memberName: 'Alice Johnson',
          reportContent:
            'Completed authentication feature. Found critical payment system down.',
          submittedAt: new Date('2024-01-15T08:00:00Z'),
          extractedIssues: ['payment_system_down', 'database_timeout'],
          extractedRisks: ['payment_gateway_failure', 'database_failure'],
          extractedAchievements: ['authentication_feature'],
        },
        {
          memberId: 'member-002',
          memberName: 'Bob Smith',
          reportContent:
            'Code review completed. Noticed API response time degradation.',
          submittedAt: new Date('2024-01-15T08:15:00Z'),
          extractedIssues: ['api_response_degradation'],
          extractedRisks: ['performance_issue'],
          extractedAchievements: ['code_review'],
        },
        {
          memberId: 'member-003',
          memberName: 'Carol Williams',
          reportContent: 'Testing deployment. Found memory leak in worker.',
          submittedAt: new Date('2024-01-15T08:30:00Z'),
          extractedIssues: ['memory_leak'],
          extractedRisks: ['process_crash_risk'],
          extractedAchievements: ['deployment_testing'],
        },
        {
          memberId: 'member-004',
          memberName: 'David Brown',
          reportContent: 'Documentation work. API docs need update.',
          submittedAt: new Date('2024-01-15T08:45:00Z'),
          extractedIssues: ['documentation_outdated'],
          extractedRisks: ['none'],
          extractedAchievements: ['documentation_partial'],
        },
        {
          memberId: 'member-005',
          memberName: 'Eve Davis',
          reportContent: 'Database optimization ongoing. No critical issues.',
          submittedAt: new Date('2024-01-15T09:00:00Z'),
          extractedIssues: [],
          extractedRisks: [],
          extractedAchievements: ['db_optimization'],
        },
        {
          memberId: 'member-006',
          memberName: 'Frank Miller',
          reportContent: 'Infrastructure monitoring. Database timeout detected.',
          submittedAt: new Date('2024-01-15T09:15:00Z'),
          extractedIssues: ['database_timeout'],
          extractedRisks: ['production_outage'],
          extractedAchievements: ['monitoring_setup'],
        },
        {
          memberId: 'member-007',
          memberName: 'Grace Lee',
          reportContent: 'Build pipeline improvement. All tests passing.',
          submittedAt: new Date('2024-01-15T09:30:00Z'),
          extractedIssues: [],
          extractedRisks: [],
          extractedAchievements: ['pipeline_improved'],
        },
        {
          memberId: 'member-008',
          memberName: 'Henry Wilson',
          reportContent:
            'Security audit in progress. No vulnerabilities found.',
          submittedAt: new Date('2024-01-15T09:45:00Z'),
          extractedIssues: [],
          extractedRisks: [],
          extractedAchievements: ['security_audit'],
        },
        {
          memberId: 'member-009',
          memberName: 'Iris Martinez',
          reportContent:
            'Client meeting completed. Performance concerns discussed.',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          extractedIssues: ['api_response_degradation'],
          extractedRisks: ['client_satisfaction'],
          extractedAchievements: ['client_meeting'],
        },
        {
          memberId: 'member-010',
          memberName: 'Jack Anderson',
          reportContent: 'Release preparation. Ready for deployment tomorrow.',
          submittedAt: new Date('2024-01-15T10:15:00Z'),
          extractedIssues: [],
          extractedRisks: [],
          extractedAchievements: ['release_ready'],
        },
      ],
    };
  });

  // SCEN-044
  test('should execute autonomous action 4 (prioritize and color-code extracted issues) according to contract', async () => {
    const executionTimestamp = new Date('2024-01-15T11:00:00Z');
    const teamId = 'team-alpha-001';
    const reportingDeadline = new Date('2024-01-15T10:30:00Z');
    const managerEmail = 'manager@company.com';

    const input = {
      executionTimestamp,
      teamId,
      reportingDeadline,
      managerEmail,
    };

    // Execute agent with injected mock AI client
    const result = await runTx2Imp1Agent(input, mockAiClient);

    // Verify Action 4 prompt builder was called with ACTION_04_PROMPT_VERSION
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();
    const action04Call = mockAiClient.buildAction04Prompt.mock.calls[0];
    expect(action04Call).toBeDefined();
    expect(action04Call[0]).toBeDefined(); // First argument is data
    expect(action04Call[1]).toBe('1.0.0'); // Second argument is ACTION_04_PROMPT_VERSION

    // Verify AI model was called for color-coding
    expect(mockAiClient.callAiModel).toHaveBeenCalled();

    // Verify output contains prioritized issues list
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);

    // Verify total extracted issues count
    const totalIssues = result.extractedIssuesCount;
    expect(totalIssues).toBe(5); // 5 unique issues: payment, database_timeout, api_response, memory_leak, documentation

    // Verify high priority issues (2 items with color #FF0000)
    const highPriorityIssues = result.prioritizedIssuesList.filter(
      (issue) => issue.priority === 'high'
    );
    expect(highPriorityIssues.length).toBe(2);
    expect(highPriorityIssues.every((issue) => issue.color === '#FF0000')).toBe(
      true
    );
    expect(
      highPriorityIssues.some((issue) => issue.title.includes('payment'))
    ).toBe(true);
    expect(
      highPriorityIssues.some((issue) => issue.title.includes('database'))
    ).toBe(true);

    // Verify medium priority issues (2 items with color #FFA500)
    const mediumPriorityIssues = result.prioritizedIssuesList.filter(
      (issue) => issue.priority === 'medium'
    );
    expect(mediumPriorityIssues.length).toBe(2);
    expect(
      mediumPriorityIssues.every((issue) => issue.color === '#FFA500')
    ).toBe(true);
    expect(
      mediumPriorityIssues.some((issue) => issue.title.includes('API'))
    ).toBe(true);
    expect(
      mediumPriorityIssues.some((issue) => issue.title.includes('memory'))
    ).toBe(true);

    // Verify low priority issues (1 item with color #00FF00)
    const lowPriorityIssues = result.prioritizedIssuesList.filter(
      (issue) => issue.priority === 'low'
    );
    expect(lowPriorityIssues.length).toBe(1);
    expect(lowPriorityIssues[0].color).toBe('#00FF00');
    expect(lowPriorityIssues[0].title).toContain('Documentation');

    // Verify no priority level conflicts
    const allPriorities = new Set(
      result.prioritizedIssuesList.map((issue) => issue.priority)
    );
    expect(allPriorities.size).toBe(3); // All three levels should be present

    // Verify each issue assigned to exactly one priority level
    const assignmentCounts = result.prioritizedIssuesList.reduce(
      (acc, issue) => {
        acc[issue.id] = (acc[issue.id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    Object.values(assignmentCounts).forEach((count) => {
      expect(count).toBe(1);
    });

    // Verify Tx2Imp1AiClient interface compliance
    expect(result.aggregationStatus).toMatch(/^(success|failure)$/);
    expect(result.emailSendStatus).toMatch(/^(sent|failed)$/);
    expect(typeof result.extractedIssuesCount).toBe('number');
    expect(result.extractedIssuesCount).toBeGreaterThan(0);

    // Verify all action prompts were built during orchestration
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalled();

    // Verify execution completed without rollback
    expect(result.aggregationStatus).toBe('success');
    expect(result.emailSendStatus).toBe('sent');

    // Verify result is properly structured Tx2Imp1AgentOutput
    expect(result).toHaveProperty('aggregationStatus');
    expect(result).toHaveProperty('extractedIssuesCount');
    expect(result).toHaveProperty('prioritizedIssuesList');
    expect(result).toHaveProperty('emailSendStatus');
  });
});