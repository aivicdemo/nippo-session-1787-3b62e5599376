import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 生成されたレポートがプロジェクトマネージャーへの通知対象として正確に識別される', () => {
  let mockDatabase: {
    weeklyReports: Array<{
      id: string;
      month: string;
      severity: 'high' | 'medium' | 'low';
      content: string;
      createdAt: Date;
    }>;
    users: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  };

  beforeEach(() => {
    mockDatabase = {
      weeklyReports: [
        {
          id: 'report-001-high',
          month: '2024-01',
          severity: 'high',
          content: 'Critical issue with production deployment',
          createdAt: new Date('2024-01-08T09:00:00Z'),
        },
        {
          id: 'report-002-medium',
          month: '2024-01',
          severity: 'medium',
          content: 'Performance optimization needed for API',
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'report-003-low',
          month: '2024-01',
          severity: 'low',
          content: 'Documentation update required',
          createdAt: new Date('2024-01-22T14:00:00Z'),
        },
      ],
      users: [
        {
          id: 'pm-user-001',
          name: 'Taro Yamada',
          role: 'ProjectManager',
        },
        {
          id: 'pm-user-002',
          name: 'Hanako Suzuki',
          role: 'ProjectManager',
        },
        {
          id: 'eng-user-001',
          name: 'John Engineer',
          role: 'Engineer',
        },
      ],
    };
  });

  afterEach(() => {
    mockDatabase = { weeklyReports: [], users: [] };
  });

  // SCEN-1795
  test('月次レポート生成時にプロジェクトマネージャー全員が通知対象として正確に特定される', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'admin-user-001';

    const currentTime = new Date('2024-02-01T09:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(currentTime);

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: undefined,
    };

    const projectManagers = mockDatabase.users.filter(
      (user) => user.role === 'ProjectManager'
    );

    const expectedNotificationTargets = projectManagers.map((pm) => pm.id);

    const result = extractMonthlyReportData(
      input,
      mockDatabase.weeklyReports,
      mockDatabase.users
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('notificationTargets');
    expect(Array.isArray(result.notificationTargets)).toBe(true);

    expect(result.notificationTargets).toEqual(
      expect.arrayContaining(expectedNotificationTargets)
    );

    expect(result.notificationTargets.length).toBe(2);

    expect(result.notificationTargets).toContain('pm-user-001');
    expect(result.notificationTargets).toContain('pm-user-002');

    expect(result.notificationTargets).not.toContain('eng-user-001');

    expect(result).toHaveProperty('generatedAt');
    const generatedAtTime = new Date(result.generatedAt);
    const timeDifference = Math.abs(
      generatedAtTime.getTime() - currentTime.getTime()
    );
    expect(timeDifference).toBeLessThanOrEqual(5000);

    expect(result).toHaveProperty('reportMonth');
    expect(result.reportMonth).toBe('2024-01');

    jest.useRealTimers();
  });
});