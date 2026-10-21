const tiers = ["S Tier", "A Tier", "B Tier", "C Tier", "F Tier"];
const demoPlayers = [
  { username: "Nazrein", points: 1041, rank: "S Tier", avatar: "https://mc-heads.net/avatar/Nazrein/32" },
  { username: "Zoarehboe", points: 1022, rank: "A Tier", avatar: "https://mc-heads.net/avatar/Zoarehboe/32" },
  { username: "theofr", points: 1016, rank: "B Tier", avatar: "https://mc-heads.net/avatar/theofr/32" },
  { username: "Dippoppppppp", points: 1016, rank: "C Tier", avatar: "https://mc-heads.net/avatar/Dippoppppppp/32" },
  { username: "meow2goated", points: 1016, rank: "F Tier", avatar: "https://mc-heads.net/avatar/meow2goated/32" },
  { username: "DarkNexus", points: 1010, rank: "F Tier", avatar: "https://mc-heads.net/avatar/DarkNexus/32" },
  { username: "1kcrip", points: 1001, rank: "F Tier", avatar: "https://mc-heads.net/avatar/1kcrip/32" },
  { username: "valk4life", points: 1000, rank: "F Tier", avatar: "https://mc-heads.net/avatar/valk4life/32" },
  { username: "BeamerCDM", points: 965, rank: "F Tier", avatar: "https://mc-heads.net/avatar/BeamerCDM/32" },
  { username: "D3rkGOAT", points: 964, rank: "F Tier", avatar: "https://mc-heads.net/avatar/D3rkGOAT/32" },
  { username: "s0box", points: 964, rank: "F Tier", avatar: "https://mc-heads.net/avatar/s0box/32" },
  { username: "VoidGoger", points: 964, rank: "F Tier", avatar: "https://mc-heads.net/avatar/VoidGoger/32" },
  { username: "CoolLah_007", points: 964, rank: "F Tier", avatar: "https://mc-heads.net/avatar/CoolLah_007/32" },
  { username: "_1win", points: 964, rank: "F Tier", avatar: "https://mc-heads.net/avatar/_1win/32" },
  { username: "NaniSecond", points: 950, rank: "F Tier", avatar: "https://mc-heads.net/avatar/NaniSecond/32" },
  { username: "Knight_mee", points: 974, rank: "F Tier", avatar: "https://mc-heads.net/avatar/Knight_mee/32" }
];
function getDemoTiers({mode="smp", season="1", queue="solo"}={}) {
  return { mode, season, queue, demo: true, tiers: tiers.map(tier => ({ name: tier, subtitle: tier === "F Tier" ? "Remaining players" : "Top 3%", players: demoPlayers.filter(p => p.rank === tier).map(p => ({...p, teamName: queue === "team" ? `${p.username} Team` : undefined})) })) };
}
module.exports = { getDemoTiers };
