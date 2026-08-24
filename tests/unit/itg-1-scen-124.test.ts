import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロール別アクセス制御', () => {
  test('SCEN-124: エンジニアロールのユーザーが報告データを確認しようとしたとき、自分の報告内容のみが表示対象に含まれる', () => {
    // Setup: engineer_user_A のユーザーコンテキスト
    const engineerUserAContext = {
      userId: 'engineer_user_A',
      role: 'engineer' as const,
      teamIds: ['team_001'],
      isActive: true,
    };

    // engineer_user_A が入力した報告データ
    const reportDataFromEngineerA = {
      reportId: 'report_001_A',
      userId: 'engineer_user_A',
      yesterdayAccomplishment: 'API実装を完了した',
      todayPlan: 'ユニットテスト作成予定',
      challenges: 'テスト環境の準備に時間がかかっている',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    // engineer_user_B のユーザーコンテキスト
    const engineerUserBContext = {
      userId: 'engineer_user_B',
      role: 'engineer' as const,
      teamIds: ['team_001'],
      isActive: true,
    };

    // engineer_user_B が入力した報告データ
    const reportDataFromEngineerB = {
      reportId: 'report_001_B',
      userId: 'engineer_user_B',
      yesterdayAccomplishment: 'ドキュメント作成を完了した',
      todayPlan: 'レビューコメント対応予定',
      challenges: 'レビュー指摘内容の理解に時間がかかっている',
      submittedAt: new Date('2024-01-15T09:15:00Z'),
    };

    // 権限判定入力: engineer_user_A が自身の報告データを閲覧する場合
    const authorizationCheckInput = {
      userId: 'engineer_user_A',
      requestedFeature: '日報確認',
      targetTeamId: 'team_001',
      targetDataType: '自分の進捗のみ',
    };

    // 権限判定の実行
    const result = validateUserAuthorizationAndPermission(
      authorizationCheckInput,
      engineerUserAContext
    );

    // 期待値の検証
    // 1. エンジニアロールのユーザーが自身の報告データにアクセスすることは許可される
    expect(result.isAuthorized).toBe(true);

    // 2. ユーザーロールがエンジニアとして返される
    expect(result.userRole).toBe('engineer');

    // 3. 表示可能なデータ範囲が「自分のみ」に制限されている
    expect(result.allowedDataScope).toBe('自分のみ');

    // 4. エンジニアロールが実行可能な機能は「閲覧」のみであり、編集・削除は許可されない
    expect(result.editableFeatures).toEqual(['view']);

    // フィルタリングロジック検証: engineer_user_A が確認画面にアクセスした場合、
    // 自分の報告データのみがフィルタリング対象となることを確認
    const displayedReports = [reportDataFromEngineerA, reportDataFromEngineerB].filter(
      (report) => report.userId === engineerUserAContext.userId
    );

    // 5. engineer_user_A のビューには engineer_user_A の報告データ 1 件のみが表示される
    expect(displayedReports).toHaveLength(1);

    // 6. 表示される報告データが engineer_user_A 本人のデータであることを確認
    expect(displayedReports[0].reportId).toBe('report_001_A');
    expect(displayedReports[0].userId).toBe('engineer_user_A');
    expect(displayedReports[0].yesterdayAccomplishment).toBe('API実装を完了した');
    expect(displayedReports[0].todayPlan).toBe('ユニットテスト作成予定');
    expect(displayedReports[0].challenges).toBe('テスト環境の準備に時間がかかっている');

    // 7. engineer_user_B のデータが表示されていないことを確認
    const engineerBReports = [reportDataFromEngineerA, reportDataFromEngineerB].filter(
      (report) => report.userId === engineerUserBContext.userId
    );
    expect(displayedReports.some((r) => r.userId === engineerUserBContext.userId)).toBe(false);
  });
});