// Run once:  node worker/gen-vapid.mjs
// Prints the VAPID keys for the push worker. The PUBLIC key goes into push-config.js and wrangler.toml,
// the PRIVATE key is a secret:  wrangler secret put VAPID_PRIVATE_JWK
const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const pub = Buffer.from(await crypto.subtle.exportKey("raw", publicKey)).toString("base64url");
const jwk = await crypto.subtle.exportKey("jwk", privateKey);
console.log("PUBLIC KEY (put in push-config.js and wrangler.toml):\n" + pub + "\n");
console.log("PRIVATE KEY (paste when `wrangler secret put VAPID_PRIVATE_JWK` asks, keep it secret):\n" + JSON.stringify(jwk) + "\n");
