'use strict';

const pathFn = require('path');
const fs = require('hexo-fs');
const { underline } = require('picocolors');
const moment = require('moment');
const { spawn } = require('hexo-util');

const assetDir = pathFn.join(__dirname, '../assets');

module.exports = function(args) {
  const baseDir = this.base_dir;
  const publicDir = this.public_dir;
  const deployDir = pathFn.join(baseDir, '.deploy_heroku');
  const deployPubDir = pathFn.join(deployDir, 'public');
  const log = this.log;
  const message = commitMessage(args);
  const verbose = !args.silent;

  if (!args.repo && !args.repository) {
    let help = '';

    help += 'You have to configure the deployment settings in _config.yml first!\n\n';
    help += 'Example:\n';
    help += '  deploy:\n';
    help += '    type: heroku\n';
    help += '    repo: <repository url>\n';
    help += '    message: [message]\n\n';
    help += 'For more help, you can check the docs: ' + underline('http://hexo.io/docs/deployment.html');

    console.log(help);
    return;
  }

  function git() {
    const len = arguments.length;
    const args = new Array(len);

    for (let i = 0; i < len; i++) {
      args[i] = arguments[i];
    }

    return spawn('git', args, {
      cwd: deployDir,
      verbose: verbose
    });
  }

  function setup() {
    // Copy assets
    return fs.copyDir(assetDir, deployDir).then(() => {
      return git('init');
    }).then(() => {
      return git('add', '-A');
    }).then(() => {
      return git('commit', '-m', 'First commit');
    });
  }

  function push(repo) {
    return git('add', '-A').then(() => {
      return git('commit', '-m', message).catch(() => {
        // Do nothing. It's OK if nothing to commit.
      });
    }).then(() => {
      return git('push', '-u', repo, 'master', '--force');
    });
  }

  return fs.exists(deployDir).then(exist => {
    if (exist) return;

    log.info('Setting up Heroku deployment...');
    return setup();
  }).then(() => {
    return fs.exists(deployPubDir);
  }).then(exist => {
    if (!exist) return;

    log.info('Clearing .deploy folder...');
    return fs.emptyDir(deployPubDir);
  }).then(() => {
    log.info('Copying files from public folder...');
    return fs.copyDir(publicDir, deployPubDir);
  }).then(() => {
    return push(args.repo || args.repository);
  });
};

function commitMessage(args) {
  const message = args.m || args.msg || args.message || `Site updated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
  return message;
}
