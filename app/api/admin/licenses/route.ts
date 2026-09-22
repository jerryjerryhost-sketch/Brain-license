import { NextRequest, NextResponse } from 'next/server';
import { getAllLicenses, upsertLicense, deleteLicense } from '@/lib/db';
import { generateLicenseKey } from '@/lib/crypto';

// Optional admin password protection via ADMIN_SECRET env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === '') return true;
  if (authHeader === `Bearer ${ADMIN_PASSWORD}` || authHeader === ADMIN_PASSWORD) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const licenses = await getAllLicenses();
    
    // Compute analytics
    const now = new Date();
    let activeCount = 0;
    let onlineCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    const enriched = licenses.map(lic => {
      const lastSync = lic.last_sync_at ? new Date(lic.last_sync_at).getTime() : 0;
      const isOnline = (Date.now() - lastSync) < (1000 * 60 * 60 * 24); // seen within 24h
      
      let daysRemaining: number | 'PERPETUAL' = 'PERPETUAL';
      let isExpired = false;
      let isExpiringSoon = false;

      if (lic.expiry_date !== 'PERPETUAL') {
        const exp = new Date(lic.expiry_date);
        const diffMs = exp.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          isExpired = true;
          expiredCount++;
        } else if (daysRemaining <= 30) {
          isExpiringSoon = true;
          expiringSoonCount++;
        }
      }

      if (lic.status === 'ACTIVE' && !isExpired) {
        activeCount++;
      }
      if (isOnline) {
        onlineCount++;
      }

      return {
        ...lic,
        is_online: isOnline,
        days_remaining: daysRemaining,
        is_expired: isExpired,
        is_expiring_soon: isExpiringSoon
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: licenses.length,
        active: activeCount,
        online: onlineCount,
        expiring_soon: expiringSoonCount,
        expired: expiredCount
      },
      licenses: enriched
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_name, machine_id, days, expiry_date, license_type, notes } = body;

    if (!client_name || !machine_id) {
      return NextResponse.json({ success: false, error: 'Client name and Machine ID are required.' }, { status: 400 });
    }

    let exp = expiry_date;
    if (!exp && days !== undefined) {
      if (Number(days) === 0) {
        exp = 'PERPETUAL';
      } else {
        const d = new Date();
        d.setDate(d.getDate() + Number(days));
        exp = d.toISOString().split('T')[0];
      }
    }

    const saved = await upsertLicense({
      client_name,
      machine_id,
      license_type: exp === 'PERPETUAL' ? 'PERPETUAL' : 'SUBSCRIPTION',
      expiry_date: exp || 'PERPETUAL',
      notes: notes || ''
    });

    return NextResponse.json({ success: true, license: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required.' }, { status: 400 });
    }
    await deleteLicense(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
