const Jimp = require('jimp');

module.exports = { getImageSize, saveCropped };

const OUTPUT_PATH = 'output/';
let UNIQUE_ID = 0;

/**
 * 
 * @param {string} imageUrl 
 * @return {Promise<{width: number, height: number}>}
 */
function getImageSize(imageUrl) {
  return Jimp.read(imageUrl).then(image => {
    // Get width, height of original image.
    var w = image.bitmap.width;
    var h = image.bitmap.height;
    return { width: w, height: h };
  });
}

/**
 * 
 * @param {string} imageUrl 
 * @param {{width: number, height: number}} imageSize 
 * @param {{left: number, top: number, width: number, height: number}} rectangle 
 * @param {string} userId 
 * @returns {Promise<{width: number, height: number, imgRelPath: string}>}
 */
function saveCropped(imageUrl, imageSize, rectangle, userId) {

  const tmp = cropTight(imageSize.width, imageSize.height, rectangle.left, rectangle.top, rectangle.width, rectangle. height);
  const { left, top, width, height } = tmp;

  const imgRelPath = OUTPUT_PATH + userId + '_' + `cropped${UNIQUE_ID++}` + '.jpg';

  return new Promise((resolve, reject) => {
    Jimp.read(imageUrl, (err, lenna) => {
    if (err) throw err;
    lenna
      .crop(left, top, width, height)
      .writeAsync(imgRelPath).then(function () {
        resolve({
          width, height, imgRelPath
        });
      });
    })
  });
}

function cropTight(origin_width, origin_height, left, top, width, height){
  var gap, gap2;
  var alpha = 0.5;
  gap = left - Math.max(left - width*alpha, 0);
  gap2 = Math.min(left + width*(1+alpha), origin_width) - (left + width);
  left -= Math.min(gap, gap2);
  width += Math.min(gap, gap2) * 2;
  gap = top - Math.max(top - height*alpha, 0);
  gap2 = Math.min(top + height*(1+alpha), origin_height) - (top + height);
  top -= Math.min(gap, gap2);
  height += Math.min(gap, gap2) * 2;

  return {left, top, width, height};
}