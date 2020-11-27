// import "@babel/polyfill";
// import dotenv from "dotenv";
// import "isomorphic-fetch";
// import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
// import graphQLProxy, { ApiVersion } from "@shopify/koa-shopify-graphql-proxy";
// import Koa from "koa";
// import next from "next";
// import Router from "koa-router";
// import session from "koa-session";
// import * as handlers from "./handlers/index";
// dotenv.config();
// const port = parseInt(process.env.PORT, 10) || 8081;
// const dev = process.env.NODE_ENV !== "production";
// const app = next({
//   dev,
// });
// const handle = app.getRequestHandler();
// const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES } = process.env;
// app.prepare().then(() => {
//   const server = new Koa();
//   const router = new Router();
//   server.use(
//     session(
//       {
//         sameSite: "none",
//         secure: true,
//       },
//       server
//     )
//   );
//   server.keys = [SHOPIFY_API_SECRET];
//   server.use(
//     createShopifyAuth({
//       apiKey: SHOPIFY_API_KEY,
//       secret: SHOPIFY_API_SECRET,
//       scopes: [SCOPES],

//       async afterAuth(ctx) {
//         //Auth token and shop available in session
//         //Redirect to shop upon auth
//         const { shop, accessToken } = ctx.session;
//         ctx.cookies.set("shopOrigin", shop, {
//           httpOnly: false,
//           secure: true,
//           sameSite: "none",
//         });
//         ctx.redirect("/");
//       },
//     })
//   );
//   server.use(
//     graphQLProxy({
//       version: ApiVersion.October19,
//     })
//   );
//   router.get("(.*)", verifyRequest(), async (ctx) => {
//     await handle(ctx.req, ctx.res);
//     ctx.respond = false;
//     ctx.res.statusCode = 200;
//   });
//   server.use(router.allowedMethods());
//   server.use(router.routes());
//   server.listen(port, () => {
//     console.log(`> Ready on http://localhost:${port}`);
//   });
// });

import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import graphQLProxy, { ApiVersion } from "@shopify/koa-shopify-graphql-proxy";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import session from "koa-session";
import * as handlers from "./handlers/index";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES } = process.env;
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(
    session(
      {
        sameSite: "none",
        secure: true,
      },
      server
    )
  );
  server.keys = [SHOPIFY_API_SECRET];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET,
      scopes: [SCOPES],

      async afterAuth(ctx) {
        //Auth token and shop available in session
        //Redirect to shop upon auth
        const { shop, accessToken } = ctx.session;
        ctx.cookies.set("shopOrigin", shop, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.cookies.set("shat", accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        });
        ctx.redirect("/");
      },
    })
  );

  router.get("/api/deletewebhooks/:object", async (ctx) => {
    const droppxEndpoint =
      "https://us-central1-droppx-45ac7.cloudfunctions.net/shopifywebhooks/";
    const getAllWebhooks = () => {
      const url =
        "https://" +
        ctx.cookies.get("shopOrigin") +
        "/admin/api/2020-07/" +
        ctx.params.object +
        ".json";
      return fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        method: "GET",
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
    };
    const deleteWebhookReq = (webhookId) => {
      const url =
        "https://" +
        ctx.cookies.get("shopOrigin") +
        "/admin/api/2020-07/" +
        ctx.params.object +
        "/" +
        webhookId +
        ".json";
      return fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
    };
    const { webhooks } = await getAllWebhooks();
    try {
      const deleteAllWebhooks = await Promise.all(
        webhooks.map((webhook) => deleteWebhookReq(webhook.id))
      );
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: deleteAllWebhooks,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/configurewebhooks/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/" +
      ctx.params.object +
      ".json";
    const droppxEndpoint =
      "https://us-central1-droppx-45ac7.cloudfunctions.net/shopifywebhooks/";
    const webhooks = [
      {
        webhook: {
          topic: "app/uninstalled",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "fulfillment_events/create",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "fulfillment_events/delete",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "fulfillments/update",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "fulfillments/create",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "orders/create",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "orders/updated",
          address: droppxEndpoint,
          format: "json",
        },
      },
      {
        webhook: {
          topic: "orders/partially_fulfilled",
          address: droppxEndpoint,
          format: "json",
        },
      },
    ];
    const createWebhookReq = (webhookConfig) => {
      return fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(webhookConfig),
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
    };
    try {
      const createNewWebhook = await Promise.all(
        webhooks.map((webhook) => createWebhookReq(webhook))
      );
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: createNewWebhook,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/getwebhooks/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/" +
      ctx.params.object +
      ".json";
    try {
      const getAllSubWebhooks = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        method: "GET",
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: getAllSubWebhooks,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/deletecourierservice/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/carrier_services/" +
      ctx.params.object +
      ".json";
    try {
      const deleteCourier = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: deleteCourier,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/checkcourierservice/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/" +
      ctx.params.object +
      ".json";
    try {
      const getExistingCouriers = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
        },
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: getExistingCouriers,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/createcourierservice/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/" +
      ctx.params.object +
      ".json";
    const courierDetails = {
      carrier_service: {
        name: "DroppX",
        callback_url:
          "https://us-central1-droppx-45ac7.cloudfunctions.net/shopifyprice",
        service_discovery: true,
      },
    };
    try {
      const createNewCourier = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courierDetails),
        method: "POST",
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
      ctx.res.statusCode = 200;
      ctx.body = {
        status: "success",
        data: createNewCourier,
      };
    } catch (err) {
      ctx.res.statusCode = 400;
      ctx.body = {
        status: "fail",
        error: err,
      };
    }
  });

  router.get("/api/:object", async (ctx) => {
    const url =
      "https://" +
      ctx.cookies.get("shopOrigin") +
      "/admin/api/2020-07/" +
      ctx.params.object +
      ".json";
    try {
      const results = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": ctx.cookies.get("shat"),
        },
      })
        .then((response) => response.json())
        .then((json) => {
          return json;
        });
      ctx.body = {
        status: "success",
        data: results,
      };
    } catch (err) {
      console.log("+++++", err);
    }
  });

  server.use(
    graphQLProxy({
      version: ApiVersion.October19,
    })
  );

  router.get("(.*)", verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
