'use strict';

var path = require('path');

var CacheSwap = require('./');
var fs = require('graceful-fs');
var should = require('should');

describe('cacheSwap', function() {
  var swap,
    category = 'testcat',
    hash = '1234',
    contents = 'Some test contents';

  beforeEach(function(done) {
    swap = new CacheSwap();
    swap.clear(category, done);
  });

  it('getCachedFilePath', function() {
    var expect = path.join(swap.options.tmpDir, swap.options.cacheDirName, category, hash);
    swap.getCachedFilePath(category, hash).should.equal(expect);
  });

  it('addCached', function(done) {
    swap.addCached(category, hash, contents, function(err, filePath) {
      if (err) {
        done(err);
        return;
      }

      fs.stat(filePath, function(statErr, stats) {
        if (statErr) {
          done(statErr);
          return;
        }

        var mode = '0' + (stats.mode & parseInt('777', 8)).toString(8);
        mode.should.equal(process.platform === 'win32' ? '0666' : '0777');

        fs.readFile(filePath, function(readErr, tmpContents) {
          if (readErr) {
            done(readErr);
            return;
          }

          String(tmpContents).should.equal(contents);
          done();
        });
      });
    });
  });

  it('getCached (doesn\'t exist)', function(done) {
    swap.getCached(category, hash, function(err, details) {
      if (err) {
        done(err);
        return;
      }

      should.not.exist(details);
      done();
    });
  });

  it('getCached (does exist)', function(done) {
    swap.addCached(category, hash, contents, function(addErr, filePath) {
      if (addErr) {
        done(addErr);
        return;
      }

      swap.getCached(category, hash, function(getErr, details) {
        if (getErr) {
          done(getErr);
          return;
        }

        should.exist(details);
        details.contents.should.equal(contents);
        details.path.should.equal(filePath);
        done();
      });
    });
  });

  it('hasCached (doesn\'t exist)', function(done) {
    swap.hasCached(category, hash, function(exists, filePath) {
      exists.should.equal(false);
      should.not.exist(filePath);

      done();
    });
  });

  it('hasCached (does exist)', function(done) {
    swap.addCached(category, hash, contents, function(err, filePath) {
      if (err) {
        done(err);
        return;
      }

      swap.hasCached(category, hash, function(exists, existsFilePath) {
        exists.should.equal(true);
        existsFilePath.should.equal(filePath);

        done();
      });
    });
  });

  it('removeCached', function(done) {
    swap.addCached(category, hash, contents, function(err, filePath) {
      if (err) {
        done(err);
        return;
      }

      swap.hasCached(category, hash, function(exists, existsFilePath) {
        exists.should.equal(true);
        existsFilePath.should.equal(filePath);

        swap.removeCached(category, hash, function(removeErr) {
          if (removeErr) {
            done(removeErr);
            return;
          }

          swap.hasCached(category, hash, function(result) {
            result.should.equal(false);
            done();
          });
        });
      });
    });
  });
});
