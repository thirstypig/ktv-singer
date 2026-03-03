module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@common": "./src/common",
            "@features": "./src/features",
            "@shared": "../shared",
            "@navigation": "./src/navigation",
            "@screens": "./src/screens",
            "@theme": "./src/theme",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
