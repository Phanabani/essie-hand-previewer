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
 * @return {Number} The stored skin tone
 */
 async function getSkinTone() {
    let skinTone;
    try {
        skinTone = (await storage.get('skinTone')).skinTone;
    } catch (e) {
        console.error(e);
        return null;
    }

    if (skinTone === undefined) {
        // Value wasn't set; set it to a default value now and return based on
        // the success of the setter operation
        return (await setSkinTone(DEFAULT_SKIN_TONE)) ? skinTone : null;
    }

    return skinTone;
}


/**
 * @param {Number} skinTone
 * @return {Number} Whether the storage set was successful or not
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


function isNailPolishPage() {
    return document.querySelector('.product-quickview__title') !== null;
}


function getNailPolishName() {
    return document.querySelector('.product-quickview__title>span').textContent;
}


function getHandPreviewButtons() {
    if (!isNailPolishPage())
        return null;

    const previewButtons = document.querySelectorAll(
        'button.product-quickview__product-thumbnail'
        );
    if (previewButtons.length === 0)
        return null;
    return previewButtons;
}


async function clickHandPreviewButton() {
    const skinTone = await getSkinTone();
    if (skinTone === null)
        return false;

    const previewButtons = getHandPreviewButtons();
    if (previewButtons === null)
        return false;

    let lastResortImage;
    for (let b of previewButtons) {
        let imgSrc = new URL(b.childNodes[0].src);
        let filename = imgSrc.pathname.split('/').slice(-1)[0];
        let match = filename.match(previewFilePattern);

        if (match === null) {
            let tryMatchNumber = filename.match(previewFileTryMatchNumberPattern);
            if ((tryMatchNumber && tryMatchNumber.groups[skinTone] == skinTone) || filename.match(/hand/i)) {
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
