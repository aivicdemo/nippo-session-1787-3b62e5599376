import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-073: [normal] ダッシュボード分析から課題指示までの自動実行 AIエージェント
  // リアルタイム進捗データを複数システムから自動集約する
  it('should aggregate real-time progress data from multiple systems and pass to next action', async () => {
    // Arrange: fake AI client setup
    const fakeAggregatedData = {
      aggregation_timestamp: '2024-01-15T07:45:00Z',
      source_systems: [
        {
          system_name: '営業管理システム',
          system_id: 'sales_mgmt_001',
          record_count: 12,
          last_updated: '2024-01-15T07:44:30Z',
          records: [
            {
              submitter_id: 'user_001',
              submission_deadline: '08:00:00',
              is_submitted: false,
              submission_time: null,
            },
            {
              submitter_id: 'user_002',
              submission_deadline: '08:00:00',
              is_submitted: true,
              submission_time: '2024-01-15T07:35:00Z',
            },
          ],
        },
        {
          system_name: 'プロジェクト管理ツール',
          system_id: 'project_mgmt_002',
          record_count: 15,
          last_updated: '2024-01-15T07:43:15Z',
          records: [
            {
              submitter_id: 'user_001',
              yesterday_progress_rate: 75,
              today_planned_tasks: 5,
              issues_list: [
                { issue_id: 'ISSUE_001', title: 'DB接続タイムアウト', severity: 'high' },
                { issue_id: 'ISSUE_002', title: 'UIレンダリング遅延', severity: 'medium' },
              ],
            },
            {
              submitter_id: 'user_003',
              yesterday_progress_rate: 60,
              today_planned_tasks: 3,
              issues_list: [
                { issue_id: 'ISSUE_003', title: 'テスト環境構築中', severity: 'low' },
              ],
            },
          ],
        },
        {
          system_name: 'タイムカード管理システム',
          system_id: 'timecard_003',
          record_count: 20,
          last_updated: '2024-01-15T07:42:00Z',
          records: [
            {
              submitter_id: 'user_001',
              clock_in_time: '2024-01-15T08:30:00Z',
              planned_end_time: '2024-01-15T17:30:00Z',
            },
            {
              submitter_id: 'user_004',
              clock_in_time: '2024-01-15T08:15:00Z',
              planned_end_time: '2024-01-15T17:15:00Z',
            },
          ],
        },
      ],
      total_records_aggregated: 47,
      aggregation_status: 'success',
      data_integrity_check: {
        passed: true,
        schema_validation: 'valid',
        duplicate_records: 0,
      },
    };

    const mockTx4Imp1AiClient = {
      aggregateRealtimeProgressDataFromMultipleSystems: jest
        .fn()
        .mockResolvedValue(fakeAggregatedData),
    };

    const auditLogSpy = jest.fn();
    const actionExecutionSpy = jest.fn();

    // Mock orchestrator internal logging
    const mockLoggerConfig = {
      onAuditEventLogged: auditLogSpy,
      onActionExecuted: actionExecutionSpy,
    };

    // Act: Call the function with fake client
    const result = await detectAndNotifyUnsubmitted(
      {
        submitter_ids: ['user_001', 'user_002', 'user_003', 'user_004'],
        submission_deadline: '08:00:00',
        execution_timestamp: '2024-01-15T07:45:00Z',
      },
      mockTx4Imp1AiClient,
      mockLoggerConfig
    );

    // Assert: Verify aggregation was called correctly
    expect(mockTx4Imp1AiClient.aggregateRealtimeProgressDataFromMultipleSystems).toHaveBeenCalled();

    // Verify returned data structure
    expect(result).toEqual(
      expect.objectContaining({
        aggregation_timestamp: '2024-01-15T07:45:00Z',
        source_systems: expect.arrayContaining([
          expect.objectContaining({
            system_name: '営業管理システム',
            system_id: 'sales_mgmt_001',
            record_count: expect.any(Number),
          }),
          expect.objectContaining({
            system_name: 'プロジェクト管理ツール',
            system_id: 'project_mgmt_002',
            record_count: expect.any(Number),
          }),
          expect.objectContaining({
            system_name: 'タイムカード管理システム',
            system_id: 'timecard_003',
            record_count: expect.any(Number),
          }),
        ]),
        total_records_aggregated: 47,
        aggregation_status: 'success',
      })
    );

    // Verify required fields exist in aggregated data
    const sourceSystemNames = result.source_systems.map((sys) => sys.system_name);
    expect(sourceSystemNames).toContain('営業管理システム');
    expect(sourceSystemNames).toContain('プロジェクト管理ツール');
    expect(sourceSystemNames).toContain('タイムカード管理システム');

    // Verify sales management system data includes submission deadline and status
    const salesSystem = result.source_systems.find((sys) => sys.system_id === 'sales_mgmt_001');
    expect(salesSystem).toBeDefined();
    expect(salesSystem?.records[0]).toEqual(
      expect.objectContaining({
        submission_deadline: '08:00:00',
        is_submitted: expect.any(Boolean),
      })
    );

    // Verify project management system data includes progress and issues
    const projectSystem = result.source_systems.find((sys) => sys.system_id === 'project_mgmt_002');
    expect(projectSystem).toBeDefined();
    expect(projectSystem?.records[0]).toEqual(
      expect.objectContaining({
        yesterday_progress_rate: expect.any(Number),
        today_planned_tasks: expect.any(Number),
        issues_list: expect.any(Array),
      })
    );

    // Verify timecard system data exists
    const timecardSystem = result.source_systems.find((sys) => sys.system_id === 'timecard_003');
    expect(timecardSystem).toBeDefined();
    expect(timecardSystem?.records.length).toBeGreaterThan(0);

    // Verify data integrity check passed
    expect(result.data_integrity_check).toEqual(
      expect.objectContaining({
        passed: true,
        schema_validation: 'valid',
        duplicate_records: 0,
      })
    );

    // Verify minimum system count requirement (at least 3 systems)
    expect(result.source_systems.length).toBeGreaterThanOrEqual(3);

    // Verify total record count
    expect(result.total_records_aggregated).toBe(47);

    // Verify audit log contains required event
    expect(auditLogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'AGGREGATE_MULTIPLE_SYSTEMS',
        timestamp: '2024-01-15T07:45:00Z',
      })
    );

    // Verify audit log contains system count and record count
    const auditCall = auditLogSpy.mock.calls[0][0];
    expect(auditCall).toEqual(
      expect.objectContaining({
        source_system_count: 3,
        total_aggregated_records: 47,
        data_sources: expect.arrayContaining([
          'sales_mgmt_001',
          'project_mgmt_002',
          'timecard_003',
        ]),
      })
    );

    // Verify action execution was logged
    expect(actionExecutionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action_name: 'AGGREGATE_REAL_TIME_DATA',
        execution_status: 'success',
      })
    );

    // Verify type safety: all records contain required fields
    result.source_systems.forEach((system) => {
      expect(system).toHaveProperty('system_name');
      expect(system).toHaveProperty('system_id');
      expect(system).toHaveProperty('record_count');
      expect(system).toHaveProperty('last_updated');
      expect(system).toHaveProperty('records');
      expect(Array.isArray(system.records)).toBe(true);
    });

    // Verify data passed to next action (Action 2)
    expect(result).toHaveProperty('aggregation_timestamp');
    expect(result.aggregation_timestamp).toBe('2024-01-15T07:45:00Z');
  });
});