/* eslint-env mocha */
/* eslint max-nested-callbacks: ["warn", 7] */
'use strict';

const path = require('path');

const CacheSwap = require('./');
const fs = require('graceful-fs');
const should = require('should');

describe('cacheSwap', () => {
  let swap;
  const category = 'testcat';
  const hash = '1234';
  const filename = 'testfile';

  describe('default settings', () => {
    beforeEach(done => {
      swap = new CacheSwap();
      swap.clear(category, done);
    });

    it('getCachedFilePath', () => {
      let expect = path.join(swap.options.tmpDir, swap.options.cacheDirName, category, hash);
      swap.getCachedFilePath(category, hash).should.equal(expect);
    });

    it('addCached', done => {
      swap.addCached(category, hash, 'foo', filename, (err, filePath) => {
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

    it('getCached (does exist)', done => {
      swap.addCached(category, hash, 'bar', filename, (addErr, filePath) => {
        if (addErr) {
          done(addErr);
          return;
        }

        swap.getCached(category, hash, filename, (getErr, details) => {
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
      swap.hasCached(category, hash, filename, (exists, filePath) => {
        exists.should.equal(false);
        should.not.exist(filePath);

        done();
      });
    });

    it('hasCached (does exist)', done => {
      swap.addCached(category, hash, 'baz', filename, (err, filePath) => {
        if (err) {
          done(err);
          return;
        }

        swap.hasCached(category, hash, filename, (exists, existsFilePath) => {
          exists.should.equal(true);
          existsFilePath.should.equal(filePath);

          done();
        });
      });
    });

    it('removeCached', done => {
      swap.addCached(category, hash, 'qux', filename, (err, filePath) => {
        if (err) {
          done(err);
          return;
        }

        swap.hasCached(category, hash, filename, (exists, existsFilePath) => {
          exists.should.equal(true);
          existsFilePath.should.equal(filePath);

          swap.removeCached(category, hash, filename, removeErr => {
            if (removeErr) {
              done(removeErr);
              return;
            }

            swap.hasCached(category, hash, filename, result => {
              result.should.equal(false);
              done();
            });
          });
        });
      });
    });
  });

  describe('light version', () => {
    beforeEach(done => {
      swap = new CacheSwap({light: true});
      swap.clear(category, done);
    });

    it('getCachedFilePath (light version)', () => {
      let expect = path.join(swap.options.tmpDir, swap.options.cacheDirName, category, filename);
      swap.getCachedFilePath(category, hash, filename).should.equal(expect);
    });

    it('addCached (light-version)', done => {
      swap.addCached(category, hash, 'foo', filename, (err, filePath) => {
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

            String(tmpContents).should.equal(hash);
            done();
          });
        });
      });
    });

    it('getCached (does exist; light-version)', done => {
      swap.addCached(category, hash, 'bar', filename, (addErr, filePath) => {
        if (addErr) {
          done(addErr);
          return;
        }

        swap.getCached(category, hash, filename, (getErr, details) => {
          if (getErr) {
            done(getErr);
            return;
          }

          should.exist(details);
          details.contents.should.equal(hash);
          details.path.should.equal(filePath);
          done();
        });
      });
    });
  });
});
