import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { type Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';
import { NotificationServiceAdapter } from '../../src/adapters/NotificationServiceAdapter';

jest.mock('../../src/adapters/NotificationServiceAdapter');

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3205
  test('データ品質が基準以下の場合にエスカレーションして人に引き継ぐ', async () => {
    const mockNotificationAdapter = NotificationServiceAdapter as jest.MockedClass<
      typeof NotificationServiceAdapter
    >;
    const mockSendReminder = jest.fn().mockResolvedValue({
      status: 'success',
      sentAt: '2024-01-15T09:00:00Z'
    });
    mockNotificationAdapter.prototype.sendReminderNotification = mockSendReminder;

    const fakeAiClient: Tx8Imp1AiClient = {
      executeAction01_ExtractIssueData: jest.fn().mockResolvedValue({
        action: 'action_01',
        status: 'completed',
        extracted_issues: [
          {
            issue_id: 'ISS-001',
            keyword: 'ネットワーク接続エラー',
            occurrence_count: 5,
            severity: 'high'
          },
          {
            issue_id: 'ISS-002',
            keyword: 'ビルドスクリプト失敗',
            occurrence_count: 3,
            severity: 'medium'
          }
        ],
        data_quality_score: 60,
        quality_assessment_details: {
          missing_fields: ['resolution_date'],
          anomaly_count: 2,
          duplicate_entries: 1
        }
      }),
      executeAction02_AnalyzeRecurringPatterns: jest.fn().mockResolvedValue({
        action: 'action_02',
        status: 'escalation_triggered',
        escalation_reason: 'data_quality_below_threshold',
        data_quality_threshold: 70,
        current_quality_score: 60,
        quality_issues: [
          {
            issue_type: 'missing_fields',
            field_names: ['resolution_date'],
            impact_count: 2
          },
          {
            issue_type: 'anomalies',
            description: 'Unexpected date format in 2 records',
            count: 2
          },
          {
            issue_type: 'duplicates',
            description: '1 duplicate entry detected',
            count: 1
          }
        ]
      }),
      executeAction03_IdentifyBottlenecks: jest.fn(),
      executeAction04_GenerateVisualizationReport: jest.fn(),
      executeAction05_PresentReportToManager: jest.fn()
    };

    const tx8Input = {
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-14',
      teamIds: ['TEAM-001', 'TEAM-002'],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: 'MGR-001'
    };

    const result = await runTx8Imp1Agent(tx8Input, fakeAiClient);

    expect(result).toBeDefined();
    expect(result.escalation_status).toBe('data_quality_below_threshold');
    expect(result.human_review_required).toBe(true);
    expect(result.pending_actions).toEqual(['action_03', 'action_04', 'action_05']);

    expect(fakeAiClient.executeAction01_ExtractIssueData).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction01_ExtractIssueData).toHaveBeenCalledWith({
      analysisStartDate: '2024-01-01',
      analysisEndDate: '2024-01-14',
      teamIds: ['TEAM-001', 'TEAM-002']
    });

    expect(fakeAiClient.executeAction02_AnalyzeRecurringPatterns).toHaveBeenCalledTimes(1);
    expect(fakeAiClient.executeAction02_AnalyzeRecurringPatterns).toHaveBeenCalledWith({
      extracted_issues: [
        {
          issue_id: 'ISS-001',
          keyword: 'ネットワーク接続エラー',
          occurrence_count: 5,
          severity: 'high'
        },
        {
          issue_id: 'ISS-002',
          keyword: 'ビルドスクリプト失敗',
          occurrence_count: 3,
          severity: 'medium'
        }
      ],
      minimumRecurrenceThreshold: 3,
      data_quality_score: 60
    });

    expect(fakeAiClient.executeAction03_IdentifyBottlenecks).not.toHaveBeenCalled();
    expect(fakeAiClient.executeAction04_GenerateVisualizationReport).not.toHaveBeenCalled();
    expect(fakeAiClient.executeAction05_PresentReportToManager).not.toHaveBeenCalled();

    expect(mockSendReminder).toHaveBeenCalledTimes(1);
    expect(mockSendReminder).toHaveBeenCalledWith({
      userId: 'MGR-001',
      message: expect.stringContaining('データ品質が基準以下'),
      context: {
        escalation_type: 'data_quality_below_threshold',
        current_score: 60,
        threshold: 70,
        quality_issues: expect.any(Array)
      }
    });

    const notificationResult = await mockSendReminder.mock.results[0].value;
    expect(notificationResult.status).toBe('success');
  });
});