import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
        rollupOptions: {
            input: {
                top: resolve(__dirname, 'index.html'),
                page00: resolve(__dirname, 'page00flask', 'index.html'),
            },
        },
    },
    server: {
        host: true,
        port: 5555,
    },
    
    base : '/GLSL-Creatures/'
});

