import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from '../../src/agents/tx-8-imp-1/prompts/action-01';

describe('TX-8 Imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3200
  test('朝会報告管理システムから課題データを検索・抽出する契約どおり実行される', async () => {
    const analysisStartDate = '2024-11-16T00:00:00Z';
    const analysisEndDate = '2024-12-16T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'manager-001';

    const extractedIssueRecords = [
      {
        issue_id: 'ISS-001',
        occurrence_date: '2024-12-01T09:15:00Z',
        issue_description: 'データベース接続がタイムアウトする問題が発生した。複数のエンドポイントで同時に接続が切れる現象が確認されており、本番環境での顧客影響が懸念される。',
        reporter_user_id: 'user-001',
        resolution_status: '未対応'
      },
      {
        issue_id: 'ISS-002',
        occurrence_date: '2024-12-02T14:30:00Z',
        issue_description: 'APIレスポンス時間が増加している。過去1週間で平均応答時間が500msから2秒に悪化し、システムパフォーマンスの低下が報告されている。',
        reporter_user_id: 'user-002',
        resolution_status: '対応中'
      },
      {
        issue_id: 'ISS-003',
        occurrence_date: '2024-12-03T11:45:00Z',
        issue_description: 'ユーザー認証機能に一時的な不具合が発生した。ログイン試行時に確率的に認証エラーが返される事象が複数ユーザーから報告されている。',
        reporter_user_id: 'user-003',
        resolution_status: '完了'
      },
      {
        issue_id: 'ISS-004',
        occurrence_date: '2024-12-05T10:20:00Z',
        issue_description: 'メモリリークが検出された。アプリケーション起動後、メモリ使用量が時間とともに増加し続け、約24時間後にメモリ枯渇エラーが発生する。',
        reporter_user_id: 'user-004',
        resolution_status: '未対応'
      },
      {
        issue_id: 'ISS-005',
        occurrence_date: '2024-12-07T16:00:00Z',
        issue_description: 'ファイルアップロード機能で大容量ファイルが処理できない。10MB以上のファイルをアップロードすると、トランザクションが中断される問題が確認されている。',
        reporter_user_id: 'user-005',
        resolution_status: '対応中'
      }
    ];

    const mockAiClient = {
      searchAndExtractIssueData: jest.fn().mockResolvedValue({
        extracted_records: extractedIssueRecords,
        record_count: 5,
        data_quality_score: 92,
        extraction_timestamp: '2024-12-16T12:00:00Z'
      }),
      analyzeTimeSeriesPattern: jest.fn(),
      identifyBottleneckPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
      formatReportOutput: jest.fn(),
      sendReportNotification: jest.fn()
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId
      },
      mockAiClient
    );

    expect(mockAiClient.searchAndExtractIssueData).toHaveBeenCalled();

    const callArgs = mockAiClient.searchAndExtractIssueData.mock.calls[0][0];
    expect(callArgs.analysisStartDate).toBe(analysisStartDate);
    expect(callArgs.analysisEndDate).toBe(analysisEndDate);
    expect(callArgs.teamIds).toEqual(teamIds);

    expect(result).toBeDefined();
    expect(result.extracted_records).toBeDefined();
    expect(Array.isArray(result.extracted_records)).toBe(true);
    expect(result.extracted_records.length).toBe(5);
    expect(result.extracted_records.length).toBeGreaterThanOrEqual(1);
    expect(result.extracted_records.length).toBeLessThanOrEqual(500);

    for (const record of result.extracted_records) {
      expect(record.issue_id).toBeDefined();
      expect(typeof record.issue_id).toBe('string');
      expect(record.issue_id.length).toBeGreaterThan(0);

      expect(record.occurrence_date).toBeDefined();
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(record.occurrence_date)).toBe(true);

      expect(record.issue_description).toBeDefined();
      expect(record.issue_description.length).toBeGreaterThanOrEqual(100);
      expect(record.issue_description.length).toBeLessThanOrEqual(500);

      expect(record.reporter_user_id).toBeDefined();
      expect(['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008', 'user-009', 'user-010']).toContain(record.reporter_user_id);

      expect(record.resolution_status).toBeDefined();
      expect(['未対応', '対応中', '完了']).toContain(record.resolution_status);
    }

    const issue_ids = result.extracted_records.map(r => r.issue_id);
    const unique_issue_ids = new Set(issue_ids);
    expect(unique_issue_ids.size).toBe(issue_ids.length);

    expect(result.data_quality_score).toBeDefined();
    expect(result.data_quality_score).toBeGreaterThanOrEqual(0);
    expect(result.data_quality_score).toBeLessThanOrEqual(100);
    expect(result.data_quality_score).toBe(92);

    expect(result.extraction_timestamp).toBeDefined();
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.extraction_timestamp)).toBe(true);

    expect(result.audit_event).toBeDefined();
    expect(result.audit_event.contract_id).toBe('tx_8_imp_1');
    expect(result.audit_event.action).toBe(1);
    expect(result.audit_event.extracted_record_count).toBe(5);
    expect(result.audit_event.data_quality_score).toBe(92);
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(result.audit_event.timestamp)).toBe(true);

    expect(buildAction01Prompt).toBeDefined();
    expect(typeof buildAction01Prompt).toBe('function');
    expect(ACTION_01_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_01_PROMPT_VERSION).toBe('string');
  });
});