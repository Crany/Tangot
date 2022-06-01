const Jimp = require('jimp');

module.exports = async function createCaptcha() {
    // Set the Text Combo //
    let captchaPre = Math.random().toString(36).slice(2, 8);
    let splitCaptcha = captchaPre.split("")
    for (let i = 0; i != captchaPre.length; i++) {
        if (Math.round(Math.random(0,1)) == 1) {
            splitCaptcha[i] = splitCaptcha[i].toUpperCase()
        }
    }
    const captcha = splitCaptcha.join("");
    const image = new Jimp(300, 70, 'black'); // Create Picture //
    const font = await Jimp.loadFont(`${__dirname}/font/Montserrat-BlackItalic.fnt`) // Load the font //
    const w = image.bitmap.width; // get width //
    const h = image.bitmap.height; // get height //
    const textWidth = Jimp.measureText(font, captcha); // get text width //
    const textHeight = Jimp.measureTextHeight(font, captcha); // get text height //
    image.print(font, (w/2 - textWidth/2), (h/2 - textHeight/2), captcha); // display text //
    image.write(`${__dirname}/captchas/${captcha}.png`); // write photo to a file //
    return captcha; // return the capture code
}