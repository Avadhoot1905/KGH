import { PrismaClient, ProductTag } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProductInput = {
  name: string;
  price: number;
  description: string;
  quantity: number;
  licenseRequired: boolean;
  tag?: ProductTag;
  category: string;
  brand: string;
  type: string;
  caliber: string;
  photos: { url: string; alt?: string; isPrimary?: boolean }[];
};

async function upsertBaseData() {
  const categories = [
    "Firearms",
    "Ammunition",
    "Optics",
    "Accessories",
    "Safety Gear",
    "Maintenance",
  ];

  const types = [
    { name: "Pistol", description: "Semi-automatic handgun" },
    { name: "Revolver", description: "Handgun with revolving cylinder" },
    { name: "Rifle", description: "Long gun with rifled barrel" },
    { name: "Shotgun", description: "Long gun designed to fire shot" },
    { name: "Ammunition", description: "Cartridges and shells" },
    { name: "Scope", description: "Magnified optic" },
    { name: "Red Dot", description: "Non-magnified reflex sight" },
    { name: "Magazine", description: "Detachable magazine" },
    { name: "Holster", description: "Firearm holster" },
    { name: "Sling", description: "Rifle/shotgun sling" },
    { name: "Light", description: "Weapon-mounted light" },
    { name: "Hearing Protection", description: "Ear muffs and plugs" },
    { name: "Cleaning Kit", description: "Maintenance and cleaning" },
  ];

  const calibers = [
    { name: "9mm", description: "9x19mm Parabellum" },
    { name: ".45 ACP", description: ".45 Auto" },
    { name: ".40 S&W", description: ".40 Smith & Wesson" },
    { name: ".380 ACP", description: ".380 Auto" },
    { name: ".22 LR", description: ".22 Long Rifle" },
    { name: ".357 Magnum", description: "Revolver cartridge" },
    { name: ".44 Magnum", description: "High power revolver cartridge" },
    { name: ".223 Rem", description: ".223 Remington" },
    { name: "5.56 NATO", description: "5.56x45mm" },
    { name: "7.62x39", description: "Intermediate rifle cartridge" },
    { name: ".308 Win", description: ".308 Winchester" },
    { name: "12 Gauge", description: "12 ga shotshell" },
    { name: "20 Gauge", description: "20 ga shotshell" },
    { name: ".300 BLK", description: ".300 AAC Blackout" },
  ];

  const brands = [
    { name: "Glock", logo: null, website: "https://us.glock.com" },
    { name: "Smith & Wesson", logo: null, website: "https://www.smith-wesson.com" },
    { name: "Ruger", logo: null, website: "https://ruger.com" },
    { name: "SIG Sauer", logo: null, website: "https://www.sigsauer.com" },
    { name: "Remington", logo: null, website: "https://www.remarms.com" },
    { name: "Winchester", logo: null, website: "https://winchester.com" },
    { name: "Beretta", logo: null, website: "https://www.beretta.com" },
    { name: "Mossberg", logo: null, website: "https://www.mossberg.com" },
    { name: "Colt", logo: null, website: "https://www.colt.com" },
    { name: "FN", logo: null, website: "https://fnamerica.com" },
    { name: "Heckler & Koch", logo: null, website: "https://hk-usa.com" },
    { name: "Vortex", logo: null, website: "https://vortexoptics.com" },
    { name: "Holosun", logo: null, website: "https://holosun.com" },
    { name: "Leupold", logo: null, website: "https://www.leupold.com" },
    { name: "Magpul", logo: null, website: "https://magpul.com" },
    { name: "SureFire", logo: null, website: "https://www.surefire.com" },
    { name: "Peltor", logo: null, website: "https://www.3m.com" },
    { name: "Hoppe's", logo: null, website: "https://www.hoppes.com" },
  ];

  await Promise.all(
    categories.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  await Promise.all(
    types.map((t) =>
      prisma.type.upsert({
        where: { name: t.name },
        update: { description: t.description ?? undefined },
        create: { name: t.name, description: t.description },
      })
    )
  );

  await Promise.all(
    calibers.map((c) =>
      prisma.caliber.upsert({
        where: { name: c.name },
        update: { description: c.description ?? undefined },
        create: { name: c.name, description: c.description },
      })
    )
  );

  await Promise.all(
    brands.map((b) =>
      prisma.brand.upsert({
        where: { name: b.name },
        update: { logo: b.logo ?? undefined, website: b.website ?? undefined },
        create: { name: b.name, logo: b.logo ?? undefined, website: b.website ?? undefined },
      })
    )
  );
}

async function createProducts(products: SeedProductInput[]) {
  let created = 0;
  for (const p of products) {
    const category = await prisma.category.findUnique({ where: { name: p.category } });
    const brand = await prisma.brand.findUnique({ where: { name: p.brand } });
    const type = await prisma.type.findUnique({ where: { name: p.type } });
    const caliber = await prisma.caliber.findUnique({ where: { name: p.caliber } });

    if (!category || !brand || !type || !caliber) {
      continue;
    }

    const existing = await prisma.product.findFirst({ where: { name: p.name } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          price: p.price,
          description: p.description,
          quantity: p.quantity,
          licenseRequired: p.licenseRequired,
          tag: p.tag,
          categoryId: category.id,
          brandId: brand.id,
          typeId: type.id,
          caliberId: caliber.id,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          description: p.description,
          quantity: p.quantity,
          licenseRequired: p.licenseRequired,
          tag: p.tag,
          categoryId: category.id,
          brandId: brand.id,
          typeId: type.id,
          caliberId: caliber.id,
          photos: {
            create: p.photos.map((ph, idx) => ({
              url: ph.url,
              alt: ph.alt ?? p.name,
              isPrimary: ph.isPrimary ?? idx === 0,
            })),
          },
        },
      });
    }
    created += 1;
  }
  return created;
}

function buildSeedProducts(): SeedProductInput[] {
  const img = (w: number, h: number, seed: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

  const firearms: SeedProductInput[] = [
    {
      name: "Glock 19 Gen5 9mm",
      price: 599.99,
      description: "Compact 9mm pistol with 15-round capacity, Gen5 improvements.",
      quantity: 25,
      licenseRequired: true,
      tag: "TOP_SELLER",
      category: "Firearms",
      brand: "Glock",
      type: "Pistol",
      caliber: "9mm",
      photos: [
        { url: img(800, 600, 1919), alt: "Glock 19 Gen5" },
      ],
    },
    {
      name: "Glock 17 Gen5 9mm",
      price: 629.99,
      description: "Full-size 9mm pistol with 17-round capacity.",
      quantity: 18,
      licenseRequired: true,
      tag: "NEW",
      category: "Firearms",
      brand: "Glock",
      type: "Pistol",
      caliber: "9mm",
      photos: [
        { url: img(800, 600, 1717), alt: "Glock 17 Gen5" },
      ],
    },
    {
      name: "SIG P365 9mm",
      price: 649.0,
      description: "Micro-compact 9mm pistol ideal for concealed carry.",
      quantity: 22,
      licenseRequired: true,
      category: "Firearms",
      brand: "SIG Sauer",
      type: "Pistol",
      caliber: "9mm",
      photos: [
        { url: img(800, 600, 3659), alt: "SIG P365" },
      ],
    },
    {
      name: "Beretta 92FS 9mm",
      price: 699.99,
      description: "Classic full-size 9mm with alloy frame and open slide design.",
      quantity: 12,
      licenseRequired: true,
      category: "Firearms",
      brand: "Beretta",
      type: "Pistol",
      caliber: "9mm",
      photos: [
        { url: img(800, 600, 9292), alt: "Beretta 92FS" },
      ],
    },
    {
      name: "Colt Python .357 Magnum",
      price: 1499.99,
      description: "Stainless steel double-action revolver with legendary smooth action.",
      quantity: 6,
      licenseRequired: true,
      category: "Firearms",
      brand: "Colt",
      type: "Revolver",
      caliber: ".357 Magnum",
      photos: [
        { url: img(800, 600, 3570), alt: "Colt Python" },
      ],
    },
    {
      name: "Ruger 10/22 .22 LR",
      price: 299.99,
      description: "Reliable semi-auto rimfire rifle great for plinking and training.",
      quantity: 30,
      licenseRequired: true,
      category: "Firearms",
      brand: "Ruger",
      type: "Rifle",
      caliber: ".22 LR",
      photos: [
        { url: img(800, 600, 1022), alt: "Ruger 10/22" },
      ],
    },
    {
      name: "FN SCAR 17S .308 Win",
      price: 3499.99,
      description: "Battle-proven modular rifle chambered in .308 Winchester.",
      quantity: 4,
      licenseRequired: true,
      category: "Firearms",
      brand: "FN",
      type: "Rifle",
      caliber: ".308 Win",
      photos: [
        { url: img(800, 600, 17308), alt: "FN SCAR 17S" },
      ],
    },
    {
      name: "Mossberg 590 12 Gauge",
      price: 579.99,
      description: "Pump-action shotgun trusted by military and law enforcement.",
      quantity: 10,
      licenseRequired: true,
      category: "Firearms",
      brand: "Mossberg",
      type: "Shotgun",
      caliber: "12 Gauge",
      photos: [
        { url: img(800, 600, 59012), alt: "Mossberg 590" },
      ],
    },
    {
      name: "Remington 700 .308 Win",
      price: 799.99,
      description: "Bolt-action precision rifle suitable for hunting and target shooting.",
      quantity: 8,
      licenseRequired: true,
      category: "Firearms",
      brand: "Remington",
      type: "Rifle",
      caliber: ".308 Win",
      photos: [
        { url: img(800, 600, 700308), alt: "Remington 700" },
      ],
    },
    {
      name: "HK VP9 9mm",
      price: 719.99,
      description: "Ergonomic striker-fired pistol with customizable grips.",
      quantity: 14,
      licenseRequired: true,
      category: "Firearms",
      brand: "Heckler & Koch",
      type: "Pistol",
      caliber: "9mm",
      photos: [
        { url: img(800, 600, 9909), alt: "HK VP9" },
      ],
    },
  ];

  const ammo: SeedProductInput[] = [
    {
      name: "Winchester 9mm 115gr FMJ - 200rd",
      price: 79.99,
      description: "Reliable range ammunition, 115 grain FMJ, 200 rounds.",
      quantity: 120,
      licenseRequired: false,
      tag: "TOP_SELLER",
      category: "Ammunition",
      brand: "Winchester",
      type: "Ammunition",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 9115), alt: "Winchester 9mm FMJ" }],
    },
    {
      name: "Federal 5.56 NATO 55gr FMJ - 500rd",
      price: 329.99,
      description: "Bulk 5.56 NATO, 55 grain FMJ for training and drills.",
      quantity: 60,
      licenseRequired: false,
      category: "Ammunition",
      brand: "Remington",
      type: "Ammunition",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 55655), alt: "5.56 NATO FMJ" }],
    },
    {
      name: "Winchester .308 Win 168gr BTHP - 100rd",
      price: 189.99,
      description: "Match-grade .308 Winchester, 168 grain BTHP.",
      quantity: 40,
      licenseRequired: false,
      category: "Ammunition",
      brand: "Winchester",
      type: "Ammunition",
      caliber: ".308 Win",
      photos: [{ url: img(800, 600, 308168), alt: ".308 Win BTHP" }],
    },
    {
      name: "Federal .22 LR 36gr HP - 525rd",
      price: 39.99,
      description: "Bulk .22LR hollow points great for plinking.",
      quantity: 200,
      licenseRequired: false,
      category: "Ammunition",
      brand: "Remington",
      type: "Ammunition",
      caliber: ".22 LR",
      photos: [{ url: img(800, 600, 221), alt: ".22 LR HP" }],
    },
  ];

  const opticsAccessories: SeedProductInput[] = [
    {
      name: "Vortex Crossfire II 3-9x40 Scope",
      price: 149.99,
      description: "Versatile scope with clear glass and generous eye relief.",
      quantity: 35,
      licenseRequired: false,
      tag: "NEW",
      category: "Optics",
      brand: "Vortex",
      type: "Scope",
      caliber: ".223 Rem",
      photos: [{ url: img(800, 600, 393940), alt: "Vortex Crossfire II" }],
    },
    {
      name: "Holosun HS507C X2 Red Dot",
      price: 309.99,
      description: "Solar failsafe, Shake Awake, multiple reticle system.",
      quantity: 20,
      licenseRequired: false,
      category: "Optics",
      brand: "Holosun",
      type: "Red Dot",
      caliber: ".223 Rem",
      photos: [{ url: img(800, 600, 5072), alt: "Holosun 507C X2" }],
    },
    {
      name: "Magpul PMAG 30 AR/M4 Gen M3",
      price: 14.99,
      description: "Durable 30-round polymer magazine for AR-15 platforms.",
      quantity: 150,
      licenseRequired: false,
      category: "Accessories",
      brand: "Magpul",
      type: "Magazine",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 3030), alt: "Magpul PMAG 30" }],
    },
    {
      name: "Safariland OWB Holster - Glock 19",
      price: 79.95,
      description: "Durable OWB holster with ALS retention for Glock 19.",
      quantity: 40,
      licenseRequired: false,
      category: "Accessories",
      brand: "Smith & Wesson",
      type: "Holster",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 1940), alt: "Safariland Glock 19 Holster" }],
    },
    {
      name: "Blue Force Gear Vickers Sling",
      price: 59.95,
      description: "Combat-proven two-point sling with quick adjuster.",
      quantity: 50,
      licenseRequired: false,
      category: "Accessories",
      brand: "Magpul",
      type: "Sling",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 7777), alt: "Vickers Sling" }],
    },
    {
      name: "SureFire X300U-B Weapon Light",
      price: 299.0,
      description: "Ultra-high-output LED handgun weaponlight with T-slot mount.",
      quantity: 25,
      licenseRequired: false,
      category: "Accessories",
      brand: "SureFire",
      type: "Light",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 3000), alt: "SureFire X300U" }],
    },
    {
      name: "Peltor Sport Tactical 500 Electronic Earmuff",
      price: 129.99,
      description: "Electronic hearing protection with Bluetooth and dynamic suppression.",
      quantity: 30,
      licenseRequired: false,
      category: "Safety Gear",
      brand: "Peltor",
      type: "Hearing Protection",
      caliber: ".22 LR",
      photos: [{ url: img(800, 600, 5001), alt: "Peltor Tactical 500" }],
    },
    {
      name: "Hoppe's No.9 Cleaning Kit - Universal",
      price: 24.99,
      description: "All-in-one cleaning kit suitable for multiple calibers.",
      quantity: 80,
      licenseRequired: false,
      category: "Maintenance",
      brand: "Hoppe's",
      type: "Cleaning Kit",
      caliber: ".223 Rem",
      photos: [{ url: img(800, 600, 9009), alt: "Hoppe's No.9 Kit" }],
    },
  ];

  // Additional firearm variations to ensure we exceed 30 products
  const firearmVariations: SeedProductInput[] = [
    {
      name: "Glock 19 Gen5 MOS 9mm",
      price: 699.99,
      description: "Optics-ready compact 9mm pistol with MOS cut.",
      quantity: 16,
      licenseRequired: true,
      category: "Firearms",
      brand: "Glock",
      type: "Pistol",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 191905), alt: "Glock 19 MOS" }],
    },
    {
      name: "Glock 43X 9mm",
      price: 529.99,
      description: "Slimline 9mm pistol with 10-round capacity.",
      quantity: 22,
      licenseRequired: true,
      category: "Firearms",
      brand: "Glock",
      type: "Pistol",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 4343), alt: "Glock 43X" }],
    },
    {
      name: "Smith & Wesson M&P9 2.0 Compact",
      price: 569.99,
      description: "Enhanced ergonomics and trigger in a compact 9mm platform.",
      quantity: 15,
      licenseRequired: true,
      category: "Firearms",
      brand: "Smith & Wesson",
      type: "Pistol",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 920), alt: "M&P9 2.0 Compact" }],
    },
    {
      name: "Ruger LCR .38 Special",
      price: 489.99,
      description: "Lightweight compact revolver with polymer fire control housing.",
      quantity: 12,
      licenseRequired: true,
      category: "Firearms",
      brand: "Ruger",
      type: "Revolver",
      caliber: ".357 Magnum",
      photos: [{ url: img(800, 600, 3838), alt: "Ruger LCR" }],
    },
    {
      name: "AR-15 16in 5.56 NATO Carbine",
      price: 899.99,
      description: "Direct impingement AR-15 with 16-inch barrel and M-LOK handguard.",
      quantity: 10,
      licenseRequired: true,
      category: "Firearms",
      brand: "Colt",
      type: "Rifle",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 1516), alt: "AR-15 16in Carbine" }],
    },
    {
      name: "AK-47 7.62x39 Rifle",
      price: 1099.99,
      description: "Classic AK pattern rifle chambered in 7.62x39mm.",
      quantity: 7,
      licenseRequired: true,
      category: "Firearms",
      brand: "Ruger",
      type: "Rifle",
      caliber: "7.62x39",
      photos: [{ url: img(800, 600, 7649), alt: "AK-47" }],
    },
    {
      name: "Benelli M4 12 Gauge",
      price: 1999.99,
      description: "Auto-regulating gas-operated semi-auto shotgun.",
      quantity: 5,
      licenseRequired: true,
      category: "Firearms",
      brand: "Mossberg",
      type: "Shotgun",
      caliber: "12 Gauge",
      photos: [{ url: img(800, 600, 1212), alt: "Benelli M4" }],
    },
    {
      name: "Remington 870 Express 12 Gauge",
      price: 429.99,
      description: "Iconic pump-action shotgun for field and home defense.",
      quantity: 14,
      licenseRequired: true,
      category: "Firearms",
      brand: "Remington",
      type: "Shotgun",
      caliber: "12 Gauge",
      photos: [{ url: img(800, 600, 87012), alt: "Remington 870" }],
    },
    {
      name: "Tikka T3x Lite .308 Win",
      price: 799.0,
      description: "Lightweight bolt-action rifle renowned for accuracy.",
      quantity: 9,
      licenseRequired: true,
      category: "Firearms",
      brand: "FN",
      type: "Rifle",
      caliber: ".308 Win",
      photos: [{ url: img(800, 600, 3308), alt: "Tikka T3x Lite" }],
    },
    {
      name: "SIG MCX Rattler .300 BLK",
      price: 2399.99,
      description: "Compact piston-driven platform chambered in .300 Blackout.",
      quantity: 3,
      licenseRequired: true,
      category: "Firearms",
      brand: "SIG Sauer",
      type: "Rifle",
      caliber: ".300 BLK",
      photos: [{ url: img(800, 600, 3300), alt: "SIG MCX Rattler" }],
    },
  ];

  const moreAccessories: SeedProductInput[] = [
    {
      name: "Leupold VX-Freedom 4-12x40 Scope",
      price: 299.99,
      description: "Rugged, lightweight scope with excellent optical performance.",
      quantity: 18,
      licenseRequired: false,
      category: "Optics",
      brand: "Leupold",
      type: "Scope",
      caliber: ".308 Win",
      photos: [{ url: img(800, 600, 41240), alt: "Leupold VX-Freedom" }],
    },
    {
      name: "Magpul MS1 Sling",
      price: 34.95,
      description: "Versatile two-point sling with durable hardware.",
      quantity: 55,
      licenseRequired: false,
      category: "Accessories",
      brand: "Magpul",
      type: "Sling",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 1122), alt: "Magpul MS1" }],
    },
    {
      name: "Leupold DeltaPoint Pro Red Dot",
      price: 399.99,
      description: "Durable pistol optic with wide field of view.",
      quantity: 11,
      licenseRequired: false,
      category: "Optics",
      brand: "Leupold",
      type: "Red Dot",
      caliber: ".40 S&W",
      photos: [{ url: img(800, 600, 4444), alt: "DeltaPoint Pro" }],
    },
    {
      name: "Glock 17 17-round Magazine",
      price: 24.99,
      description: "Factory OEM magazine for Glock 17.",
      quantity: 70,
      licenseRequired: false,
      category: "Accessories",
      brand: "Glock",
      type: "Magazine",
      caliber: "9mm",
      photos: [{ url: img(800, 600, 1717), alt: "Glock 17 Magazine" }],
    },
    {
      name: "SureFire Scout Light Pro",
      price: 329.0,
      description: "Low-profile weaponlight with flexible mounting options.",
      quantity: 13,
      licenseRequired: false,
      category: "Accessories",
      brand: "SureFire",
      type: "Light",
      caliber: "5.56 NATO",
      photos: [{ url: img(800, 600, 8888), alt: "Scout Light Pro" }],
    },
    {
      name: "Hoppe's Boresnake - .223/5.56",
      price: 16.99,
      description: "One-pass bore cleaning solution for .223/5.56 barrels.",
      quantity: 90,
      licenseRequired: false,
      category: "Maintenance",
      brand: "Hoppe's",
      type: "Cleaning Kit",
      caliber: ".223 Rem",
      photos: [{ url: img(800, 600, 22356), alt: "Boresnake .223" }],
    },
  ];

  const all = [
    ...firearms,
    ...ammo,
    ...opticsAccessories,
    ...firearmVariations,
    ...moreAccessories,
  ];

  return all;
}

async function main() {
  console.log("Seeding base data (categories, types, calibers, brands)...");
  await upsertBaseData();

  const products = buildSeedProducts();
  console.log(`Seeding products: ${products.length} items...`);
  const created = await createProducts(products);
  console.log(`Seed complete. Upserted ${created} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


