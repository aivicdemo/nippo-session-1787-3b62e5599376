import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール保存", () => {
  // SCEN-055
  test("[normal] リマインドスケジュール保存 - 業務フロー「リマインドスケジュール保存」を開始から完了まで実行する", async ({ page, request }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
    
    // ログイン処理
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);

    // 工程1: リマインド通知管理画面を開く
    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/panels/scr-1787119211243.html");
      await expect(page.locator('text=リマインド通知管理')).toBeVisible();
    });

    // 工程2: リマインドスケジュール保存画面に遷移し、スケジュール設定フォームが表示されていることを確認
    await test.step("リマインドスケジュール保存画面に遷移し、フォーム表示を確認", async () => {
      await page.click('[data-testid="create-schedule-button"]');
      await expect(page.locator('#create-modal')).toBeVisible();
      await expect(page.locator('[name="send_time"]')).toBeVisible();
      await expect(page.locator('[name="team_id"]')).toBeVisible();
      await expect(page.locator('[name="deadline_hours"]')).toBeVisible();
      await expect(page.locator('[name="is_active"]')).toBeVisible();
    });

    // 工程3: 送信時刻を入力（例：毎朝08:00）
    const uniqueSendTime = "08:00";
    await test.step("送信時刻を入力", async () => {
      await page.fill('[name="send_time"]', uniqueSendTime);
      const inputValue = await page.inputValue('[name="send_time"]');
      expect(inputValue).toBe(uniqueSendTime);
    });

    // 工程4: リマインド通知の配信対象としてチームメンバーが選択可能な状態を確認
    await test.step("配信対象チームの選択肢を確認", async () => {
      const teamSelect = page.locator('[name="team_id"]');
      await teamSelect.click();
      await expect(page.locator('text=営業チーム')).toBeVisible();
      await expect(page.locator('text=企画チーム')).toBeVisible();
      await expect(page.locator('text=開発チーム')).toBeVisible();
      await expect(page.locator('text=全社')).toBeVisible();
    });

    // 工程5: スケジュール設定フォームに必要な全ての項目を入力
    await test.step("スケジュール設定フォームに全項目を入力", async () => {
      // チームを選択
      await page.locator('[name="team_id"]').selectOption('1');
      
      // 報告期限を入力
      const uniqueDeadlineHours = "24";
      await page.fill('[name="deadline_hours"]', uniqueDeadlineHours);
      
      // 作成後すぐに有効にするをチェック
      const isActiveCheckbox = page.locator('[name="is_active"]');
      await isActiveCheckbox.check();
      
      // 各フィールドの入力値を確認
      expect(await page.inputValue('[name="send_time"]')).toBe(uniqueSendTime);
      expect(await page.inputValue('[name="deadline_hours"]')).toBe(uniqueDeadlineHours);
      expect(await isActiveCheckbox.isChecked()).toBe(true);
    });

    // 工程6: 「保存」ボタンをクリック
    let schedulesBefore: any[] = [];
    await test.step("保存ボタンをクリック前に既存スケジュール件数を確認", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      if (tableIndex >= 0) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        if (res.ok()) {
          schedulesBefore = await res.json();
        }
      }
    });

    await test.step("保存ボタンをクリック", async () => {
      await page.click('[data-testid="save-schedule-button"]');
      await expect(page.locator('#create-modal')).not.toBeVisible();
      await expect(page.locator('text=リマインド通知管理')).toBeVisible();
    });

    // 工程7: 画面がリマインド通知管理画面に遷移し、新規作成したリマインドスケジュールが表示される
    await test.step("リマインド通知管理画面で保存されたスケジュール情報を確認", async () => {
      await expect(page.locator('#schedules-list')).toBeVisible();
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      
      if (tableIndex >= 0) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        if (res.ok()) {
          const schedulesAfter = await res.json();
          expect(schedulesAfter.length).toBeGreaterThan(schedulesBefore.length);
          const jsonString = JSON.stringify(schedulesAfter);
          expect(jsonString).toContain(uniqueSendTime);
        }
      }

      // 画面上でスケジュール情報が表示されていることを確認
      await expect(page.locator('[data-testid="next-send-time"]')).toBeVisible();
    });
  });
});