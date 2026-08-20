.DEFAULT_GOAL := check

PNPM ?= pnpm
STYLE_DICTIONARY := $(PNPM) exec style-dictionary
VITEST := $(PNPM) exec vitest --run --config vitest.config.ts

.PHONY: check build test storybook format

build:
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.foundations.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.light.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.dark.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.light-storybook.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.dark-storybook.json
	$(PNPM) exec tsc --noEmit

check: build
	$(PNPM) exec node src/styles/tokens/scripts/check-foundations.mjs
	git diff --exit-code -- src/styles/tokens/generated .storybook/generated
	$(PNPM) exec node src/styles/tokens/scripts/check-source.mjs
	$(PNPM) exec oxlint src

test: build
	$(VITEST)
	VITE_STORYBOOK_THEME=dark $(VITEST)

storybook: build
	$(PNPM) exec storybook dev -p 6006

format:
	$(PNPM) exec oxfmt src --write
