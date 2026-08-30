import { runTx2Imp1Agent, Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AgentInput, Tx2Imp1AgentOutput } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('Tx2Imp1Agent - 日報収集から課題抽出・配信までの自律実行', () => {
  test('SCEN-005: 日報受信から課題抽出・優先度付け・確認メール配信まで自動で完結する', async () => {
    const executionDate = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    
    const mockInput: Tx2Imp1AgentInput = {
      executionDate,
      teamIds,
      managerNotificationEnabled: true,
    };

    const mockAiClient = {
      getSubmissionStatus: jest.fn().mockResolvedValue({
        teamId: 'team-001',
        submittedCount: 5,
        totalMembers: 5,
        submittedAt: new Date('2024-01-15T08:30:00Z'),
        isOnTime: true,
      }),
      
      extractAndRankIssuesFromReports: jest.fn().mockResolvedValue([
        {
          keyword: 'ビルド失敗',
          frequency: 3,
          affectedMemberCount: 2,
          priorityScore: 85,
          priorityLevel: 'high',
          displayColor: '#FF0000',
        },
        {
          keyword: 'テスト環境不安定',
          frequency: 2,
          affectedMemberCount: 2,
          priorityScore: 72,
          priorityLevel: 'high',
          displayColor: '#FF0000',
        },
        {
          keyword: 'リソース不足',
          frequency: 1,
          affectedMemberCount: 1,
          priorityScore: 45,
          priorityLevel: 'medium',
          displayColor: '#FFFF00',
        },
      ]),
      
      generateAndSendManagerConfirmationEmail: jest.fn().mockResolvedValue({
        emailSent: true,
        emailId: 'email-20240115-001',
        sentAt: new Date('2024-01-15T09:15:00Z'),
      }),
    };

    const result = await runTx2Imp1Agent(mockInput, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('success');
    expect(result.extractedIssuesCount).toBeGreaterThanOrEqual(3);
    expect(result.extractedIssuesCount).toBe(3);
    expect(result.prioritizedIssuesList).toHaveLength(3);
    expect(result.prioritizedIssuesList[0]).toEqual({
      keyword: 'ビルド失敗',
      frequency: 3,
      affectedMemberCount: 2,
      priorityScore: 85,
      priorityLevel: 'high',
      displayColor: '#FF0000',
    });
    expect(result.prioritizedIssuesList[1]).toEqual({
      keyword: 'テスト環境不安定',
      frequency: 2,
      affectedMemberCount: 2,
      priorityScore: 72,
      priorityLevel: 'high',
      displayColor: '#FF0000',
    });
    expect(result.prioritizedIssuesList[2]).toEqual({
      keyword: 'リソース不足',
      frequency: 1,
      affectedMemberCount: 1,
      priorityScore: 45,
      priorityLevel: 'medium',
      displayColor: '#FFFF00',
    });
    expect(result.managerEmailSent).toBe(true);
    expect(result.processingTimestampUtc).toBeInstanceOf(Date);
    expect(result.processingTimestampUtc.getTime()).toBeGreaterThan(executionDate.getTime());
  });
});