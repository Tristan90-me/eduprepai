// ── BECE canonical topic taxonomy ──────────────────────────────
// Sub-strand names from NaCCA's Common Core Programme (CCP)
// curriculum for B7/JHS1–B9/JHS3 (September 2020), the curriculum
// the new BECE is examined against. Used to keep AI-extracted/
// generated topic labels consistent across years instead of each
// extraction run inventing its own topic string — the prediction
// engine groups purely by exact topic text, so drift here silently
// fragments frequency/gap signals.
//
// Sources (official NaCCA documents):
//   Mathematics:               nacca.gov.gh/wp-content/uploads/2022/10/MATHEMATICS-CCP-B7-B9.pdf
//   Science (formerly Integrated Science): nacca.gov.gh/wp-content/uploads/2022/10/Science-Curriculum.pdf
//   Social Studies:            nacca.gov.gh/wp-content/uploads/2023/06/SOCIAL-STUDIES.pdf
//   English Language:          nacca.gov.gh/wp-content/uploads/2023/06/ENGLISH-LANGUAGE.pdf
//   Computing:                 nacca.gov.gh/wp-content/uploads/2023/06/COMPUTING.pdf
//   Religious & Moral Education: nacca.gov.gh/wp-content/uploads/2022/10/Religious-and-Moral-Education.pdf
//   French:                    nacca.gov.gh/wp-content/uploads/2022/10/FRENCH-LANGUAGE.pdf
//   Career Technology:         nacca.gov.gh/wp-content/uploads/2022/10/Career-Technology.pdf
//   Creative Arts and Design:  nacca.gov.gh/wp-content/uploads/2022/10/Creative-Arts-and-Designs.pdf
//   Ghanaian Language:         nacca.gov.gh/wp-content/uploads/2023/06/GHANAIAN-LANGUAGE.pdf
//     (one shared CCP framework taught across Asante Twi, Akuapim Twi,
//     Ga and Ewe — same strand/sub-strand structure regardless of which
//     specific language a student studies, so the same topic list is
//     applied to all four language subjects below)
//
// Every BECE subject is now covered.
//
// Each list is the union of sub-strands used across B7, B8 and B9
// (the same sub-strand recurs every year with different content
// standards, so grouping by sub-strand name is what actually
// matches how the syllabus organises topics).
export const BECE_TOPICS = {
  'Mathematics': [
    // Strand 1: Number
    'Number and Numeration Systems',
    'Number Operations',
    'Fractions, Decimals and Percentages',
    'Ratios and Proportion',
    // Strand 2: Algebra
    'Patterns and Relations',
    'Algebraic Expressions',
    'Variables and Equations',
    // Strand 3: Geometry and Measurement
    'Shape and Space',
    'Measurement',
    'Position and Transformation',
    // Strand 4: Data
    'Data',
    'Chance or Probability',
  ],

  'Science': [
    // Strand 1: Diversity of Matter
    'Materials',
    'Living Cells',
    // Strand 2: Cycles
    'Earth Science',
    'Life Cycle of Organisms',
    'Crop Production',
    'Animal Production',
    // Strand 3: Systems
    'The Human Body System',
    'The Solar System',
    'Ecosystem',
    'Farming Systems',
    // Strand 4: Forces and Energy
    'Energy',
    'Electricity and Electronics',
    'Conversion and Conservation of Energy',
    'Force and Motion',
    'Agricultural Tools',
    // Strand 5: Humans and the Environment
    'Waste Management',
    'Human Health',
    'Science and Industry',
    'Climate Change and Green Economy',
  ],

  'Social Studies': [
    // Strand 1: Environment
    'Environmental Issues',
    'Mapping Skills',
    'Understanding Our Natural World',
    'Our Natural and Human Resources',
    // Strand 2: Family Life
    'Adolescent Reproductive Health',
    'The Family',
    'Socialisation',
    'Population',
    // Strand 3: Sense of Purpose
    'Self-Identity',
    'The Individual and the Community',
    'Culture and National Identity',
    // Strand 4: Law and Order
    'Citizenship and Human Rights',
    'Conflict Prevention and Management',
    'The 1992 Constitution',
    'Peace and Security in our Nation',
    'Promoting Democracy and Political Stability',
    // Strand 5: Socio-economic Development
    'Human Resource Development',
    'Financial and Investment Issues',
    'Tourism',
    'Science and Technology',
    // Strand 6: Nationhood
    'Independent Ghana',
    'The Republics',
  ],

  'English Language': [
    // Strand 1: Oral Language (Listening and Speaking)
    'Conversation/Everyday Discourse',
    'Listening Comprehension',
    'English Sounds',
    // Strand 2: Reading
    'Comprehension',
    'Summarising',
    // Strand 3: Grammar Usage
    'Grammar',
    'Punctuation and Capitalisation',
    'Vocabulary',
    // Strand 4: Writing
    'Production and Distribution of Writing',
    'Text Types and Purposes',
    'Building and Presenting Knowledge',
    // Strand 5: Literature
    'Narrative, Drama and Poetry',
  ],

  'Computing': [
    // Strand 1: Introduction to Computing
    'Components of Computers and Computer Systems',
    'Technology in the Community',
    'Health and Safety in the Use of ICT Tools',
    // Strand 2: Productivity Software
    'Introduction to Word Processing',
    'Introduction to Presentation Software',
    'Introduction to Desktop Publishing',
    'Introduction to Electronic Spreadsheet',
    // Strand 3: Communication Networks
    'Computer Networks',
    'Internet and Social Media',
    'Information Security',
    'Web Technologies',
    // Strand 4: Computational Thinking
    'Introduction to Programming',
    'Algorithm',
    'Robotics',
    'Artificial Intelligence',
  ],

  'Religious & Moral Education': [
    // Strand 1: God, His Creation and Attributes
    'God, His Nature and Attributes',
    'The Creation Stories of the Three Major Religions in Ghana',
    'The Purpose and Usefulness of God’s Creation',
    // Strand 2: Religious Practices
    'Worship',
    'Religious Songs and Recitations',
    'Rites of Passage',
    'Religious Festivals',
    // Strand 3: The Family and the Community
    'Family Systems',
    'Authority and Obedience',
    'Religion and Social Cohesion',
    // Strand 4: Religious Leaders and Personalities
    'Religious Leaders',
    'Prophets and Caliphs',
    'Women in Religion and Leadership Positions',
    // Strand 5: Ethics and Moral Life
    'Manners and Decency',
    'Substance Abuse',
    'Moral Teachings in the Three Major Religions in Ghana',
    'Reward, Punishment and Repentance',
    // Strand 6: Religion and Economic Life
    'Work, Entrepreneurship and Social Security',
    'Money',
  ],

  'French': [
    // Strand: Faire Connaissance
    'Saluer et Prendre Congé',
    'Se Présenter et Présenter Quelqu’un',
    'Exprimer ses Goûts et ses Préférences',
    'Décrire Quelqu’un',
    'Parler de sa Famille et les Liens Familiaux',
    'Parler des Professions et des Métiers',
    'Entrer en Contact par Téléphone',
    'Inviter et Accepter ou Refuser une Invitation',
    // Strand: L'Environnement
    'Parler de son Lieu d’Habitation',
    'Parler de son École',
    'Comprendre et s’exprimer sur les Plats',
    'Parler de l’Hygiène et de la Santé',
    'Parler de son Pays',
    'Parler du Temps qu’il Fait',
    // Strand: La Localisation, les Horaires et les Déplacements
    'Situer les Objets, les Personnes et les Lieux dans l’Espace',
    'Demander et Indiquer l’Itinéraire',
    'Demander et Donner l’Heure',
    'Parler de son Agenda',
    'Parler des Moyens de Transport et des Horaires',
    // Strand: Les Achats
    'Compter et Faire des Calculs',
    'Parler de la Quantité et la Qualité des Choses',
    'Faire des Courses',
    'Faire une Réservation',
    // Strand: Les Sentiments et les Opinions
    'Donner et Réagir à des Ordres et des Interdictions',
    'Demander, Donner ou Refuser la Permission',
    // Strand: Les Loisirs
    'Parler de l’Habillement et de la Mode',
    'Parler des Sports',
    'Parler des Passe-temps',
  ],

  'Career Technology': [
    // Strand 1: Health and Safety
    'Personal Hygiene and Food Hygiene',
    'Personal, Workshop and Food Laboratory Safety',
    'Environmental Health',
    // Strand 2: Materials for Production
    'Compliant Materials',
    'Resistant Materials',
    'Smart and Modern Materials',
    'Food Commodities (Animal and Plant Sources)',
    // Strand 3: Tools, Equipment and Processes
    'Measuring and Marking Out',
    'Cutting/Shaping',
    'Joining and Assembling',
    'Kitchen Essentials',
    'Finishes and Finishing',
    // Strand 4: Technology
    'Simple Structures and Mechanisms, Electric and Electronic Systems',
    // Strand 5: Designing and Making of Artefacts/Products
    'Communicating Designs',
    'Designing',
    'Planning for Making Artefacts/Products',
    'Making Artefacts from Compliant, Resistant Materials and Food Ingredients',
    // Strand 6: Entrepreneurial Skills
    'Career Pathways and Career Opportunities',
    'Establishing and Managing a Small Business Enterprise',
  ],

  'Creative Arts and Design': [
    // Strand 1: Design
    'Design in Nature and Manmade Environment',
    'Drawing, Shading, Colouring and Modelling for Design',
    'Creativity, Innovation and the Design Process',
    // Strand 2: Creative Arts
    'Media and Techniques',
    'Creative and Aesthetic Expression',
    'Connections in Local and Global Cultures',
  ],
}

// ── Ghanaian Language topic list ────────────────────────────────
// One shared CCP framework covers all four languages taught under
// this programme — same strands/sub-strands, different language
// content — so the same canonical list applies to each.
const GHANAIAN_LANGUAGE_TOPICS = [
  // Strand 1: Customs and Institutions
  'Rites of Passage',
  'Naming Systems',
  'The Clan System',
  'Chieftaincy',
  // Strand 2: Listening and Speaking
  'Conversation/Everyday Discourse',
  'Listening Comprehension',
  'Speech Sounds — Vowels, Consonants and Syllables',
  'Tone',
  'Presentation — Everyday Experience',
  // Strand 3: Reading
  'Reading',
  'Translation',
  // Strand 4: Language and Usage
  'Sentences — Simple, Compound and Complex',
  'Integrating Grammar in Written Language (Nouns, Pronouns and Adjectives)',
  'Integrating Grammar in Written Language (Verbs, Adverbs, Conjunctions, Postpositions/Prepositions)',
  'Vocabulary, Spelling and Punctuation',
  // Strand 5: Composition Writing
  'Structure and Organise Ideas in Composition Writing',
  // Strand 6: Literature
  'Folktales, Songs, Prose, Drama, Poetry',
]

for (const language of ['Asante Twi', 'Akuapim Twi', 'Ga', 'Ewe']) {
  BECE_TOPICS[language] = GHANAIAN_LANGUAGE_TOPICS
}

// Returns the canonical topic list for a subject, or null if this
// subject's curriculum hasn't been added yet (caller should fall
// back to free-form topic labelling in that case).
export const getCanonicalTopics = (subject) => BECE_TOPICS[subject] || null

// ── Curriculum reform boundary ──────────────────────────────────
// The first BECE cohort examined under this new CCP curriculum sat
// in 2024 — anything before that was set against the retired
// syllabus. Used to exclude pre-reform questions from BECE
// predictions instead of silently blending two different curricula.
export const BECE_CURRICULUM_REFORM_YEAR = 2024
