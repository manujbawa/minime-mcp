# MiniMe MCP Root Makefile
# Delegates to build/Makefile for all operations

.PHONY: help all up down build logs shell status clean restart health test

# Default target
.DEFAULT_GOAL := help

# Delegate all targets to build/Makefile
%:
	@cd build && $(MAKE) $@

# Show help
help:
	@echo "MiniMe MCP - Single Container Build System"
	@echo ""
	@echo "All commands are delegated to build/Makefile"
	@echo "Run 'make all' for quick start, or cd build/ for more options"
	@echo ""
	@cd build && $(MAKE) help