import { test, expect } from '@playwright/test';

test.describe("リマインドスケジュール削除", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'test');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
  });

  // SCEN-056
  test("リマインドスケジュール削除 - 業務フロー全体を完了する", async ({ page, request }) => {
    const uniqueValue = "テスト削除対象" + Date.now();
    
    await test.step("リマインド通知管理画面を開く", async () => {
      await page.goto("/panels/scr-1787119211243.html");
      await expect(page.locator('text=リマインド通知管理')).toBeVisible();
    });

    let scheduleCountBefore = 0;
    await test.step("削除前のスケジュール件数を記録する", async () => {
      const schedulesList = page.locator('#schedules-list');
      await expect(schedulesList).toBeVisible();
      const items = await schedulesList.locator('.card').count();
      scheduleCountBefore = items;
    });

    await test.step("新規スケジュール作成で削除対象を準備する", async () => {
      await page.click('[data-testid="create-schedule-button"]');
      await expect(page.locator('#create-modal')).toBeVisible();
      
      await page.fill('[name="send_time"]', '08:00');
      await page.selectOption('[name="team_id"]', { label: '営業チーム' });
      await page.fill('[name="deadline_hours"]', '24');
      await page.check('[name="is_active"]');
      await page.fill('[data-testid="send-time-input"]', uniqueValue);
      
      await page.click('button:has-text("作成")');
      await expect(page.locator('#create-modal')).not.toBeVisible();
    });

    let scheduleCountAfterCreate = 0;
    await test.step("作成後のスケジュール件数を確認する", async () => {
      await expect(page.locator('.card')).toHaveCount(scheduleCountBefore + 1);
      const schedulesList = page.locator('#schedules-list');
      const items = await schedulesList.locator('.card').count();
      scheduleCountAfterCreate = items;
      expect(scheduleCountAfterCreate).toBeGreaterThan(scheduleCountBefore);
    });

    await test.step("作成したスケジュール項目の詳細を開く", async () => {
      const scheduleCards = page.locator('#schedules-list .card');
      let targetCard = null;
      
      for (let i = 0; i < scheduleCountAfterCreate; i++) {
        const card = scheduleCards.nth(i);
        const text = await card.textContent();
        if (text && text.includes(uniqueValue)) {
          targetCard = card;
          break;
        }
      }
      
      expect(targetCard).not.toBeNull();
      if (targetCard) {
        await targetCard.click();
      }
      
      await expect(page.locator('#detail-modal')).toBeVisible();
      await expect(page.locator('#detail-content')).toContainText(uniqueValue);
    });

    await test.step("削除確認ダイアログを表示する", async () => {
      await page.click('#delete-schedule-button');
      await expect(page.locator('#delete-confirm-modal')).toBeVisible();
      await expect(page.locator('text=スケジュールを削除しますか？')).toBeVisible();
    });

    await test.step("削除を確定する", async () => {
      await page.click('#confirm-delete-button');
      await expect(page.locator('#delete-confirm-modal')).not.toBeVisible();
    });

    await test.step("削除完了を確認し、管理画面に戻る", async () => {
      await expect(page.locator('#detail-modal')).not.toBeVisible();
      await expect(page.locator('#schedules-list')).toBeVisible();
    });

    await test.step("削除対象が一覧から消えたことを確認する", async () => {
      const schedulesList = page.locator('#schedules-list');
      const items = await schedulesList.locator('.card').count();
      expect(items).toBe(scheduleCountAfterCreate - 1);
      
      const remainingText = await schedulesList.textContent();
      expect(remainingText).not.toContain(uniqueValue);
    });

    await test.step("記録から削除対象が消えたことを確認する", async () => {
      const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL);
      const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID);
      const tableIndex = await page.evaluate(
        (name) => ((window as any).AIVIC_TABLES || []).findIndex((t: any) => t.tableName === name),
        "リマインド通知履歴",
      );
      
      if (tableIndex >= 0) {
        const res = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
        const rows = await res.json();
        const rowsString = JSON.stringify(rows);
        const beforeDelete = rowsString.includes(uniqueValue);
        
        if (beforeDelete) {
          const resAfter = await request.get(`${apiUrl}/api/${tableIndex}?app=${appId}`);
          const rowsAfter = await resAfter.json();
          const rowsAfterString = JSON.stringify(rowsAfter);
          expect(rowsAfterString).not.toContain(uniqueValue);
        }
      }
    });
  });
});