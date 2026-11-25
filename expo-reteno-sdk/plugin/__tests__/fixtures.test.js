/**
 * Config plugin integration tests (EXPO_UPGRADE_WORKFLOW.md §5.1–5.3).
 *
 * Runs the COMPILED plugin (plugin/build) through Expo's real mod compiler against
 * clean prebuild fixtures of Expo SDK 54–58 (plugin/__fixtures__), and checks:
 * - anchors resolve and init code lands in the right place (classic + scene templates);
 * - idempotency (repeated `prebuild --no-clean`);
 * - reversibility (APNs → Firebase → APNs);
 * - Android: manifest-only changes, Gradle files untouched.
 *
 * Run: npm run test:plugin   (compiles the plugin first)
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { compileModsAsync } = require("expo/config-plugins");
const withReteno = require("../build").default;

const FIXTURES_DIR = path.join(__dirname, "..", "__fixtures__");
const FIXTURES = fs
  .readdirSync(FIXTURES_DIR)
  .filter((d) => d.startsWith("sdk-"))
  .sort();

const FILES = {
  appDelegate: "ios/fixture/AppDelegate.swift",
  podfile: "ios/Podfile",
  pbxproj: "ios/fixture.xcodeproj/project.pbxproj",
  infoPlist: "ios/fixture/Info.plist",
  entitlements: "ios/fixture/fixture.entitlements",
  manifest: "android/app/src/main/AndroidManifest.xml",
  rootGradle: "android/build.gradle",
  appGradle: "android/app/build.gradle",
  gradleProperties: "android/gradle.properties",
};

const read = (root, file) => {
  const p = path.join(root, file);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
};

const snapshot = (root) =>
  Object.fromEntries(
    Object.entries(FILES).map(([key, file]) => [key, read(root, file)]),
  );

const copyFixture = (name) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `reteno-${name}-`));
  fs.cpSync(path.join(FIXTURES_DIR, name), root, { recursive: true });
  return root;
};

async function runPlugin(root, { service, googleServicesFile = true }) {
  const app = JSON.parse(read(root, "app.json")).expo;
  let config = {
    ...app,
    android: {
      ...app.android,
      ...(googleServicesFile ? { googleServicesFile: "./google-services.json" } : {}),
    },
    _internal: { projectRoot: root },
  };
  const props = {
    ios: {
      notificationService: service,
      appGroups: ["group.com.example.fixture.reteno-local-storage"],
      mode: "development",
      config: {},
      sdkAccessToken: "TEST_PLACEHOLDER_KEY",
    },
    android: { sdkAccessToken: "TEST_PLACEHOLDER_KEY", config: {} },
  };

  const warnings = [];
  const { warn, log } = console;
  console.warn = (...args) => warnings.push(args.join(" "));
  console.log = () => {};
  try {
    config = withReteno(config, props);
    await compileModsAsync(config, {
      projectRoot: root,
      platforms: ["ios", "android"],
      assertMissingModProviders: false,
    });
  } finally {
    console.warn = warn;
    console.log = log;
  }
  return { files: snapshot(root), warnings };
}

for (const name of FIXTURES) {
  test(`${name}: init is inserted after reactNativeFactory and before React Native starts`, async () => {
    const root = copyFixture(name);
    const { files } = await runPlugin(root, { service: "apns" });
    const ad = files.appDelegate;

    const factory = ad.indexOf("reactNativeFactory = factory");
    const init = ad.indexOf("ExpoRetenoSdkModule.delayedStart()");
    const start = ad.indexOf("factory.startReactNative(");
    assert.ok(factory > -1 && init > factory, "init must follow `reactNativeFactory = factory`");
    if (start > -1) {
      assert.ok(init < start, "init must run before factory.startReactNative");
    }
    assert.equal(ad.split("ExpoRetenoSdkModule.delayedStart()").length - 1, 1, "init inserted once");
    const expoImport = ad.match(/^((?:internal |public |package )?)import Expo$/m);
    assert.ok(expoImport, "template `import Expo` line present");
    const level = expoImport[1];
    assert.match(ad, new RegExp(`^${level}import Reteno\\n${level}import ExpoRetenoSdk$`, "m"), "Reteno imports mirror the template access level");
    assert.match(ad, /didRegisterForRemoteNotificationsWithDeviceToken/);
    assert.doesNotMatch(ad, /import Firebase/);
  });

  test(`${name}: APNs and Firebase runs are idempotent and reversible`, async () => {
    const root = copyFixture(name);
    const apns1 = (await runPlugin(root, { service: "apns" })).files;
    const apns2 = (await runPlugin(root, { service: "apns" })).files;
    assert.deepEqual(apns2, apns1, "second APNs run must not change native files");

    const fb1 = (await runPlugin(root, { service: "firebase" })).files;
    const fb2 = (await runPlugin(root, { service: "firebase" })).files;
    assert.deepEqual(fb2, fb1, "second Firebase run must not change native files");
    assert.match(fb1.appDelegate, /FirebaseApp\.configure\(\)/);
    assert.match(fb1.appDelegate, /extension AppDelegate: MessagingDelegate/);
    assert.match(fb1.podfile, /@generated begin expo-reteno-sdk - firebase pods/);
    assert.match(fb1.podfile, /pod 'FirebaseMessaging', :modular_headers => true/);

    const apns3 = (await runPlugin(root, { service: "apns" })).files;
    assert.deepEqual(apns3, apns1, "Firebase → APNs must restore the APNs state");
    assert.doesNotMatch(apns3.podfile, /Firebase/);
  });

  test(`${name}: extension targets are added once with the app deployment target`, async () => {
    const root = copyFixture(name);
    const before = read(root, FILES.pbxproj);
    const appTargets = [...before.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g)].map((m) => m[1]);
    const { files } = await runPlugin(root, { service: "apns" });
    await runPlugin(root, { service: "apns" });
    const after = read(root, FILES.pbxproj);

    for (const target of ["NotificationServiceExtension", "NotificationContentExtension"]) {
      const count = (after.match(new RegExp(`name = "?${target}"?;`, "g")) || []).length;
      // PBXNativeTarget + PBXGroup reference the target name.
      assert.ok(count >= 1, `${target} target must exist`);
      assert.equal(
        (after.match(new RegExp(`/\\* "?${target}"? \\*/ = \\{\\n\\s*isa = PBXNativeTarget`, "g")) || []).length,
        1,
        `${target} native target must be added exactly once`,
      );
    }
    const extTargets = [...files.pbxproj.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g)].map((m) => m[1]);
    assert.deepEqual(new Set(extTargets), new Set(appTargets), "extensions use the app deployment target");
    assert.doesNotMatch(after, /DEVELOPMENT_TEAM = ;|DevelopmentTeam = ;/, "no empty development team");
  });

  test(`${name}: Android changes are manifest-only`, async () => {
    const root = copyFixture(name);
    const before = snapshot(root);
    const { files, warnings } = await runPlugin(root, { service: "apns" });

    assert.equal(files.rootGradle, before.rootGradle, "root build.gradle untouched");
    assert.equal(files.gradleProperties, before.gradleProperties, "gradle.properties untouched");
    assert.doesNotMatch(files.appGradle, /com\.reteno|sourceCompatibility JavaVersion\.VERSION_1_8/);
    assert.match(files.manifest, /expo\.modules\.retenosdk\.ExpoRetenoClickReceiver/);
    assert.match(files.manifest, /expo\.modules\.retenosdk\.ExpoRetenoPushReceiver/);
    assert.match(files.manifest, /com\.reteno\.SDK_ACCESS_KEY/);
    assert.ok(!warnings.some((w) => w.includes("googleServicesFile")), "no warning when googleServicesFile is set");
  });
}

test("warns (does not fail) when android.googleServicesFile is missing", async () => {
  const root = copyFixture(FIXTURES[FIXTURES.length - 1]);
  const { warnings } = await runPlugin(root, { service: "apns", googleServicesFile: false });
  assert.ok(warnings.some((w) => w.includes("android.googleServicesFile")));
});

test("fails with a clear error when an AppDelegate anchor is missing", async () => {
  const root = copyFixture(FIXTURES[FIXTURES.length - 1]);
  const adPath = path.join(root, FILES.appDelegate);
  fs.writeFileSync(
    adPath,
    fs.readFileSync(adPath, "utf8").replace(/^\s*reactNativeFactory = factory\s*$/m, ""),
  );
  await assert.rejects(runPlugin(root, { service: "apns" }), /Expected exactly one match/);
});
