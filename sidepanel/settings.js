import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import {styles as typescaleStyles} from '@material/web/typography/md-typescale-styles.js';

document.adoptedStyleSheets.push(typescaleStyles.styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveBtn = document.getElementById('save-key');
    const status = document.getElementById('status');

    // Load saved API key
    chrome.storage.sync.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
    });

    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        chrome.storage.sync.set({ apiKey }, () => {
            status.hidden = false;
            status.textContent = 'Saved!';
            setTimeout(() => { status.hidden = true; }, 1500);
        });
    });
});
