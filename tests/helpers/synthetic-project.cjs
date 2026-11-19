// Synthetic fixture configuration only. Never imported by application builds.
const projectRef = "abcdefghijklmnopqrst";
const token = (claims) =>
  Buffer.from(JSON.stringify(claims)).toString("base64url");
const publicKey = (ref) =>
  token({ alg: "HS256", typ: "JWT" }) +
  "." +
  token({ role: "anon", ref }) +
  ".fictional_signature_no_remote_use";
const config = {
  environment: "synthetic-test",
  projectName: "jaxon-maths-v3-staging",
  projectRef,
  authorizedRef: projectRef,
  url: `https://${projectRef}.supabase.co`,
  anonKey: publicKey(projectRef),
};
const identity = {
  name: config.projectName,
  projectRef,
  environmentKind: "synthetic-test",
  syntheticOnly: true,
  syntheticContractVersion: 1,
  saveReceiptVersion: 1,
};
module.exports = { config, identity, publicKey };
