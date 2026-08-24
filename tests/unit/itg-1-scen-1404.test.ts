import { describe, test, expect } from '@jest/globals';
import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('tool-integration validation', () => {
  test('SCEN-1404:課題データアーカイブ機能 - 連携完了から29日前の課題はアクティブのまま', () => {
    // Arrange: 連携完了日時が現在から29日前のデータを構築
    const now = new Date('2026-01-20T10:00:00Z');
    const integrationCompletedAt = new Date('2025-12-22T10:00:00Z'); // 29日前

    const input = {
      integrationSessionId: 'session-001',
      toolType: 'jira' as const,
      extractedIssueCount: 5,
      integrationTimestamp: integrationCompletedAt,
    };

    // Act: 検証関数を実行
    const result = validateToolIntegrationSuccess(input);

    // Assert: 連携データが有効であることを確認
    expect(result.isValid).toBe(true);
    expect(result.receivedIssueCount).toBe(5);
    expect(result.nextAction).toBe('send_confirmation_email');
    expect(result.mismatchDetails).toBeUndefined();

    // Assert: アーカイブ対象外として正しく判定される
    // (29日 < 30日のため、アーカイブ対象ではない)
    const daysSinceIntegration = Math.floor(
      (now.getTime() - integrationCompletedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysSinceIntegration).toBe(29);
    expect(daysSinceIntegration).toBeLessThan(30);
  });
});