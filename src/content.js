const DEFAULT_SKIN_TONE = 1;
const MIN_SKIN_TONE = 1;
const MAX_SKIN_TONE = 3;

const storage = browser.storage.local;
const previewFilePattern = /^.+(?:(?:hand.?(?<skinTone>\d+))|(?<allHands>all.?hands)).*\.[a-z]+$/i;
const previewFileTryMatchNumberPattern = /(?<skinTone>\d)\.[a-z]+$/i;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * @return {?number} The stored skin tone
 */
async function getSkinTone() {
    let skinTone;
    try {
        skinTone = (await storage.get('skinTone')).skinTone;
    } catch (e) {
        console.error(e);
        return null;
    }

    return (skinTone !== undefined) ? skinTone : null;
}


/**
 * @param {number} the new skin tone (corresponds to Essie's filename conventions)
 * @return {boolean} whether the storage set was successful or not
 */
async function setSkinTone(skinTone) {
    try {
        await storage.set({skinTone: skinTone});
    } catch (e) {
        console.error(e);
        return false;
    }
    return true;
}


/**
 * Search for a nail polish title to guess if this is a nail polish preview page
 * @return {boolean} whether a nail polish title was found on the page
 */
function isNailPolishPage() {
    return document.querySelector('.product-quickview__title') !== null;
}


/**
 * @return {?string} the nail polish name
 */
function getNailPolishName() {
    const title = document.querySelector('.product-quickview__title>span');
    return (title) ? title.textContent : null;
}


/**
 * Get the preview buttons for the currently selected nail polish (if they
 * exist).
 * @return {?object[]} an array of preview button elements
 */
function getPreviewButtons() {
    if (!isNailPolishPage())
        return null;

    const previewButtons = document.querySelectorAll(
        'button.product-quickview__product-thumbnail'
        );
    if (previewButtons.length === 0)
        return null;
    return previewButtons;
}


/**
 * Search through preview buttons on the page and click the one that
 * corresponds to the stored skin tone. The filename conventions on the site
 * aren't always consistent, so this function will try several matches in
 * succession:
 *   1. Match an image with the stored skin tone
 *   2. Match an image with all skin tones
 *   3. Match any hand image
 *   4. Match any image that has the skin tone value in the file name
 * @return {boolean} whether an image was clicked
 */
async function clickHandPreviewButton() {
    const skinTone = await getSkinTone();
    if (skinTone === null)
        return false;

    const previewButtons = getPreviewButtons();
    if (previewButtons === null)
        return false;

    let lastResortImage;
    for (let b of previewButtons) {
        let imgSrc = new URL(b.childNodes[0].src);
        let filename = imgSrc.pathname.split('/').slice(-1)[0];

        // Match skin tone or all hands
        let match = filename.match(previewFilePattern);

        if (match === null) {
            // Try to match the skin tone number or just any hand and store it
            // as a last resort if we fail to match anything else
            let tryMatchNumber = filename.match(previewFileTryMatchNumberPattern);
            let matchedNumber = (
                tryMatchNumber && tryMatchNumber.groups[skinTone] == skinTone
            )
            if (matchedNumber || filename.match(/hand/i)) {
                lastResortImage = b;
            }
            continue;
        }

        if (match.groups['skinTone'] == skinTone || match.groups['allHands']) {
            b.click();
            return true;
        }
    }

    if (lastResortImage) {
        lastResortImage.click();
        return true;
    }

    return false;
}


/**
 * Add change handlers to the nail polish color sliders.
 */
async function addColorSliderEventHandlers() {

    function handler(e) {
        const name = getNailPolishName();
        if (this.lastName === undefined || name !== this.lastName) {
            this.lastName = name;
            clickHandPreviewButton();
        }
    }

    await sleep(400);
    const sliders = document.querySelectorAll('div.color-bar>input');
    for (let s of sliders) {
        s.addEventListener('input', handler);
    }
}

/**
 * Add click handlers to the nail polish color family buttons. When the color
 * family is changed, event handlers will be added to the new color slider.
 */
async function addColorFamilyEventHandlers() {
    const familyButtons = document.querySelectorAll(
        'div.select-color-family__family>button'
    );
    for (let b of familyButtons) {
        b.addEventListener('click', e => {addColorSliderEventHandlers()});
    }
}

clickHandPreviewButton().catch(e => {
    console.error(e);
});
addColorFamilyEventHandlers();
addColorSliderEventHandlers();
