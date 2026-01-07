import { onRequest as __posts_ts_onRequest } from "C:\\Users\\Barry\\Desktop\\nerdxnews_repo\\functions\\posts.ts"
import { onRequest as __upload_image_ts_onRequest } from "C:\\Users\\Barry\\Desktop\\nerdxnews_repo\\functions\\upload-image.ts"

export const routes = [
    {
      routePath: "/posts",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__posts_ts_onRequest],
    },
  {
      routePath: "/upload-image",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__upload_image_ts_onRequest],
    },
  ]