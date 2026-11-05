// Character data is kept separate so future fighters can be added without
// rewriting the renderer. Real, detailed GLB models can be assigned later.
export const characters = [
  {
    id: "bauna-kid",
    name: "BAUNA KID",
    quote: "Jai Bhavani!",
    special: "Jai Bhavani Leap",
    height: 1.0,
    jacket: 0x9f1835,
    shirt: 0xf4eee5,
    pants: 0x242633,
    hair: 0x17151a,
    skin: 0x9a6046,
    accessories: { earrings: false, lemon: false }
  },
  {
    id: "nimbu-chatora",
    name: "NIMBU CHATORA",
    quote: "Parth mera beta!",
    special: "Lemon Blast",
    height: 1.12,
    jacket: 0xe8e2d7,
    shirt: 0xf4eee5,
    pants: 0x252a36,
    hair: 0x211b1a,
    skin: 0xc58b68,
    accessories: { earrings: false, lemon: true }
  }
];
