// Trusted Indian Certifying Authorities (CCA India licensed).
// Static reference list for v1 — used for display and future chain-trust matching.
export interface TrustedCA {
  name: string;
  shortName: string;
  website: string;
}

export const TRUSTED_INDIAN_CAS: TrustedCA[] = [
  { name: "SafeScrypt (Sify Technologies)", shortName: "SafeScrypt", website: "https://www.safescrypt.com" },
  { name: "IDRBT (Institute for Development and Research in Banking Technology)", shortName: "IDRBT", website: "https://www.idrbt.ac.in" },
  { name: "(n)Code Solutions CA", shortName: "(n)Code", website: "https://www.ncodesolutions.com" },
  { name: "eMudhra Limited", shortName: "eMudhra", website: "https://www.e-mudhra.com" },
  { name: "C-DAC CA (Centre for Development of Advanced Computing)", shortName: "C-DAC", website: "https://cca.gov.in" },
  { name: "Capricorn Identity Services Pvt Ltd", shortName: "Capricorn", website: "https://www.certificate.digital" },
  { name: "Protean eGov Technologies (formerly NSDL)", shortName: "Protean", website: "https://www.proteantech.in" },
  { name: "Vsign (Verasys Technologies)", shortName: "Vsign", website: "https://www.vsign.in" },
  { name: "Indian Air Force", shortName: "IAF", website: "https://cca.gov.in" },
  { name: "CSC (Common Service Centre)", shortName: "CSC", website: "https://cca.gov.in" },
  { name: "RISL (RajComp Info Services Ltd)", shortName: "RISL", website: "https://cca.gov.in" },
  { name: "Indian Army", shortName: "Indian Army", website: "https://cca.gov.in" },
  { name: "IDSign (Verasys Technologies)", shortName: "IDSign", website: "https://www.idsign.com" },
  { name: "CDSL Ventures", shortName: "CDSL", website: "https://cca.gov.in" },
  { name: "Pantasign CA", shortName: "Pantasign", website: "https://www.pantasign.com" },
  { name: "XtraTrust", shortName: "XtraTrust", website: "https://www.xtratrust.com" },
  { name: "Indian Navy", shortName: "Indian Navy", website: "https://cca.gov.in" },
  { name: "ProDigiSign", shortName: "ProDigiSign", website: "https://cca.gov.in" },
  { name: "SignX", shortName: "SignX", website: "https://cca.gov.in" },
  { name: "Care4Sign", shortName: "Care4Sign", website: "https://cca.gov.in" },
  { name: "IGCAR", shortName: "IGCAR", website: "https://cca.gov.in" },
  { name: "Speed Sign", shortName: "Speed Sign", website: "https://cca.gov.in" },
  { name: "Assam Rifles", shortName: "Assam Rifles", website: "https://cca.gov.in" },
];
