import { describe, test, expect, beforeEach } from '@jest/globals';
import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';
import type { ProgressComparisonInput, GroupedProgressOutput } from '../../src/logic/manager-dashboard';

describe('sortAndGroupProgressComparison', () => {
  // SCEN-2803: [edge] ダッシュボード表示優先順位付け機能 - 優先度スコアが降順に正確に整列される
  test('should sort and display progress comparison by priority score in descending order', () => {
    // Arrange: TextAnalysisServiceAdapter モック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'システム障害') return 85;
        if (keyword === '軽微なバグ') return 42;
        if (keyword === '緊急対応') return 72;
        return 0;
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 3 件の日報データを作成: 異なる優先度スコアを持つ
    const dailyReportA = {
      reportId: 'report-001',
      reporterId: 'engineer-001',
      reporterName: 'Engineer A',
      teamId: 'team-001',
      teamName: 'Development Team',
      content: 'システム障害が発生',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    const dailyReportB = {
      reportId: 'report-002',
      reporterId: 'engineer-002',
      reporterName: 'Engineer B',
      teamId: 'team-001',
      teamName: 'Development Team',
      content: '軽微なバグを修正',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T09:05:00Z',
    };

    const dailyReportC = {
      reportId: 'report-003',
      reporterId: 'engineer-003',
      reporterName: 'Engineer C',
      teamId: 'team-001',
      teamName: 'Development Team',
      content: '緊急対応が必要',
      reportDate: '2024-01-15',
      submissionTimestamp: '2024-01-15T09:10:00Z',
    };

    const input: ProgressComparisonInput = {
      reportDataList: [dailyReportA, dailyReportB, dailyReportC],
      groupByDimensions: ['priority'],
      userId: 'manager-001',
      userRole: 'manager',
    };

    // Act: ダッシュボード表示機能を実行
    const result = sortAndGroupProgressComparison(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter
    );

    // Assert: 結果の型確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('groupedData');
    expect(result).toHaveProperty('sortOrder');
    expect(result).toHaveProperty('displayFormat');

    // Assert: groupedData が配列で存在することを確認
    expect(Array.isArray(result.groupedData)).toBe(true);
    expect(result.groupedData.length).toBe(3);

    // Assert: 優先度スコアが降順で正確に整列されていることを確認
    // 期待される順序: 日報A（スコア85）→ 日報C（スコア72）→ 日報B（スコア42）
    const sortedByScore = result.groupedData.map((item) => item.priorityScore);
    expect(sortedByScore[0]).toBe(85);
    expect(sortedByScore[1]).toBe(72);
    expect(sortedByScore[2]).toBe(42);

    // Assert: 各日報が降順に配列されていることを確認
    expect(result.groupedData[0].reportId).toBe('report-001');
    expect(result.groupedData[1].reportId).toBe('report-003');
    expect(result.groupedData[2].reportId).toBe('report-002');

    // Assert: 各日報の横に対応するスコア値が表示されることを確認
    expect(result.groupedData[0]).toHaveProperty('priorityScore', 85);
    expect(result.groupedData[1]).toHaveProperty('priorityScore', 72);
    expect(result.groupedData[2]).toHaveProperty('priorityScore', 42);

    // Assert: NotificationServiceAdapter が呼び出されていないことを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();

    // Assert: displayFormat が指定されていることを確認
    expect(result.displayFormat).toBeDefined();
    expect(typeof result.displayFormat).toBe('string');

    // Assert: sortOrder が優先度スコア順であることを確認
    expect(result.sortOrder).toBeDefined();
    expect(result.sortOrder).toHaveProperty('criteria');
  });
});