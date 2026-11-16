// Club colours and display names, by provider team id.
// `name` only where the provider's is abbreviated, unaccented or too long.
export const teamInfo: Record<number, { name?: string; colors: [string, string] }> = {
  // Liga Profesional
  394797: { colors: ["#0b7a3b", "#f2c500"] }, // Aldosivi
  390542: { colors: ["#d0021b", "#ffffff"] }, // Argentinos Juniors
  387989: { colors: ["#7ec3f0", "#ffffff"] }, // Atlético Tucumán
  382883: { colors: ["#0a7d45", "#ffffff"] }, // Banfield
  2070416: { colors: ["#d61f26", "#ffffff"] }, // Barracas Central
  375224: { name: "Belgrano", colors: ["#5bb5e8", "#ffffff"] },
  384585: { colors: ["#103f79", "#f3b229"] }, // Boca Juniors
  907099: { name: "Central Córdoba", colors: ["#111111", "#ffffff"] },
  376926: { colors: ["#f5d000", "#0a8a3a"] }, // Defensa y Justicia
  405860: { colors: ["#111111", "#ffffff"] }, // Deportivo Riestra
  383734: { name: "Estudiantes", colors: ["#d5202a", "#ffffff"] },
  2063608: { name: "Estudiantes (RC)", colors: ["#6db7e8", "#ffffff"] },
  370118: { name: "Gimnasia", colors: ["#12284c", "#ffffff"] },
  907950: { name: "Gimnasia (Mza)", colors: ["#111111", "#ffffff"] },
  379479: { name: "Huracán", colors: ["#ffffff", "#e2231a"] },
  403307: { name: "Independiente Rivadavia", colors: ["#1b3f8b", "#ffffff"] },
  386287: { colors: ["#d7141a", "#ffffff"] }, // Independiente
  407562: { name: "Instituto", colors: ["#d2232a", "#ffffff"] },
  380330: { colors: ["#7a1a2c", "#ffffff"] }, // Lanús
  389691: { name: "Newell's", colors: ["#d71920", "#111111"] },
  906248: { colors: ["#5a3a22", "#ffffff"] }, // Platense
  371820: { name: "Racing", colors: ["#75bde8", "#ffffff"] },
  370969: { colors: ["#ffffff", "#e30613"] }, // River Plate
  372671: { colors: ["#123c7b", "#f6c400"] }, // Rosario Central
  392244: { name: "San Lorenzo", colors: ["#14315f", "#c8102e"] },
  404158: { name: "Sarmiento", colors: ["#0c8040", "#ffffff"] },
  388840: { name: "Talleres", colors: ["#152a55", "#ffffff"] },
  385436: { colors: ["#1d3e8a", "#d2202a"] }, // Tigre
  376075: { name: "Unión", colors: ["#d81e2c", "#ffffff"] },
  373522: { name: "Vélez", colors: ["#ffffff", "#1b4a9c"] },

  // Primera Nacional
  2064459: { colors: ["#1e4fa3", "#ffffff"] }, // Acassuso
  393946: { colors: ["#0a8a3a", "#d2202a"] }, // Agropecuario
  395648: { colors: ["#ffffff", "#111111"] }, // All Boys
  410966: { colors: ["#1b3f8b", "#111111"] }, // Almagro
  7127909: { colors: ["#f5c400", "#111111"] }, // Almirante Brown
  1658532: { colors: ["#1b3f8b", "#f5c400"] }, // Atlanta
  397350: { name: "Mitre (SdE)", colors: ["#f5c400", "#111111"] },
  396499: { name: "Atlético de Rafaela", colors: ["#7ec3f0", "#ffffff"] },
  1648320: { name: "Estudiantes (BA)", colors: ["#ffffff", "#111111"] },
  1661085: { colors: ["#111111", "#ffffff"] }, // Central Norte
  381181: { name: "Chacarita", colors: ["#d2202a", "#111111"] },
  1656830: { colors: ["#111111", "#ffffff"] }, // Chaco For Ever
  14137596: { colors: ["#6db7e8", "#ffffff"] }, // Ciudad de Bolívar
  3378403: { name: "Güemes", colors: ["#1b3f8b", "#d2202a"] },
  7129611: { colors: ["#1b3f8b", "#d2202a"] }, // Colegiales
  382032: { name: "Colón", colors: ["#d2202a", "#111111"] },
  908801: { name: "Defensores de Belgrano", colors: ["#d2202a", "#111111"] },
  1642363: { colors: ["#f5c400", "#111111"] }, // Deportivo Madryn
  1663638: { colors: ["#d2202a", "#ffffff"] }, // Deportivo Maipú
  399903: { colors: ["#ffffff", "#d2202a"] }, // Deportivo Morón
  400754: { name: "Ferro", colors: ["#0a7d45", "#ffffff"] },
  408413: { name: "Gimnasia (J)", colors: ["#6db7e8", "#ffffff"] },
  1641512: { name: "Gimnasia y Tiro", colors: ["#6db7e8", "#ffffff"] },
  374373: { colors: ["#1d3e8a", "#ffffff"] }, // Godoy Cruz
  411817: { colors: ["#d2202a", "#ffffff"] }, // Los Andes
  1671297: { colors: ["#1b3f8b", "#ffffff"] }, // Midland
  412668: { colors: ["#0a8a3a", "#111111"] }, // Nueva Chicago
  378628: { colors: ["#d2202a", "#111111"] }, // Patronato
  409264: { colors: ["#ffffff", "#14315f"] }, // Quilmes
  1666191: { name: "Racing (Cba)", colors: ["#75bde8", "#ffffff"] },
  393095: { name: "San Martín (SJ)", colors: ["#0a7d45", "#111111"] },
  413519: { name: "San Martín (T)", colors: ["#d2202a", "#ffffff"] },
  7131313: { name: "San Miguel", colors: ["#0a8a3a", "#ffffff"] },
  1644916: { colors: ["#6db7e8", "#14315f"] }, // San Telmo
  387138: { colors: ["#75bde8", "#ffffff"] }, // Temperley
  1672999: { name: "Tristán Suárez", colors: ["#ffffff", "#1b3f8b"] },
};
