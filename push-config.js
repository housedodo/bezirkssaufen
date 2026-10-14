// Fill these in after deploying worker/ (see worker/README.md). While empty, the app simply hides the
// "mission alerts" card. Loaded by the page AND by the service worker, so it must only use `self`.
self.PUSH = {
  workerUrl: "",       // e.g. "https://bezirkssaufen-push.<your-subdomain>.workers.dev"
  vapidPublicKey: "",  // PUBLIC key printed by `node worker/gen-vapid.mjs`
};
