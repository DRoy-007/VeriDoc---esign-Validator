const fs = require('fs');
const d = fs.readFileSync('src/lib/trusted-ca-certs.server.ts', 'utf8');
const m1 = d.match(/CCA_INDIA_2014_PEM = `([\s\S]*?)`/);
const m2 = d.match(/CCA_INDIA_2011_PEM = `([\s\S]*?)`/);
if (m1) fs.writeFileSync('src/lib/trust-store/roots/cca-india-2014.pem', m1[1]);
if (m2) fs.writeFileSync('src/lib/trust-store/roots/cca-india-2011.pem', m2[1]);
