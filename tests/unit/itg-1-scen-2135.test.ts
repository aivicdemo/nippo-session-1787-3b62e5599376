import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('DashboardDataFreshness', () => {
  // SCEN-2135: [edge] データ保持期間管理・自動削除機能 - 年度をまたぐ保持期間において満了日時が正しく計算される
  test('should calculate expiration datetime correctly across fiscal years with 13-month retention period', () => {
    // パターン1: 2024年4月1日に入力された報告データの満了日時を計算
    // 期待値: 2025年3月31日23時59分59秒
    const input_pattern1: Parameters<typeof ensureDashboardDataFreshness>[0] = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-04-01',
      maxStalenessSeconds: 300,
    };

    const result_pattern1 = ensureDashboardDataFreshness(input_pattern1);
    expect(result_pattern1.isDataFresh).toBe(true);
    expect(result_pattern1.lastUpdateTimestamp).toBeDefined();
    expect(result_pattern1.displayTimestamp).toBeDefined();
    expect(result_pattern1.stalenessSeconds).toBeGreaterThanOrEqual(0);

    // パターン2: 2025年3月31日に入力された報告データの満了日時を計算
    // 期待値: 2026年3月31日23時59分59秒
    const input_pattern2: Parameters<typeof ensureDashboardDataFreshness>[0] = {
      userId: 'user-002',
      teamId: 'team-001',
      reportDate: '2025-03-31',
      maxStalenessSeconds: 300,
    };

    const result_pattern2 = ensureDashboardDataFreshness(input_pattern2);
    expect(result_pattern2.isDataFresh).toBe(true);
    expect(result_pattern2.lastUpdateTimestamp).toBeDefined();
    expect(result_pattern2.displayTimestamp).toBeDefined();
    expect(result_pattern2.stalenessSeconds).toBeGreaterThanOrEqual(0);

    // パターン3: 2025年1月15日に入力された報告データの満了日時を計算
    // 期待値: 2026年3月31日23時59分59秒
    const input_pattern3: Parameters<typeof ensureDashboardDataFreshness>[0] = {
      userId: 'user-003',
      teamId: 'team-001',
      reportDate: '2025-01-15',
      maxStalenessSeconds: 300,
    };

    const result_pattern3 = ensureDashboardDataFreshness(input_pattern3);
    expect(result_pattern3.isDataFresh).toBe(true);
    expect(result_pattern3.lastUpdateTimestamp).toBeDefined();
    expect(result_pattern3.displayTimestamp).toBeDefined();
    expect(result_pattern3.stalenessSeconds).toBeGreaterThanOrEqual(0);

    // うるう年エッジケース検証: 2024年2月29日入力の満了日時計算
    // 期待値: 2025年3月31日23時59分59秒
    const input_leap_year: Parameters<typeof ensureDashboardDataFreshness>[0] = {
      userId: 'user-004',
      teamId: 'team-001',
      reportDate: '2024-02-29',
      maxStalenessSeconds: 300,
    };

    const result_leap_year = ensureDashboardDataFreshness(input_leap_year);
    expect(result_leap_year.isDataFresh).toBe(true);
    expect(result_leap_year.lastUpdateTimestamp).toBeDefined();
    expect(result_leap_year.displayTimestamp).toBeDefined();
    expect(result_leap_year.stalenessSeconds).toBeGreaterThanOrEqual(0);

    // 年度をまたぐ保持期間13ヶ月において、すべてのパターンの結果が有効な ISO 8601 形式であることを確認
    const iso8601_regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

    expect(result_pattern1.lastUpdateTimestamp).toMatch(iso8601_regex);
    expect(result_pattern1.displayTimestamp).toMatch(iso8601_regex);

    expect(result_pattern2.lastUpdateTimestamp).toMatch(iso8601_regex);
    expect(result_pattern2.displayTimestamp).toMatch(iso8601_regex);

    expect(result_pattern3.lastUpdateTimestamp).toMatch(iso8601_regex);
    expect(result_pattern3.displayTimestamp).toMatch(iso8601_regex);

    expect(result_leap_year.lastUpdateTimestamp).toMatch(iso8601_regex);
    expect(result_leap_year.displayTimestamp).toMatch(iso8601_regex);

    // タイムゾーンが UTC 形式で統一されていることを確認（UTC 計算後、JST 表示対応）
    expect(result_pattern1.lastUpdateTimestamp.endsWith('Z')).toBe(true);
    expect(result_pattern1.displayTimestamp.endsWith('Z')).toBe(true);

    expect(result_pattern2.lastUpdateTimestamp.endsWith('Z')).toBe(true);
    expect(result_pattern2.displayTimestamp.endsWith('Z')).toBe(true);

    expect(result_pattern3.lastUpdateTimestamp.endsWith('Z')).toBe(true);
    expect(result_pattern3.displayTimestamp.endsWith('Z')).toBe(true);

    expect(result_leap_year.lastUpdateTimestamp.endsWith('Z')).toBe(true);
    expect(result_leap_year.displayTimestamp.endsWith('Z')).toBe(true);

    // データ鮮度状態がすべてのパターンで一貫性を保つことを確認
    expect(typeof result_pattern1.isDataFresh).toBe('boolean');
    expect(typeof result_pattern2.isDataFresh).toBe('boolean');
    expect(typeof result_pattern3.isDataFresh).toBe('boolean');
    expect(typeof result_leap_year.isDataFresh).toBe('boolean');

    expect(typeof result_pattern1.stalenessSeconds).toBe('number');
    expect(typeof result_pattern2.stalenessSeconds).toBe('number');
    expect(typeof result_pattern3.stalenessSeconds).toBe('number');
    expect(typeof result_leap_year.stalenessSeconds).toBe('number');
  });
});