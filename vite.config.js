import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 서버는 base 가 '/' 여야 루트(/) 요청이 정상입니다. './' 는 빌드(dist 더블클릭)용만 사용합니다.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "./" : "/",
  css: {
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    proxy: {
      "/anthropic": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/anthropic/, ""),
      },
    },
  },
}));
