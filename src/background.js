const DEFAULT_SKIN_TONE = 1;
const MIN_SKIN_TONE = 1;
const MAX_SKIN_TONE = 3;

const storage = browser.storage.local;


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


function updateIcon(skinTone) {
    if (skinTone < MIN_SKIN_TONE || skinTone > MAX_SKIN_TONE) {
        console.error(`Essie Hand Previewer: Invalid skin tone ${skinTone}`);
        return;
    }

    const iconPath = `icons/icon-skin-tone-${skinTone}.svg`;
    browser.browserAction.setIcon({
        path: {
            16: iconPath,
            32: iconPath,
            64: iconPath,
        }
    });
    browser.browserAction.setTitle({
        // Screen readers can see the title
        title: `Essie Hand Previewer (Skin tone ${skinTone})`
    }); 
}


async function setUp() {
    await getSkinTone();
}


function clickHandler() {
    getSkinTone().then(skinTone => {
        newSkinTone = (skinTone === MAX_SKIN_TONE) ? MIN_SKIN_TONE : skinTone + 1;
        setSkinTone(newSkinTone).then(success => {
            if (success)
                updateIcon(newSkinTone);
        });
    }).catch(e => {
        console.log(e);
    });
}


browser.browserAction.onClicked.addListener(clickHandler);
