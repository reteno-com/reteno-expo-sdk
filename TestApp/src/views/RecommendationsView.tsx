import Reteno from "expo-reteno-sdk";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const RecommendationsView = () => {
  const [recommendations, setRecommendations] = useState([]);

  const handleGetRecommendations = async () => {
    const recommendationsPayload = {
      recomVariantId: "r1107v1482",
      productIds: ["240-LV09", "24-WG080"],
      categoryId: "",
      filters: [],
      fields: ["productId", "name", "descr", "imageUrl", "price"],
    };

    try {
      const data = await Reteno.getRecommendations(recommendationsPayload);

      if (data) {
        console.log("@@@", data);
        setRecommendations(data);
        // alert(JSON.stringify({ data }));
      }
    } catch (error) {
      alert(JSON.stringify({ error }));
    }
  };

  const handleLogRecommendationEvent = () => {
    const recommendationEventPayload = {
      recomVariantId: "r1107v1482",
      impressions: [{ productId: "240-LV09" }],
      clicks: [{ productId: "24-WG080" }],
      forcePush: true,
    };

    Reteno.logRecommendationEvent(recommendationEventPayload)
      .then(() => {
        // Handle successful logging of recommendation event
        alert("Recommendation event logged successfully");
      })
      .catch((error) => {
        // Handle error
        alert(error);
      });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button
            text="Get recommendations"
            onPress={handleGetRecommendations}
          />
          <Button
            text="Log recommendations"
            onPress={handleLogRecommendationEvent}
          />
        </Block>

        {recommendations && (
          <Block title="Recommendations">
            <Text>{JSON.stringify(recommendations)}</Text>
          </Block>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
