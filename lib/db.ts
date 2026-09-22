import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { generateLicenseKey } from './crypto';

export interface LicenseRecord {
  id: string;
  client_name: string;
  machine_id: string;
  license_type: 'SUBSCRIPTION' | 'PERPETUAL' | 'TRIAL';
  issued_date: string;
  expiry_date: string; // YYYY-MM-DD or 'PERPETUAL'
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  license_key: string;
  max_users?: number;
  app_version?: string;
  last_ip?: string;
  last_sync_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 1. Check if Supabase is configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

// 2. Local Fallback Database (Supports Vercel Serverless /tmp + In-Memory)
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'licenses.json');

let _IN_MEMORY_RECORDS: LicenseRecord[] | null = null;

function getInitialSeed(): LicenseRecord[] {
  return [
    {
      id: 'lic-dh-medisurg-01',
      client_name: 'D & H Medisurg (HQ)',
      machine_id: 'DH-B6C2-D862-A0E8-A3BB',
      license_type: 'PERPETUAL',
      issued_date: '2026-09-01',
      expiry_date: 'PERPETUAL',
      status: 'ACTIVE',
      license_key: generateLicenseKey('DH-B6C2-D862-A0E8-A3BB', 'D & H Medisurg (HQ)', 0, 'PERPETUAL').key,
      app_version: 'v2.5.5',
      last_ip: '192.168.1.100',
      last_sync_at: new Date().toISOString(),
      notes: 'Main Master Server Workstation',
      created_at: '2026-09-01T10:00:00.000Z',
      updated_at: new Date().toISOString()
    },
    {
      id: 'lic-lifecare-02',
      client_name: 'Life Care Surgicals',
      machine_id: 'DH-98F1-42A7-10D3-88B1',
      license_type: 'SUBSCRIPTION',
      issued_date: '2026-01-10',
      expiry_date: '2027-01-10',
      status: 'ACTIVE',
      license_key: generateLicenseKey('DH-98F1-42A7-10D3-88B1', 'Life Care Surgicals', 0, 'SUBSCRIPTION', '2027-01-10').key,
      app_version: 'v2.5.5',
      last_ip: '192.168.1.105',
      last_sync_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      notes: 'Annual Subscription Client',
      created_at: '2026-01-10T10:00:00.000Z',
      updated_at: new Date().toISOString()
    }
  ];
}

function ensureLocalDb(): LicenseRecord[] {
  if (_IN_MEMORY_RECORDS && _IN_MEMORY_RECORDS.length > 0) {
    return _IN_MEMORY_RECORDS;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      _IN_MEMORY_RECORDS = JSON.parse(raw);
      return _IN_MEMORY_RECORDS || [];
    }
  } catch (err) {
    console.warn('FS read notice (using memory):', err);
  }
  _IN_MEMORY_RECORDS = getInitialSeed();
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(_IN_MEMORY_RECORDS, null, 2), 'utf-8');
  } catch {
    // Read-only environment, keep in memory
  }
  return _IN_MEMORY_RECORDS;
}

function saveLocalDb(records: LicenseRecord[]) {
  _IN_MEMORY_RECORDS = records;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('FS write notice (persisted in memory):', err);
  }
}

/**
 * Get all license records
 */
export async function getAllLicenses(): Promise<LicenseRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as LicenseRecord[];
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local DB:', err);
    }
  }
  return ensureLocalDb();
}

/**
 * Find license by machine_id
 */
export async function getLicenseByMachineId(machineId: string): Promise<LicenseRecord | null> {
  const normId = machineId.trim().toUpperCase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('machine_id', normId)
        .single();
      if (!error && data) {
        return data as LicenseRecord;
      }
    } catch (err) {
      console.warn('Supabase find failed, falling back to local DB:', err);
    }
  }
  const records = ensureLocalDb();
  return records.find(r => r.machine_id.toUpperCase() === normId) || null;
}

/**
 * Create or Update a license record
 */
export async function upsertLicense(record: Partial<LicenseRecord> & { machine_id: string; client_name: string }): Promise<LicenseRecord> {
  const normMachineId = record.machine_id.trim().toUpperCase();
  const existing = await getLicenseByMachineId(normMachineId);

  const issuedDate = record.issued_date || existing?.issued_date || new Date().toISOString().split('T')[0];
  const expiryDate = record.expiry_date || existing?.expiry_date || 'PERPETUAL';
  const licType = expiryDate === 'PERPETUAL' ? 'PERPETUAL' : 'SUBSCRIPTION';

  const maxUsers = record.max_users !== undefined ? Number(record.max_users) : (existing?.max_users || 0);
  const { key } = generateLicenseKey(normMachineId, record.client_name, 0, licType, expiryDate, maxUsers);

  const newRecord: LicenseRecord = {
    id: existing?.id || `lic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    client_name: record.client_name.trim(),
    machine_id: normMachineId,
    license_type: licType,
    issued_date: issuedDate,
    expiry_date: expiryDate,
    status: record.status || existing?.status || 'ACTIVE',
    license_key: key,
    max_users: maxUsers,
    app_version: record.app_version || existing?.app_version || '',
    last_ip: record.last_ip || existing?.last_ip || '',
    last_sync_at: record.last_sync_at || existing?.last_sync_at || new Date().toISOString(),
    notes: record.notes !== undefined ? record.notes : (existing?.notes || ''),
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .upsert(newRecord, { onConflict: 'machine_id' })
        .select()
        .single();
      if (!error && data) {
        return data as LicenseRecord;
      }
    } catch (err) {
      console.warn('Supabase upsert failed, updating local DB:', err);
    }
  }

  // Update local DB
  const records = ensureLocalDb();
  const idx = records.findIndex(r => r.machine_id.toUpperCase() === normMachineId);
  if (idx >= 0) {
    records[idx] = newRecord;
  } else {
    records.unshift(newRecord);
  }
  saveLocalDb(records);
  return newRecord;
}

/**
 * Record a heartbeat / sync event from a client workstation
 */
export async function recordHeartbeat(
  machineId: string, 
  appVersion: string = '', 
  ipAddress: string = ''
): Promise<LicenseRecord | null> {
  const normId = machineId.trim().toUpperCase();
  const existing = await getLicenseByMachineId(normId);
  if (!existing) {
    return null;
  }

  const updated: LicenseRecord = {
    ...existing,
    app_version: appVersion || existing.app_version,
    last_ip: ipAddress || existing.last_ip,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase
        .from('licenses')
        .update({
          app_version: updated.app_version,
          last_ip: updated.last_ip,
          last_sync_at: updated.last_sync_at,
          updated_at: updated.updated_at
        })
        .eq('machine_id', normId);
    } catch (err) {
      console.warn('Supabase heartbeat update warning:', err);
    }
  }

  const records = ensureLocalDb();
  const idx = records.findIndex(r => r.machine_id.toUpperCase() === normId);
  if (idx >= 0) {
    records[idx] = updated;
    saveLocalDb(records);
  }
  return updated;
}

/**
 * Delete a license record
 */
export async function deleteLicense(id: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('licenses').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete warning:', err);
    }
  }
  const records = ensureLocalDb();
  const filtered = records.filter(r => r.id !== id);
  saveLocalDb(filtered);
  return true;
}

/**
 * Diagnostics: Check Supabase connectivity vs local fallback
 */
export async function getDbStatus(): Promise<{
  is_supabase: boolean;
  supabase_url?: string;
  connected: boolean;
  count: number;
  error?: string;
}> {
  if (supabase) {
    try {
      const { count, error } = await supabase
        .from('licenses')
        .select('*', { count: 'exact', head: true });
      if (!error) {
        return {
          is_supabase: true,
          supabase_url: supabaseUrl.replace(/^(https?:\/\/[^\/]+).*$/, '$1'),
          connected: true,
          count: count ?? 0
        };
      } else {
        return {
          is_supabase: true,
          supabase_url: supabaseUrl.replace(/^(https?:\/\/[^\/]+).*$/, '$1'),
          connected: false,
          count: 0,
          error: error.message
        };
      }
    } catch (err: any) {
      return {
        is_supabase: true,
        connected: false,
        count: 0,
        error: err?.message || String(err)
      };
    }
  }

  const records = ensureLocalDb();
  return {
    is_supabase: false,
    connected: true,
    count: records.length
  };
}
