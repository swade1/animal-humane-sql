## Step 1: Extract the Site Data
Open the URL in Chrome/Edge, right-click anywhere, and select Inspect.

Go to the Elements tab.

Right-click the <body> tag.

Select Copy -> Copy OuterHTML. (If the file is too large, copy section by section, e.g., <nav>, <main>, <footer>).

## Step 2: Use This "Deep Clone" Prompt

"I am providing the raw HTML and structure of a specific webpage. I want you to perform a 'Structural Reverse Engineering' of this code.

Task: Recreate this exact page using React, Tailwind CSS, and TypeScript.

Requirements:

Style Extraction: Analyze the classes and inline styles in the provided HTML. Map them to the closest Tailwind CSS utility classes.

Component Architecture: Break the HTML down into logical React components (e.g., Navbar, Hero, PetGrid, Footer).

Assets: Use descriptive placeholders for images. Ensure the aspect ratios match the original containers.

Typography & Spacing: Pay close attention to the padding, margin, and font-size hierarchy. If the original uses specific hex codes for colors, use those in the Tailwind arbitrary values format (e.g., bg-[#F3E5D8]).

Here is the source HTML to replicate: [PASTE YOUR COPIED HTML HERE]"
