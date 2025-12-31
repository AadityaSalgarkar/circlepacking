# Makefile for Circle Packing with Opus 4.5 via Anannas AI
# Uses local LM Studio for embeddings

SHELL := /bin/bash
.PHONY: all start-lmstudio stop-lmstudio test-embed test-anannas test run visualize stop clean help status quick-run

# Configuration
LMSTUDIO_PORT ?= 1234
LMSTUDIO_URL := http://localhost:$(LMSTUDIO_PORT)/v1
ANANNAS_URL := https://api.anannas.ai/v1
EMBED_MODEL ?= text-embedding-nomic-embed-text-v1.5
TMUX_SESSION := shinka
VISUALIZE_PORT ?= 8888

# Evolution parameters (override with make run GENERATIONS=50)
GENERATIONS ?= 20
DATABASE ?= island_small
PARALLEL_JOBS ?= 3

# Load .env file
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Default target
all: test run visualize

# Help
help:
	@echo "Circle Packing with Opus 4.5 - Makefile Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make start-lmstudio  - Start LM Studio server and load embedding model"
	@echo "  make stop-lmstudio   - Stop LM Studio server"
	@echo ""
	@echo "Testing:"
	@echo "  make test-embed      - Test local embedding endpoint"
	@echo "  make test-anannas    - Test Anannas API connection"
	@echo "  make test            - Run all tests"
	@echo ""
	@echo "Running:"
	@echo "  make run             - Start evolution in tmux (after tests pass)"
	@echo "  make visualize       - Open visualization UI"
	@echo "  make all             - Test, run, and visualize"
	@echo ""
	@echo "Management:"
	@echo "  make stop            - Stop tmux session"
	@echo "  make clean           - Clean results directory"
	@echo "  make status          - Show tmux session status"
	@echo ""
	@echo "Configuration (override with environment or make args):"
	@echo "  GENERATIONS=$(GENERATIONS)"
	@echo "  DATABASE=$(DATABASE)"
	@echo "  PARALLEL_JOBS=$(PARALLEL_JOBS)"
	@echo "  LMSTUDIO_PORT=$(LMSTUDIO_PORT)"
	@echo "  VISUALIZE_PORT=$(VISUALIZE_PORT)"
	@echo "  EMBED_MODEL=$(EMBED_MODEL)"

# Start LM Studio server with embedding model
start-lmstudio:
	@echo "Starting LM Studio server..."
	@if ! command -v lms &> /dev/null; then \
		echo "ERROR: lms CLI not found. Install with: npx lmstudio install-cli"; \
		exit 1; \
	fi
	@lms server start --port $(LMSTUDIO_PORT) 2>/dev/null || true
	@echo "Loading embedding model: $(EMBED_MODEL)..."
	@lms load $(EMBED_MODEL) --yes 2>/dev/null || { \
		echo "Model not found locally. Searching..."; \
		lms get $(EMBED_MODEL) --yes && lms load $(EMBED_MODEL) --yes; \
	}
	@echo "Waiting for server to be ready..."
	@for i in $$(seq 1 30); do \
		if curl -s $(LMSTUDIO_URL)/models > /dev/null 2>&1; then \
			echo "LM Studio server is ready with $(EMBED_MODEL)!"; \
			exit 0; \
		fi; \
		echo "Waiting... ($$i/30)"; \
		sleep 2; \
	done; \
	echo "ERROR: LM Studio server not responding."; \
	exit 1

# Stop LM Studio server
stop-lmstudio:
	@echo "Stopping LM Studio server..."
	@lms server stop 2>/dev/null || echo "Server not running"

# Test local embedding endpoint
test-embed:
	@echo "Testing local embedding endpoint at $(LMSTUDIO_URL)..."
	@if ! curl -s $(LMSTUDIO_URL)/models > /dev/null 2>&1; then \
		echo "ERROR: LM Studio server not running at $(LMSTUDIO_URL)"; \
		echo "Run 'make start-lmstudio' or start LM Studio manually"; \
		exit 1; \
	fi
	@echo "Server is running. Testing embedding..."
	@RESPONSE=$$(curl -s -X POST $(LMSTUDIO_URL)/embeddings \
		-H "Content-Type: application/json" \
		-d '{"model": "$(EMBED_MODEL)", "input": "test embedding"}'); \
	if echo "$$RESPONSE" | grep -q '"embedding"'; then \
		echo "Embedding test PASSED"; \
		echo "Model: $(EMBED_MODEL)"; \
	elif echo "$$RESPONSE" | grep -q '"data"'; then \
		echo "Embedding test PASSED"; \
		echo "Model: $(EMBED_MODEL)"; \
	else \
		echo "ERROR: Embedding test failed"; \
		echo "Response: $$RESPONSE"; \
		echo "Make sure you have an embedding model loaded in LM Studio"; \
		exit 1; \
	fi

# Test Anannas API connection
test-anannas:
	@echo "Testing Anannas API connection..."
	@if [ -z "$(ANANNAS_API_KEY)" ] || [ "$(ANANNAS_API_KEY)" = "your_anannas_api_key_here" ]; then \
		echo "ERROR: ANANNAS_API_KEY not set or using placeholder"; \
		echo "Please set your API key in .env file"; \
		exit 1; \
	fi
	@RESPONSE=$$(curl -s -X POST $(ANANNAS_URL)/chat/completions \
		-H "Authorization: Bearer $(ANANNAS_API_KEY)" \
		-H "Content-Type: application/json" \
		-d '{"model": "anthropic/claude-opus-4-5", "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 10}'); \
	if echo "$$RESPONSE" | grep -q '"choices"'; then \
		echo "Anannas API test PASSED"; \
		echo "Model: anthropic/claude-opus-4-5"; \
	elif echo "$$RESPONSE" | grep -q '"content"'; then \
		echo "Anannas API test PASSED"; \
		echo "Model: anthropic/claude-opus-4-5"; \
	else \
		echo "ERROR: Anannas API test failed"; \
		echo "Response: $$RESPONSE"; \
		exit 1; \
	fi

# Run all tests
test: test-embed test-anannas
	@echo ""
	@echo "All tests PASSED"

# Run evolution in tmux
run: test
	@echo ""
	@echo "Starting evolution in tmux session '$(TMUX_SESSION)'..."
	@if tmux has-session -t $(TMUX_SESSION) 2>/dev/null; then \
		echo "Killing existing tmux session..."; \
		tmux kill-session -t $(TMUX_SESSION); \
	fi
	@tmux new-session -d -s $(TMUX_SESSION) -n evolution
	@tmux send-keys -t $(TMUX_SESSION):evolution "cd $$(pwd) && uv run shinka_launch task=circle_packing database=$(DATABASE) evolution=opus45_budget cluster=local evo_config.num_generations=$(GENERATIONS) evo_config.max_parallel_jobs=$(PARALLEL_JOBS)" Enter
	@echo "Evolution started in tmux session '$(TMUX_SESSION)'"
	@echo "Attach with: tmux attach -t $(TMUX_SESSION)"
	@echo ""
	@sleep 2

# Open visualization
visualize:
	@echo "Starting visualization on port $(VISUALIZE_PORT)..."
	@if tmux has-session -t $(TMUX_SESSION) 2>/dev/null; then \
		tmux new-window -t $(TMUX_SESSION) -n visualize; \
		tmux send-keys -t $(TMUX_SESSION):visualize "cd $$(pwd) && uv run shinka_visualize --port $(VISUALIZE_PORT) --open" Enter; \
	else \
		echo "Starting visualization in new tmux session..."; \
		tmux new-session -d -s $(TMUX_SESSION) -n visualize; \
		tmux send-keys -t $(TMUX_SESSION):visualize "cd $$(pwd) && uv run shinka_visualize --port $(VISUALIZE_PORT) --open" Enter; \
	fi
	@echo "Visualization started at http://localhost:$(VISUALIZE_PORT)"
	@echo "Attach with: tmux attach -t $(TMUX_SESSION)"

# Show tmux session status
status:
	@if tmux has-session -t $(TMUX_SESSION) 2>/dev/null; then \
		echo "Tmux session '$(TMUX_SESSION)' is running"; \
		tmux list-windows -t $(TMUX_SESSION); \
	else \
		echo "No tmux session '$(TMUX_SESSION)' found"; \
	fi

# Stop tmux session
stop:
	@if tmux has-session -t $(TMUX_SESSION) 2>/dev/null; then \
		tmux kill-session -t $(TMUX_SESSION); \
		echo "Tmux session '$(TMUX_SESSION)' stopped"; \
	else \
		echo "No tmux session '$(TMUX_SESSION)' to stop"; \
	fi

# Clean results
clean:
	@echo "Cleaning results directory..."
	@rm -rf results/shinka_circle_packing
	@echo "Results cleaned"

# Quick run (skip tests)
quick-run:
	@echo "Starting evolution (skipping tests)..."
	@if tmux has-session -t $(TMUX_SESSION) 2>/dev/null; then \
		tmux kill-session -t $(TMUX_SESSION); \
	fi
	@tmux new-session -d -s $(TMUX_SESSION) -n evolution
	@tmux send-keys -t $(TMUX_SESSION):evolution "cd $$(pwd) && uv run shinka_launch task=circle_packing database=$(DATABASE) evolution=opus45_budget cluster=local evo_config.num_generations=$(GENERATIONS) evo_config.max_parallel_jobs=$(PARALLEL_JOBS)" Enter
	@echo "Evolution started. Attach with: tmux attach -t $(TMUX_SESSION)"
