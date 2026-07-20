const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "code-worker-me",
          name: "PomGiv",
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-wix",
      config: {
        name: "PomGiv",
        shortName: "PomGiv",
        description: "Pomodoro Timer by Giveonaldo",
        version: "1.0.0",
        manufacturer: "Giveonaldo",
        language: 1033,

        // --- Aset & Tampilan ---
        icon: "./assets/icon-1.ico", // Ikon untuk installer dan Add/Remove Programs

        // --- Struktur Folder Instalasi ---
        programFilesFolderName: "PomGiv", // Nama folder di dalam C:\Program Files\
        shortcutFolderName: "PomGiv", // Nama folder di dalam Windows Start Menu

        // --- Identitas Sistem (Standar Windows 10/11) ---
        // Format standar industri: com.namapengembang.namaaplikasi (semua huruf kecil)
        // Berguna agar sistem notifikasi Windows dan Taskbar mengenali aplikasi secara unik
        appUserModelId: "com.AbriansyahAdam.pomgiv",

        // --- Pengaturan Wizard Antarmuka (UI) ---
        ui: {
          chooseDirectory: true, // Menampilkan opsi pemilihan folder instalasi kepada pengguna
        },
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
