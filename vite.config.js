export default {
  root: './src',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Makes one JS file on build
      },
    },
  },
};
