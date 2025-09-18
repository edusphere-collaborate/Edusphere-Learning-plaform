import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables properly
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [
      react(),
    ],
    server: {
      sourcemapIgnoreList: () => true, // Ignore all source maps in dev server
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: true,
          // Remove the rewrite to preserve the /api prefix
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    esbuild: {
      // Suppress SES lockdown warnings in development
      define: {
        'process.env.NODE_ENV': '"development"'
      }
    },
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3001'),
      'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL || 'ws://localhost:3001'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_API_TIMEOUT': JSON.stringify(process.env.REACT_APP_API_TIMEOUT || '10000'),
      'process.env.REACT_APP_API_RETRIES': JSON.stringify(process.env.REACT_APP_API_RETRIES || '3'),
      'process.env.REACT_APP_MOCK_API': JSON.stringify(process.env.REACT_APP_MOCK_API || 'false'),
      'process.env.REACT_APP_DEBUG_WS': JSON.stringify(process.env.REACT_APP_DEBUG_WS || 'false'),
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@shared": path.resolve(import.meta.dirname, "..", "shared"),
        "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
      },
    },
    optimizeDeps: {
      exclude: ['@radix-ui/react-slot', 'clsx'],
      include: ['react', 'react-dom', 'react-hook-form']
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
      sourcemap: false, // Disable source maps to prevent warnings
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-slot', 'clsx'],
            forms: ['react-hook-form', '@hookform/resolvers']
          }
        }
      }
    }
  };
});
