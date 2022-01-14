# hexo-deployer-heroku

[![Build Status](https://github.com/hexojs/hexo-deployer-heroku/workflows/Tester/badge.svg)](https://github.com/hexojs/hexo-deployer-heroku/actions?query=workflow%3ATester)
[![NPM version](https://badge.fury.io/js/hexo-deployer-heroku.svg)](https://www.npmjs.com/package/hexo-deployer-heroku)
[![Coverage Status](https://coveralls.io/repos/hexojs/hexo-deployer-heroku/badge.svg)](https://coveralls.io/r/hexojs/hexo-deployer-heroku)

Heroku deployer plugin for [Hexo].

## Installation

``` bash
$ npm install hexo-deployer-heroku --save
```

## Options

You can configure this plugin in `_config.yml`.

``` yaml
# You can use this:
deploy:
  type: heroku
  repo: <repository url>
  message: [message]
```

- **repo**: Repository URL
- **message**: Commit message. The default commit message is `Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}`.

## Reset

Remove `.deploy_heroku` folder.

``` bash
$ rm -rf .deploy_heroku
```

## License

MIT

[Hexo]: https://hexo.io/