import crypto from 'crypto';

export const MASTER_VENDOR_SECRET = process.env.VENDOR_SECRET || "DH_MEDISURG_SECURE_KERNEL_NODE_LOCK_2026_X91A_OFFLINE";

export interface LicensePayload {
  machine_id: string;
  client: string;
  type: string;
  issued: string;
  expires: string;
  sig: string;
  max_users?: number;
}

export interface GeneratedLicense {
  key: string;
  payload: LicensePayload;
}

/**
 * Computes deterministic HMAC-SHA256 signature and base64 encoded license key
 * with 100% cryptographic parity to Brain's keygen.py and license_guard.py.
 */
export function generateLicenseKey(
  machineId: string,
  clientName: string,
  days: number = 0,
  licType: string = "PERPETUAL",
  customExpiryDate?: string,
  maxUsers: number = 0
): GeneratedLicense {
  const cleanMachineId = machineId.trim().toUpperCase();
  const cleanClient = clientName.trim();
  let expDate = "PERPETUAL";
  let type = licType;

  if (customExpiryDate) {
    expDate = customExpiryDate.trim().toUpperCase() === "PERPETUAL" ? "PERPETUAL" : customExpiryDate.trim();
    type = expDate === "PERPETUAL" ? "PERPETUAL" : "SUBSCRIPTION";
  } else if (days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    expDate = d.toISOString().split('T')[0];
    type = "SUBSCRIPTION";
  } else {
    expDate = "PERPETUAL";
    type = "PERPETUAL";
  }

  const canonical = maxUsers > 0
    ? `${cleanMachineId}|${cleanClient}|${type}|${expDate}|${maxUsers}`
    : `${cleanMachineId}|${cleanClient}|${type}|${expDate}`;
  const sig = crypto.createHmac('sha256', MASTER_VENDOR_SECRET).update(canonical, 'utf-8').digest('hex');

  const payload: LicensePayload = {
    machine_id: cleanMachineId,
    client: cleanClient,
    type: type,
    issued: new Date().toISOString().split('T')[0],
    expires: expDate,
    sig: sig,
    ...(maxUsers > 0 ? { max_users: maxUsers } : {})
  };

  const rawJson = JSON.stringify(payload);
  const b64 = Buffer.from(rawJson, 'utf-8').toString('base64');

  return {
    key: `DH-LIC-${b64}`,
    payload
  };
}

/**
 * Decodes and verifies a license string against its HMAC-SHA256 signature.
 */
export function verifyLicenseSignature(rawKey: string): { valid: boolean; payload?: LicensePayload; error?: string } {
  try {
    let keyStr = rawKey.trim();
    if (keyStr.startsWith("DH-LIC-")) {
      keyStr = keyStr.substring(7);
    }
    const rawJson = Buffer.from(keyStr, 'base64').toString('utf-8');
    const data: LicensePayload = JSON.parse(rawJson);

    if (!data.machine_id || !data.client || !data.expires || !data.sig) {
      return { valid: false, error: "Missing required license fields." };
    }

    const candidates = [];
    if (data.max_users !== undefined && Number(data.max_users) > 0) {
      candidates.push(`${data.machine_id}|${data.client}|${data.type || 'PERPETUAL'}|${data.expires}|${data.max_users}`);
    }
    candidates.push(`${data.machine_id}|${data.client}|${data.type || 'PERPETUAL'}|${data.expires}`);

    let isValid = false;
    for (const canon of candidates) {
      const expectedSig = crypto.createHmac('sha256', MASTER_VENDOR_SECRET).update(canon, 'utf-8').digest('hex');
      if (crypto.timingSafeEqual(Buffer.from(data.sig), Buffer.from(expectedSig))) {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      return { valid: true, payload: data };
    } else {
      return { valid: false, error: "Cryptographic signature mismatch." };
    }
  } catch (err: any) {
    return { valid: false, error: `Invalid license format: ${err?.message || err}` };
  }
}
