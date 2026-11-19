const XIXIANG = "https://sz.centanet.com/chengjiao/xixiang/";
const CENTALINE = "深圳中原地产";

const records = [
  { name: "万科都会四季花园", aliases: ["万科都会四季"], date: "2026-10-25", total: 436, area: 77.32, url: XIXIANG },
  { name: "榕江壹号院", aliases: [], date: "2026-10-22", total: 940, area: 120.32, url: XIXIANG },
  { name: "香缇湾花园", aliases: ["香缇湾", "中熙香缇湾"], date: "2026-09-20", total: 595, area: 89.21, url: XIXIANG },
  { name: "碧海富通城（一期）", aliases: ["碧海富通城一期", "富通城一期"], date: "2026-09-19", total: 576, area: 108.95, url: "https://sz.centanet.com/chengjiao/p3h3/" },
  { name: "安泰花园", aliases: [], date: "2026-09-14", total: 225, area: 66.4, url: XIXIANG },
  { name: "越秀和樾府", aliases: [], date: "2026-05-27", total: 848, area: 107.92, url: XIXIANG },
  { name: "金达花园", aliases: [], date: "2026-05-25", total: 210, area: 67.56, url: XIXIANG },
  { name: "圣淘沙", aliases: ["圣淘沙骏园"], date: "2026-05-24", total: 750, area: 117.43, url: XIXIANG },
  { name: "领航城领秀花园", aliases: ["领航城领秀"], date: "2026-05-23", total: 380, area: 80.37, url: XIXIANG },
  { name: "河东骏濠园", aliases: [], date: "2026-05-12", total: 238, area: 41.5, url: XIXIANG },
  { name: "中粮锦云", aliases: ["中粮锦云花园"], date: "2026-05-06", total: 375, area: 63.53, url: XIXIANG },
  { name: "山语华庭", aliases: [], date: "2026-05-05", total: 672, area: 143.44, url: XIXIANG },
  { name: "金港华庭", aliases: [], date: "2026-05-01", total: 394, area: 87.08, url: XIXIANG },
  { name: "阳光新居", aliases: [], date: "2026-04-27", total: 332, area: 80.16, url: XIXIANG },
  { name: "招商果岭", aliases: ["招商果岭花园"], date: "2026-04-07", total: 558, area: 124.47, url: `${XIXIANG}g2/` },
  { name: "富盈门花园", aliases: [], date: "2026-04-02", total: 358, area: 92.36, url: `${XIXIANG}g2/` },
  { name: "碧海富通城（五期）", aliases: ["碧海富通城五期", "富通城五期"], date: "2026-03-17", total: 457, area: 86.61, url: "https://sz.centanet.com/chengjiao/baoan/c3c8c2/" },
];

function normalize(name: string): string {
  return name.normalize("NFKC").replace(/[()\s·-]/g, "");
}

export function latestEstateSale(name: string, districtName: string) {
  if (districtName !== "宝安区" && districtName !== "宝安") return undefined;
  const key = normalize(name);
  const record = records
    .filter((entry) => [entry.name, ...entry.aliases].some((alias) => normalize(alias) === key))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return record && { ...record, perSquareMetre: record.total / record.area, source: CENTALINE };
}
