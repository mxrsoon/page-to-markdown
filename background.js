import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
} from './node_modules/@google/generative-ai/dist/index.mjs';

let genAI = null;
let model = null;
let generationConfig = { temperature: 1 };

function initModel(apiKey, generationConfig) {
    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
        }
    ];

    genAI = new GoogleGenerativeAI(apiKey);

    model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings,
        generationConfig
    });

    return model;
}

async function runPrompt(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (e) {
        console.log('Prompt failed');
        console.error(e);
        console.log('Prompt:', prompt);
        throw e;
    }
}

function contentCopy(text) {
    navigator.clipboard.writeText(text);
}

function getArticleHtml() {
    return document.querySelector("article").outerHTML;
}

// Helper to get API key asynchronously
async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['apiKey'], (result) => {
            resolve(result.apiKey);
        });
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    const apiKey = await getApiKey();
    if (!apiKey) {
        // Show notification if API key is missing
        await chrome.notifications.create({
            title: "API Key Required",
            message: "Set your API key to use the converter. Click to open settings.",
            iconUrl: "../images/icon128.png",
            type: "basic"
        });

        // Store tabId for use on notification click
        chrome.storage.session.set({ notificationTabId: tab.id });
        return;
    }

    console.log("Started execution");

    const notificationId = await chrome.notifications.create(
        null,
        {
            title: "Conversion started",
            message: "The result will be available in a moment.",
            iconUrl: "../images/icon128.png",
            type: "basic"
        }
    );

    const [results] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getArticleHtml,
        args: []
    });

    console.log("Scrapping results", results);

    // Pass apiKey as argument
    initModel(apiKey, generationConfig);

    const prompt = `Convert the following HTML contents to Markdown, removing images and transforming relative links to absolute, except anchors to the same page. You should answer only with the resulting Markdown code, nothing more. The current URL is ${tab.url} and the HTML content is the following: ${results.result}`;
    const response = await runPrompt(prompt, generationConfig);
    const responseWithUrl = `The following document is available at ${tab.url}  \n\n${response}`;

    console.log("Convertion response", responseWithUrl);

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: contentCopy,
        args: [responseWithUrl]
    });

    await chrome.notifications.create(
        notificationId,
        {
            title: "Conversion complete",
            message: "The result Markdown was copied to your clipboard.",
            iconUrl: "../images/icon128.png",
            type: "basic"
        }
    );
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
    chrome.storage.session.get(['notificationTabId'], (result) => {
        if (result.notificationTabId) {
            chrome.sidePanel.open({ tabId: result.notificationTabId });
            chrome.storage.session.remove(['notificationTabId']);
        }
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-options-sidepanel",
        title: "Options",
        contexts: ["action"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-options-sidepanel") {
        chrome.sidePanel.open({
            tabId: tab.id
        });
    }
});