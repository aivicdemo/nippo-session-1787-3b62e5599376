import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - ツール連携検証', () => {
  // SCEN-1414
  test('課題データアーカイブ機能 - 現在日時が連携完了タイムスタンプより前の場合エラーが返される', () => {
    const integration_session_id = 'session-20260820-001';
    const tool_type = 'jira' as const;
    const extracted_issue_count = 5;
    const integration_completed_timestamp = new Date('2026-08-20T10:00:00.000Z');
    
    const current_time_mock = new Date('2026-08-20T09:59:59.999Z');
    
    const input: Parameters<typeof validateToolIntegrationSuccess>[0] = {
      integrationSessionId: integration_session_id,
      toolType: tool_type,
      extractedIssueCount: extracted_issue_count,
      integrationTimestamp: integration_completed_timestamp,
      currentTime: current_time_mock,
    };

    const result = validateToolIntegrationSuccess(input);

    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe('mismatch');
    expect(result.nextAction).toBe('retry_integration');
    expect(result.mismatchDetails).toBeDefined();
    if (result.mismatchDetails && result.mismatchDetails.length > 0) {
      expect(result.mismatchDetails[0].mismatchType).toBe('status');
    }
  });
});