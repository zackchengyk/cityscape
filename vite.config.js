export default {
  root: './src',
  base: '/l-cityscape/',
  build: {
    outDir: '../docs',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Makes one JS file on build
      },
    },
  },
}
