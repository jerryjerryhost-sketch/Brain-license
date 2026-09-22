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

    // 2. If record is not found in database (e.g. deleted by administrator)
    if (!record) {
      return NextResponse.json({
        success: false,
        status: 'DELETED',
        message: 'This workstation license is not registered or has been removed from the portal.'
      });
    }

    // 3. Record heartbeat (non-blocking)
    recordHeartbeat(machineId, appVersion, ip, record);

    // 4. Check if license has been revoked or suspended remotely
    if (record.status === 'SUSPENDED' || record.status === 'REVOKED') {
      return NextResponse.json({
        success: false,
        status: record.status,
        message: 'This workstation license has been suspended by the vendor. Please contact support.'
      });
    }

    // 5. Check if license was renewed/extended or user limit changed on cloud portal
    const serverExpires = record.expiry_date.trim().toUpperCase();
    const clientExp = currentExpires.trim().toUpperCase();
    const serverMaxUsers = Number(record.max_users || 0);
    const clientMaxUsers = Number(body.current_max_users !== undefined ? body.current_max_users : 0);

    if (serverExpires !== clientExp || serverMaxUsers !== clientMaxUsers) {
      // Expiry or User Limit was updated on server! Deliver the new signed key to workstation
      const { key } = generateLicenseKey(
        machineId, 
        record.client_name, 
        0, 
        record.license_type, 
        record.expiry_date, 
        serverMaxUsers
      );
      return NextResponse.json({
        success: true,
        status: 'RENEWED',
        license_key: key,
        expires: record.expiry_date,
        max_users: serverMaxUsers,
        client: record.client_name,
        message: `License successfully updated on cloud! New expiry: ${record.expiry_date}, Users: ${serverMaxUsers}`
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
