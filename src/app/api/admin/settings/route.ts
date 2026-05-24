import { NextResponse } from 'next/server';
import { query } from '@/lib/server/mysql';
import { verifyAuth, getAuthCookie } from '@/lib/server/auth';

async function checkAdmin() {
  const token = await getAuthCookie();
  if (!token) throw new Error('Unauthorized');
  await verifyAuth(token);
}

// Default limits in case they don't exist in the DB yet
const DEFAULT_SETTINGS = {
  max_daily_generations: '10',
  max_weekly_generations: '50',
  max_monthly_generations: '100',
  otp_enabled: 'true',
  eid_camp_enabled: 'false'
};

export async function GET() {
  try {
    await checkAdmin();

    const dbSettings = await query<any[]>('SELECT setting_key, setting_value FROM app_settings');
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    for (const row of dbSettings) {
      settingsMap[row.setting_key] = row.setting_value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    await checkAdmin();
    const body = await req.json();
    const { max_daily_generations, max_weekly_generations, max_monthly_generations } = body;

    // Use INSERT ... ON DUPLICATE KEY UPDATE for each setting
    const updateSetting = async (key: string, value: string) => {
      await query(
        'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value.toString(), value.toString()]
      );
    };

    if (max_daily_generations !== undefined) await updateSetting('max_daily_generations', max_daily_generations);
    if (max_weekly_generations !== undefined) await updateSetting('max_weekly_generations', max_weekly_generations);
    if (max_monthly_generations !== undefined) await updateSetting('max_monthly_generations', max_monthly_generations);
    if (body.otp_enabled !== undefined) await updateSetting('otp_enabled', body.otp_enabled);
    if (body.eid_camp_enabled !== undefined) await updateSetting('eid_camp_enabled', body.eid_camp_enabled);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
