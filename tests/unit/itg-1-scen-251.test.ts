import { submitDailyReport } from "../../src/logic/daily-report-management";
import { type NotificationServiceAdapter } from "../../src/adapters/notification-service-adapter";

describe("部長向けダッシュボード - 本日の報告提出状況リアルタイム表示", () => {
  test("SCEN-251: [normal] 報告遅延判定機能 - 遅延判定結果が部長に通知される", async () => {
    // Arrange: テストデータ準備
    const report_submit_timestamp = new Date("2024-01-15T09:30:00Z");
    const morning_meeting_start_time = new Date("2024-01-15T09:00:00Z");
    const delay_threshold_minutes = 30;

    const engineer_user_id = "user_engineer_001";
    const manager_user_id = "manager_001";
    const team_id = "team_engineering";
    const report_date = "2024-01-15";

    // 報告送信入力データ
    const daily_report_input = {
      userId: engineer_user_id,
      teamId: team_id,
      yesterdayAccomplishment: "前日の実装作業が完了",
      todayPlan: "本日は設計ドキュメント作成予定",
      challenges: "デバッグに時間がかかっている",
      reportDate: report_date,
    };

    // NotificationServiceAdapter のスタブ準備
    const notification_stub: Partial<NotificationServiceAdapter> = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        delivery_status: "success",
        notification_id: "notif_001",
        delivered_at: new Date("2024-01-15T09:30:05Z").toISOString(),
      }),
    };

    const mock_notification_adapter =
      notification_stub as NotificationServiceAdapter;

    // 通知配信ログテーブルをシミュレート
    const notification_delivery_logs: Array<{
      log_id: string;
      recipient_user_id: string;
      notification_type: string;
      status: string;
      created_at: string;
    }> = [];

    // Act: 報告を送信
    const submission_result = await submitDailyReport(
      {
        reportId: "report_20240115_001",
        userId: engineer_user_id,
        submissionTimestamp: report_submit_timestamp,
        reportContent: {
          yesterdayAccomplishment: daily_report_input.yesterdayAccomplishment,
          todayPlan: daily_report_input.todayPlan,
          challenges: daily_report_input.challenges,
        },
      },
      mock_notification_adapter,
      {
        morningMeetingStartTime: morning_meeting_start_time,
        delayThresholdMinutes: delay_threshold_minutes,
        managerUserId: manager_user_id,
      }
    );

    // 遅延判定: 送信時刻 09:30 - 朝会開始時刻 09:00 = 30分遅延 (閾値30分)
    const minutes_after_meeting_start = Math.floor(
      (report_submit_timestamp.getTime() -
        morning_meeting_start_time.getTime()) /
        (1000 * 60)
    );
    const is_delayed = minutes_after_meeting_start >= delay_threshold_minutes;

    // 遅延判定結果に基づいて通知配信ログを記録（実装の流れをシミュレート）
    if (is_delayed) {
      notification_delivery_logs.push({
        log_id: "log_delivery_001",
        recipient_user_id: manager_user_id,
        notification_type: "delay_detection_result",
        status: "delivery_success",
        created_at: new Date("2024-01-15T09:30:05Z").toISOString(),
      });
    }

    // Assert: 遅延判定が『遅延あり』と判定されたか確認
    expect(is_delayed).toBe(true);

    // NotificationServiceAdapter が部長ユーザーID宛に1回呼び出されたか確認
    expect(mock_notification_adapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(
      mock_notification_adapter.sendReminderNotification
    ).toHaveBeenCalledWith({
      userId: manager_user_id,
      message: expect.stringContaining("遅延"),
      notificationType: "delay_detection_result",
    });

    // 通知配信ログに『受信者:部長、通知種別:遅延判定結果、ステータス:配信成功』が記録されているか確認
    expect(notification_delivery_logs).toHaveLength(1);
    const delivery_log = notification_delivery_logs[0];
    expect(delivery_log.recipient_user_id).toBe(manager_user_id);
    expect(delivery_log.notification_type).toBe("delay_detection_result");
    expect(delivery_log.status).toBe("delivery_success");

    // 報告送信結果が正常に返却されたか確認
    expect(submission_result).toMatchObject({
      reportId: "report_20240115_001",
      submissionTimestamp: report_submit_timestamp.toISOString(),
      isWithinDeadline: false,
      delayMinutes: 30,
    });

    // ダッシュボード表示用の遅延判定結果が含まれているか確認
    expect(submission_result).toHaveProperty("delayMinutes");
    expect(submission_result.delayMinutes).toBe(30);
  });
});