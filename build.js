const fs = require('fs')
const path = require('path')
const { execFileSync, spawnSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const mobileDir = __dirname
const uiDirCandidates = [
  path.resolve(rootDir, 'gowa-ui'),
  path.resolve(rootDir, 'golangwaui'),
]
const uiDir = uiDirCandidates.find((d) => fs.existsSync(d)) || path.resolve(rootDir, 'gowa-ui')

let sharp
let AdmZip
try {
  sharp = require('sharp')
} catch {
  sharp = require(path.resolve(uiDir, 'node_modules/sharp'))
}
try {
  AdmZip = require('adm-zip')
} catch {
  AdmZip = require(path.resolve(uiDir, 'node_modules/adm-zip'))
}

const isWin = process.platform === 'win32'
const linuxSdk = '/opt/data/home/.local/android-sdk'
const linuxJdk = '/opt/data/home/.local/jdk-17'

const sdkDir = isWin
  ? process.env.ANDROID_HOME || 'C:\\Users\\NCN0C\\AppData\\Local\\Android\\Sdk'
  : process.env.ANDROID_HOME || (fs.existsSync(linuxSdk) ? linuxSdk : '/opt/android-sdk')

const buildToolsVersion = fs.existsSync(path.join(sdkDir, 'build-tools/34.0.0'))
  ? '34.0.0'
  : (fs.existsSync(path.join(sdkDir, 'build-tools/36.0.0')) ? '36.0.0' : '34.0.0')

const buildToolsDir = path.join(sdkDir, 'build-tools', buildToolsVersion)
const platformJar = path.join(sdkDir, 'platforms', 'android-34', 'android.jar')
const jdkHome = isWin
  ? process.env.JAVA_HOME || 'C:\\Users\\NCN0C\\.jdks\\openjdk-26.0.1'
  : process.env.JAVA_HOME || (fs.existsSync(linuxJdk) ? linuxJdk : '/usr/lib/jvm/java-17-openjdk')
const jdkBin = path.join(jdkHome, 'bin')

process.env.JAVA_HOME = jdkHome
process.env.PATH = `${jdkBin}${path.delimiter}${buildToolsDir}${path.delimiter}${process.env.PATH}`

const aapt2 = path.join(buildToolsDir, isWin ? 'aapt2.exe' : 'aapt2')
const zipalign = path.join(buildToolsDir, isWin ? 'zipalign.exe' : 'zipalign')
const apksigner = path.join(buildToolsDir, isWin ? 'apksigner.bat' : 'apksigner')
const d8 = path.join(buildToolsDir, isWin ? 'd8.bat' : 'd8')
const javac = path.join(jdkBin, isWin ? 'javac.exe' : 'javac')
const keytool = path.join(jdkBin, isWin ? 'keytool.exe' : 'keytool')

function runTool(cmd, args, opts = {}) {
  if (isWin && (cmd.endsWith('.bat') || cmd.endsWith('.cmd'))) {
    return spawnSync('cmd.exe', ['/c', cmd, ...args], {
      cwd: mobileDir,
      env: process.env,
      stdio: 'inherit',
      ...opts,
    })
  }
  return spawnSync(cmd, args, {
    cwd: mobileDir,
    env: process.env,
    stdio: 'inherit',
    ...opts,
  })
}

async function generateDrawables() {
  const logoCandidates = [
    path.resolve(uiDir, 'src/assets/gowa-logo.webp'),
    path.resolve(uiDir, 'public/gowa-logo.webp'),
  ]
  const logoPath = logoCandidates.find((f) => fs.existsSync(f))
  if (!logoPath) return

  const densities = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
  ]

  for (const { name, size } of densities) {
    const dir = path.join(mobileDir, 'res', name)
    fs.mkdirSync(dir, { recursive: true })

    await sharp(logoPath)
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 6 })
      .toFile(path.join(dir, 'ic_launcher.png'))

    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/></svg>`
    )

    await sharp(logoPath)
      .resize(size, size, { fit: 'cover' })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png({ compressionLevel: 6 })
      .toFile(path.join(dir, 'ic_launcher_round.png'))
  }

  const splashDensities = [
    { name: 'drawable-hdpi', size: 200 },
    { name: 'drawable-xhdpi', size: 280 },
    { name: 'drawable-xxhdpi', size: 400 },
  ]

  for (const { name, size } of splashDensities) {
    const dir = path.join(mobileDir, 'res', name)
    fs.mkdirSync(dir, { recursive: true })

    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 11, g: 15, b: 25, alpha: 1 } })
      .png({ compressionLevel: 8 })
      .toFile(path.join(dir, 'splash_logo.png'))

    const bannerWidth = Math.round(size * 1.8)
    const bannerHeight = size
    await sharp(logoPath)
      .resize(Math.round(size * 0.7), Math.round(size * 0.7), { fit: 'contain' })
      .extend({
        top: Math.round(bannerHeight * 0.15),
        bottom: Math.round(bannerHeight * 0.15),
        left: Math.round((bannerWidth - Math.round(size * 0.7)) / 2),
        right: Math.round((bannerWidth - Math.round(size * 0.7)) / 2),
        background: { r: 11, g: 15, b: 25, alpha: 1 },
      })
      .png({ compressionLevel: 8 })
      .toFile(path.join(dir, 'gowa_banner.png'))
  }

  const valuesDir = path.join(mobileDir, 'res', 'values')
  fs.mkdirSync(valuesDir, { recursive: true })
  fs.writeFileSync(
    path.join(valuesDir, 'strings.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">GoWA</string>\n</resources>\n',
    'utf-8'
  )
}

async function build() {
  await generateDrawables()

  const distHtml = path.resolve(uiDir, 'dist/index.html')
  if (!fs.existsSync(distHtml)) {
    throw new Error(`dist/index.html not found. Run npm run build in ${uiDir} first.`)
  }

  const assetsDir = path.join(mobileDir, 'assets')
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.copyFileSync(distHtml, path.join(assetsDir, 'index.html'))

  const buildDir = path.join(mobileDir, 'build')
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true })
  }
  const classesDir = path.join(buildDir, 'classes')
  const dexDir = path.join(buildDir, 'dex')
  fs.mkdirSync(classesDir, { recursive: true })
  fs.mkdirSync(dexDir, { recursive: true })

  const resZip = path.join(buildDir, 'res.zip')
  const resDir = path.join(mobileDir, 'res')
  execFileSync(aapt2, ['compile', '--dir', resDir, '-o', resZip], {
    cwd: mobileDir,
    env: process.env,
    stdio: 'inherit',
  })

  const manifestPath = path.join(mobileDir, 'AndroidManifest.xml')
  const unalignedApk = path.join(buildDir, 'unaligned.apk')
  execFileSync(
    aapt2,
    [
      'link',
      '-I',
      platformJar,
      '--min-sdk-version',
      '21',
      '--target-sdk-version',
      '34',
      '--version-code',
      '3',
      '--version-name',
      '1.1.2',
      '--manifest',
      manifestPath,
      '-R',
      resZip,
      '-A',
      assetsDir,
      '-o',
      unalignedApk,
      '--auto-add-overlay',
    ],
    {
      cwd: mobileDir,
      env: process.env,
      stdio: 'inherit',
    }
  )

  const javaSrc = path.join(mobileDir, 'src/id/sumopod/gowa/MainActivity.java')
  execFileSync(javac, ['--release', '8', '-cp', platformJar, '-d', classesDir, javaSrc], {
    cwd: mobileDir,
    env: process.env,
    stdio: 'inherit',
  })

  const classFiles = fs
    .readdirSync(path.join(classesDir, 'id/sumopod/gowa'))
    .filter((f) => f.endsWith('.class'))
    .map((f) => path.join(classesDir, 'id/sumopod/gowa', f))

  const d8Res = runTool(d8, ['--min-api', '21', '--lib', platformJar, '--output', dexDir, ...classFiles])
  if (d8Res.status !== 0) {
    throw new Error(`D8 compilation failed with exit code ${d8Res.status}`)
  }

  const zip = new AdmZip(unalignedApk)
  zip.addLocalFile(path.join(dexDir, 'classes.dex'))
  zip.writeZip(unalignedApk)

  const alignedApk = path.join(buildDir, 'aligned.apk')
  execFileSync(zipalign, ['-p', '-f', '4', unalignedApk, alignedApk], {
    cwd: mobileDir,
    env: process.env,
    stdio: 'inherit',
  })

  const keystore = path.join(mobileDir, 'debug.keystore')
  if (!fs.existsSync(keystore)) {
    execFileSync(
      keytool,
      [
        '-genkeypair',
        '-v',
        '-keystore',
        keystore,
        '-storepass',
        'android',
        '-alias',
        'androiddebugkey',
        '-keypass',
        'android',
        '-keyalg',
        'RSA',
        '-keysize',
        '2048',
        '-validity',
        '10000',
        '-dname',
        'CN=GoWA,OU=GoWA,O=GoWA,L=Jakarta,ST=Jakarta,C=ID',
      ],
      { cwd: mobileDir, env: process.env, stdio: 'inherit' }
    )
  }

  const outputApk = path.join(mobileDir, 'gowa.apk')
  const signRes = runTool(apksigner, [
    'sign',
    '--v1-signing-enabled',
    'true',
    '--v2-signing-enabled',
    'true',
    '--v3-signing-enabled',
    'true',
    '--min-sdk-version',
    '21',
    '--ks',
    keystore,
    '--ks-pass',
    'pass:android',
    '--key-pass',
    'pass:android',
    '--out',
    outputApk,
    alignedApk,
  ])
  if (signRes.status !== 0) {
    throw new Error(`APK signing failed with exit code ${signRes.status}`)
  }

  const verifyRes = runTool(apksigner, ['verify', '--verbose', outputApk])
  if (verifyRes.status !== 0) {
    throw new Error(`APK verification failed with exit code ${verifyRes.status}`)
  }

  const targetDirs = [
    path.resolve(rootDir, 'gowanew/statics'),
    path.resolve(rootDir, 'gowanew/src/storages/statics'),
    path.resolve(rootDir, 'gowa-ui/public/statics'),
    path.resolve(rootDir, 'golangwa/statics'),
    path.resolve(rootDir, 'golangwaui/public/statics'),
  ]

  for (const dir of targetDirs) {
    if (fs.existsSync(path.dirname(dir))) {
      fs.mkdirSync(dir, { recursive: true })
      fs.copyFileSync(outputApk, path.join(dir, 'gowa.apk'))
    }
  }

  const stat = fs.statSync(outputApk)
  console.log(`\n=== GoWA Mobile APK Build Complete ===`)
  console.log(`Location: ${outputApk}`)
  console.log(`Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`)
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
