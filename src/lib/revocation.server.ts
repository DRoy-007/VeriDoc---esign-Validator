import * as pkijs from "pkijs";
import * as asn1js from "asn1js";

// Cache CRLs in memory to avoid repeated large downloads.
// In a real production system, this could be backed by Redis or the filesystem.
const crlCache = new Map<string, { crl: pkijs.CertificateRevocationList, expires: number }>();

/**
 * Extracts CRL Distribution Points (HTTP URIs) from a certificate.
 */
export function getCRLDistributionPoints(cert: pkijs.Certificate): string[] {
  const uris: string[] = [];
  const ext = cert.extensions?.find(e => e.extnID === "2.5.29.31");
  if (ext && ext.parsedValue && ext.parsedValue.distributionPoints) {
    for (const dp of ext.parsedValue.distributionPoints) {
      if (dp.distributionPoint) {
        for (const name of dp.distributionPoint) {
          if (name.type === 6 && typeof name.value === "string") { // URI
            uris.push(name.value);
          }
        }
      }
    }
  }
  return uris;
}

/**
 * Fetches CRLs for an array of certificates, leveraging the cache.
 */
export async function fetchCRLsForCertificates(certs: pkijs.Certificate[]): Promise<pkijs.CertificateRevocationList[]> {
  const urls = new Set<string>();
  for (const cert of certs) {
    const dps = getCRLDistributionPoints(cert);
    for (const dp of dps) {
      if (dp.startsWith("http://") || dp.startsWith("https://")) {
        urls.add(dp);
      }
    }
  }

  const results: pkijs.CertificateRevocationList[] = [];
  
  // We fetch them sequentially to avoid overwhelming the server/network, 
  // but they could be fetched in parallel.
  for (const url of urls) {
    const cached = crlCache.get(url);
    if (cached && cached.expires > Date.now()) {
      results.push(cached.crl);
      continue;
    }

    try {
      console.log(`Fetching CRL from ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const buffer = await res.arrayBuffer();
      const asn1 = asn1js.fromBER(buffer);
      if (asn1.offset === -1) throw new Error("Invalid ASN.1");
      
      const crl = new pkijs.CertificateRevocationList({ schema: asn1.result });
      
      // Determine cache time. If CRL has nextUpdate, use it. Otherwise, cache for 1 hour.
      let expires = Date.now() + 60 * 60 * 1000;
      if (crl.nextUpdate) {
        expires = crl.nextUpdate.value.getTime();
      }
      
      crlCache.set(url, { crl, expires });
      results.push(crl);
    } catch (e) {
      console.warn(`Failed to fetch/parse CRL from ${url}:`, e);
      // We continue even if one CRL fails, the validation engine might still work 
      // or will flag it depending on its strictness.
    }
  }

  return results;
}
