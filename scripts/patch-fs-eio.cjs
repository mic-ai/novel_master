// Monkey-patch fs.rmdir/rmdirSync to silently ignore EIO errors.
// Required in Windows/WSL environments where NTFS rmdir returns EIO after
// Next.js static page generation cleans up the temporary export directory.
// This patch is applied via NODE_OPTIONS in npm run build.
// Vercel builds do NOT use this (NODE_OPTIONS is not set there).
const fs = require('fs');

const orig = fs.rmdir.bind(fs);
fs.rmdir = function patchedRmdir(path, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  orig(path, options ?? {}, function (err) {
    if (err && err.code === 'EIO') { callback(null); return; }
    callback(err);
  });
};

const origSync = fs.rmdirSync.bind(fs);
fs.rmdirSync = function patchedRmdirSync(path, options) {
  try { origSync(path, options); }
  catch (err) { if (err.code !== 'EIO') throw err; }
};

const fsPromises = require('fs/promises');
const origRm = fsPromises.rm.bind(fsPromises);
fsPromises.rm = async function patchedRm(path, options) {
  try { await origRm(path, options); }
  catch (err) { if (err.code !== 'EIO') throw err; }
};
