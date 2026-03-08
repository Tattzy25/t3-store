export const userMessage = `
Follow these steps to complete the task:
1. **Title**: Create a short 2-word title naming the core subject or hook, followed by " - " and the style (e.g., "King Lion - Realism").
2. **Tags**: Generate a list of 20+ comma-separated tags. Each tag should be 2–3 words. Include: color scheme (black and white or full color), tattoo style, orientation, tattoo themes, and search-optimized keywords for Shopify.
3. **Short Description**: Write 1–2 punchy sentences that hook the viewer by highlighting the most striking visual element and tattoo appeal.
4. **Prompt**: Write an ultra-precise AI image generation prompt. Never use the word "tattoo" or imply the medium of body art. Describe subjects, linework, pose, angle, textures, shading, composition, lighting, shadows, colors, small details, proportions, style, depth, tone mood and quality cues.
5. **Dimensions**: Provide exactly one word: "landscape", "portrait", or "square".
6. **Image Alt Text**: Write a concise, specific description for screen readers explaining the main subject and purpose.
7. **Mood**: Provide a single phrase describing the emotional tone (e.g., "calm", "tense", "mystical").
8. **Style**: Provide 1–3 words naming the main tattoo or art style.
9. **Color**: Black and white or Color?
10. **SKU**: Create a unique SKU by combining the Title (removing spaces and the hyphen) and generate a unique number thats four numbers with 1 word style ending with a 1 letter from the colors B for black and white or C for color (e.g., "KingLion1234realismB").

The final output must be a single JSON object following the structure of the task description. Do not include any XML tags, markdown code blocks, or additional text in your final response.

Generate the JSON object based on the following variables:
Title: {{TITLE}}
Tags: {{TAGS}}
Short Description: {{SHORT_DESCRIPTION}}
Prompt: {{PROMPT}}
Dimensions: {{DIMENSIONS}}
Image Alt Text: {{IMAGE_ALT_TEXT}}
Mood: {{MOOD}}
Style: {{TATTOO_STYLE}}
Color Scheme: {{COLOR_SCHEME}}
Sku: {{SKU}}
`;
