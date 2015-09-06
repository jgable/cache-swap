/* eslint-env mocha */
'use strict';

const path = require('path');

const CacheSwap = require('./');
const fs = require('graceful-fs');
const should = require('should');

describe('cacheSwap', () => {
  let swap;
  const category = 'testcat';
  const hash = '1234';

  beforeEach(done => {
    swap = new CacheSwap();
    swap.clear(category, done);
  });

  it('getCachedFilePath', () => {
    let expect = path.join(swap.options.tmpDir, swap.options.cacheDirName, category, hash);
    swap.getCachedFilePath(category, hash).should.equal(expect);
  });

  it('addCached', done => {
    swap.addCached(category, hash, 'foo', (err, filePath) => {
      if (err) {
        done(err);
        return;
      }

      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          done(statErr);
          return;
        }

        const mode = '0' + (stats.mode & parseInt('777', 8)).toString(8);
        mode.should.equal(process.platform === 'win32' ? '0666' : '0777');

        fs.readFile(filePath, (readErr, tmpContents) => {
          if (readErr) {
            done(readErr);
            return;
          }

          String(tmpContents).should.equal('foo');
          done();
        });
      });
    });
  });

  it('getCached (doesn\'t exist)', done => {
    swap.getCached(category, hash, (err, details) => {
      if (err) {
        done(err);
        return;
      }

      should.not.exist(details);
      done();
    });
  });

  it('getCached (does exist)', done => {
    swap.addCached(category, hash, 'bar', (addErr, filePath) => {
      if (addErr) {
        done(addErr);
        return;
      }

      swap.getCached(category, hash, (getErr, details) => {
        if (getErr) {
          done(getErr);
          return;
        }

        should.exist(details);
        details.contents.should.equal('bar');
        details.path.should.equal(filePath);
        done();
      });
    });
  });

  it('hasCached (doesn\'t exist)', done => {
    swap.hasCached(category, hash, (exists, filePath) => {
      exists.should.equal(false);
      should.not.exist(filePath);

      done();
    });
  });

  it('hasCached (does exist)', done => {
    swap.addCached(category, hash, 'baz', (err, filePath) => {
      if (err) {
        done(err);
        return;
      }

      swap.hasCached(category, hash, (exists, existsFilePath) => {
        exists.should.equal(true);
        existsFilePath.should.equal(filePath);

        done();
      });
    });
  });

  it('removeCached', done => {
    swap.addCached(category, hash, 'qux', (err, filePath) => {
      if (err) {
        done(err);
        return;
      }

      swap.hasCached(category, hash, (exists, existsFilePath) => {
        exists.should.equal(true);
        existsFilePath.should.equal(filePath);

        swap.removeCached(category, hash, removeErr => {
          if (removeErr) {
            done(removeErr);
            return;
          }

          swap.hasCached(category, hash, result => {
            result.should.equal(false);
            done();
          });
        });
      });
    });
  });
});
