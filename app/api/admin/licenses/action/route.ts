import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByMachineId, upsertLicense } from '@/lib/db';
import { generateLicenseKey } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machine_id, action, days } = body;

    if (!machine_id || !action) {
      return NextResponse.json({ success: false, error: 'machine_id and action are required.' }, { status: 400 });
    }

    const record = await getLicenseByMachineId(machine_id);
    if (!record) {
      return NextResponse.json({ success: false, error: 'License record not found.' }, { status: 404 });
    }

    let updatedExpiry = record.expiry_date;
    let updatedStatus = record.status;
    let updatedType = record.license_type;

    if (action === 'extend_days') {
      const addDays = Number(days || 30);
      let baseDate = new Date();
      // If current expiry is in the future, extend from current expiry date!
      if (record.expiry_date !== 'PERPETUAL') {
        const currExp = new Date(record.expiry_date);
        if (currExp.getTime() > baseDate.getTime()) {
          baseDate = currExp;
        }
      }
      baseDate.setDate(baseDate.getDate() + addDays);
      updatedExpiry = baseDate.toISOString().split('T')[0];
      updatedType = 'SUBSCRIPTION';
      updatedStatus = 'ACTIVE';
    } else if (action === 'set_perpetual') {
      updatedExpiry = 'PERPETUAL';
      updatedType = 'PERPETUAL';
      updatedStatus = 'ACTIVE';
    } else if (action === 'toggle_suspend') {
      updatedStatus = record.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    } else if (action === 'revoke') {
      updatedStatus = 'REVOKED';
    }

    const saved = await upsertLicense({
      ...record,
      expiry_date: updatedExpiry,
      license_type: updatedType,
      status: updatedStatus
    });

    return NextResponse.json({ success: true, license: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
