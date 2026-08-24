import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1782: [edge] 月次レポート生成機能 - 抽出期間が年をまたぐ場合（12月31日23:59から1月1日00:00）に境界を正しく判定する
  test('should correctly classify reports across year boundary without duplication', async () => {
    const decemberEndReports = [
      {
        reportId: 'report-dec-1',
        teamId: 'team-001',
        createdAt: new Date('2024-12-31T23:59:00Z'),
        content: 'December end report 1',
      },
      {
        reportId: 'report-dec-2',
        teamId: 'team-001',
        createdAt: new Date('2024-12-31T23:59:00Z'),
        content: 'December end report 2',
      },
      {
        reportId: 'report-dec-3',
        teamId: 'team-002',
        createdAt: new Date('2024-12-31T23:59:00Z'),
        content: 'December end report 3',
      },
      {
        reportId: 'report-dec-4',
        teamId: 'team-002',
        createdAt: new Date('2024-12-31T23:59:00Z'),
        content: 'December end report 4',
      },
      {
        reportId: 'report-dec-5',
        teamId: 'team-003',
        createdAt: new Date('2024-12-31T23:59:00Z'),
        content: 'December end report 5',
      },
    ];

    const januaryStartReports = [
      {
        reportId: 'report-jan-1',
        teamId: 'team-001',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        content: 'January start report 1',
      },
      {
        reportId: 'report-jan-2',
        teamId: 'team-001',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        content: 'January start report 2',
      },
      {
        reportId: 'report-jan-3',
        teamId: 'team-002',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        content: 'January start report 3',
      },
      {
        reportId: 'report-jan-4',
        teamId: 'team-002',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        content: 'January start report 4',
      },
      {
        reportId: 'report-jan-5',
        teamId: 'team-003',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        content: 'January start report 5',
      },
    ];

    const allReports = [...decemberEndReports, ...januaryStartReports];

    const decemberExtractionRequest = {
      targetYear: 2024,
      targetMonth: 12,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    const decemberResult = extractMonthlyReportData(
      decemberExtractionRequest,
      allReports
    );

    expect(decemberResult.totalReportCount).toBe(5);
    expect(decemberResult.reportsByTeam).toHaveLength(3);

    const decemberTeam001 = decemberResult.reportsByTeam.find(
      (t) => t.teamId === 'team-001'
    );
    expect(decemberTeam001).toBeDefined();
    expect(decemberTeam001!.reportCount).toBe(2);
    expect(decemberTeam001!.reportIds).toEqual(['report-dec-1', 'report-dec-2']);

    const decemberTeam002 = decemberResult.reportsByTeam.find(
      (t) => t.teamId === 'team-002'
    );
    expect(decemberTeam002).toBeDefined();
    expect(decemberTeam002!.reportCount).toBe(2);
    expect(decemberTeam002!.reportIds).toEqual(['report-dec-3', 'report-dec-4']);

    const decemberTeam003 = decemberResult.reportsByTeam.find(
      (t) => t.teamId === 'team-003'
    );
    expect(decemberTeam003).toBeDefined();
    expect(decemberTeam003!.reportCount).toBe(1);
    expect(decemberTeam003!.reportIds).toEqual(['report-dec-5']);

    expect(decemberResult.extractionPeriodStart).toBe('2024-12-01T00:00:00Z');
    expect(decemberResult.extractionPeriodEnd).toBe('2024-12-31T23:59:59Z');

    const januaryExtractionRequest = {
      targetYear: 2025,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    const januaryResult = extractMonthlyReportData(
      januaryExtractionRequest,
      allReports
    );

    expect(januaryResult.totalReportCount).toBe(5);
    expect(januaryResult.reportsByTeam).toHaveLength(3);

    const januaryTeam001 = januaryResult.reportsByTeam.find(
      (t) => t.teamId === 'team-001'
    );
    expect(januaryTeam001).toBeDefined();
    expect(januaryTeam001!.reportCount).toBe(2);
    expect(januaryTeam001!.reportIds).toEqual(['report-jan-1', 'report-jan-2']);

    const januaryTeam002 = januaryResult.reportsByTeam.find(
      (t) => t.teamId === 'team-002'
    );
    expect(januaryTeam002).toBeDefined();
    expect(januaryTeam002!.reportCount).toBe(2);
    expect(januaryTeam002!.reportIds).toEqual(['report-jan-3', 'report-jan-4']);

    const januaryTeam003 = januaryResult.reportsByTeam.find(
      (t) => t.teamId === 'team-003'
    );
    expect(januaryTeam003).toBeDefined();
    expect(januaryTeam003!.reportCount).toBe(1);
    expect(januaryTeam003!.reportIds).toEqual(['report-jan-5']);

    expect(januaryResult.extractionPeriodStart).toBe('2025-01-01T00:00:00Z');
    expect(januaryResult.extractionPeriodEnd).toBe('2025-01-31T23:59:59Z');

    // Verify no cross-contamination between December and January
    const decemberReportIds = new Set(
      decemberResult.reportsByTeam.flatMap((t) => t.reportIds)
    );
    const januaryReportIds = new Set(
      januaryResult.reportsByTeam.flatMap((t) => t.reportIds)
    );

    const intersection = [...decemberReportIds].filter((id) =>
      januaryReportIds.has(id)
    );
    expect(intersection).toHaveLength(0);

    // Verify December reports do not contain January report IDs
    expect(decemberResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-jan-1'
    );
    expect(decemberResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-jan-2'
    );
    expect(decemberResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-jan-3'
    );
    expect(decemberResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-jan-4'
    );
    expect(decemberResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-jan-5'
    );

    // Verify January reports do not contain December report IDs
    expect(januaryResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-dec-1'
    );
    expect(januaryResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-dec-2'
    );
    expect(januaryResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-dec-3'
    );
    expect(januaryResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-dec-4'
    );
    expect(januaryResult.reportsByTeam.flatMap((t) => t.reportIds)).not.toContain(
      'report-dec-5'
    );
  });
});