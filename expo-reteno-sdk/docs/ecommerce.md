# Ecommerce Activity Tracking

Reteno e-commerce tracking helps capture product, cart, order, and search behavior.

```ts
import Reteno from 'expo-reteno-sdk';
```

## Supported Events

- `logEcomEventProductViewed`
- `logEcomEventProductCategoryViewed`
- `logEcomEventProductAddedToWishlist`
- `logEcomEventCartUpdated`
- `logEcomEventOrderCreated`
- `logEcomEventOrderUpdated`
- `logEcomEventOrderDelivered`
- `logEcomEventOrderCancelled`
- `logEcomEventSearchRequest`

## Usage Examples

### Product viewed

```ts
await Reteno.logEcomEventProductViewed({
  product: {
    productId: '123',
    price: 29.99,
    isInStock: true,
    attributes: [{ name: 'color', value: ['blue', 'white'] }],
  },
  currencyCode: 'EUR',
});
```

### Product category viewed

```ts
await Reteno.logEcomEventProductCategoryViewed({
  category: {
    productCategoryId: 'CATEGORY_01',
    attributes: [{ name: 'gender', value: ['women'] }],
  },
});
```

### Product added to wishlist

```ts
await Reteno.logEcomEventProductAddedToWishlist({
  product: {
    productId: 'abc',
    price: 59.99,
    isInStock: true,
    attributes: [],
  },
  currencyCode: 'UAH',
});
```

### Cart updated

```ts
await Reteno.logEcomEventCartUpdated({
  cartId: 'CART-123',
  cartItems: [
    { productId: 'p1', quantity: 2, price: 25.0, discount: 5.0 },
    { productId: 'p2', quantity: 1, price: 100.0 },
  ],
  currencyCode: 'USD',
});
```

### Order created / updated

```ts
await Reteno.logEcomEventOrderCreated({
  order: {
    externalOrderId: 'ORDER-999',
    totalCost: 200,
    status: 0, // Initialized
    cartId: 'CART-123',
    externalCustomerId: 'user-001',
  },
  currencyCode: 'USD',
});

await Reteno.logEcomEventOrderUpdated({
  order: {
    externalOrderId: 'ORDER-999',
    totalCost: 200,
    status: 1, // InProgress
  },
  currencyCode: 'USD',
});
```

### Order delivered / cancelled

```ts
await Reteno.logEcomEventOrderDelivered({ externalOrderId: 'ORDER-999' });
await Reteno.logEcomEventOrderCancelled({ externalOrderId: 'ORDER-999' });
```

### Search request

```ts
await Reteno.logEcomEventSearchRequest({
  searchQuery: 'running shoes',
  isFound: true,
});
```

Use valid [ISO-4217](https://en.wikipedia.org/wiki/ISO_4217) currency codes (`USD`, `EUR`, etc).
