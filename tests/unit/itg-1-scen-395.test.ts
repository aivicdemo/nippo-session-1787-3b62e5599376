import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';
import type {
  ToolIntegrationRequest,
  ToolIntegrationResult,
  ExtractedIssueData,
  DataConsistencyCheckResult,
} from '../../src/logic/existing-tool-integration';

describe('existing-tool-integration', () => {
  // SCEN-395: [edge] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する。 - 連携失敗件数が全体の50%以上のときという明示された境界条件で連携失敗が多数発生しています。既存ツールの設定とAPI認証を確認してください
  test('should record partial_failure status with 50% failure rate and notify manager when syncing to external tool', () => {
    // Prepare extracted issue data (10 issues total)
    const extractedIssuesData: ExtractedIssueData[] = [
      {
        issueId: 'issue-001',
        issueContent: 'Database connection timeout',
        priorityScore: 75,
        impactLevel: 'high',
        extractedKeywords: ['database', 'timeout'],
        reportDate: '2024-01-15',
        reporterId: 'eng-001',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-002',
        issueContent: 'Memory leak in service',
        priorityScore: 80,
        impactLevel: 'high',
        extractedKeywords: ['memory', 'leak'],
        reportDate: '2024-01-15',
        reporterId: 'eng-002',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-003',
        issueContent: 'API response slow',
        priorityScore: 60,
        impactLevel: 'medium',
        extractedKeywords: ['api', 'performance'],
        reportDate: '2024-01-15',
        reporterId: 'eng-003',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-004',
        issueContent: 'Build failure on CI/CD',
        priorityScore: 85,
        impactLevel: 'high',
        extractedKeywords: ['build', 'ci-cd'],
        reportDate: '2024-01-15',
        reporterId: 'eng-004',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-005',
        issueContent: 'Test coverage insufficient',
        priorityScore: 45,
        impactLevel: 'medium',
        extractedKeywords: ['test', 'coverage'],
        reportDate: '2024-01-15',
        reporterId: 'eng-005',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-006',
        issueContent: 'Code review queue backlog',
        priorityScore: 50,
        impactLevel: 'medium',
        extractedKeywords: ['code-review', 'backlog'],
        reportDate: '2024-01-15',
        reporterId: 'eng-006',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-007',
        issueContent: 'Documentation outdated',
        priorityScore: 35,
        impactLevel: 'low',
        extractedKeywords: ['documentation'],
        reportDate: '2024-01-15',
        reporterId: 'eng-007',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-008',
        issueContent: 'Dependency version conflict',
        priorityScore: 70,
        impactLevel: 'high',
        extractedKeywords: ['dependency', 'conflict'],
        reportDate: '2024-01-15',
        reporterId: 'eng-008',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-009',
        issueContent: 'Security vulnerability found',
        priorityScore: 90,
        impactLevel: 'high',
        extractedKeywords: ['security', 'vulnerability'],
        reportDate: '2024-01-15',
        reporterId: 'eng-009',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-010',
        issueContent: 'Performance optimization needed',
        priorityScore: 55,
        impactLevel: 'medium',
        extractedKeywords: ['performance', 'optimization'],
        reportDate: '2024-01-15',
        reporterId: 'eng-010',
        teamId: 'team-001',
      },
    ];

    // Construct tool integration request
    const toolIntegrationRequest: ToolIntegrationRequest = {
      extractedIssueDataList: extractedIssuesData,
      externalToolType: 'jira',
      toolApiEndpoint: 'https://api.jira.example.com',
      toolApiAuthToken: 'valid-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 3,
    };

    // Mock the internal validation and processing functions
    // This simulates the actual system behavior
    // 50% failure rate: issues 1-5 fail, issues 6-10 succeed
    const mockToolApiResponses = {
      'issue-001': { success: false, httpStatusCode: 429, errorType: 'rate_limit' },
      'issue-002': { success: false, httpStatusCode: 429, errorType: 'rate_limit' },
      'issue-003': { success: false, httpStatusCode: 429, errorType: 'rate_limit' },
      'issue-004': { success: false, httpStatusCode: 429, errorType: 'rate_limit' },
      'issue-005': { success: false, httpStatusCode: 429, errorType: 'rate_limit' },
      'issue-006': { success: true, httpStatusCode: 201, toolIssueId: 'JIRA-1001' },
      'issue-007': { success: true, httpStatusCode: 201, toolIssueId: 'JIRA-1002' },
      'issue-008': { success: true, httpStatusCode: 201, toolIssueId: 'JIRA-1003' },
      'issue-009': { success: true, httpStatusCode: 201, toolIssueId: 'JIRA-1004' },
      'issue-010': { success: true, httpStatusCode: 201, toolIssueId: 'JIRA-1005' },
    };

    // Execute the main integration function
    const result: ToolIntegrationResult = syncExtractedIssuesToExternalTool(
      toolIntegrationRequest,
      mockToolApiResponses
    );

    // Validate integration status is partial_failure at 50% boundary
    expect(result.integrationStatus).toBe('partial_failure');

    // Validate synced issue count = 5 (issues 6-10)
    expect(result.syncedIssueCount).toBe(5);

    // Validate failed issue count = 5 (issues 1-5)
    expect(result.failedIssueCount).toBe(5);

    // Validate failure rate exactly 50%: failedIssueCount / (syncedIssueCount + failedIssueCount) = 5 / (5 + 5) = 0.5
    const failureRate = result.failedIssueCount / (result.syncedIssueCount + result.failedIssueCount);
    expect(failureRate).toBe(0.5);

    // Validate failure reason message is recorded (warning at 50% boundary)
    expect(result.failureReasonIfAny).toMatch(
      /既存ツールの設定とAPI認証を確認してください/
    );

    // Validate manager notification required flag is true at >= 50% failure threshold
    expect(result.managerNotificationRequired).toBe(true);

    // Validate data consistency validation result is recorded
    expect(result.dataConsistencyValidationResult).toBeDefined();
    expect(result.dataConsistencyValidationResult.isConsistent).toBeDefined();
    expect(result.dataConsistencyValidationResult.expectedIssueCount).toBe(10);
    expect(result.dataConsistencyValidationResult.actualIssueCountInTool).toBe(5);

    // Validate retry attempts executed is recorded (should reflect API retry logic)
    expect(result.retryAttemptsExecuted).toBeGreaterThanOrEqual(0);
    expect(result.retryAttemptsExecuted).toBeLessThanOrEqual(3);

    // Validate integration completed timestamp in ISO 8601 format
    expect(result.integrationCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});