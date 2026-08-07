.DEFAULT_GOAL := check

PNPM ?= pnpm
STYLE_DICTIONARY := $(PNPM) exec style-dictionary
VITEST := $(PNPM) exec vitest --run --config vitest.config.ts

.PHONY: check build typecheck lint format tokens-build tokens-check check-source \
	test test-a11y test-a11y-light test-a11y-dark storybook prepack

check: tokens-check check-source typecheck

build typecheck:
	$(PNPM) exec tsc --noEmit

lint:
	$(PNPM) exec oxlint src --fix

format:
	$(PNPM) exec oxfmt src --write

tokens-build:
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.foundations.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.native.mjs
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.light.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.dark.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.light-storybook.json
	$(STYLE_DICTIONARY) build --config src/styles/tokens/style-dictionary.dark-storybook.json

tokens-check: tokens-build
	$(PNPM) exec node src/styles/tokens/scripts/check-foundations.mjs
	git diff --exit-code -- src/styles/tokens/generated

check-source:
	$(PNPM) exec node src/styles/tokens/scripts/check-source.mjs

test:
	$(VITEST)

test-a11y: test-a11y-light test-a11y-dark

test-a11y-light:
	VITE_STORYBOOK_THEME=light $(VITEST)

test-a11y-dark:
	VITE_STORYBOOK_THEME=dark $(VITEST)

storybook: tokens-build
	$(PNPM) exec storybook dev -p 6006

prepack: check
