const crypto = require("node:crypto");
const { signatures, lit } = require("./main-history-fixture.cjs");
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex");
const contractExpression = `jsonb_build_object(
 'bodyHash',encode(extensions.digest(convert_to(p.prosrc,'UTF8'),'sha256'),'hex'),
 'language',l.lanname,'argnames',to_jsonb(p.proargnames),
 'defaults',pg_get_expr(p.proargdefaults,0),'returns',format_type(p.prorettype,NULL),
 'returnsSet',p.proretset,'volatility',p.provolatile,'strict',p.proisstrict,
 'parallel',p.proparallel,'leakproof',p.proleakproof,'definer',p.prosecdef,
 'owner',pg_get_userbyid(p.proowner),'config',to_jsonb(p.proconfig),
 'anonExecute',has_function_privilege('anon',p.oid,'EXECUTE'),
 'authenticatedExecute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
 'serviceExecute',has_function_privilege('service_role',p.oid,'EXECUTE'),
 'publicExecute',EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE'))`;
async function contracts(db, names = signatures) {
  const out = {};
  for (const signature of names) {
    const { rows } = await db.query(
      `SELECT ${contractExpression} AS contract,p.prosrc AS body FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang WHERE p.oid=to_regprocedure(${lit(signature)})`,
    );
    if (rows.length !== 1)
      throw new Error("Missing fictional contract: " + signature);
    const { bodyHash, ...metadata } = rows[0].contract;
    out[signature] = {
      metadata,
      bodyHashes: [
        ...new Set([
          bodyHash,
          hash(rows[0].body.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")),
        ]),
      ],
    };
  }
  return out;
}
module.exports = { contractExpression, contracts, hash };
