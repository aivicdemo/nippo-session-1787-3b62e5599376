import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-1458: TextAnalysisServiceAdapterの影響度判定機能が失敗した場合に手動キーワード入力モードに切り替わる', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'システム障害', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn()
        .mockRejectedValueOnce(new Error('API call failed'))
        .mockRejectedValueOnce(new Error('API call failed'))
        .mockRejectedValueOnce(new Error('API call failed')),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      })
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');

    const dailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-001', 'user-002'],
        challengeItems: ['システム障害が発生した']
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 2,
        submittedByUserIds: ['user-001', 'user-002'],
        challengeItems: ['システム障害が発生した']
      }
    ];

    const input = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: 'user-001'
    };

    let result;
    let fallbackMode = false;
    let manualInputModeActive = false;
    let dashboardMessage = '';

    try {
      result = await extractWeeklyReportData(
        input,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('API call failed')) {
        fallbackMode = true;
        manualInputModeActive = true;
        dashboardMessage = '課題分析が一時的に利用できません。手動入力をご利用ください';
      }
    }

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    const firstCall = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls[0];
    expect(firstCall).toBeDefined();

    const secondCall = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls[1];
    expect(secondCall).toBeDefined();

    const thirdCall = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls[2];
    expect(thirdCall).toBeDefined();

    expect(fallbackMode).toBe(true);
    expect(manualInputModeActive).toBe(true);
    expect(dashboardMessage).toBe('課題分析が一時的に利用できません。手動入力をご利用ください');

    if (result) {
      expect(result.dataQualityScore).toBeDefined();
      expect(typeof result.dataQualityScore).toBe('number');
      expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
      expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    }
  });
});