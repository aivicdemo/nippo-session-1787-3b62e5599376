import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2122: [error] 古いデータ自動削除機能 - 監査対象フラグが null のとき、エラーが発生して処理が中断される
  test('should throw error when audit flag is null for old records and abort deletion process', () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockOldRecord = {
      reportId: 'report-old-001',
      reportDate: '2023-10-15',
      createdAt: new Date('2023-10-15T10:00:00Z'),
      auditFlag: null,
      content: 'Old report with null audit flag',
    };

    const mockDashboardDataFreshnessOutput: DashboardDataFreshnessOutput = {
      isDataFresh: false,
      lastUpdateTimestamp: '2023-10-15T10:00:00Z',
      displayTimestamp: '2024-01-15T11:00:00Z',
      stalenessSeconds: 7776000,
    };

    expect(() => {
      ensureDashboardDataFreshness(input, [mockOldRecord]);
    }).toThrow(/audit/i);
  });
});