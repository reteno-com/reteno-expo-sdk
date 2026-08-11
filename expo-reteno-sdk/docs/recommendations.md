# Recommendations

## Get Recommendations

Use recommendations API to get personalized products.

```ts
import Reteno from 'expo-reteno-sdk';

const recommendationsPayload = {
  recomVariantId: 'r1107v1482',
  productIds: ['240-LV09', '24-WG080'],
  categoryId: '',
  filters: [],
  fields: ['productId', 'name', 'descr', 'imageUrl', 'price'],
};

Reteno.getRecommendations(recommendationsPayload)
  .then((response) => {
    console.log('Recommendations received:', response);
  })
  .catch((error) => {
    console.error('Error fetching recommendations:', error);
  });
```

## Log Recommendation Event

Track impressions and clicks for recommendation widgets.

```ts
import Reteno from 'expo-reteno-sdk';

const recommendationEventPayload = {
  recomVariantId: 'r1107v1482',
  impressions: [{ productId: '240-LV09' }],
  clicks: [{ productId: '24-WG080' }],
  forcePush: true,
};

Reteno.logRecommendationEvent(recommendationEventPayload)
  .then(() => {
    console.log('Recommendation event logged successfully');
  })
  .catch((error) => {
    console.error('Error logging recommendation event:', error);
  });
```
