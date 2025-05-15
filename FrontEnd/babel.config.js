module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }], // 👈 ensures no React import is needed
    '@babel/preset-typescript',
  ],
};
