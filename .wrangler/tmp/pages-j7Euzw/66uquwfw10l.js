// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: ["/posts*", "/upload-image*", "/health*", "/articles*"],
  exclude: [
    "/assets/*",
    "/favicon.ico",
    "/logo.jpg",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "C:\\Users\\Barry\\Desktop\\nerdxnews_repo\\.wrangler\\tmp\\pages-j7Euzw\\functionsWorker-0.9566778583931561.mjs";
import { isRoutingRuleMatch } from "C:\\Users\\Barry\\Desktop\\nerdxnews_repo\\node_modules\\wrangler\\templates\\pages-dev-util.ts";
export * from "C:\\Users\\Barry\\Desktop\\nerdxnews_repo\\.wrangler\\tmp\\pages-j7Euzw\\functionsWorker-0.9566778583931561.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=66uquwfw10l.js.map
