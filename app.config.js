module.exports = {
  expo: {
    name: "Drink Me",
    slug: "drinkme",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/adaptive-icon.png",
    scheme: "drinkme",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#D9F2FB",
      },
      edgeToEdgeEnabled: true,
      package: "com.tejasnasre.drinkme",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/adaptive-icon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/adaptive-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#D9F2FB",
        },
      ],
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/OpenSans_SemiCondensed-LightItalic.ttf"],
          android: {
            fonts: [
              {
                fontFamily: "OpenSans_SemiCondensed-LightItalic",
                fontDefinitions: [
                  {
                    path: "./assets/fonts/OpenSans_SemiCondensed-LightItalic.ttf",
                    weight: 800,
                  },
                ],
              },
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "0c84caef-577f-4e78-8758-1da631a4764a",
      },
    },
  },
};
