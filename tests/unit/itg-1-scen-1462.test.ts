import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('週次日報データ集約機能 - 部分的エラーハンドリング', () => {
  // SCEN-1462
  test('前週日報データ集約機能 - 10名のチームメンバーのうち1名でも日報提出がない場合に部分的エラーが返される', () => {
    const weekStartDate = new Date('2024-01-15T00:00:00Z');
    const weekEndDate = new Date('2024-01-21T23:59:59Z');
    const teamIds = ['team-dev-001'];
    const requestedByUserId = 'user-director-001';

    const mockDailyReports = [
      {
        reportDate: new Date('2024-01-15T09:30:00Z'),
        reportCount: 9,
        submittedByUserIds: [
          'member1',
          'member2',
          'member3',
          'member4',
          'member5',
          'member6',
          'member7',
          'member8',
          'member9',
        ],
        challengeItems: [
          'データベース接続タイムアウト',
          'API応答遅延',
          'データベース接続タイムアウト',
          'キャッシュミス',
        ],
      },
      {
        reportDate: new Date('2024-01-16T09:30:00Z'),
        reportCount: 9,
        submittedByUserIds: [
          'member1',
          'member2',
          'member3',
          'member4',
          'member5',
          'member6',
          'member7',
          'member8',
          'member9',
        ],
        challengeItems: [
          'デプロイメントエラー',
          'データベース接続タイムアウト',
        ],
      },
    ];

    const mockUnsubmittedUserIds = ['member10'];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        success: true,
        deliveryStatus: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続タイムアウト',
            frequency: 3,
          },
          {
            keyword: 'API応答遅延',
            frequency: 1,
          },
          {
            keyword: 'キャッシュミス',
            frequency: 1,
          },
          {
            keyword: 'デプロイメントエラー',
            frequency: 1,
          },
        ],
        confidence: 0.92,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    const result = extractWeeklyReportData(input, {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      reportDataSource: mockDailyReports,
      unsubmittedUserIds: mockUnsubmittedUserIds,
    });

    expect(result).toBeDefined();
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(9);
    expect(result.reportsByDate).toHaveLength(2);

    expect(result.reportsByDate[0].reportDate).toEqual(
      new Date('2024-01-15T09:30:00Z'),
    );
    expect(result.reportsByDate[0].reportCount).toBe(9);
    expect(result.reportsByDate[0].submittedByUserIds).toEqual([
      'member1',
      'member2',
      'member3',
      'member4',
      'member5',
      'member6',
      'member7',
      'member8',
      'member9',
    ]);
    expect(result.reportsByDate[0].submittedByUserIds).not.toContain(
      'member10',
    );

    expect(result.reportsByDate[1].reportDate).toEqual(
      new Date('2024-01-16T09:30:00Z'),
    );
    expect(result.reportsByDate[1].reportCount).toBe(9);

    expect(result.extractedChallenges).toBeDefined();
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    const normalizedChallenges = result.extractedChallenges;
    const databaseTimeoutChallenge = normalizedChallenges.find(
      (c) => c.keyword === 'データベース接続タイムアウト',
    );
    expect(databaseTimeoutChallenge).toBeDefined();
    expect(databaseTimeoutChallenge?.occurrenceCount).toBe(3);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.partialError).toBeDefined();
    expect(result.partialError?.status).toBe('partial_error');
    expect(result.partialError?.unsubmittedUserCount).toBe(1);
    expect(result.partialError?.unsubmittedUserIds).toEqual(['member10']);
    expect(result.partialError?.submittedUserCount).toBe(9);
    expect(result.partialError?.message).toContain('member10');
    expect(result.partialError?.message).toContain('未提出');
  });
});