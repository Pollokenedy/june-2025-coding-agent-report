# June 2025 Coding Agent Report

📄 **[Download the Full Report (PDF)](june-2025-coding-agents.pdf)** - Complete 61-page evaluation with detailed analysis

Below is a summary of my discoveries, but if you want to dive into the full details [you can also read it on Turing Post](https://www.turingpost.com/c/coding-agents-2025).

## Overview

This repository contains the complete June 2025 coding agent evaluation, including the original report, source materials, and implementation examples from each tested agent.

## Key Findings

### Top Performers
- **Overall Winner**: Cursor + Warp (24 points each)
- **Professional Development**: Cursor Background Agent (24/24 - strongly recommend hire)
- **Casual Users**: Replit (easy setup, integrated hosting)
- **Product Design**: v0 (excellent UI iteration, NextJS/Vercel focused)
- **Enterprise**: Copilot Agent, Jules (GitHub integration, SDLC focused)
- **Experts/Tinkerers**: RooCode, Goose (BYOM, local model support)

### Agent Categories Evaluated

#### IDE Agents
- [Copilot](https://github.com/features/copilot) - Traditional autocomplete, requires expertise
- [Cursor](https://cursor.com) - Professional favorite, great developer experience  
- [RooCode](https://roocode.com/) - Expert-level, excellent BYOM support
- [Windsurf](https://windsurf.com/) - Basic functionality, needs improvement

#### CLI Agents  
- [aider](https://aider.chat/) - First OSS agent, git-heavy workflow
- [Claude Code](https://www.anthropic.com/claude-code) - Solid output, blinking lights UI
- [Codex CLI](https://openai.com/codex/) - Functional but unremarkable
- [Goose](https://block.github.io/goose/) - Configuration-heavy, expert-focused

#### Full-Stack Agents
- [Codex Agent](https://chatgpt.com/codex/onboarding) - GitHub integration, PM-friendly
- [Copilot Agent](https://github.com/features/copilot) - Game-changing potential if it works
- [Cursor Agent](https://cursor.com) - Surprising background capabilities  
- [Jules](https://jules.google.com/) - Slick Google product, fast execution
- [Replit](https://replit.com/) - Best for business value, integrated platform

#### Hybrid Platforms
- [v0](https://v0.dev) - Obviously the way to go for UI design
- [Warp](https://www.warp.dev/) - Terminal replacement, scripting powerhouse

## Methodology

Each agent received the same standardized prompt:

> Build a simple webapp that makes it easy to collect ideas. The user should be able to enter in a new idea, see a list of existing ideas, and be able to "vote" on them which will move them up in the list. The user should also be able to add notes and to the ideas if they want more detail, including attaching files. Build it using node that will be deployed in a docker container with a persistent volume for storage, and make sure that everything has unit tests.

Agents were scored across 6 categories:
1. Code Quality & Structure
2. Testing Setup  
3. Tooling & Environment
4. Documentation & Comments
5. Overall Professionalism
6. Hire Recommendation

## Recommendations by Use Case

### Software Professionals: Cursor + Warp
Recommended workflow:
1. Use ChatGPT/Claude to flesh out ideas with project-brief-maker
2. Create repo and save as project-brief
3. Start Cursor Agent to "implement @project-brief"
4. Test and develop with Cursor Agent using small, targeted changes
5. Deploy using Warp for infrastructure scripts

### Business Value: Replit
For casual users solving real problems - easiest to start, great visual planner, integrated hosting.

### Product Designers: v0  
For UI iteration and communicating with engineering teams - best for prototyping, NextJS/Vercel focused.

### Project/Product Managers: Copilot Agent or Jules
Most promise for SDLC integration, though still rough around edges.

### Experts and Tinkerers: RooCode and Goose
Best control over models and prompts, local model support, open source future.

## Key Insights: Don't Be Passive Aggressive

> **📝 Read the companion post:** [Don't be passive aggressive with your agents](https://thefocus.ai/posts/dont-be-passive-aggressive/)

Based on our evaluation and experience, here are the critical lessons:

### 1. Communicate Clearly, Not Aggressively
When agents go off rails, resist writing in ALL CAPS. Instead:
- Step back and take a breath
- Roll back to previous checkpoint  
- Adjust prompt with more context
- Ask agent to review existing code first

### 2. Speed > Endurance
"Claude ran for 7 hours" isn't impressive - it's concerning. Jules completing tasks in 6 minutes vs Copilot taking 30 minutes doesn't mean 5x better results, it means 5x smarter execution.

### 3. Match Your Development Lifecycle
- One-off script? Use dynamic typing, inline everything
- Production system? More ceremony and structure needed
- Different tools for different contexts

### 4. Drop Unnecessary Ceremony
Agents often over-engineer. Push back on:
- Complex build systems for simple scripts
- Modular file structures when inline works
- Enterprise patterns for MVPs
- Remember: future you will use agents to clean up technical debt

### 5. Technical Debt Is Different Now
With agents reducing the cost of refactoring, yesterday's technical debt becomes more manageable. The economics of code maintenance have fundamentally shifted.

### 6. Rules-Driven Development
Document development practices in your repo:
- Cursor: `.rules` directory
- Claude: `CLAUDE.md` files  
- Copilot: GitHub integration rules
- These guide agent behavior across runs

## Repository Contents

### Reports
- **[june-2025-coding-agents.pdf](june-2025-coding-agents.pdf)** - Complete formatted report (61 pages)
- `june-2025-coding-agents.md` - Source markdown

### Visual Gallery
- **[📸 Screenshots Gallery](SCREENSHOTS.md)** - Visual showcase of all 15 agent implementations

### Implementation Examples
Each agent's implementation is available in local directories with full source code:

#### IDE Agents
- **[idears-copilot/](idears-copilot/)** - GitHub Copilot basic (Score: 13/25)
- **[idears-cursor/](idears-cursor/)** - Cursor IDE implementation (Score: 21/25)
- **[idears-roocode/](idears-roocode/)** - RooCode VSCode extension (Score: 20/25)
- **[idears-windsurf/](idears-windsurf/)** - Windsurf IDE agent (Score: 13/25)

#### CLI Agents
- **[idears-aider/](idears-aider/)** - OSS CLI agent example (Score: 17/25)
- **[idears-claude/](idears-claude/)** - Anthropic's code agent (Score: 19/25)
- **[idears-codex/](idears-codex/)** - OpenAI CLI implementation (Score: 19/25)
- **[idears-goose/](idears-goose/)** - Block's CLI agent (Score: 16/25)

#### Full-Stack Agents
- **[idears-codex-agent/](idears-codex-agent/)** - OpenAI's agent platform (Score: 18/25)
- **[idears-copilot-plus/](idears-copilot-plus/)** - GitHub Copilot Agent (Score: 21/25)
- **[idears-cursor-agent/](idears-cursor-agent/)** - Cursor background agent 🏆 (Score: 24/25)
- **[idears-jules/](idears-jules/)** - Google's coding agent (Score: 21/25)
- **[idears-replit/](idears-replit/)** - Replit platform example (Score: 15/25)

#### Hybrid Platforms
- **[idears-v0/](idears-v0/)** - Vercel's UI agent 🏆 (Score: 24/25)
- **[idears-warp/](idears-warp/)** - Warp terminal implementation 🏆 (Score: 24/25)

## Testing Philosophy

This evaluation tests **non-expert empowerment** - how these tools perform for someone dipping in for the first time. We used a "YOLO" approach: blindly accepting suggestions without code review or iteration, simulating how non-coders might interact with these tools.

## Future Outlook

The landscape is rapidly evolving. By summer 2025, we expect:
- Better SDLC integration across all platforms
- Improved local model performance  
- More sophisticated rule-based development workflows
- Greater emphasis on speed over complexity

---

## Related Resources

- 📰 **[Full Turing Post Article](https://www.turingpost.com/c/coding-agents-2025)** - Published coverage with additional insights
- 📝 **[Don't Be Passive Aggressive Blog Post](https://thefocus.ai/posts/dont-be-passive-aggressive/)** - Companion article on agent collaboration
- 📸 **[Screenshots Gallery](SCREENSHOTS.md)** - Visual showcase of all implementations
- 🎯 **[TheFocus.AI](https://thefocus.ai)** - More AI development insights and tools

---

*Report authors: Will Schenk/TheFocus.AI
Published on Turing Post: June 21, 2025  
Original evaluation: June 2025*
