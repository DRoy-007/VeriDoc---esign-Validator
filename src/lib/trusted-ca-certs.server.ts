import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

// Helper to parse a PEM or DER file into a pkijs Certificate
export function parseCertificateFile(filePath: string): pkijs.Certificate | null {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    
    let buffer: ArrayBuffer;
    if (ext === ".pem" || ext === ".crt") {
      const text = data.toString('utf8');
      const b64 = text
        .replace(/-----BEGIN CERTIFICATE-----/g, "")
        .replace(/-----END CERTIFICATE-----/g, "")
        .replace(/\s/g, "");
      const buf = Buffer.from(b64, 'base64');
      buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    } else if (ext === ".der" || ext === ".cer") {
      buffer = new Uint8Array(data).buffer;
    } else {
      // Try treating as DER first, then PEM
      try {
        buffer = new Uint8Array(data).buffer;
        const test = asn1js.fromBER(buffer);
        if (test.offset === -1) throw new Error();
      } catch {
        const text = data.toString('utf8');
        const b64 = text.replace(/-----BEGIN CERTIFICATE-----/g, "").replace(/-----END CERTIFICATE-----/g, "").replace(/\s/g, "");
        const buf = Buffer.from(b64, 'base64');
        buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      }
    }

    const asn1 = asn1js.fromBER(buffer);
    if (asn1.offset === -1) {
      console.warn(`Failed to parse certificate ASN.1 structure in ${filePath}`);
      return null;
    }
    return new pkijs.Certificate({ schema: asn1.result });
  } catch (e) {
    console.warn(`Error reading certificate file ${filePath}:`, e);
    return null;
  }
}

let _trustedRoots: pkijs.Certificate[] | null = null;
let _trustedIntermediates: pkijs.Certificate[] | null = null;

export function reloadTrustStore() {
  _trustedRoots = null;
  _trustedIntermediates = null;
}

export function getTrustedRootCerts(): pkijs.Certificate[] {
  if (_trustedRoots) return _trustedRoots;
  
  _trustedRoots = [];
  const dirs = [
    path.join(process.cwd(), "src", "lib", "trust-store", "roots"),
    path.join(os.tmpdir(), "trust-store", "roots")
  ];
  
  for (const rootsDir of dirs) {
    if (fs.existsSync(rootsDir)) {
      const files = fs.readdirSync(rootsDir);
      for (const file of files) {
        const cert = parseCertificateFile(path.join(rootsDir, file));
        if (cert) _trustedRoots.push(cert);
      }
    }
  }
  return _trustedRoots;
}

export function getTrustedIntermediates(): pkijs.Certificate[] {
  if (_trustedIntermediates) return _trustedIntermediates;
  
  _trustedIntermediates = [];
  const intDir = path.join(process.cwd(), "src", "lib", "trust-store", "intermediates");
  if (fs.existsSync(intDir)) {
    const files = fs.readdirSync(intDir);
    for (const file of files) {
      const cert = parseCertificateFile(path.join(intDir, file));
      if (cert) _trustedIntermediates.push(cert);
    }
  }
  return _trustedIntermediates;
}

// ---------------------------------------------------------------------------
// Identity Helpers
// ---------------------------------------------------------------------------

export function getCertificateCN(cert: pkijs.Certificate): string {
  for (const rdn of cert.subject.typesAndValues) {
    if (rdn.type === "2.5.4.3") {
      return rdn.value.valueBlock.value as string;
    }
  }
  return "";
}

export function getCertificateOrg(cert: pkijs.Certificate): string {
  for (const rdn of cert.subject.typesAndValues) {
    if (rdn.type === "2.5.4.10") {
      return rdn.value.valueBlock.value as string;
    }
  }
  return "";
}

export function getIssuerCN(cert: pkijs.Certificate): string {
  for (const rdn of cert.issuer.typesAndValues) {
    if (rdn.type === "2.5.4.3") {
      return rdn.value.valueBlock.value as string;
    }
  }
  return "";
}

export function getIssuerOrg(cert: pkijs.Certificate): string {
  for (const rdn of cert.issuer.typesAndValues) {
    if (rdn.type === "2.5.4.10") {
      return rdn.value.valueBlock.value as string;
    }
  }
  return "";
}

export function isKnownIndianCA(cert: pkijs.Certificate): boolean {
  const cn = getCertificateCN(cert).toLowerCase();
  const org = getCertificateOrg(cert).toLowerCase();
  const issuerCn = getIssuerCN(cert).toLowerCase();
  const issuerOrg = getIssuerOrg(cert).toLowerCase();
  const all = [cn, org, issuerCn, issuerOrg].join(" ");

  if (all.includes("care4sign")) return true;
  if (all.includes("emudhra")) return true;
  if (all.includes("capricorn")) return true;
  if (all.includes("safescrypt") || all.includes("sify")) return true;
  if (all.includes("ncode") || all.includes("(n)code")) return true;
  if (all.includes("pantasign")) return true;
  if (all.includes("idsign") || all.includes("verasys") || all.includes("vsign")) return true;
  if (all.includes("nic") && (all.includes("national informatics") || all.includes("nicca"))) return true;
  if (all.includes("cdac") || all.includes("c-dac")) return true;
  if (all.includes("idrbt")) return true;
  if (all.includes("cca india") || all.includes("controller of cert")) return true;
  if (all.includes("signx") || all.includes("futuriq")) return true;
  
  return false;
}

// Map a certificate to a human-readable CA name (for the UI)
export function identifyCA(cert: pkijs.Certificate): { name: string; shortName: string } {
  const cn = getCertificateCN(cert).toLowerCase();
  const org = getCertificateOrg(cert).toLowerCase();
  const issuerCn = getIssuerCN(cert).toLowerCase();
  const issuerOrg = getIssuerOrg(cert).toLowerCase();
  const all = [cn, org, issuerCn, issuerOrg].join(" ");

  if (all.includes("care4sign")) return { name: "Care4Sign", shortName: "Care4Sign" };
  if (all.includes("emudhra")) return { name: "eMudhra Limited", shortName: "eMudhra" };
  if (all.includes("capricorn")) return { name: "Capricorn Identity Services Pvt Ltd", shortName: "Capricorn" };
  if (all.includes("safescrypt") || all.includes("sify")) return { name: "Sify Safescrypt", shortName: "SafeScrypt" };
  if (all.includes("ncode") || all.includes("(n)code")) return { name: "(n)Code Solutions CA", shortName: "(n)Code" };
  if (all.includes("pantasign")) return { name: "Pantasign CA", shortName: "Pantasign" };
  if (all.includes("idsign") || all.includes("verasys") || all.includes("vsign"))
    return { name: "IDSign (Verasys Technologies)", shortName: "IDSign" };
  if (all.includes("nic") && (all.includes("national informatics") || all.includes("nicca")))
    return { name: "National Informatics Centre CA", shortName: "NIC CA" };
  if (all.includes("cdac") || all.includes("c-dac"))
    return { name: "CDAC CA", shortName: "CDAC" };
  if (all.includes("idrbt"))
    return { name: "IDRBT CA", shortName: "IDRBT" };
  if (all.includes("cca india") || all.includes("controller of cert"))
    return { name: "CCA India (Root)", shortName: "CCA India" };
  if (all.includes("signx") || all.includes("futuriq"))
    return { name: "SignX (FuturiQ Systems)", shortName: "SignX" };

  const fallbackName = getIssuerCN(cert) || getIssuerOrg(cert) || "Unknown CA";
  return { name: fallbackName, shortName: fallbackName };
}
