import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

async function generate() {
  const keys = await generateKeyPair("RS256", {
    extractable: true,
  });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey, alg: "RS256" }] });

  console.log("\n--- COPIEZ CES VALEURS DANS VOTRE .env.local ---\n");
  console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, "\\n")}"`);
  console.log(`CONVEX_AUTH_SECRET="un_secret_aleatoire_ici"`);
  console.log("\n--- COPIEZ CES VALEURS DANS LE DASHBOARD CONVEX (Settings > Environment Variables) ---\n");
  console.log(`JWKS='${jwks}'`);
  console.log(`JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, "\\n")}"`);
}

generate();
