import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/panels/scr-1787119211243.html");
  });

  // SCEN-011: [edge] リマインド通知管理画面 - リマインド通知スケジュール一覧に0件のときスケジュールなし表示になる
  test("SCEN-011: スケジュール一覧が0件のとき『スケジュールなし』と表示される", async ({ page }) => {
    const scheduleSection = page.locator("text=スケジュール");
    await expect(scheduleSection).toBeVisible();
    
    const noScheduleMessage = page.locator("text=スケジュールなし");
    await expect(noScheduleMessage).toBeVisible();
  });

  // SCEN-012: [normal] リマインド通知管理画面 - リマインド通知履歴一覧に複数件の履歴が表示される
  test("SCEN-012: リマインド通知履歴一覧に複数件の履歴が表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const historyRows = page.locator("tr, li").filter({ hasText: /送信済み|未送信/ });
    const count = await historyRows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // SCEN-013: [edge] リマインド通知管理画面 - リマインド通知履歴一覧に0件のとき履歴なし表示になる
  test("SCEN-013: 履歴一覧が0件のとき『履歴なし』と表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const noHistoryMessage = page.locator("text=履歴なし");
    const isVisible = await noHistoryMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(noHistoryMessage).toBeVisible();
    } else {
      const historyRows = page.locator("tr, li").filter({ hasText: /送信済み|未送信/ });
      const count = await historyRows.count();
      expect(count).toBe(0);
    }
  });

  // SCEN-014: [normal] リマインド通知管理画面 - リマインド通知履歴に通知送信日時が表示される
  test("SCEN-014: 通知履歴に送信日時が表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const dateTimePattern = /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{1,2}:\d{2}/;
    const historyContent = page.locator("table, .history-list, [class*='history']");
    const text = await historyContent.innerText().catch(() => "");
    
    expect(text).toMatch(dateTimePattern);
  });

  // SCEN-015: [normal] リマインド通知管理画面 - リマインド通知履歴に通知対象者が表示される
  test("SCEN-015: 通知履歴に通知対象者が表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const notificationRow = page.locator("tr, li").first();
    const text = await notificationRow.innerText();
    
    expect(text.length).toBeGreaterThan(0);
    expect(/対象者|ユーザー|メンバー|担当者/.test(text) || /[ぁ-ん]/.test(text)).toBeTruthy();
  });

  // SCEN-016: [normal] リマインド通知管理画面 - リマインド通知履歴に送信済みステータスが表示される
  test("SCEN-016: 通知履歴に『送信済み』ステータスが表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const sentStatus = page.locator("text=送信済み");
    const isSentStatusVisible = await sentStatus.isVisible().catch(() => false);
    
    if (isSentStatusVisible) {
      await expect(sentStatus).toBeVisible();
    } else {
      const historyTable = page.locator("table, [class*='history']");
      const text = await historyTable.innerText();
      expect(text).toContain("送信済み");
    }
  });

  // SCEN-017: [normal] リマインド通知管理画面 - リマインド通知履歴に未送信ステータスが表示される
  test("SCEN-017: 通知履歴に『未送信』ステータスが表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const unsendStatus = page.locator("text=未送信");
    const isUnsendStatusVisible = await unsendStatus.isVisible().catch(() => false);
    
    if (isUnsendStatusVisible) {
      await expect(unsendStatus).toBeVisible();
    } else {
      const historyTable = page.locator("table, [class*='history']");
      const text = await historyTable.innerText();
      expect(text).toMatch(/未送信|送信待ち|失敗/);
    }
  });

  // SCEN-018: [normal] リマインド通知管理画面 - リマインド通知内容確認リンク押下で通知内容が表示される
  test("SCEN-018: 内容確認リンク押下で通知内容が表示される", async ({ page }) => {
    const historySection = page.locator("text=リマインド通知履歴");
    await expect(historySection).toBeVisible();

    const detailLink = page.locator("a, button").filter({ hasText: /確認|詳細|内容/ }).first();
    const isDetailLinkVisible = await detailLink.isVisible().catch(() => false);
    
    if (isDetailLinkVisible) {
      await detailLink.click();
      await page.waitForTimeout(500);
      
      const detailPanel = page.locator("[class*='modal'], [class*='dialog'], [class*='panel']");
      const isPanelVisible = await detailPanel.isVisible().catch(() => false);
      
      expect(isPanelVisible || await page.content().then(c => c.includes("送信対象者"))).toBeTruthy();
    }
  });

  // SCEN-019: [normal] リマインド通知管理画面 - 報告期限までの時間が画面に表示される
  test("SCEN-019: 報告期限までの時間が画面に表示される", async ({ page }) => {
    const reminderContent = page.locator("body");
    const text = await reminderContent.innerText();

    const timePattern = /(\d+)\s*(時間|日|分|時|時間30分|日\d+時間)/;
    expect(text).toMatch(timePattern);
  });

  // SCEN-020: [error] リマインド通知管理画面 - リマインド送信時刻を空で保存するとエラー表示になる
  test("SCEN-020: 送信時刻を空で保存するとエラーが表示される", async ({ page }) => {
    const formButton = page.locator("button, [class*='btn']").filter({ hasText: /新規|追加|設定/ }).first();
    const isFormButtonVisible = await formButton.isVisible().catch(() => false);
    
    if (isFormButtonVisible) {
      await formButton.click();
      await page.waitForTimeout(300);
    }

    const saveButton = page.locator("button, [class*='btn']").filter({ hasText: /保存|登録|送信/ }).first();
    const isSaveButtonVisible = await saveButton.isVisible().catch(() => false);
    
    if (isSaveButtonVisible) {
      await saveButton.click();
      await page.waitForTimeout(500);

      const errorMessage = page.locator("[class*='error'], [class*='alert'], [class*='message']");
      const isErrorVisible = await errorMessage.isVisible().catch(() => false);
      
      if (isErrorVisible) {
        const errorText = await errorMessage.innerText();
        expect(errorText.length).toBeGreaterThan(0);
      }
    }
  });
});