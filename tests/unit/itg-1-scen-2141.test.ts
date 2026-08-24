import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2141
  test('[edge] should correctly distinguish data at retention boundary with identical timestamps', async () => {
    const nowTime = new Date('2026-09-18T10:00:00Z');
    const retentionDays = 30;
    const boundaryTime = new Date(nowTime.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const boundaryTimeStr = boundaryTime.toISOString();

    const timeBeforeBoundary = new Date(boundaryTime.getTime() - 1000).toISOString();
    const timeAtBoundary = boundaryTimeStr;
    const timeAfterBoundary = new Date(boundaryTime.getTime() + 1000).toISOString();

    const testDataset = [
      { id: 'del-001', lastUpdateTimestamp: timeBeforeBoundary, category: 'outside' },
      { id: 'del-002', lastUpdateTimestamp: timeBeforeBoundary, category: 'outside' },
      { id: 'del-003', lastUpdateTimestamp: timeBeforeBoundary, category: 'outside' },
      { id: 'del-004', lastUpdateTimestamp: timeBeforeBoundary, category: 'outside' },
      { id: 'del-005', lastUpdateTimestamp: timeBeforeBoundary, category: 'outside' },
      { id: 'boundary-001', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-002', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-003', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-004', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-005', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-006', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-007', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-008', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-009', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'boundary-010', lastUpdateTimestamp: timeAtBoundary, category: 'boundary' },
      { id: 'keep-001', lastUpdateTimestamp: timeAfterBoundary, category: 'inside' },
      { id: 'keep-002', lastUpdateTimestamp: timeAfterBoundary, category: 'inside' },
      { id: 'keep-003', lastUpdateTimestamp: timeAfterBoundary, category: 'inside' },
      { id: 'keep-004', lastUpdateTimestamp: timeAfterBoundary, category: 'inside' },
      { id: 'keep-005', lastUpdateTimestamp: timeAfterBoundary, category: 'inside' },
    ];

    const input = {
      userId: 'user-manager-001',
      teamId: 'team-001',
      reportDate: '2026-09-18',
      maxStalenessSeconds: 300,
    };

    const result = await ensureDashboardDataFreshness(input, testDataset, nowTime, retentionDays);

    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBe(timeAfterBoundary);
    expect(result.displayTimestamp).toBe(nowTime.toISOString());
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);

    const deletedIds = testDataset
      .filter(record => record.category === 'outside')
      .map(record => record.id);
    const retainedIds = testDataset
      .filter(record => record.category === 'boundary' || record.category === 'inside')
      .map(record => record.id);

    expect(deletedIds).toEqual([
      'del-001',
      'del-002',
      'del-003',
      'del-004',
      'del-005',
    ]);

    expect(retainedIds).toEqual([
      'boundary-001',
      'boundary-002',
      'boundary-003',
      'boundary-004',
      'boundary-005',
      'boundary-006',
      'boundary-007',
      'boundary-008',
      'boundary-009',
      'boundary-010',
      'keep-001',
      'keep-002',
      'keep-003',
      'keep-004',
      'keep-005',
    ]);

    const retainedRecordCount = retainedIds.length;
    const deletedRecordCount = deletedIds.length;

    expect(retainedRecordCount).toBe(15);
    expect(deletedRecordCount).toBe(5);
  });
});