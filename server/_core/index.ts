import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateEvaluationPDF } from "../pdfGenerator";
import * as db from "../db";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // PDF直接下载路由
  app.get("/api/pdf/download/:evaluationId", async (req, res) => {
    try {
      // 验证用户身份
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (e) {
        return res.status(401).json({ error: "未登录" });
      }
      
      const evaluationId = parseInt(req.params.evaluationId);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: "无效的评估ID" });
      }
      
      const evaluation = await db.getSiteEvaluationById(evaluationId, user.id);
      if (!evaluation) {
        return res.status(404).json({ error: "评估不存在" });
      }
      
      const restaurant = await db.getRestaurantById(evaluation.restaurantId, user.id);
      if (!restaurant) {
        return res.status(404).json({ error: "餐厅不存在" });
      }
      
      console.log('Generating PDF for evaluation:', evaluationId);
      const pdfBuffer = await generateEvaluationPDF({ evaluation, restaurant });
      console.log('PDF generated, size:', pdfBuffer.length);
      
      const filename = `选址评估报告_${evaluation.address.slice(0, 20)}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const encodedFilename = encodeURIComponent(filename);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF生成错误:', error);
      res.status(500).json({ error: 'PDF生成失败' });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
