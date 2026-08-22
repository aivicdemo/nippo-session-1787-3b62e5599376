import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getDashboardData } from '../../src/logic/dashboard-display';

describe('getDashboardData', () => {
  test('SCEN-126: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント - 当月の蓄積報告データを自動抽出する', () => {
    const currentDate = new Date('2024-01-01T00:00:00Z');
    const thirtyDaysAgo = new Date('2023-12-02T00:00:00Z');
    
    const mockReportData = Array.from({ length: 10 }, (_, memberIdx) => 
      Array.from({ length: 30 }, (_, dayIdx) => ({
        memberId: `member-${memberIdx + 1}`,
        reportDate: new Date(thirtyDaysAgo.getTime() + dayIdx * 86400000).toISOString(),
        yesterday: `completed task for member-${memberIdx + 1} on day ${dayIdx + 1}`,
        today: `planned task for member-${memberIdx + 1} on day ${dayIdx + 1}`,
        challenge: `issue for member-${memberIdx + 1} on day ${dayIdx + 1}`,
      }))
    ).flat();

    const mockDashboardInput = {
      triggerId: 'trigger-monthly-2024-01',
      triggerStatus: 'ACTIVE',
      triggerDate: currentDate.toISOString(),
      isMonthStart: true,
      reportDataRange: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: currentDate.toISOString(),
        totalDays: 30,
      },
      memberCount: 10,
      expectedRecordCount: 300,
      requiredFields: ['yesterday', 'today', 'challenge'],
    };

    const result = getDashboardData(mockDashboardInput);

    expect(result).toBeDefined();
    expect(result.extractedRecordCount).toBe(300);
    expect(result.memberIds).toHaveLength(10);
    expect(result.memberIds).toEqual(
      Array.from({ length: 10 }, (_, i) => `member-${i + 1}`)
    );
    expect(result.dateRange.startDate).toBe(thirtyDaysAgo.toISOString());
    expect(result.dateRange.endDate).toBe(currentDate.toISOString());
    expect(result.fieldCount).toBe(3);
    expect(result.fields).toEqual(['yesterday', 'today', 'challenge']);
    expect(result.hasNoDataExtractionError).toBe(true);
    expect(result.hasNoDataInconsistency).toBe(true);
    expect(result.auditEvent).toBeDefined();
    expect(result.auditEvent.eventType).toBe('Action02_DataExtraction_Success');
    expect(result.auditEvent.timestamp).toBeDefined();
    expect(new Date(result.auditEvent.timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(currentDate).getTime() - 1000
    );
    expect(result.auditEvent.timestamp).toBeDefined();
    expect(result.auditEvent.context).toBeDefined();
    expect(result.auditEvent.context.triggerId).toBe('trigger-monthly-2024-01');
    expect(result.auditEvent.context.extractedRecordCount).toBe(300);
    expect(result.readyForNextAction).toBe(true);
  });
});