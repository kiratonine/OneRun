import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Дев-сервер слушает и на локальной сети: /demo нужно открывать с телефона,
  // а не только с ноутбука. `npm run dev` печатает адрес в строке Network.
  server: { host: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
