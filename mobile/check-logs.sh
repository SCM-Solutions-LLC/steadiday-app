#!/bin/bash
echo "Check your Metro bundler terminal for these logs:"
echo "1. [AppStore] Starting rehydration..."
echo "2. [AppStore] Rehydration callback called"
echo "3. [AppStore] Setting _hasHydrated = true"
echo ""
echo "If you don't see these, the store isn't hydrating properly."
echo ""
echo "Quick fix: Stop the app (Cmd+C) and restart: npx expo start --clear"
