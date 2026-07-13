import * as pkijs from "pkijs";
console.log("Verify params keys:");
try { 
  new pkijs.CertificateChainValidationEngine({}).verify(); 
} catch (e) {
  console.log(e.message);
}
