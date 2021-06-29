const storage = browser.storage.local;
const normalFilePattern = /^.+(?:(?:hand.?(?<skinTone>\d+))|(?<allHands>all.?hands)).*\.[a-z]+$/i;
const strangeFilePattern = /essie(?<number>\d+)\.[a-z]+$/i;


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
 * Search for a nail polish title to guess if this is a nail polish preview page
 * @return {boolean} whether a nail polish title was found on the page
 */
function isNailPolishPage() {
    // noinspection JSIncompatibleTypesComparison
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
 * @return {NodeListOf<Element>} an array of preview button elements
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
 *   3. Match images that looks like ESSIE5.jpg, sorting by the number in the
 *      filename and selecting the skin tone based on the relative order
 *   4. Match any hand image
 * @return {boolean} whether an image was clicked
 */
async function clickHandPreviewButton() {
    const skinTone = await getSkinTone();
    if (skinTone === null || skinTone === -1)
        return false;

    const previewButtons = getPreviewButtons();
    if (previewButtons === null)
        return false;

    let lastResortImage;
    let strangeMatches = [];
    for (let b of previewButtons) {
        let imgSrc = new URL(b.childNodes[0].src);
        let filename = imgSrc.pathname.split('/').slice(-1)[0];

        // Match skin tone or all hands
        let match = filename.match(normalFilePattern);

        if (match === null) {
            let strangeMatch = filename.match(strangeFilePattern);
            if (strangeMatch)
                strangeMatches.push({
                    number: Number(strangeMatch.groups.number),
                    button: b
                });
            // Try to match any hand image and store it as a last resort if we
            // fail to match anything else
            if (filename.match(/hand/i)) {
                lastResortImage = b;
            }
            continue;
        }

        if (Number(match.groups.skinTone) === skinTone || match.groups.allHands) {
            b.click();
            return true;
        }
    }

    if (strangeMatches.length !== 0) {
        // "Strange matches" are files which look like ESSIE5.jpg. The
        // numbering is inconsistent, but it appears that the highest number is
        // the lightest shade, and the lowest number is the darkest shade.
        if (strangeMatches.length !== 3) {
            // Unexpected number of strange matches, click the first one
            strangeMatches[0].button.click();
            return true;
        }
        // Make sure they are sorted in ascending order (if x is greater, swap)
        strangeMatches.sort((a, b) => Number(a.number > b.number));
        switch (skinTone) {
            case 1:
                strangeMatches[2].button.click();
                return true;
            case 2:
                strangeMatches[1].button.click();
                return true;
            case 3:
                strangeMatches[0].button.click();
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
addColorFamilyEventHandlers().catch(e => {
    console.error(e);
});
addColorSliderEventHandlers().catch(e => {
    console.error(e);
});
