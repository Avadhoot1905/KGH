# Related Products Feature

## Overview
The `relatedProducts` field has been successfully added to the Product model, enabling product recommendations and cross-selling opportunities.

## Schema Changes

### Product Model
Added two new fields to create a self-referential many-to-many relationship:
- `relatedProducts Product[] @relation("RelatedProducts")` - Products related to this product
- `relatedTo Product[] @relation("RelatedProducts")` - Products that list this product as related

## Database Migration
- Migration created: `20251012180741_add_related_products_relation`
- Creates a join table `_RelatedProducts` to manage the many-to-many relationship

## Seed Data
The seed script now includes 201 product relationships across 38 products, connecting:

### Firearms with:
- Compatible ammunition (same caliber)
- Suitable optics (red dots for pistols, scopes for rifles)
- Appropriate accessories (holsters, magazines, slings)
- Safety gear (hearing protection)
- Maintenance supplies (cleaning kits)

### Ammunition with:
- Compatible firearms
- Safety gear recommendations

### Accessories with:
- Compatible firearms
- Related accessories
- Complementary products

## Example Relationships

### Glock 19 Gen5 9mm (8 related products):
1. Glock 17 Gen5 9mm - Similar firearm
2. Winchester 9mm 115gr FMJ - 200rd - Compatible ammunition
3. Holosun HS507C X2 Red Dot - Compatible optic
4. Safariland OWB Holster - Glock 19 - Specific holster
5. SureFire X300U-B Weapon Light - Weapon light
6. Peltor Sport Tactical 500 Electronic Earmuff - Safety gear
7. Glock 19 Gen5 MOS 9mm - Variant model
8. Glock 43X 9mm - Similar compact pistol

### AR-15 16in 5.56 NATO Carbine (9 related products):
1. Federal 5.56 NATO 55gr FMJ - 500rd - Compatible ammunition
2. Vortex Crossfire II 3-9x40 Scope - Rifle scope
3. Magpul PMAG 30 AR/M4 Gen M3 - Compatible magazine
4. Blue Force Gear Vickers Sling - Rifle sling
5. SureFire Scout Light Pro - Weapon light
6. Peltor Sport Tactical 500 Electronic Earmuff - Safety gear
7. Hoppe's No.9 Cleaning Kit - Universal - Maintenance
8. Magpul MS1 Sling - Alternative sling
9. Hoppe's Boresnake - .223/5.56 - Cleaning tool

## Usage in Application

### Querying Related Products
```typescript
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    relatedProducts: {
      include: {
        photos: true,
        brand: true,
      }
    }
  }
});
```

### Adding Related Products
```typescript
await prisma.product.update({
  where: { id: productId },
  data: {
    relatedProducts: {
      connect: [{ id: relatedProductId1 }, { id: relatedProductId2 }]
    }
  }
});
```

### Removing Related Products
```typescript
await prisma.product.update({
  where: { id: productId },
  data: {
    relatedProducts: {
      disconnect: [{ id: relatedProductId }]
    }
  }
});
```

## Relationship Strategy
The relationships are designed to:
1. **Match calibers** - Suggest ammunition that works with firearms
2. **Suggest accessories** - Holsters, slings, lights for specific firearms
3. **Recommend upgrades** - Optics suitable for the firearm type
4. **Cross-sell** - Safety gear and maintenance supplies for all firearms
5. **Show alternatives** - Similar models or variants within the same brand
6. **Bundle products** - Complete setups (firearm + ammo + accessories)

## Statistics
- Total products: 38
- Total relationships: 201
- Average relationships per product: ~5.3
- Product with most relationships: AR-15 (9 related products)

## Testing
Run the seed script to populate relationships:
```bash
npx tsx prisma/seed.ts
```

Verify relationships:
```bash
npx prisma studio
```

## Next Steps
1. ✅ Schema updated
2. ✅ Migration applied
3. ✅ Seed data with relationships
4. 🔄 Implement UI component to display related products
5. 🔄 Add analytics to track which relationships drive conversions
6. 🔄 Create admin interface to manage relationships
