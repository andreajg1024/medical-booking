import { test, expect } from '@playwright/test';

test.describe('Booking flow', () => {
  
  function nextWeekdayIso(daysAhead: number, hour: number) {
    const d = new Date(Date.now() + daysAhead * 24 * 3600 * 1000);
    
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(hour, 0, 0, 0);
    return d.toISOString().slice(0,19);
  }
  test('Register patient success and schedule appointment', async ({ page }) => {
    await page.goto('/');
    await page.fill('#pname', 'Test User');
    await page.fill('#pemail', 'testuser@example.com');
    await page.fill('#pphone', '3001234567');
    await page.click('#frmRegister button');
    await expect(page.locator('#regMsg')).toContainText('Registrado con id:');

    
    const regMsg = await page.textContent('#regMsg');
    const idMatch = regMsg!.match(/id:\s*(\d+)/);
    expect(idMatch).not.toBeNull();
    const patientId = idMatch![1];

   
    await page.fill('#patientId', patientId);
    await page.waitForSelector('#doctorSelect');
    await page.selectOption('#doctorSelect', { index: 0 });
    
    const iso = nextWeekdayIso(1, 10);
    await page.fill('#startIso', iso);
    await page.fill('#duration', '60');
    await page.click('#frmBook button');
    await expect(page.locator('#bookMsg')).toContainText('Cita agendada id:');

    await page.click('#refresh');
    await page.waitForTimeout(500);
    const appts = await page.textContent('#appts');
    expect(appts).toContain('Inicio');
  });

  test('Validation: invalid email, empty fields', async ({ page }) => {
    await page.goto('/');
    await page.click('#frmRegister button');
    await page.waitForSelector('#regMsg');
    let msg = await page.textContent('#regMsg');
    expect(msg).toContain('Campos obligatorios');

    
    await page.fill('#pname', 'X');
    await page.fill('#pemail', 'not-an-email');
    await page.fill('#pphone', '3001234');
    await page.click('#frmRegister button');
    await page.waitForSelector('#regMsg');
    msg = await page.textContent('#regMsg');
    expect(msg).toContain('Email inválido');
  });

  test('Attempt to double-book same doctor at same time', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('#pname','A One');
    await page.fill('#pemail','a1@example.com');
    await page.fill('#pphone','3001111111');
    await page.click('#frmRegister button');
    await expect(page.locator('#regMsg')).toContainText('Registrado con id:');
    const aId = (await page.textContent('#regMsg'))!.match(/id:\s*(\d+)/)![1];

    
    await page.fill('#pname','B Two');
    await page.fill('#pemail','b2@example.com');
    await page.fill('#pphone','3002222222');
    await page.click('#frmRegister button');
    await expect(page.locator('#regMsg')).toContainText('Registrado con id:');
    const bId = (await page.textContent('#regMsg'))!.match(/id:\s*(\d+)/)![1];


    await page.waitForSelector('#doctorSelect');
    await page.selectOption('#doctorSelect', { index: 0 });
    const iso = nextWeekdayIso(2, 11);

    
    await page.fill('#patientId', aId);
    await page.fill('#startIso', iso);
    await page.click('#frmBook button');
    await expect(page.locator('#bookMsg')).toContainText('Cita agendada id:');

    await page.fill('#patientId', bId);
    await page.fill('#startIso', iso);
    await page.click('#frmBook button');
    await page.waitForSelector('#bookMsg');
    const err = await page.textContent('#bookMsg');
    expect(err).toContain('Horario ya ocupado');
  });

  test('Cancel appointment', async ({ page }) => {
    await page.goto('/');
    await page.fill('#pname', 'Cancel Tester');
    await page.fill('#pemail', 'cancel@test.com');
    await page.fill('#pphone', '3003333333');
    await page.click('#frmRegister button');
    await expect(page.locator('#regMsg')).toContainText('Registrado con id:');
    const idMatch = (await page.textContent('#regMsg'))!.match(/id:\s*(\d+)/);
    const pid = idMatch![1];

    await page.fill('#patientId', pid);
    await page.waitForSelector('#doctorSelect');
    await page.selectOption('#doctorSelect', { index: 0 });
    const iso = nextWeekdayIso(3, 9);
    await page.fill('#startIso', iso);
    await page.click('#frmBook button');
    await page.waitForSelector('#bookMsg');
    
    await page.click('#refresh');
    await page.waitForTimeout(500);
    const cancelBtn = await page.$('.cancel');
    expect(cancelBtn).not.toBeNull();
    await cancelBtn!.click();
    await page.waitForTimeout(500);
    const appts = await page.textContent('#appts');

    expect(appts).toContain('CANCELLED');
  });
});
