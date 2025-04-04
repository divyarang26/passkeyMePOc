import * as CBOR from "cbor-x/decode";
import { bufToBigint, bigintToBuf } from "bigint-conversion";
import { hash } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";

// Utility: Convert base64url to Uint8Array
function base64urlToUint8Array(base64urlString: string): Uint8Array {
  const padding = '='.repeat((4 - base64urlString.length % 4) % 4);
  const base64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Utility: Normalize input to Buffer
function toBuffer(input: ArrayBuffer | Buffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  return Buffer.from(input);
}

// Types
export interface RegistrationCredential {
  id: string;
  rawId: string;
  response: {
    attestationObject?: string;
    clientDataJSON: string;
  };
  type: string;
  clientExtensionResults?: unknown;
  authenticatorAttachment?: string;
}

// Main function to extract public key
export async function getPublicKeys(
  registration: RegistrationCredential
): Promise<{
  contractSalt: Buffer;
  publicKey?: Buffer;
}> {
  const contractSalt = hash(Buffer.from(base64urlToUint8Array(registration.id)));

  if (!registration.response.attestationObject) {
    return { contractSalt };
  }

  const { publicKeyObject } = getPublicKeyObject(registration.response.attestationObject);

  const xRaw = publicKeyObject.get(-2);
  const yRaw = publicKeyObject.get(-3);

  if (!xRaw || !yRaw) {
    throw new Error("Missing x or y coordinates in public key");
  }

  const x = toBuffer(xRaw);
  const y = toBuffer(yRaw);

  const publicKey = Buffer.concat([Buffer.from([0x04]), x, y]);

  return {
    contractSalt,
    publicKey,
  };
}

// Parses attestation object and extracts public key object
function getPublicKeyObject(attestationObject: string): {
  rpIdHash: Buffer;
  flags: number;
  signCount: number;
  aaguid: Buffer;
  credIdLength: number;
  credentialId: Buffer;
  credentialPublicKey: Buffer;
  theRest: Buffer;
  publicKeyObject: Map<number, Buffer>;
} {
  const decoded = CBOR.decode(base64urlToUint8Array(attestationObject)) as { authData: Uint8Array };
  const authData = decoded.authData;
  const view = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);

  let offset = 0;
  const rpIdHash = Buffer.from(authData.slice(offset, offset + 32));
  offset += 32;

  const flags = view.getUint8(offset++);
  const signCount = view.getUint32(offset, false);
  offset += 4;

  if ((flags & 0x40) === 0) {
    throw new Error("Attested credential data not present in the flags");
  }

  const aaguid = Buffer.from(authData.slice(offset, offset + 16));
  offset += 16;

  const credIdLength = view.getUint16(offset, false);
  offset += 2;

  const credentialId = Buffer.from(authData.slice(offset, offset + credIdLength));
  offset += credIdLength;

  const remaining = authData.slice(offset);
  const publicKeyLength = remaining.length;
  const credentialPublicKey = Buffer.from(remaining.slice(0, publicKeyLength));
  offset += publicKeyLength;

  const rawKey = CBOR.decode(credentialPublicKey) as Record<number, ArrayBuffer | Uint8Array>;
  // const publicKeyObject = new Map<number, Buffer>(
  //   Object.entries(rawKey).map(([k, v]) => [parseInt(k), toBuffer(v)])
  // );
  const publicKeyObject = new Map<number, Buffer>(
    Object.entries(rawKey)
      .filter(([_, v]) => v instanceof ArrayBuffer || ArrayBuffer.isView(v))
      .map(([k, v]) => [parseInt(k), toBuffer(v)])
  );
  

  return {
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credIdLength,
    credentialId,
    credentialPublicKey,
    theRest: Buffer.from([]), // optional
    publicKeyObject,
  };
}

// Converts ECDSA signature from ASN.1 to compact 64-byte format
export function convertEcdsaSignatureAsnToCompact(sig: Buffer): Buffer {
  const q = Buffer.from(
    "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",
    "hex"
  );

  let offset = 0;
  if (sig[offset++] !== 0x30) throw new Error("Invalid ASN.1 format (no sequence)");

  offset++; // Skip total length

  if (sig[offset++] !== 0x02) throw new Error("Missing r component");
  let rLen = sig[offset++];
  if (rLen > 32 && sig[offset] === 0x00) {
    offset++;
    rLen--;
  }
  const r = sig.slice(offset, offset + rLen).toString("hex").padStart(64, "0").slice(-64);
  offset += rLen;

  if (sig[offset++] !== 0x02) throw new Error("Missing s component");
  let sLen = sig[offset++];
  if (sLen > 32 && sig[offset] === 0x00) {
    offset++;
    sLen--;
  }
  const sRaw = sig.slice(offset, offset + sLen);
  const sBigint = bufToBigint(sRaw);
  const qBigint = bufToBigint(q);
  const halfQ = (qBigint - BigInt(1)) / BigInt(2);
  const canonicalS = sBigint > halfQ ? qBigint - sBigint : sBigint;
  const s = bigintToBuf(canonicalS).toString("hex").padStart(64, "0").slice(-64);

  return Buffer.from(r + s, "hex");
}
