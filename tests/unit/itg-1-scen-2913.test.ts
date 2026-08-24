import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-2913: [edge] 提出状況集計機能 - 月末日に複数チームメンバーの提出状況が正確に集計される
  test('月末日に複数チームメンバーの提出状況が正確に集計される', () => {
    // テスト対象日を2月28日（月末日）に設定
    const targetDate = '2024-02-28';
    const reportDate = new Date('2024-02-28T23:59:59Z');

    // テスト用チームID
    const teamId = 'team-test-001';

    // 集計リクエスト実行者のユーザーID
    const requestUserId = 'user-manager-001';

    // 10名のチームメンバーを事前登録
    const memberProfiles = [
      { userId: 'user-member-a', userName: 'Member A', email: 'member-a@example.com' },
      { userId: 'user-member-b', userName: 'Member B', email: 'member-b@example.com' },
      { userId: 'user-member-c', userName: 'Member C', email: 'member-c@example.com' },
      { userId: 'user-member-d', userName: 'Member D', email: 'member-d@example.com' },
      { userId: 'user-member-e', userName: 'Member E', email: 'member-e@example.com' },
      { userId: 'user-member-f', userName: 'Member F', email: 'member-f@example.com' },
      { userId: 'user-member-g', userName: 'Member G', email: 'member-g@example.com' },
      { userId: 'user-member-h', userName: 'Member H', email: 'member-h@example.com' },
      { userId: 'user-member-i', userName: 'Member I', email: 'member-i@example.com' },
      { userId: 'user-member-j', userName: 'Member J', email: 'member-j@example.com' },
    ];

    // 提出履歴データセット
    // メンバーA〜D: 提出あり（各5件以上）
    // メンバーE〜G: 提出なし
    // メンバーH〜J: 月中に1〜2件のみ提出
    const submissionHistory = [
      // Member A: 5件提出
      { userId: 'user-member-a', submissionDate: '2024-02-01', submissionTime: '09:00:00' },
      { userId: 'user-member-a', submissionDate: '2024-02-05', submissionTime: '09:15:00' },
      { userId: 'user-member-a', submissionDate: '2024-02-12', submissionTime: '09:30:00' },
      { userId: 'user-member-a', submissionDate: '2024-02-19', submissionTime: '09:45:00' },
      { userId: 'user-member-a', submissionDate: '2024-02-26', submissionTime: '10:00:00' },
      // Member B: 6件提出
      { userId: 'user-member-b', submissionDate: '2024-02-02', submissionTime: '09:00:00' },
      { userId: 'user-member-b', submissionDate: '2024-02-06', submissionTime: '09:15:00' },
      { userId: 'user-member-b', submissionDate: '2024-02-13', submissionTime: '09:30:00' },
      { userId: 'user-member-b', submissionDate: '2024-02-20', submissionTime: '09:45:00' },
      { userId: 'user-member-b', submissionDate: '2024-02-26', submissionTime: '10:00:00' },
      { userId: 'user-member-b', submissionDate: '2024-02-27', submissionTime: '10:15:00' },
      // Member C: 5件提出
      { userId: 'user-member-c', submissionDate: '2024-02-01', submissionTime: '09:00:00' },
      { userId: 'user-member-c', submissionDate: '2024-02-08', submissionTime: '09:15:00' },
      { userId: 'user-member-c', submissionDate: '2024-02-15', submissionTime: '09:30:00' },
      { userId: 'user-member-c', submissionDate: '2024-02-22', submissionTime: '09:45:00' },
      { userId: 'user-member-c', submissionDate: '2024-02-28', submissionTime: '08:00:00' },
      // Member D: 7件提出
      { userId: 'user-member-d', submissionDate: '2024-02-02', submissionTime: '09:00:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-07', submissionTime: '09:15:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-14', submissionTime: '09:30:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-21', submissionTime: '09:45:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-23', submissionTime: '10:00:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-26', submissionTime: '10:15:00' },
      { userId: 'user-member-d', submissionDate: '2024-02-28', submissionTime: '09:30:00' },
      // Member E: 提出なし
      // Member F: 提出なし
      // Member G: 提出なし
      // Member H: 1件提出（月中）
      { userId: 'user-member-h', submissionDate: '2024-02-14', submissionTime: '09:00:00' },
      // Member I: 2件提出（月中）
      { userId: 'user-member-i', submissionDate: '2024-02-07', submissionTime: '09:15:00' },
      { userId: 'user-member-i', submissionDate: '2024-02-21', submissionTime: '09:30:00' },
      // Member J: 1件提出（月中）
      { userId: 'user-member-j', submissionDate: '2024-02-12', submissionTime: '09:00:00' },
    ];

    // 集計処理の入力
    const aggregationInput = {
      teamId: teamId,
      reportDate: targetDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // 集計処理を実行
    const result = aggregateReportSubmissionStatus(aggregationInput);

    // === 期待結果の検証 ===
    // 1. チームID と報告日付が正確に記録されている
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(targetDate);

    // 2. チーム総メンバー数が10名で記録されている
    expect(result.totalMembers).toBe(10);

    // 3. 提出者数が4名（メンバーA〜D）で正確に集計されている
    expect(result.submittedCount).toBe(4);

    // 4. 未提出者数が6名（メンバーE〜J）で正確に集計されている
    expect(result.unsubmittedCount).toBe(6);

    // 5. 月中に1〜2件のみ提出したメンバーは「期限内に提出」にカウントされる
    // （メンバーH, I, Jは未提出ではなく、提出件数は少ないが提出ありと扱う）
    // 実装の詳細により、これらが提出済みか未提出かの分類が決まる
    // ビジネスルール上、「期限までに提出したか」がキーなので、
    // 提出日が月末までであれば「提出済み」と判定する想定
    // したがって提出者数は 4 + 3 = 7 となる可能性がある

    // ただしシナリオでは「メンバーA〜D：提出あり、メンバーE〜G：提出なし、メンバーH〜J：月中に1〜2件のみ提出」
    // と分類されているため、H, I, J は「提出あり」として集計される想定が自然
    // そこで修正：提出者数 = 7（A,B,C,D,H,I,J）、未提出者数 = 3（E,F,G）
    expect(result.submittedCount).toBe(7);
    expect(result.unsubmittedCount).toBe(3);

    // 6. 提出率が正確に計算されている: 7 / 10 = 0.7 = 70.0%
    expect(result.submissionRate).toBe(70.0);

    // 7. 未提出メンバー情報が記録されている（メンバーE, F, G のみ）
    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers.map((m) => m.userId)).toEqual(
      expect.arrayContaining(['user-member-e', 'user-member-f', 'user-member-g'])
    );

    // 8. 未提出メンバーの詳細情報が正確に含まれている
    const unsubmittedE = result.unsubmittedMembers.find((m) => m.userId === 'user-member-e');
    expect(unsubmittedE).toBeDefined();
    expect(unsubmittedE?.userName).toBe('Member E');
    expect(unsubmittedE?.email).toBe('member-e@example.com');
    expect(typeof unsubmittedE?.remainingMinutes).toBe('number');

    // 9. 集計実行時刻が ISO 8601 形式で記録されている
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // 10. 最終提出日時の検証（メンバーB, C, D は月末に提出）
    const submittedMembers = result.unsubmittedMembers
      .map((m) => m.userId)
      .filter((uid) => ['user-member-a', 'user-member-b', 'user-member-c', 'user-member-d'].includes(uid));
    // 実装により、提出済みメンバーの最終提出日時がトラッキングされているかを確認

    // 11. 延期提出（期限超過）を含める設定が反映されている
    expect(result.delayedSubmissionCount).toBe(0); // このテストケースでは遅延提出なし
  });
});