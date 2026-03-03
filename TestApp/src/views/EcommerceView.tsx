import Reteno from "expo-reteno-sdk";
import { OrderStatus } from "expo-reteno-sdk/build/types";
import { Alert, ScrollView } from "react-native";
import { Block, Button, ScreenContainer } from "src/components";

export const EcommerceView = () => {
  const handleLogEcomEventProductViewed = async () => {
    await Reteno.logEcomEventProductViewed({
      product: {
        productId: "123",
        price: 29.99,
        isInStock: true,
        attributes: [{ name: "color", value: ["blue", "white"] }],
      },
      currencyCode: "EUR",
    });
  };

  const handleLogEcomEventProductCategoryViewed = async () => {
    await Reteno.logEcomEventProductCategoryViewed({
      category: {
        productCategoryId: "CATEGORY_01",
        attributes: [{ name: "gender", value: ["women"] }],
      },
    });
  };

  const handleLogEcomEventCartUpdated = async () => {
    await Reteno.logEcomEventCartUpdated({
      cartId: "CART-123",
      cartItems: [
        {
          productId: "p1",
          quantity: 2,
          price: 25.0,
          discount: 5.0,
        },
        {
          productId: "p2",
          quantity: 1,
          price: 100.0,
        },
      ],
      currencyCode: "USD",
    });
  };

  const handleLogEcomEventProductAddedToWishlist = async () => {
    await Reteno.logEcomEventProductAddedToWishlist({
      product: {
        productId: "abc",
        price: 59.99,
        isInStock: true,
        attributes: [],
      },
      currencyCode: "UAH",
    });
  };

  const handleLogEcomEventOrderCreated = async () => {
    await Reteno.logEcomEventOrderCreated({
      order: {
        externalOrderId: "ORDER-999",
        totalCost: 200,
        status: OrderStatus.Initialized,
        cartId: "CART-123",
        externalCustomerId: "user-001",
      },
      currencyCode: "USD",
    });
  };

  const handleLogEcomEventOrderUpdated = async () => {
    await Reteno.logEcomEventOrderUpdated({
      order: {
        externalOrderId: "ORDER-999",
        totalCost: 200,
        status: OrderStatus.Initialized,
        cartId: "CART-123",
        externalCustomerId: "user-001",
      },
      currencyCode: "USD",
    });
  };

  const handleLogEcomEventOrderDelivered = async () => {
    await Reteno.logEcomEventOrderDelivered({ externalOrderId: "ORDER-999" });
  };

  const handleLogEcomEventOrderCancelled = async () => {
    await Reteno.logEcomEventOrderCancelled({ externalOrderId: "ORDER-999" });
  };

  const handleLogEcomEventSearchRequest = async () => {
    await Reteno.logEcomEventSearchRequest({
      searchQuery: "running shoes",
      isFound: true,
    });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Block title="Available options">
          <Button
            text="logEcomEventProductViewed()"
            onPress={handleLogEcomEventProductViewed}
          />

          <Button
            text="logEcomEventProductCategoryViewed()"
            onPress={handleLogEcomEventProductCategoryViewed}
          />

          <Button
            text="logEcomEventProductAddedToWishlist()"
            onPress={handleLogEcomEventProductAddedToWishlist}
          />

          <Button
            text="logEcomEventCartUpdated()"
            onPress={handleLogEcomEventCartUpdated}
          />

          <Button
            text="logEcomEventOrderCreated()"
            onPress={handleLogEcomEventOrderCreated}
          />

          <Button
            text="logEcomEventOrderUpdated()"
            onPress={handleLogEcomEventOrderUpdated}
          />

          <Button
            text="LogEcomEventOrderDelivered()"
            onPress={handleLogEcomEventOrderDelivered}
          />

          <Button
            text="logEcomEventOrderCancelled()"
            onPress={handleLogEcomEventOrderCancelled}
          />

          <Button
            text="logEcomEventSearchRequest()"
            onPress={handleLogEcomEventSearchRequest}
          />
        </Block>
      </ScrollView>
    </ScreenContainer>
  );
};
