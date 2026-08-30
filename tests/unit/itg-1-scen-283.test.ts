import { generateAndSendManagerConfirmationEmail } from '../../src/logic/confirmation-email-generation';

describe('confirmationEmailGeneration', () => {
  test('SCEN-283: [edge] 日報集約完了時に部長向け確認メールを自動生成・送信し、課題が報告されていないメンバーは課題一覧に含まれない', async () => {
    // 準備: スタブ化された依存関数
    const buildManagerConfirmationEmailContentStub = jest.fn();
    const determineManagerEmailRecipientsStub = jest.fn();
    const sendEmailWithRetryStub = jest.fn();
    const recordEmailSendingHistoryStub = jest.fn();

    // テスト用の基本データ
    const teamId = 'team-001';
    const managerUserId = 'manager-001';
    const aggregationDate = new Date('2024-01-15T00:00:00Z').toISOString();
    const submissionDeadline = new Date('2024-01-15T09:30:00Z').toISOString();

    // チームメンバー10名分の日報データ
    // メンバーA～E: 課題が空白
    // メンバーF～J: 課題あり
    const reportDataList = [
      {
        employeeId: 'emp-001',
        employeeName: 'Member A',
        yesterday: 'Task A-1',
        today: 'Task A-2',
        issue: '',
        submittedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
      },
      {
        employeeId: 'emp-002',
        employeeName: 'Member B',
        yesterday: 'Task B-1',
        today: 'Task B-2',
        issue: '',
        submittedAt: new Date('2024-01-15T09:05:00Z').toISOString(),
      },
      {
        employeeId: 'emp-003',
        employeeName: 'Member C',
        yesterday: 'Task C-1',
        today: 'Task C-2',
        issue: '',
        submittedAt: new Date('2024-01-15T09:10:00Z').toISOString(),
      },
      {
        employeeId: 'emp-004',
        employeeName: 'Member D',
        yesterday: 'Task D-1',
        today: 'Task D-2',
        issue: '',
        submittedAt: new Date('2024-01-15T09:15:00Z').toISOString(),
      },
      {
        employeeId: 'emp-005',
        employeeName: 'Member E',
        yesterday: 'Task E-1',
        today: 'Task E-2',
        issue: '',
        submittedAt: new Date('2024-01-15T09:20:00Z').toISOString(),
      },
      {
        employeeId: 'emp-006',
        employeeName: 'Member F',
        yesterday: 'Task F-1',
        today: 'Task F-2',
        issue: 'システム遅延',
        submittedAt: new Date('2024-01-15T09:25:00Z').toISOString(),
      },
      {
        employeeId: 'emp-007',
        employeeName: 'Member G',
        yesterday: 'Task G-1',
        today: 'Task G-2',
        issue: '予算調整',
        submittedAt: new Date('2024-01-15T09:26:00Z').toISOString(),
      },
      {
        employeeId: 'emp-008',
        employeeName: 'Member H',
        yesterday: 'Task H-1',
        today: 'Task H-2',
        issue: '体制不足',
        submittedAt: new Date('2024-01-15T09:27:00Z').toISOString(),
      },
      {
        employeeId: 'emp-009',
        employeeName: 'Member I',
        yesterday: 'Task I-1',
        today: 'Task I-2',
        issue: '期限短縮',
        submittedAt: new Date('2024-01-15T09:28:00Z').toISOString(),
      },
      {
        employeeId: 'emp-010',
        employeeName: 'Member J',
        yesterday: 'Task J-1',
        today: 'Task J-2',
        issue: 'インターフェース改修',
        submittedAt: new Date('2024-01-15T09:29:00Z').toISOString(),
      },
    ];

    // 優先度付き課題リスト（メンバーF～Jから抽出された5つの課題のみ）
    const prioritizedIssues = [
      {
        keyword: 'システム遅延',
        frequency: 1,
        impactScore: 50,
        priorityRank: 1,
        priorityLevel: 'HIGH' as const,
        affectedMembers: ['emp-006'],
      },
      {
        keyword: '予算調整',
        frequency: 1,
        impactScore: 40,
        priorityRank: 2,
        priorityLevel: 'MEDIUM' as const,
        affectedMembers: ['emp-007'],
      },
      {
        keyword: '体制不足',
        frequency: 1,
        impactScore: 45,
        priorityRank: 3,
        priorityLevel: 'MEDIUM' as const,
        affectedMembers: ['emp-008'],
      },
      {
        keyword: '期限短縮',
        frequency: 1,
        impactScore: 35,
        priorityRank: 4,
        priorityLevel: 'LOW' as const,
        affectedMembers: ['emp-009'],
      },
      {
        keyword: 'インターフェース改修',
        frequency: 1,
        impactScore: 30,
        priorityRank: 5,
        priorityLevel: 'LOW' as const,
        affectedMembers: ['emp-010'],
      },
    ];

    // 未提出メンバーは空配列（全メンバーが提出済み）
    const unsubmittedMembers: { userId: string; userName: string; elapsedMinutes: number }[] = [];

    // スタブの返り値設定
    const mockEmailContent = {
      subject: 'Test Subject',
      body: '<html>Test Body</html>',
      generatedAt: new Date('2024-01-15T09:30:00Z'),
    };

    const mockManagerRecipient = {
      userId: managerUserId,
      emailAddress: 'manager@example.com',
      displayName: 'Manager User',
      teamId: teamId,
    };

    const mockEmailSendResult = {
      success: true,
      messageId: 'msg-123',
      attemptCount: 1,
    };

    buildManagerConfirmationEmailContentStub.mockResolvedValue(mockEmailContent);
    determineManagerEmailRecipientsStub.mockResolvedValue({
      recipients: [mockManagerRecipient],
      recipientCount: 1,
    });
    sendEmailWithRetryStub.mockResolvedValue(mockEmailSendResult);
    recordEmailSendingHistoryStub.mockResolvedValue(undefined);

    // 入力オブジェクト
    const input = {
      managerUserId: managerUserId,
      aggregationDate: aggregationDate,
      reportDataList: reportDataList,
      unsubmittedMembers: unsubmittedMembers,
      prioritizedIssues: prioritizedIssues,
      submissionDeadline: submissionDeadline,
      teamId: teamId,
      buildManagerConfirmationEmailContent: buildManagerConfirmationEmailContentStub,
      determineManagerEmailRecipients: determineManagerEmailRecipientsStub,
      sendEmailWithRetry: sendEmailWithRetryStub,
      recordEmailSendingHistory: recordEmailSendingHistoryStub,
    };

    // 関数実行
    const result = await generateAndSendManagerConfirmationEmail(input);

    // 検証1: 戻り値のsendingStatusが"success"であること
    expect(result.sendingStatus).toBe('success');

    // 検証2: 戻り値のsentDateTimeがISO 8601形式の有効な日時文字列であること
    expect(result.sentDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(() => new Date(result.sentDateTime)).not.toThrow(/Date/);

    // 検証3: buildManagerConfirmationEmailContentが呼び出されたことを確認
    expect(buildManagerConfirmationEmailContentStub).toHaveBeenCalled();

    // 検証4: buildManagerConfirmationEmailContentに渡されたpriorityizedIssuesを検証
    const callArgs = buildManagerConfirmationEmailContentStub.mock.calls[0][0];
    const passedPrioritizedIssues = callArgs.prioritizedIssues;

    // 検証5: メンバーA～E（課題が空白）の課題が含まれていないことを確認
    const affectedMemberIds = passedPrioritizedIssues.flatMap(
      (issue: { affectedMembers: string[] }) => issue.affectedMembers
    );
    expect(affectedMemberIds).not.toContain('emp-001'); // Member A
    expect(affectedMemberIds).not.toContain('emp-002'); // Member B
    expect(affectedMemberIds).not.toContain('emp-003'); // Member C
    expect(affectedMemberIds).not.toContain('emp-004'); // Member D
    expect(affectedMemberIds).not.toContain('emp-005'); // Member E

    // 検証6: メンバーF～J（課題あり）の課題が含まれていることを確認
    expect(affectedMemberIds).toContain('emp-006'); // Member F
    expect(affectedMemberIds).toContain('emp-007'); // Member G
    expect(affectedMemberIds).toContain('emp-008'); // Member H
    expect(affectedMemberIds).toContain('emp-009'); // Member I
    expect(affectedMemberIds).toContain('emp-010'); // Member J

    // 検証7: 抽出された課題の件数が正確に5件であることを確認
    expect(passedPrioritizedIssues).toHaveLength(5);

    // 検証8: 課題キーワードが正確であることを確認
    const keywords = passedPrioritizedIssues.map(
      (issue: { keyword: string }) => issue.keyword
    );
    expect(keywords).toEqual([
      'システム遅延',
      '予算調整',
      '体制不足',
      '期限短縮',
      'インターフェース改修',
    ]);

    // 検証9: メール送信が正常に実行されたことを確認
    expect(sendEmailWithRetryStub).toHaveBeenCalled();
    expect(recordEmailSendingHistoryStub).toHaveBeenCalled();
  });
});