'use strict';

require('chai').should(); // eslint-disable-line
const pathFn = require('path');
const { spawn } = require('hexo-util');
const fs = require('hexo-fs');
const { stub, assert: sinonAssert } = require('sinon');
const { underline } = require('picocolors');
const Promise = require('bluebird');

const assetDir = pathFn.join(__dirname, '../assets');

describe('Heroku deployer', () => {
  const baseDir = pathFn.join(__dirname, 'deployer_test');
  const publicDir = pathFn.join(baseDir, 'public');
  const deployDir = pathFn.join(baseDir, '.deploy_heroku');
  const fakeRemote = pathFn.join(baseDir, 'remote');
  const validateDir = pathFn.join(baseDir, 'validate');

  const ctx = {
    base_dir: baseDir,
    public_dir: publicDir,
    log: {
      info: function() {}
    }
  };

  const deployer = require('../lib/deployer').bind(ctx);

  function compareFile(a, b) {
    return Promise.all([
      fs.readFile(a),
      fs.readFile(b)
    ]).then(result => {
      result[0].should.eql(result[1]);
    });
  }

  before(() => {
    return fs.writeFile(pathFn.join(publicDir, 'foo.txt'), 'foo');
  });

  beforeEach(() => {
    // Create a bare repo as a fake remote repo
    return fs.mkdirs(fakeRemote).then(() => {
      return spawn('git', ['init', '--bare', fakeRemote]);
    });
  });

  after(() => {
    return fs.rmdir(baseDir);
  });

  afterEach(() => {
    return fs.rmdir(fakeRemote).then(() => {
      return fs.rmdir(validateDir);
    });
  });

  function clone() {
    // Clone the remote repo
    return spawn('git', ['clone', fakeRemote, validateDir, '--branch', 'master']);
  }

  function validate() {
    return clone().then(() => {
      // Check files
      return fs.readFile(pathFn.join(validateDir, 'public', 'foo.txt'));
    }).then(result => {
      result.should.eql('foo');

      // Check Procfile
      return compareFile(pathFn.join(assetDir, 'Procfile'), pathFn.join(validateDir, 'Procfile'));
    });
  }

  it('default', () => {
    return deployer({
      repo: fakeRemote,
      silent: true
    }).then(() => {
      return validate();
    });
  });

  it('server test');

  it.skip('custom message', () => {
    return deployer({
      repo: fakeRemote,
      message: 'custom message',
      silent: true
    }).then(() => {
      return validate();
    }).then(() => {
      return spawn('git', ['log', '-1', '--pretty=format:%s'], {cwd: validateDir});
    }).then(content => {
      content.should.eql('custom message');
    });
  });

  it('without repo and repository', () => {
    fs.mkdirSync(validateDir);
    const logStub = stub(console, 'log');
    process.env.HEXO_DEPLOYER_REPO = '';
    deployer({});
    let help = '';
    help += 'You have to configure the deployment settings in _config.yml first!\n\n';
    help += 'Example:\n';
    help += '  deploy:\n';
    help += '    type: heroku\n';
    help += '    repo: <repository url>\n';
    help += '    message: [message]\n\n';
    help += 'For more help, you can check the docs: ' + underline('http://hexo.io/docs/deployment.html');
    sinonAssert.calledWithMatch(logStub, help);
    logStub.restore();
  });

  it('exist deployDir', () => {
    return fs.mkdirs(deployDir).then(() => {
      return deployer({
        repo: fakeRemote,
        silent: true
      });
    }).then(() => {
      return validate();
    });
  });
});
