#!/bin/bash
# Script to add SceneDelegate.swift to Xcode project after prebuild
# This is a workaround since config plugins have limitations with xcode project manipulation

PROJECT_FILE="ios/DailyCompanion.xcodeproj/project.pbxproj"
SCENE_FILE="ios/DailyCompanion/SceneDelegate.swift"

if [ ! -f "$SCENE_FILE" ]; then
  echo "SceneDelegate.swift not found, skipping"
  exit 0
fi

if grep -q "SceneDelegate.swift" "$PROJECT_FILE" 2>/dev/null; then
  echo "SceneDelegate.swift already in project"
  exit 0
fi

echo "Note: SceneDelegate.swift needs to be added to Xcode project manually"
echo "Open ios/DailyCompanion.xcworkspace in Xcode and add the file"
