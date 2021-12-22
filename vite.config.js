export default {
  root: './src',
  base: '/cityscape/',
  build: {
    outDir: '../docs',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Makes one JS file on build
      },
    },
  },
}
