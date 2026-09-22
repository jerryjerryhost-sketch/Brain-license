import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByMachineId, upsertLicense } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machine_id, action, days, validity_option, custom_days, max_users } = body;

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
    let updatedMaxUsers = record.max_users !== undefined ? record.max_users : 0;

    if (action === 'update_license') {
      const option = validity_option || '30d';
      if (option === 'perpetual') {
        updatedExpiry = 'PERPETUAL';
        updatedType = 'PERPETUAL';
      } else {
        let daysToAdd = 30;
        if (option === '15d') daysToAdd = 15;
        else if (option === '30d') daysToAdd = 30;
        else if (option === '180d') daysToAdd = 180;
        else if (option === '365d') daysToAdd = 365;
        else if (option === 'custom') daysToAdd = Math.max(1, Number(custom_days || 30));

        let baseDate = new Date();
        // If current expiry is in the future, extend from current expiry date
        if (record.expiry_date && record.expiry_date !== 'PERPETUAL') {
          const curr = new Date(record.expiry_date);
          if (curr.getTime() > baseDate.getTime()) {
            baseDate = curr;
          }
        }
        baseDate.setDate(baseDate.getDate() + daysToAdd);
        updatedExpiry = baseDate.toISOString().split('T')[0];
        updatedType = 'SUBSCRIPTION';
      }

      if (max_users !== undefined && max_users !== null) {
        updatedMaxUsers = Math.max(0, Number(max_users));
      }

      // If license was previously expired/inactive, reactivate
      if (updatedStatus === 'EXPIRED') {
        updatedStatus = 'ACTIVE';
      }
    } else if (action === 'extend_days') {
      const addDays = Number(days || 30);
      let baseDate = new Date();
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
      status: updatedStatus,
      max_users: updatedMaxUsers
    }, record);

    return NextResponse.json({ success: true, license: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
