'use strict';

var should = require('chai').should(); // eslint-disable-line
var pathFn = require('path');
var spawn = require('hexo-util/lib/spawn');
var fs = require('hexo-fs');
var Promise = require('bluebird');

var assetDir = pathFn.join(__dirname, '../assets');

describe('Heroku deployer', function() {
  var baseDir = pathFn.join(__dirname, 'deployer_test');
  var publicDir = pathFn.join(baseDir, 'public');
  var fakeRemote = pathFn.join(baseDir, 'remote');
  var validateDir = pathFn.join(baseDir, 'validate');
  var fixturesDir = pathFn.join(__dirname, 'fixtures');

  var ctx = {
    base_dir: baseDir,
    public_dir: publicDir,
    log: {
      info: function() {}
    }
  };

  var deployer = require('../lib/deployer').bind(ctx);

  function compareFile(a, b) {
    return Promise.all([
      fs.readFile(a),
      fs.readFile(b)
    ]).then(function(result) {
      result[0].should.eql(result[1]);
    });
  }

  beforeEach(function() {
    // Create a bare repo as a fake remote repo
    return fs.writeFile(pathFn.join(publicDir, 'foo.txt'), 'foo').then(function() {
      return fs.mkdirs(fakeRemote);
    }).then(function() {
      return spawn('git', ['init', '--bare', fakeRemote]);
    });
  });

  afterEach(function() {
    return fs.rmdir(fakeRemote).then(function() {
      return fs.rmdir(validateDir);
    }).then(function() {
      return fs.rmdir(baseDir);
    });
  });

  function clone() {
    // Clone the remote repo
    return spawn('git', ['clone', fakeRemote, validateDir, '--branch', 'master']);
  }

  function validate() {
    return clone().then(function() {
      // Check files
      return fs.readFile(pathFn.join(validateDir, 'public', 'foo.txt'));
    }).then(function(result) {
      result.should.eql('foo');

      // Check Procfile
      return compareFile(pathFn.join(assetDir, 'Procfile'), pathFn.join(validateDir, 'Procfile'));
    });
  }

  function validateNginxConf(confFile) {
    return clone().then(function() {
      // Check Procfile
      return compareFile(pathFn.join(fixturesDir, 'Procfile'), pathFn.join(validateDir, 'Procfile'));
    }).then(function() {
      // Check conf file
      return compareFile(pathFn.join(__dirname, 'fixtures', confFile), pathFn.join(validateDir, confFile));
    });
  }

  it('default', function() {
    return deployer({
      repo: fakeRemote,
      silent: true
    }).then(function() {
      return validate();
    });
  });

  it('server test');

  it('custom message', function() {
    return deployer({
      repo: fakeRemote,
      message: 'custom message',
      silent: true
    }).then(function() {
      return validate();
    }).then(function() {
      return spawn('git', ['log', '-1', '--pretty=format:%s'], {cwd: validateDir});
    }).then(function(content) {
      content.should.eql('custom message');
    });
  });

  it('nginx conf', function() {
    var confFile = 'nginx.conf.php';

    return deployer({
      repo: fakeRemote,
      nginx_conf: pathFn.join('test', 'fixtures', confFile),
      silent: true
    }).then(function() {
      return validateNginxConf(confFile);
    });
  });
});
