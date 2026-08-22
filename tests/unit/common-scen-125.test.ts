import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-125: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test('should execute trigger confirmation on first day of month and record audit log', async () => {
    // Setup: Mock current date to 1st day of month
    const first_day_of_month = new Date('2024-02-01T09:00:00Z');
    const mock_ai_client = {
      executeAction01: jest.fn().mockResolvedValue({
        trigger_confirmed: true,
        confirmation_timestamp: '2024-02-01T09:00:00Z',
        message: 'Monthly report generation trigger confirmed',
      }),
      executeAction02: jest.fn(),
      executeAction03: jest.fn(),
      executeAction04: jest.fn(),
      executeAction05: jest.fn(),
      executeAction06: jest.fn(),
      executeAction07: jest.fn(),
      executeAction08: jest.fn(),
    };

    const mock_audit_log: Array<{
      event_type: string;
      timestamp: string;
      details: Record<string, unknown>;
    }> = [];

    // Execute: Call generateMonthlyAnalysisReport with mocked context
    const result = await generateMonthlyAnalysisReport(
      first_day_of_month,
      mock_ai_client,
      (event_type, details) => {
        mock_audit_log.push({
          event_type,
          timestamp: first_day_of_month.toISOString(),
          details,
        });
      }
    );

    // Verify: Action 1 (trigger confirmation) was called
    expect(mock_ai_client.executeAction01).toHaveBeenCalled();
    expect(mock_ai_client.executeAction01).toHaveBeenCalledTimes(1);

    // Verify: Prompt construction includes ACTION_01_PROMPT_VERSION reference
    const call_args = mock_ai_client.executeAction01.mock.calls[0];
    expect(call_args).toBeDefined();
    expect(call_args[0]).toHaveProperty('prompt_version');
    expect(call_args[0].prompt_version).toMatch(/^1\./);

    // Verify: Actions 2-8 were NOT executed (only Action 1)
    expect(mock_ai_client.executeAction02).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction03).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction04).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction05).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction06).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction07).not.toHaveBeenCalled();
    expect(mock_ai_client.executeAction08).not.toHaveBeenCalled();

    // Verify: AI client result was received successfully
    expect(result).toBeDefined();
    expect(result.trigger_confirmed).toBe(true);
    expect(result.confirmation_timestamp).toBe('2024-02-01T09:00:00Z');

    // Verify: Audit log recorded trigger_confirmed_on_first_day event
    expect(mock_audit_log.length).toBeGreaterThan(0);
    const trigger_event = mock_audit_log.find(
      (log) => log.event_type === 'trigger_confirmed_on_first_day'
    );
    expect(trigger_event).toBeDefined();
    expect(trigger_event?.details).toHaveProperty('trigger_confirmed', true);
    expect(trigger_event?.details).toHaveProperty('timestamp', '2024-02-01T09:00:00Z');
  });
});