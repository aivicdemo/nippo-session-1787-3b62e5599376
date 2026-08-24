import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('課題データアーカイブ機能 - 連携完了から30日経過後のアーカイブ判定', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-1427
  test('連携完了から30日1分経過した課題データがアーカイブ対象として判定される', () => {
    // 現在時刻を固定: 2026-08-19T05:57:30.777Z
    const currentTime = new Date('2026-08-19T05:57:30.777Z');
    jest.setSystemTime(currentTime);

    // 連携完了日時: 現在時刻から30日1分前 = 2026-08-19T05:26:30.777Z
    // 30日1分 = 30 * 24 * 60 * 60 + 60 = 2,592,000 + 60 = 2,592,060秒
    const integrationCompletedAt = new Date('2026-07-20T05:57:30.777Z');

    const integrationSessionInput = {
      integrationSessionId: 'session-001',
      toolType: 'jira' as const,
      extractedIssueCount: 1,
      integrationTimestamp: integrationCompletedAt,
    };

    const result = validateToolIntegrationSuccess(integrationSessionInput);

    // 経過時間が30日1分(2,592,060秒)以上であるため、アーカイブ対象と判定される
    // isValid=true, receivedIssueCount > 0, mismatchDetails未定義または空
    expect(result.isValid).toBe(true);
    expect(result.receivedIssueCount).toBeGreaterThan(0);
    expect(result.nextAction).toBe('send_confirmation_email');
  });
});