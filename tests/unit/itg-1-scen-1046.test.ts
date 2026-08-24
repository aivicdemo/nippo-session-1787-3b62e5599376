import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import { type DashboardDataFreshnessInput, type DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード - データ鮮度チェック機能', () => {
  // SCEN-1046
  test('表示時刻が無効な日時形式のとき、バリデーションエラーを返す', () => {
    const invalidDisplayTimestamps = [
      '2026-13-45T99:99:99Z',
      'invalid-date',
      '',
      '2024-01-01',
      'not-an-iso-string',
      '2024-13-01T12:00:00Z',
      '2024-01-32T12:00:00Z',
      null,
      undefined,
    ];

    for (const invalidTimestamp of invalidDisplayTimestamps) {
      const input: DashboardDataFreshnessInput = {
        userId: 'user-123',
        teamId: 'team-456',
        reportDate: '2024-01-15',
        maxStalenessSeconds: 300,
        displayTimestamp: invalidTimestamp as any,
      };

      expect(() => {
        ensureDashboardDataFreshness(input);
      }).toThrow(/日時形式|timestamp|format/i);
    }
  });
});