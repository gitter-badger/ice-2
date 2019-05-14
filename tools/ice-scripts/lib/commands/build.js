// TODO: 感觉不太合适
process.env.NODE_ENV = 'production';

const gulp = require('gulp');
const rimraf = require('rimraf');
const webpack = require('webpack');
const { collectDetail } = require('@alifd/fusion-collector');
const iceScriptsPkgData = require('../../package.json');
const goldlog = require('../utils/goldlog');
const log = require('../utils/log');
const validationSassAvailable = require('../utils/validationSassAvailable');
const checkDepsInstalled = require('../utils/checkDepsInstalled');

/**
 * 构建项目：cli 调用；云构建方法调用
 *
 * 因为 build 方法有可能被直接调用，因此需要保证自身功能的完整性
 *
 * @param {Object} options 命令行参数
 */
module.exports = async function (api) {
  goldlog('version', {
    version: iceScriptsPkgData.version,
  });
  goldlog('build', api.commandArgs);
  log.verbose('build cliOptions', api.commandArgs);

  const installedDeps = checkDepsInstalled(api.paths.appDirectory);
  if (!installedDeps) {
    log.error('项目依赖未安装，请先安装依赖。');
    process.exit(1);
  }

  if (api.userConfig.type === 'project') {
    validationSassAvailable();

    try {
      collectDetail({
        rootDir: api.context, // 项目根地址
        basicPackage: ['@alifd/next', '@icedesign/base', '@alife/next'], // 主体包名称
        kit: 'ice-scripts', // 统计的来源
      });
    } catch (err) {
      log.warn('collectDetail error', err);
    }
  }

  const webpackConfig = api.config;

  // build task
  gulp.task('build', ['clean'], () => {
    gulp.start(['webpack']);
  });

  gulp.task('clean', (done) => {
    rimraf(webpackConfig.output.path, done);
  });

  // webpack 打包工作流
  gulp.task('webpack', (done) => {
    webpack(webpackConfig, (error, stats) => {
      if (error) {
        throw error;
      } else {
        console.log(
          stats.toString({
            colors: true,
            chunks: false,
            children: false,
            modules: false,
            chunkModules: false,
          })
        );
        if (stats.hasErrors()) {
          throw new Error('webpack compiled failed.');
        }
      }

      done();
    });
  });

  gulp.start('build', (err) => {
    if (err) {
      log.error('ICE BUILD ERROR', err);
    } else {
      log.info('ICE build finished');
    }
  });
};