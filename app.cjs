(async () => {
  try {
    await import('./dist/server/node-build.mjs');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();