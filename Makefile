.PHONY: help install test demos web web-build lint ci clean

help:
	@echo "A2AConnect targets:"
	@echo "  make install   - Python editable + dev deps"
	@echo "  make test      - pytest"
	@echo "  make demos     - run all Python demos"
	@echo "  make web       - Next.js dev server"
	@echo "  make web-build - Next.js production build"
	@echo "  make ci        - test + demos + web-build"
	@echo "  make clean     - caches and build artifacts"

install:
	python3 -m pip install -e ".[dev]"

test:
	pytest -q

demos:
	python demos/quickstart.py
	python demos/support_desk.py
	python demos/incident_handoff.py
	python demos/two_agents.py
	python demos/registry_hub.py

web:
	cd apps/web && npm run dev

web-build:
	cd apps/web && npm ci && npm run build

ci: install test demos web-build

clean:
	rm -rf .pytest_cache **/__pycache__ apps/web/.next packages/*/dist
