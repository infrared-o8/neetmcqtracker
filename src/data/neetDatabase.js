/**
 * NEET Database: Comprehensive NCERT Chapter Index
 */

export const DATABASE_CATEGORIES = [
  { id: "biology", label: "Biology", icon: "🧬", color: "text-emerald-400" },
  { id: "chemistry", label: "Chemistry", icon: "🧪", color: "text-cyan-400" },
  { id: "physics", label: "Physics", icon: "⚛️", color: "text-blue-400" },
  { id: "practical", label: "Practical", icon: "🔬", color: "text-amber-400" },
];

/**
 * NCERT Book Codes mapping for PDF generation
 * Format: {bookCode}{chapterNumber}.pdf
 * Note: Chapter 0 is usually prelims, 1+ is chapters.
 */
export const NCERT_BOOKS = [
  // --- BIOLOGY ---
  {
    id: "bio11",
    title: "Biology Class 11",
    subject: "biology",
    class: 11,
    code: "kebo1",
    chapters: 22,
    chapterNames: [
      "The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom",
      "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals",
      "Cell: The Unit of Life", "Biomolecules", "Cell Cycle and Cell Division",
      "Transport in Plants", "Mineral Nutrition", "Photosynthesis in Higher Plants",
      "Respiration in Plants", "Plant Growth and Development", "Digestion and Absorption",
      "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products and their Elimination",
      "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination and Integration"
    ]
  },
  {
    id: "bio12",
    title: "Biology Class 12",
    subject: "biology",
    class: 12,
    code: "lebo1",
    chapters: 16,
    chapterNames: [
      "Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health",
      "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution",
      "Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes", "Biotechnology and its Applications",
      "Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"
    ]
  },
  // --- CHEMISTRY ---
  {
    id: "chem11-1",
    title: "Chemistry Class 11 - Part 1",
    subject: "chemistry",
    class: 11,
    code: "kech1",
    chapters: 7,
    chapterNames: [
      "Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure", "States of Matter", "Thermodynamics", "Equilibrium"
    ]
  },
  {
    id: "chem11-2",
    title: "Chemistry Class 11 - Part 2",
    subject: "chemistry",
    class: 11,
    code: "kech2",
    chapters: 7,
    chapterNames: [
      "Redox Reactions", "Hydrogen", "The s-Block Elements", "The p-Block Elements",
      "Organic Chemistry – Some Basic Principles and Techniques", "Hydrocarbons", "Environmental Chemistry"
    ]
  },
  {
    id: "chem12-1",
    title: "Chemistry Class 12 - Part 1",
    subject: "chemistry",
    class: 12,
    code: "lech1",
    chapters: 9,
    chapterNames: [
      "The Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry",
      "General Principles and Processes of Isolation of Elements", "The p-Block Elements", "The d-and f-Block Elements", "Coordination Compounds"
    ]
  },
  {
    id: "chem12-2",
    title: "Chemistry Class 12 - Part 2",
    subject: "chemistry",
    class: 12,
    code: "lech2",
    chapters: 7,
    chapterNames: [
      "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids",
      "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"
    ]
  },
  // --- PHYSICS ---
  {
    id: "phys11-1",
    title: "Physics Class 11 - Part 1",
    subject: "physics",
    class: 11,
    code: "keph1",
    chapters: 7,
    chapterNames: [
      "Units and Measurements", "Motion in a Straight Line", "Motion in a Plane",
      "Laws of Motion", "Work, Energy and Power", "System of Particles and Rotational Motion", "Gravitation"
    ]
  },
  {
    id: "phys11-2",
    title: "Physics Class 11 - Part 2",
    subject: "physics",
    class: 11,
    code: "keph2",
    chapters: 7,
    chapterNames: [
      "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter",
      "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"
    ]
  },
  {
    id: "phys12-1",
    title: "Physics Class 12 - Part 1",
    subject: "physics",
    class: 12,
    code: "leph1",
    chapters: 8,
    chapterNames: [
      "Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity",
      "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves"
    ]
  },
  {
    id: "phys12-2",
    title: "Physics Class 12 - Part 2",
    subject: "physics",
    class: 12,
    code: "leph2",
    chapters: 7,
    chapterNames: [
      "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter",
      "Atoms", "Nuclei", "Semiconductor Electronics: Materials, Devices and Simple Circuits", "Communication Systems"
    ]
  }
];

// --- PRACTICAL & LAB MANUALS ---
export const PRACTICAL_BOOKS = [
  {
    id: "prac-chem-12",
    title: "Chemistry Lab Manual Class 12",
    subject: "practical",
    class: 12,
    code: "lelm1",
    chapters: 10,
    chapterNames: [
      "Colloids", "Chemical Kinetics", "Thermochemical Measurement", "Electrochemistry",
      "Chromatography", "Titrimetric Analysis", "Systematic Qualitative Analysis",
      "Tests for Functional Groups in Organic Compounds", "Preparation of Inorganic Compounds",
      "Tests for Carbohydrates, Fats and Proteins"
    ],
    baseUrl: "https://ncert.nic.in/pdf/publication/sciencelaboratorymanuals/classXII/chemistry/"
  }
];

/**
 * Generate a flat list of chapters with dynamic metadata for search
 */
export function getFlattenedChapters() {
  const flat = [];
  
  // Textbooks
  NCERT_BOOKS.forEach(book => {
    book.chapterNames.forEach((name, index) => {
      const chNum = index + 1;
      const chId = `${book.code}${chNum < 10 ? '0' + chNum : chNum}`;
      flat.push({
        id: chId,
        title: `Ch ${chNum}: ${name}`,
        bookTitle: book.title,
        subject: book.subject,
        class: book.class,
        chNum,
        tags: [book.subject, `${book.class}th`, name, `chapter ${chNum}`, book.title, "ncert"],
        url: `https://ncert.nic.in/textbook.php?${book.code}=${chNum}-${book.chapters}`,
        directUrl: `https://ncert.nic.in/textbook/pdf/${chId}.pdf`,
        thumbnail: `https://ncert.nic.in/textbook/pdf/${book.code}ps.jpg`
      });
    });

    // Add Answers
    flat.push({
      id: `${book.code}an`,
      title: `Answers`,
      bookTitle: book.title,
      subject: book.subject,
      class: book.class,
      chNum: "an",
      tags: [book.subject, `${book.class}th`, "Answers", "Solutions", book.title, "ncert"],
      url: `https://ncert.nic.in/textbook.php?${book.code}=an-${book.chapters}`,
      directUrl: `https://ncert.nic.in/textbook/pdf/${book.code}an.pdf`,
      thumbnail: `https://ncert.nic.in/textbook/pdf/${book.code}ps.jpg`
    });
  });

  // Practicals
  PRACTICAL_BOOKS.forEach(book => {
    book.chapterNames.forEach((name, index) => {
      const chNum = index + 1;
      const chId = `${book.code}${chNum < 10 ? '0' + chNum : chNum}`;
      flat.push({
        id: chId,
        title: `Exp ${chNum}: ${name}`,
        bookTitle: book.title,
        subject: book.subject,
        class: book.class,
        chNum,
        tags: [book.subject, `${book.class}th`, name, "practical", "lab manual", "experiment"],
        url: `${book.baseUrl}${chId}.pdf`,
        directUrl: `${book.baseUrl}${chId}.pdf`,
        thumbnail: `https://ncert.nic.in/textbook/pdf/${book.code}ps.jpg`
      });
    });
  });

  return flat;
}
