import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startTopicFixtureServer } from "../tests/support/topic-fixture-server.mjs";
const server = await startTopicFixtureServer();
console.log("TOPIC FIXTURE PREVIEW ONLY — mock API :4317, UI :4318. Default npm run dev is unchanged.");
const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4318", "--strictPort"], {
  cwd: fileURLToPath(new URL("../", import.meta.url)), env: { ...process.env, VITE_API_PROXY_TARGET: "http://127.0.0.1:4317" }, stdio: "inherit", windowsHide: true,
});
const stop = () => { child.kill(); server.close(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
child.on("exit", () => { server.close(); });
