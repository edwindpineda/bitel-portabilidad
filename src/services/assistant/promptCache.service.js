const fs = require("fs");
const path = require("path");
const logger = require("../../config/logger/loggerClient");

let _cachedPromptTemplate = null;

function loadPromptTemplate() {
    if (_cachedPromptTemplate) return _cachedPromptTemplate;

    const filePath = path.join(__dirname, "prompts", "auna.md");
    _cachedPromptTemplate = fs.readFileSync(filePath, "utf-8");
    logger.info("[promptCache] System prompt cargado y cacheado en memoria");
    return _cachedPromptTemplate;
}

function buildSystemPrompt({ persona, timestamp }) {
    const template = loadPromptTemplate();

    return template
        .replace("{{datos}}", JSON.stringify(persona))
        .replace("{{timestamp}}", timestamp);
}

module.exports = { loadPromptTemplate, buildSystemPrompt };
