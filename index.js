'use strict';

var path = require('path');

var assign = require('object-assign');
var fs = require('graceful-fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var tmpDir = require('os').tmpDir();

function CacheSwap(options) {
  this.options = assign({
    tmpDir: tmpDir,
    cacheDirName: 'defaultCacheSwap',
    light: false
  }, options);
}

assign(CacheSwap.prototype, {
  clear: function(category, cb) {
    var dir = path.join(this.options.tmpDir, this.options.cacheDirName, category || '');
    rimraf(dir, {disableGlob: true}, cb);
  },

  hasCached: function(category, hash, filename, cb) {
    var filePath = this.getCachedFilePath(category, hash, filename);

    fs.exists(filePath, function(exists) {
      return cb(exists, exists ? filePath : null);
    });
  },

  getCached: function(category, hash, filename, cb) {
    var filePath = this.getCachedFilePath(category, hash, filename);

    fs.readFile(filePath, function(err, fileStream) {
      if (err) {
        if (err.code === 'ENOENT') {
          cb();
          return;
        }

        cb(err);
        return;
      }

      cb(null, {
        contents: fileStream.toString(),
        path: filePath
      });
    });
  },

  addCached: function(category, hash, contents, filename, cb) {
    var filePath = this.getCachedFilePath(category, hash, filename);
    var self = this;

    mkdirp(path.dirname(filePath), {mode: parseInt('0777', 8)}, function(mkdirErr) {
      if (mkdirErr) {
        cb(mkdirErr);
        return;
      }

      if(self.options.light) {
        contents = hash;
      }

      fs.writeFile(filePath, contents, {mode: parseInt('0777', 8)}, function(writeErr) {
        if (writeErr) {
          cb(writeErr);
          return;
        }

        fs.chmod(filePath, parseInt('0777', 8), function(chmodErr) {
          if (chmodErr) {
            cb(chmodErr);
            return;
          }

          cb(null, filePath);
        });
      });
    });
  },

  removeCached: function(category, hash, filename, cb) {
    var filePath = this.getCachedFilePath(category, hash, filename);

    fs.unlink(filePath, function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          cb();
          return;
        }

        cb(err);
        return;
      }

      cb();
    });
  },

  getCachedFilePath: function(category, hash, filename) {
    if(this.options.light) {
      return path.join(this.options.tmpDir, this.options.cacheDirName, category, filename).replace(/\.\w+/, '');
    }

    return path.join(this.options.tmpDir, this.options.cacheDirName, category, hash);
  }
});

module.exports = CacheSwap;
