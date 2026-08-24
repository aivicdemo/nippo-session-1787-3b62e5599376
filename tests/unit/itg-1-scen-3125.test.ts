import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: idempotent execution for aggregated report', () => {
  // SCEN-3125
  test('should prevent duplicate writes and notifications when same aggregated report is re-executed', async () => {
    // Setup: Initialize test database and register aggregated report with issues
    const aggregatedReportId = 'report_001';
    const executionId1 = 'exec_001_initial';
    const executionId2 = 'exec_001_retry';
    const managerUserId = 'user_manager_001';
    const teamId = 'team_001';
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const aggregatedReportIds = [aggregatedReportId];
    const priorityThresholdScore = 70;

    // Mock aggregated report content with issues
    const mockAggregatedReportContent = {
      reportDate: '2024-01-14',
      issues: [
        { keyword: 'システム遅延', frequency: 3, impactScore: 85 },
        { keyword: 'データ不整合', frequency: 2, impactScore: 75 }
      ]
    };

    // First execution: prepare AI client stub
    const mockAiClient1 = {
      executeAction01_ExtractKeywords: jest.fn().mockResolvedValue({
        extractedKeywords: [
          { keyword: 'システム遅延', frequency: 3 },
          { keyword: 'データ不整合', frequency: 2 }
        ],
        confidence: 0.92
      }),
      executeAction02_ClassifyIssues: jest.fn().mockResolvedValue({
        classifiedIssues: [
          { keyword: 'システム遅延', category: 'infrastructure', severity: 'high' },
          { keyword: 'データ不整合', category: 'data_quality', severity: 'medium' }
        ]
      }),
      executeAction03_AssignPriority: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          { keyword: 'システム遅延', score: 85, rank: 'high', priority: 1 },
          { keyword: 'データ不整合', score: 75, rank: 'high', priority: 2 }
        ]
      }),
      executeAction04_GenerateList: jest.fn().mockResolvedValue({
        listId: 'list_001',
        prioritizedIssuesList: [
          { keyword: 'システム遅延', score: 85, rank: 'high', priority: 1, highlightColor: 'red' },
          { keyword: 'データ不整合', score: 75, rank: 'high', priority: 2, highlightColor: 'red' }
        ],
        totalCount: 2,
        highlightedCount: 2
      }),
      executeAction05_SendEmail: jest.fn().mockResolvedValue({
        messageId: 'msg_001',
        deliveryStatus: 'success',
        recipientUserId: managerUserId,
        timestamp: '2024-01-14T09:00:00Z'
      })
    };

    const input1: Tx3Imp1AgentInput = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore
    };

    // First execution
    const output1 = await runTx3Imp1Agent(input1, mockAiClient1);

    // Verify first execution result
    expect(output1).toHaveProperty('executionId');
    expect(output1).toHaveProperty('extractedIssuesCount');
    expect(output1.extractedIssuesCount).toBe(2);
    expect(output1).toHaveProperty('prioritizedIssuesList');
    expect(output1.prioritizedIssuesList).toHaveLength(2);
    expect(output1).toHaveProperty('emailSendStatus');
    expect(output1.emailSendStatus).toBe('success');
    expect(output1).toHaveProperty('completionTimestamp');

    // Record first execution results
    const firstExecutionId = output1.executionId;
    const firstMessageId = 'msg_001';
    const firstTimestamp = '2024-01-14T09:00:00Z';

    // Verify first execution made API calls
    expect(mockAiClient1.executeAction01_ExtractKeywords).toHaveBeenCalledTimes(1);
    expect(mockAiClient1.executeAction02_ClassifyIssues).toHaveBeenCalledTimes(1);
    expect(mockAiClient1.executeAction03_AssignPriority).toHaveBeenCalledTimes(1);
    expect(mockAiClient1.executeAction04_GenerateList).toHaveBeenCalledTimes(1);
    expect(mockAiClient1.executeAction05_SendEmail).toHaveBeenCalledTimes(1);

    // Second execution: prepare new AI client stub (should not be called due to idempotency)
    const mockAiClient2 = {
      executeAction01_ExtractKeywords: jest.fn(),
      executeAction02_ClassifyIssues: jest.fn(),
      executeAction03_AssignPriority: jest.fn(),
      executeAction04_GenerateList: jest.fn(),
      executeAction05_SendEmail: jest.fn()
    };

    const input2: Tx3Imp1AgentInput = {
      aggregatedReportIds, // Same report ID
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore
    };

    // Second execution (retry with same input)
    const output2 = await runTx3Imp1Agent(input2, mockAiClient2);

    // Verify second execution detects idempotency
    expect(output2).toHaveProperty('executionId');
    
    // Verify no API calls were made in second execution (idempotent skip)
    expect(mockAiClient2.executeAction01_ExtractKeywords).toHaveBeenCalledTimes(0);
    expect(mockAiClient2.executeAction02_ClassifyIssues).toHaveBeenCalledTimes(0);
    expect(mockAiClient2.executeAction03_AssignPriority).toHaveBeenCalledTimes(0);
    expect(mockAiClient2.executeAction04_GenerateList).toHaveBeenCalledTimes(0);
    expect(mockAiClient2.executeAction05_SendEmail).toHaveBeenCalledTimes(0);

    // Verify idempotent skip behavior: email status should be 'skipped' or similar
    // indicating that no new notification was sent
    expect(output2.emailSendStatus).toMatch(/skip|duplicate|idempotent/i);

    // Verify extracted issues count remains same (from cache/first result)
    expect(output2.extractedIssuesCount).toBe(2);

    // Verify the same prioritized issues are returned from cache
    expect(output2.prioritizedIssuesList).toHaveLength(2);
    expect(output2.prioritizedIssuesList[0]).toEqual(
      expect.objectContaining({
        keyword: 'システム遅延',
        priority: 1
      })
    );
    expect(output2.prioritizedIssuesList[1]).toEqual(
      expect.objectContaining({
        keyword: 'データ不整合',
        priority: 2
      })
    );

    // Verify completionTimestamp is recorded
    expect(output2.completionTimestamp).toBeDefined();
  });
});