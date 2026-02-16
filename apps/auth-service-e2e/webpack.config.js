const {NxAppWebpackPlugin} = require('@nx/webpack/app-plugin')
const {join} = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': join(__dirname, 'src'),
      '@packages': join(__dirname, '../../packages'),
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    })
  ]
};
