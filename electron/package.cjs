const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const staging = path.join(root, '.electron-build');
const output = path.join(root, 'dist-electron');

fs.rmSync(staging, { recursive: true, force: true });
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true });
fs.cpSync(path.join(root, 'electron'), path.join(staging, 'electron'), { recursive: true });
fs.cpSync(path.join(root, 'assets'), path.join(staging, 'assets'), { recursive: true });

const packageJson = {
  name: 'alco-auto-motion-desktop',
  version: '1.0.0',
  description: 'ALCO Auto Motion desktop application',
  author: 'Aladzan Corpora',
  main: 'electron/main.cjs',
  build: {
    appId: 'com.alco.automotion',
    productName: 'ALCO Auto Motion',
    electronVersion: '44.1.1',
    directories: { output: '../dist-electron' },
    files: ['dist/**/*', 'electron/**/*', 'assets/**/*'],
    extraResources: [{ from: 'assets', to: 'assets' }],
    asar: true,
    asarUnpack: ['dist/**/*'],
    win: { icon: 'assets/icon.ico', target: [{ target: 'nsis', arch: ['x64'] }] },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      artifactName: 'ALCO Auto Motion Setup ${version}.${ext}',
    },
  },
};

fs.writeFileSync(path.join(staging, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
const builder = path.join(root, 'node_modules', 'electron-builder', 'cli.js');
const result = spawnSync(process.execPath, [builder, '--win', '--projectDir', staging], { cwd: root, stdio: 'inherit' });
fs.rmSync(staging, { recursive: true, force: true });
process.exit(result.status ?? 1);
