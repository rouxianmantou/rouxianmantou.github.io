// const gulp = require('gulp');
const { watch, series, src, dest } = require('gulp');
const gulpPlumber = require('gulp-plumber');
const changed = require('gulp-changed');
const sass = require('gulp-sass');
const bs = require('browser-sync').create();
const run = require('gulp4-run-sequence');
const cp = require('child_process');
const $if = require("gulp-if");
const sourcemaps = require('gulp-sourcemaps');
const util = require("gulp-util");
const rollup = require("./buildtools/rollup");
const imagemin = require('gulp-imagemin');
const pngquant = require("imagemin-pngquant");
const toml = require("toml");
const fs = require("fs");
const hugoLunr = require('hugo-lunr-zh');

const siteConf = toml.parse(fs.readFileSync("./config.toml"));
const c = Object.assign({}, require('./package.json').config);
const testDir = '.tmp';
const srcDir = 'assets';
const themeDir = 'theme/canoe';
const prodDir = siteConf.publishDir || "public";

let env = 'dev' // dev, prod, theme

exports.serve = series(buildDev, serve);

function serve(done) {
  bs.init({
    reloadDebounce: 200,
    port: c.port,
    server: {
      baseDir: testDir
    }
  })

  watch(`${srcDir}/style/**/*.{scss,css}`, style);
  watch(`${srcDir}/image/**/*.{png,jpg}`, image);
  watch(`${srcDir}/pimg/**/*.{png,jpg}`, pimg);

  //todo
  const toReload = [`${testDir}/**/*.html`, `${testDir}/js/**/*.js`];
  const watcher = watch(toReload);
  watcher.on('change', function (path, stats) {
    console.log(`File ${path} was changed.`);
    bs.reload();
  });

  done();
}

function buildDev(cb) {
  run([hugo],
    [style, script, image, pimg, copyStatic, lunr],
    cb);
}

function hugo(cb) {
  const prodArgs = ["-d", `./${testDir}`];
  const devArgs = ["-d", `./${testDir}`, "-w", "-b", "/."];
  const hugo = cp.spawn("hugo", env === "dev" ? devArgs : prodArgs);
  hugo.stdout.on("data", data => util.log(data.toString()));
  hugo.stderr.on("data", data => util.log("error: ", data.toString()));
  hugo.on("exit", code => {
    util.log("hugo process exited with code", code);
    env !== "dev" && cb();
  });
  // env == dev is in watch mode
  env === "dev" && cb();
}

function style() {
  const destDir = env === "theme" ? `${themeDir}/static/css` : `${testDir}/css`;
  console.log(`'The env is ${env}'`)
  return src(`${srcDir}/style/**/*.{scss,css}`)
    .pipe(gulpPlumber())
    .pipe(changed(destDir))
    .pipe($if(env === "dev", sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe($if(env === "dev", sourcemaps.write()))
    .pipe(dest(destDir))
    .pipe(bs.stream({ match: "**/*.css" }));
}

function script() {
  const destDir = env === 'theme' ? `${themeDir}/static/css` : `${testDir}/css`;
  return rollup(
    [
      {
        entry: `./${srcDir}/script/polyfill.ts`,
        dest: `./${destDir}/polyfill.js`
      },
      { entry: `./${srcDir}/script/index.ts`, dest: `./${destDir}/index.js` },
      { entry: `./${srcDir}/script/canvas.ts`, dest: `./${destDir}/canvas.js` }
      // { entry: `${srcDir}/script/worker.ts`, dest: `./${destDir}/worker.js` }
    ],
    env === "dev"
  );
}

function image() {
  const destDir = env === 'theme' ? `${themeDir}/static/img` : `${testDir}/img`;
  return src(`${srcDir}/image/**/*.{png,jpg}`)
    .pipe(changed(destDir))
    .pipe(
      $if(
        env !== "dev",
        imagemin({
          progressive: true,
          use: [pngquant({ quality: 90 })]
        })
      )
    )
    .pipe(dest(destDir))
    .pipe(bs.stream({ match: "**/*.{png,jpg}" }));
}

function pimg() {
  const destDir = `${testDir}/pimg`;
  return src(`pimg/**/*.{png,jpg}`)
    .pipe(changed(destDir))
    .pipe(
      $if(
        env !== "dev",
        imagemin({
          progressive: true,
          use: [pngquant({ quality: 90 })]
        })
      )
    )
    .pipe(dest(destDir))
    .pipe(bs.stream({ match: "**/*.{png,jpg}" }));
}

function copyStatic() {
  console.log("I start copy:static task!")
  const destDir =
    env === "dev" ? testDir : env === "prod" ? prodDir : `${themeDir}/static`;
  return src(`${srcDir}/static/**/*`)
    .pipe(dest(destDir));
}

function lunr() {
  const destDir = env === "dev" ? testDir : prodDir;
  const option = {
    output: `${destDir}/index.json`
  };
  if (siteConf.metaDataFormat === "yaml") {
    option.matterDelims = "---";
    option.matterType = "yaml";
  }
  return hugoLunr(option);
}