import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write('Building for production...\n');
        },
        buildEnd() {
            const line = "————————————————————————————————————————————————————";
            const msg = '♥♥♥ Tell us about your game! — games@phaser.io ♥♥♥';
            process.stdout.write(`${line}\n${msg}\n${line}\n`);
            process.stdout.write('✨ Done ✨\n');
        }
    }
};

export default defineConfig({
    base: './',
    plugins: [
        react(),
        phasermsg()
    ],
    publicDir: 'public', // Ensure this is set
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'], // Add this line
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        },
        // Add this section
        assetsDir: 'assets',
        copyPublicDir: true
    },
    server: {
        // Add this section
        watch: {
            usePolling: true,
            ignored: ['!**/node_modules/**']
        }
    }
});