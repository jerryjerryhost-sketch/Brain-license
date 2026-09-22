import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByMachineId, recordHeartbeat, upsertLicense } from '@/lib/db';
import { generateLicenseKey } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const machineId = String(body.machine_id || '').trim().toUpperCase();
    const appVersion = String(body.app_version || '').trim();
    const currentExpires = String(body.current_expires || '').trim();

    if (!machineId) {
      return NextResponse.json(
        { success: false, error: 'Missing machine_id parameter' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';

    // 1. Look up existing license in DB
    let record = await getLicenseByMachineId(machineId);

    // 2. Auto-discovery: If machine is new, auto-register as pending/trial so vendor can see it
    if (!record) {
      const clientName = body.client_name || `Workstation (${machineId.substring(3, 7)})`;
      const defaultDays = 30; // 30-day initial discovery trial
      const { key, payload } = generateLicenseKey(machineId, clientName, defaultDays, 'SUBSCRIPTION');
      
      record = await upsertLicense({
        machine_id: machineId,
        client_name: clientName,
        license_type: 'SUBSCRIPTION',
        issued_date: payload.issued,
        expiry_date: payload.expires,
        status: 'ACTIVE',
        license_key: key,
        app_version: appVersion,
        last_ip: ip,
        notes: 'Auto-registered on first connection'
      });

      return NextResponse.json({
        success: true,
        status: 'NEW_ACTIVATION',
        license_key: key,
        expires: payload.expires,
        message: `Workstation registered and activated for 30 days trial.`
      });
    }

    // 3. Record heartbeat
    await recordHeartbeat(machineId, appVersion, ip);

    // 4. Check if license has been revoked or suspended remotely
    if (record.status === 'SUSPENDED' || record.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        status: record.status,
        message: 'This workstation license has been suspended by the vendor. Please contact support.'
      });
    }

    // 5. Check if license was renewed/extended on cloud portal
    const serverExpires = record.expiry_date.trim().toUpperCase();
    const clientExp = currentExpires.trim().toUpperCase();

    if (serverExpires !== clientExp) {
      // Expiry was changed on server! Deliver the new signed key to workstation
      const { key } = generateLicenseKey(machineId, record.client_name, 0, record.license_type, record.expiry_date);
      return NextResponse.json({
        success: true,
        status: 'RENEWED',
        license_key: key,
        expires: record.expiry_date,
        client: record.client_name,
        message: `License successfully updated on cloud! New expiry: ${record.expiry_date}`
      });
    }

    // 6. License is up to date
    return NextResponse.json({
      success: true,
      status: 'ACTIVE',
      expires: record.expiry_date,
      client: record.client_name,
      message: 'License is active and synchronized with cloud.'
    });

  } catch (error: any) {
    console.error('License sync API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}
