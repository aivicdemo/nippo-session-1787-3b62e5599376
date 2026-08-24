import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポートデータ抽出', () => {
  // SCEN-2405: [error] 日報データ集約・アーカイブ移行機能 - 集約期間内のデータが0件のとき処理が中断される
  test('should abort aggregation and log error when no report data exists in the target period', async () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const requestedByUserId = 'user-director-001';
    const teamIdFilter = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const mockDatabase = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      rollback: jest.fn(),
      commit: jest.fn(),
    };

    // モックデータベースの戻り値設定：日報データが0件
    mockDatabase.query.mockResolvedValueOnce([]);
    mockDatabase.query.mockResolvedValueOnce(0);
    mockDatabase.beginTransaction.mockResolvedValueOnce(undefined);
    mockDatabase.rollback.mockResolvedValueOnce(undefined);

    const result = await extractMonthlyReportData(
      {
        targetYear: 2024,
        targetMonth: 1,
        requestedByUserId: requestedByUserId,
        teamIdFilter: teamIdFilter,
      },
      {
        notificationService: mockNotificationServiceAdapter,
        textAnalysisService: mockTextAnalysisServiceAdapter,
        logger: mockLogger,
        database: mockDatabase,
      }
    );

    // アサーション (1): アーカイブテーブルへのデータ移行は実行されない
    expect(mockDatabase.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO archive')
    );

    // アサーション (2): エラーコード「DATA_NOT_FOUND_IN_AGGREGATION_PERIOD」がログに記録される
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('DATA_NOT_FOUND_IN_AGGREGATION_PERIOD')
    );

    // アサーション (3): 管理者向けアラートが生成され、指定期間のメッセージが含まれる
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/2024-01-01.*2024-01-31.*データが存在しません/)
    );

    // アサーション (4): NotificationServiceAdapter と TextAnalysisServiceAdapter への呼び出しは発生しない
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    // アサーション (5): トランザクションはロールバックされ、データベースは初期状態のまま保持される
    expect(mockDatabase.beginTransaction).toHaveBeenCalled();
    expect(mockDatabase.rollback).toHaveBeenCalled();
    expect(mockDatabase.commit).not.toHaveBeenCalled();

    // 戻り値の検証：エラー状態を示すレスポンスが返される
    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
        validationErrors: expect.arrayContaining([
          expect.stringContaining('指定期間 2024-01-01～2024-01-31 のデータが存在しません'),
        ]),
      })
    );
  });
});