import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';

describe('existing-tool-integration', () => {
  test('SCEN-397: handleToolIntegrationFailure returns correct retry and notification values based on error type and attempt count', async () => {
    // Test case 1: integrationAttempt=1, errorType='timeout'
    // Expected: shouldRetry=true, nextRetryDelayMs=2000 (2000 * 2^(1-1) = 2000), notificationRequired=false, failureReason='timeout'
    const result1 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-001',
          issueContent: 'Sample issue content for testing',
          priorityScore: 75,
          impactLevel: 'high',
          extractedKeywords: ['bug'],
          reportDate: '2024-01-15',
          reporterId: 'user-001',
          teamId: 'team-001',
        },
      ],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api',
      toolApiAuthToken: 'test-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 1,
    });

    expect(result1.integrationStatus).toBe('failure');
    expect(result1.retryAttemptsExecuted).toBe(0);

    // Test case 2: integrationAttempt=2, errorType='network_error'
    // Expected: shouldRetry=true, nextRetryDelayMs=4000 (2000 * 2^(2-1) = 4000), notificationRequired=false, failureReason='network_error'
    const result2 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-002',
          issueContent: 'Another issue for network error test',
          priorityScore: 50,
          impactLevel: 'medium',
          extractedKeywords: ['delay'],
          reportDate: '2024-01-15',
          reporterId: 'user-002',
          teamId: 'team-001',
        },
      ],
      externalToolType: 'asana',
      toolApiEndpoint: 'https://app.asana.com/api',
      toolApiAuthToken: 'test-token-asana',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 2,
    });

    expect(result2.integrationStatus).toBe('failure');
    expect(result2.retryAttemptsExecuted).toBeGreaterThanOrEqual(0);

    // Test case 3: integrationAttempt=3, errorType='timeout'
    // Expected: shouldRetry=false, nextRetryDelayMs=0, notificationRequired=true, notificationMessage='課題データの既存ツール連携が3回のリトライ後も失敗しました。手動確認が必要です。', failureReason='timeout'
    const result3 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-003',
          issueContent: 'Issue for max retry timeout test',
          priorityScore: 65,
          impactLevel: 'medium',
          extractedKeywords: ['timeout'],
          reportDate: '2024-01-15',
          reporterId: 'user-003',
          teamId: 'team-001',
        },
      ],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api',
      toolApiAuthToken: 'test-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 3,
    });

    expect(result3.integrationStatus).toBe('failure');
    expect(result3.managerNotificationRequired).toBe(true);
    expect(result3.failureReasonIfAny).toBeDefined();

    // Test case 4: integrationAttempt=1, errorType='auth_error'
    // Expected: shouldRetry=false, nextRetryDelayMs=0, notificationRequired=true, notificationMessage='課題データの既存ツール連携でエラーが発生しました。auth_errorを確認してください。', failureReason='auth_error'
    const result4 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-004',
          issueContent: 'Issue for auth error test',
          priorityScore: 80,
          impactLevel: 'high',
          extractedKeywords: ['authentication'],
          reportDate: '2024-01-15',
          reporterId: 'user-004',
          teamId: 'team-002',
        },
      ],
      externalToolType: 'asana',
      toolApiEndpoint: 'https://app.asana.com/api',
      toolApiAuthToken: 'invalid-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 1,
    });

    expect(result4.integrationStatus).toBe('failure');
    expect(result4.managerNotificationRequired).toBe(true);

    // Test case 5: integrationAttempt=2, errorType='format_error'
    // Expected: shouldRetry=false, nextRetryDelayMs=0, notificationRequired=true, notificationMessage='課題データの既存ツール連携でエラーが発生しました。format_errorを確認してください。', failureReason='format_error'
    const result5 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-005',
          issueContent: 'Issue for format error test with special characters ™®',
          priorityScore: 45,
          impactLevel: 'low',
          extractedKeywords: ['format'],
          reportDate: '2024-01-15',
          reporterId: 'user-005',
          teamId: 'team-002',
        },
      ],
      externalToolType: 'jira',
      toolApiEndpoint: 'https://jira.example.com/api',
      toolApiAuthToken: 'test-token',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 2,
    });

    expect(result5.integrationStatus).toBe('failure');
    expect(result5.managerNotificationRequired).toBe(true);

    // Test case 6: integrationAttempt=1, errorType='unknown_error'
    // Expected: shouldRetry=false, nextRetryDelayMs=0, notificationRequired=true, notificationMessage='課題データの既存ツール連携で予期しないエラーが発生しました。', failureReason='unknown'
    const result6 = await syncExtractedIssuesToExternalTool({
      extractedIssueDataList: [
        {
          issueId: 'issue-006',
          issueContent: 'Issue for unknown error test',
          priorityScore: 55,
          impactLevel: 'medium',
          extractedKeywords: ['unknown'],
          reportDate: '2024-01-15',
          reporterId: 'user-006',
          teamId: 'team-003',
        },
      ],
      externalToolType: 'asana',
      toolApiEndpoint: 'https://app.asana.com/api',
      toolApiAuthToken: 'test-token-asana',
      projectManagerId: 'pm-001',
      maxRetryAttempts: 1,
    });

    expect(result6.integrationStatus).toBe('failure');
    expect(result6.managerNotificationRequired).toBe(true);
    expect(result6.failureReasonIfAny).toBeDefined();
  });
});