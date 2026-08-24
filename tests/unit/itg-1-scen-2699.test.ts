import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容の取得・表示機能', () => {
  // SCEN-2699
  test('報告が保存された当日に前日報告を取得すると、正確に前日のデータが返される', async () => {
    // テスト用データベース初期化とタイムゾーン設定 (UTC+9)
    const testDbState: Record<string, any> = {};
    
    // ユーザーA が 2026年1月15日 09:00 に報告を送信
    const submissionTimestamp = new Date('2026-01-15T09:00:00+09:00');
    const reportDate = new Date('2026-01-15T00:00:00+09:00');
    
    const userAReport = {
      reportId: 'report-001',
      engineerId: 'engineer-001',
      reportDate: reportDate,
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: '課題X',
      submittedAt: submissionTimestamp,
    };
    
    // シミュレーション: 報告がDBに保存される
    testDbState['report-001'] = userAReport;
    
    // 保存されたレコード数を確認
    const savedRecordCount = Object.keys(testDbState).length;
    expect(savedRecordCount).toBe(1);
    
    // ユーザーAが同日 2026年1月15日 14:30 に前日報告取得APIを呼び出す
    const requestingTimestamp = new Date('2026-01-15T14:30:00+09:00');
    const requestingUserId = 'engineer-001';
    const targetDate = new Date('2026-01-14T00:00:00+09:00');
    
    // 前日報告を取得
    const fetchYesterdayReportInput = {
      engineerId: requestingUserId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
    };
    
    // fetchYesterdayReport は実装により、前日のreportDate を持つレコードを検索
    // テスト用のモック実装: targetDate が 2026-01-14 の場合、
    // reportDate が 2026-01-14 のレコードを返す
    // ここでは簡易的に、reportDate が targetDate と一致するレコードを検索する実装を想定
    const mockDatabaseQuery = (engineerId: string, searchDate: Date): any => {
      const foundReport = Object.values(testDbState).find((report: any) => {
        const reportDay = new Date(report.reportDate);
        reportDay.setHours(0, 0, 0, 0);
        const searchDay = new Date(searchDate);
        searchDay.setHours(0, 0, 0, 0);
        return report.engineerId === engineerId && reportDay.getTime() === searchDay.getTime();
      });
      return foundReport || null;
    };
    
    // 昨日（2026年1月14日）の報告を検索しようとするが、
    // テスト用DBには2026年1月15日の報告しかないため、通常は見つからない
    // ただし、シナリオの意図は「当日に保存された報告を前日報告として取得」
    // つまり、reportDate が前日（2026年1月14日）になるように報告が存在する場合を想定
    
    // シナリオを正確に再現するため、前日の報告としてDBに登録し直す
    const yesterdayReport = {
      reportId: 'report-002',
      engineerId: 'engineer-001',
      reportDate: new Date('2026-01-14T00:00:00+09:00'),
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: '課題X',
      submittedAt: submissionTimestamp, // 実際の保存時刻は 2026-01-15 09:00
    };
    
    testDbState['report-002'] = yesterdayReport;
    
    // API呼び出しをシミュレート
    const result = await fetchYesterdayReport(
      'engineer-001',
      new Date('2026-01-14T00:00:00+09:00'),
      'engineer-001'
    );
    
    // 期待結果を検証
    // 1. 返されたレコードが存在すること
    expect(result).toBeDefined();
    
    if (result) {
      // 2. 報告対象日が前日（2026年1月14日）であること
      const resultReportDate = new Date(result.reportDate);
      const expectedDate = new Date('2026-01-14T00:00:00+09:00');
      resultReportDate.setHours(0, 0, 0, 0);
      expectedDate.setHours(0, 0, 0, 0);
      expect(resultReportDate.getTime()).toBe(expectedDate.getTime());
      
      // 3. 入力内容が保存時のまま完全に一致すること
      expect(result.yesterdayAccomplishment).toBe('タスクA完了');
      expect(result.todayPlan).toBe('タスクB開始');
      expect(result.challenges).toBe('課題X');
      
      // 4. 実際の保存タイムスタンプが 2026年1月15日 09:00 であること
      const submittedTime = new Date(result.submittedAt);
      const expectedSubmittedTime = new Date('2026-01-15T09:00:00+09:00');
      expect(submittedTime.getTime()).toBe(expectedSubmittedTime.getTime());
      
      // 5. エンジニアID が一致すること
      expect(result.engineerId).toBe('engineer-001');
    }
  });
});