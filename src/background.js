const DEFAULT_SKIN_TONE = 1;
const MIN_SKIN_TONE = 1;
const MAX_SKIN_TONE = 3;

const storage = browser.storage.local;


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
 * @param skinTone {number} the new skin tone (corresponds to Essie's filename conventions)
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


function updateIcon(skinTone) {
    if ((skinTone < MIN_SKIN_TONE || skinTone > MAX_SKIN_TONE) && skinTone !== -1) {
        console.error(`Essie Hand Previewer: Invalid skin tone ${skinTone}`);
        return;
    }

    let iconPath;
    let title;
    if (skinTone === -1) {
        iconPath = 'icons/icon-disabled.svg';
        title = 'Essie Hand Previewer (Disabled)';
    } else {
        iconPath = `icons/icon-skin-tone-${skinTone}.svg`;
        title = `Essie Hand Previewer (Skin tone ${skinTone})`;
    }

    browser.browserAction.setIcon({
        path: {
            16: iconPath,
            32: iconPath,
            64: iconPath,
        }
    });
    browser.browserAction.setTitle({title: title});
}


async function setUp() {
    if ((await getSkinTone()) !== null)
        return;
    if (await setSkinTone(DEFAULT_SKIN_TONE))
        updateIcon(DEFAULT_SKIN_TONE);
}


async function clickHandler() {
    const skinTone = await getSkinTone();
    let newSkinTone;
    switch (skinTone) {
        case -1:
            newSkinTone = MIN_SKIN_TONE;
            break;
        case MAX_SKIN_TONE:
            newSkinTone = -1;
            break;
        default:
            newSkinTone = skinTone + 1;
    }
    if (await setSkinTone(newSkinTone))
        updateIcon(newSkinTone);
}


setUp().catch(e => {
    console.error(e);
});
browser.browserAction.onClicked.addListener(clickHandler);
