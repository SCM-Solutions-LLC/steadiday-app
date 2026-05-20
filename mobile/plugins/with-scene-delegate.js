const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function findAppDir(platformRoot) {
  const entries = fs.readdirSync(platformRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      !entry.name.endsWith('.xcodeproj') &&
      !entry.name.endsWith('.xcworkspace') &&
      entry.name !== 'Pods' &&
      entry.name !== 'build' &&
      !entry.name.startsWith('.')
    ) {
      const appDelegatePath = path.join(platformRoot, entry.name, 'AppDelegate.swift');
      const appDelegateM = path.join(platformRoot, entry.name, 'AppDelegate.mm');
      if (fs.existsSync(appDelegatePath) || fs.existsSync(appDelegateM)) {
        return entry.name;
      }
    }
  }
  return null;
}

const withSceneDelegate = (config) => {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const appDir = findAppDir(platformRoot) || config.modRequest.projectName || 'SteadiDay';
      const sceneDelegatePath = path.join(platformRoot, appDir, 'SceneDelegate.swift');
      const sceneDelegateDir = path.dirname(sceneDelegatePath);

      if (!fs.existsSync(sceneDelegateDir)) {
        fs.mkdirSync(sceneDelegateDir, { recursive: true });
      }

      if (!fs.existsSync(sceneDelegatePath)) {
        const content = `import UIKit
import Expo
import React
import ReactAppDependencyProvider

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = (scene as? UIWindowScene) else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    if appDelegate.reactNativeFactory == nil { return }

    let window = UIWindow(windowScene: windowScene)
    if let factory = appDelegate.reactNativeFactory {
      factory.startReactNative(
        withModuleName: "main",
        in: window,
        launchOptions: nil
      )
    }
    self.window = window
    window.makeKeyAndVisible()
  }

  func sceneDidDisconnect(_ scene: UIScene) {}
  func sceneDidBecomeActive(_ scene: UIScene) {}
  func sceneWillResignActive(_ scene: UIScene) {}
  func sceneWillEnterForeground(_ scene: UIScene) {}
  func sceneDidEnterBackground(_ scene: UIScene) {}
}
`;
        fs.writeFileSync(sceneDelegatePath, content, 'utf8');
        console.log('✅ Created SceneDelegate.swift');
      }

      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName || 'SteadiDay';
    const swiftPath = `${projectName}/SceneDelegate.swift`;

    if (!project.hasFile(swiftPath)) {
      project.addSourceFile(swiftPath, {}, project.getFirstProject().firstProject.mainGroup);
    }

    console.log('✅ SceneDelegate.swift added to Xcode project');
    return config;
  });

  return config;
};

module.exports = withSceneDelegate;
