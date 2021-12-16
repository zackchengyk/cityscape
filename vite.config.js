export default {
  root: './src',
  build: {
    outDir: '../docs',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Makes one JS file on build
      },
    },
  },
}
