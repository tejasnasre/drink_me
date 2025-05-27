import React from "react";
import { Image, StyleSheet, View } from "react-native";

type ImageComProps = {
  imageurl: string;
};

const ImageCom = ({ imageurl }: ImageComProps) => {
  return (
    <View className="flex-col items-center mt-6 mb-2">
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: imageurl,
          }}
          className="w-40 h-40"
          resizeMode="contain"
          style={styles.image}
        />
      </View>
    </View>
  );
};

export default ImageCom;

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: "#e9f6ff",
    borderRadius: 70,
    padding: 10,
    shadowColor: "#68c6ff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    borderRadius: 70,
  },
});
