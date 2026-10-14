// Fill these in after deploying worker/ (see worker/README.md). While empty, the app simply hides the
// "mission alerts" card. Loaded by the page AND by the service worker, so it must only use `self`.
self.PUSH = {
  workerUrl: "https://bezirkssaufen.domi-dominkovic.workers.dev",       // e.g. "https://bezirkssaufen-push.<your-subdomain>.workers.dev"
  syncSteps: true,     // true = neither girl continues until BOTH solved the stop (needs the worker); false = off
  lobby: true,         // true = a phone that picked its name shows "Under construction" until the host presses Start game; false = off
  vapidPublicKey: "BCWZ9MIa7Z61oRgw9Sdpmkhqyaufd_ORF264u-oZChgWvWNFe9p7zeKWXfRJsP21ccyMMUqQkRaw7djHQMxfdQY",  // PUBLIC key printed by `node worker/gen-vapid.mjs`
};
