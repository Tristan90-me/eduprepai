// ── Seed data: all WAEC and BECE subjects with full topic lists ─
// Covers all official subjects for both examinations.

export const CURRICULUM = {

  // ════════════════════════════════════════════════════════════
  // MATHEMATICS
  // ════════════════════════════════════════════════════════════
  'Mathematics': {
    WASSCE: {
      topics: [
        {
          topic: 'Algebra',
          subtopics: [
            'Linear equations and inequalities',
            'Quadratic equations by factorisation',
            'Quadratic equations by formula',
            'Simultaneous linear equations',
            'Change of subject of formulae',
            'Functions and mappings',
          ],
        },
        {
          topic: 'Numbers and Numeration',
          subtopics: [
            'Number bases conversion',
            'Operations in number bases',
            'Fractions and decimals',
            'Indices and logarithms',
            'Surds and irrational numbers',
            'Standard form and significant figures',
          ],
        },
        {
          topic: 'Geometry',
          subtopics: [
            'Angles and parallel lines',
            'Properties of triangles',
            'Circle theorems',
            'Properties of polygons',
            'Geometric constructions',
            'Loci and their constructions',
          ],
        },
        {
          topic: 'Trigonometry',
          subtopics: [
            'Trigonometric ratios SOHCAHTOA',
            'Sine rule and cosine rule',
            'Angles of elevation and depression',
            'Bearings and directions',
            'Trigonometric graphs',
          ],
        },
        {
          topic: 'Statistics',
          subtopics: [
            'Mean median and mode',
            'Frequency distribution tables',
            'Histograms and frequency polygons',
            'Cumulative frequency and ogive',
            'Probability and sample space',
            'Pie charts and bar charts',
          ],
        },
        {
          topic: 'Vectors and Scalars',
          subtopics: [
            'Vector notation and representation',
            'Addition and subtraction of vectors',
            'Column vectors and position vectors',
            'Magnitude and direction of vectors',
            'Multiplication of vectors by scalars',
          ],
        },
        {
          topic: 'Mensuration',
          subtopics: [
            'Perimeters and areas of plane figures',
            'Areas of circles and sectors',
            'Surface areas of solids',
            'Volumes of prisms and cylinders',
            'Volumes of pyramids and cones',
          ],
        },
        {
          topic: 'Coordinate Geometry',
          subtopics: [
            'Gradient of a straight line',
            'Midpoint and distance formula',
            'Equation of a straight line',
            'Parallel and perpendicular lines',
          ],
        },
        {
          topic: 'Sequences and Series',
          subtopics: [
            'Arithmetic progression nth term',
            'Arithmetic progression sum',
            'Geometric progression nth term',
            'Geometric progression sum',
          ],
        },
        {
          topic: 'Sets',
          subtopics: [
            'Types of sets and notation',
            'Union and intersection of sets',
            'Complement of sets',
            'Venn diagrams with two sets',
            'Venn diagrams with three sets',
          ],
        },
      ],
    },
    BECE: {
      topics: [
        {
          topic: 'Number Operations',
          subtopics: [
            'Whole numbers and place value',
            'Addition and subtraction of fractions',
            'Multiplication and division of fractions',
            'Decimals and percentages',
            'Ratios and proportions',
          ],
        },
        {
          topic: 'Algebra',
          subtopics: [
            'Simple linear equations',
            'Algebraic expressions',
            'Substitution into formulae',
            'Word problems and equations',
          ],
        },
        {
          topic: 'Geometry',
          subtopics: [
            'Properties of 2D shapes',
            'Angles and their types',
            'Symmetry and transformations',
            'Basic geometric constructions',
          ],
        },
        {
          topic: 'Measurement',
          subtopics: [
            'Length and perimeter',
            'Area of rectangles and triangles',
            'Volume of cuboids',
            'Mass and weight',
            'Time and clocks',
          ],
        },
        {
          topic: 'Statistics',
          subtopics: [
            'Bar charts and pictograms',
            'Pie charts',
            'Mean of a data set',
            'Reading tables and graphs',
          ],
        },
        {
          topic: 'Probability',
          subtopics: [
            'Simple probability scale',
            'Sample space and outcomes',
            'Probability of simple events',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // ENGLISH LANGUAGE
  // ════════════════════════════════════════════════════════════
  'English Language': {
    WASSCE: {
      topics: [
        {
          topic: 'Comprehension',
          subtopics: [
            'Reading for literal meaning',
            'Reading for inference and deduction',
            'Vocabulary in context',
            'Authorial purpose and tone',
            'Summary of main ideas',
          ],
        },
        {
          topic: 'Essay Writing',
          subtopics: [
            'Argumentative essay structure',
            'Narrative essay techniques',
            'Descriptive essay writing',
            'Expository essay organisation',
            'Formal and informal letter writing',
            'Report writing',
          ],
        },
        {
          topic: 'Grammar',
          subtopics: [
            'Parts of speech and their functions',
            'Verb tenses and aspect',
            'Subject verb agreement',
            'Clauses and sentence types',
            'Punctuation and capitalisation',
            'Active and passive voice',
          ],
        },
        {
          topic: 'Oral English',
          subtopics: [
            'Vowel sounds and pronunciation',
            'Consonant sounds',
            'Word stress and syllabification',
            'Intonation patterns',
            'Rhyme and rhythm in poetry',
          ],
        },
        {
          topic: 'Lexis and Structure',
          subtopics: [
            'Synonyms and antonyms',
            'Idioms and their meanings',
            'Phrasal verbs',
            'Register and appropriateness',
            'Word formation',
          ],
        },
        {
          topic: 'Literature',
          subtopics: [
            'Poetry analysis and techniques',
            'Prose and character analysis',
            'Drama and dramatic techniques',
            'Figures of speech',
            'Themes in African literature',
          ],
        },
        {
          topic: 'Summary Writing',
          subtopics: [
            'Identifying main points',
            'Paraphrasing and reformulating',
            'Conciseness and clarity',
            'Note-making techniques',
          ],
        },
      ],
    },
    BECE: {
      topics: [
        {
          topic: 'Comprehension',
          subtopics: [
            'Reading passages for meaning',
            'Answering comprehension questions',
            'Identifying the main idea',
            'Vocabulary from context',
          ],
        },
        {
          topic: 'Composition Writing',
          subtopics: [
            'Informal letter writing',
            'Formal letter writing',
            'Story and narrative writing',
            'Descriptive writing',
            'Dialogue writing',
          ],
        },
        {
          topic: 'Grammar',
          subtopics: [
            'Nouns pronouns and determiners',
            'Verbs and verb phrases',
            'Adjectives and adverbs',
            'Prepositions and conjunctions',
            'Punctuation in sentences',
          ],
        },
        {
          topic: 'Vocabulary',
          subtopics: [
            'Word meanings and definitions',
            'Synonyms and antonyms',
            'Words often confused',
            'Everyday vocabulary usage',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // INTEGRATED SCIENCE
  // ════════════════════════════════════════════════════════════
  'Integrated Science': {
    WASSCE: {
      topics: [
        {
          topic: 'Living Things',
          subtopics: [
            'Classification of living things',
            'Cell structure and organelles',
            'Photosynthesis and respiration',
            'Reproduction in plants',
            'Reproduction in animals',
          ],
        },
        {
          topic: 'Human Biology',
          subtopics: [
            'The digestive system',
            'The circulatory system and blood',
            'The respiratory system',
            'The nervous system',
            'The excretory system',
            'The skeletal and muscular system',
          ],
        },
        {
          topic: 'Physics Concepts',
          subtopics: [
            'Forces and motion',
            'Work energy and power',
            'Electricity and circuits',
            'Waves and sound',
            'Light and optics',
          ],
        },
        {
          topic: 'Chemistry Concepts',
          subtopics: [
            'Acids bases and salts',
            'Metals and non-metals',
            'Chemical and physical changes',
            'The periodic table',
            'Bonding and structures',
          ],
        },
        {
          topic: 'Earth Science',
          subtopics: [
            'Types of rocks and minerals',
            'Weather and climate',
            'The solar system',
            'Soil and erosion',
          ],
        },
        {
          topic: 'Environmental Science',
          subtopics: [
            'Types of pollution',
            'Conservation of resources',
            'Food chains and webs',
            'Ecosystems and habitats',
            'Human impact on environment',
          ],
        },
        {
          topic: 'Genetics and Evolution',
          subtopics: [
            'Heredity and variation',
            'DNA and chromosomes',
            'Mutations and genetic disorders',
            'Natural selection and adaptation',
          ],
        },
      ],
    },
    BECE: {
      topics: [
        {
          topic: 'Plants and Animals',
          subtopics: [
            'Classification of plants and animals',
            'Parts of flowering plants',
            'Animal groups and characteristics',
            'Adaptation to the environment',
          ],
        },
        {
          topic: 'Human Body',
          subtopics: [
            'Body systems and their functions',
            'Nutrition and food groups',
            'Health and hygiene',
            'Growth and development',
          ],
        },
        {
          topic: 'Matter and Materials',
          subtopics: [
            'States of matter',
            'Properties of materials',
            'Physical and chemical changes',
          ],
        },
        {
          topic: 'Energy',
          subtopics: [
            'Forms of energy',
            'Renewable and non-renewable sources',
            'Transfer and transformation of energy',
          ],
        },
        {
          topic: 'Environment and Resources',
          subtopics: [
            'Types of pollution in Ghana',
            'Conservation of resources',
            'Natural resources of Ghana',
            'Human activities and the environment',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // SOCIAL STUDIES
  // ════════════════════════════════════════════════════════════
  'Social Studies': {
    WASSCE: {
      topics: [
        {
          topic: 'Government and Politics',
          subtopics: [
            'Democracy and its features',
            'The 1992 Constitution of Ghana',
            'The three arms of government',
            'Elections and voting',
            'Citizenship and civic responsibility',
          ],
        },
        {
          topic: 'Ghanaian History',
          subtopics: [
            'Pre-colonial states of Ghana',
            'The colonial period and British rule',
            'The independence movement',
            'Post-independence governance',
            'Notable Ghanaian leaders',
          ],
        },
        {
          topic: 'Geography of Ghana',
          subtopics: [
            'Location and size of Ghana',
            'Climate and seasons',
            'Vegetation zones',
            'Natural resources',
            'Population distribution',
          ],
        },
        {
          topic: 'Economics and Development',
          subtopics: [
            'Economic activities in Ghana',
            'Agriculture in Ghana',
            'Trade and commerce',
            'Industry and manufacturing',
            'Ghana\'s development challenges',
          ],
        },
        {
          topic: 'Culture and Society',
          subtopics: [
            'Ghanaian cultural values',
            'The family and marriage',
            'Religion and belief systems',
            'Traditional festivals',
            'Chieftaincy institution',
          ],
        },
        {
          topic: 'International Relations',
          subtopics: [
            'ECOWAS and regional cooperation',
            'The African Union',
            'The United Nations and Ghana',
            'Ghana\'s foreign policy',
          ],
        },
        {
          topic: 'Environmental Issues',
          subtopics: [
            'Deforestation and its effects',
            'Galamsey and illegal mining',
            'Flood control and management',
            'Sanitation challenges in Ghana',
            'Climate change and Ghana',
          ],
        },
      ],
    },
    BECE: {
      topics: [
        {
          topic: 'Our Nation Ghana',
          subtopics: [
            'Location and boundaries of Ghana',
            'National symbols of Ghana',
            'History of Ghana',
            'Government of Ghana',
          ],
        },
        {
          topic: 'The Family',
          subtopics: [
            'Types of family in Ghana',
            'Roles and responsibilities in the family',
            'Marriage customs in Ghana',
          ],
        },
        {
          topic: 'Our Community',
          subtopics: [
            'Community services and facilities',
            'Community leadership and governance',
            'Community development',
          ],
        },
        {
          topic: 'Natural Environment',
          subtopics: [
            'Climate of Ghana',
            'Vegetation of Ghana',
            'Natural resources of Ghana',
            'Environmental conservation',
          ],
        },
        {
          topic: 'Economic Activities',
          subtopics: [
            'Farming and fishing in Ghana',
            'Trade and markets',
            'Industry and services',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // PHYSICS (WASSCE only)
  // ════════════════════════════════════════════════════════════
  'Physics': {
    WASSCE: {
      topics: [
        {
          topic: 'Mechanics',
          subtopics: [
            'Kinematics: speed velocity and acceleration',
            'Newton\'s laws of motion',
            'Work energy and power',
            'Linear momentum and impulse',
            'Projectile motion',
          ],
        },
        {
          topic: 'Waves',
          subtopics: [
            'Properties of waves',
            'Sound waves and echo',
            'The electromagnetic spectrum',
            'Light and reflection',
            'Refraction of light',
          ],
        },
        {
          topic: 'Electricity',
          subtopics: [
            'Electric current and charge',
            'Ohm\'s law and resistance',
            'Series and parallel circuits',
            'Electrical power and energy',
            'Domestic wiring and safety',
          ],
        },
        {
          topic: 'Magnetism',
          subtopics: [
            'Magnetic fields and field lines',
            'Electromagnets and applications',
            'Electromagnetic induction',
            'Electric motors and generators',
          ],
        },
        {
          topic: 'Thermal Physics',
          subtopics: [
            'Temperature and thermometers',
            'Heat transfer by conduction',
            'Heat transfer by convection',
            'Heat transfer by radiation',
            'Expansion of materials',
          ],
        },
        {
          topic: 'Optics',
          subtopics: [
            'Reflection at plane mirrors',
            'Reflection at curved mirrors',
            'Refraction and Snell\'s law',
            'Converging and diverging lenses',
            'Total internal reflection',
          ],
        },
        {
          topic: 'Pressure',
          subtopics: [
            'Atmospheric pressure',
            'Pressure in fluids',
            'Archimedes\' principle and upthrust',
            'Applications of pressure',
          ],
        },
        {
          topic: 'Nuclear Physics',
          subtopics: [
            'Structure of the atom',
            'Radioactivity and types of radiation',
            'Half-life calculations',
            'Nuclear reactions and energy',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // CHEMISTRY (WASSCE only)
  // ════════════════════════════════════════════════════════════
  'Chemistry': {
    WASSCE: {
      topics: [
        {
          topic: 'Atomic Structure',
          subtopics: [
            'Subatomic particles and their properties',
            'Electronic configuration',
            'Isotopes and relative atomic mass',
            'The Bohr model of the atom',
          ],
        },
        {
          topic: 'Chemical Bonding',
          subtopics: [
            'Ionic bonding and ionic compounds',
            'Covalent bonding and molecules',
            'Metallic bonding',
            'Intermolecular forces',
            'Structure and properties of compounds',
          ],
        },
        {
          topic: 'Acids Bases and Salts',
          subtopics: [
            'Properties of acids and bases',
            'The pH scale and indicators',
            'Neutralisation reactions',
            'Preparation of salts',
            'Uses of acids and bases in Ghana',
          ],
        },
        {
          topic: 'Organic Chemistry',
          subtopics: [
            'Alkanes and their properties',
            'Alkenes and addition reactions',
            'Alcohols and fermentation',
            'Functional groups',
            'Polymers and plastics',
          ],
        },
        {
          topic: 'Electrochemistry',
          subtopics: [
            'Electrolysis principles',
            'Electrolysis of solutions',
            'Electrochemical cells and EMF',
            'Redox reactions',
          ],
        },
        {
          topic: 'Equilibrium',
          subtopics: [
            'Reversible reactions',
            'Le Chatelier\'s principle',
            'Factors affecting equilibrium',
            'Equilibrium constant Kc',
          ],
        },
        {
          topic: 'Metals and Extraction',
          subtopics: [
            'Reactivity series of metals',
            'Extraction of metals from ores',
            'Corrosion and its prevention',
            'Alloys and their uses',
          ],
        },
        {
          topic: 'Kinetics',
          subtopics: [
            'Rate of reaction definition',
            'Factors affecting rate of reaction',
            'Catalysts and activation energy',
            'Collision theory',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // BIOLOGY (WASSCE only)
  // ════════════════════════════════════════════════════════════
  'Biology': {
    WASSCE: {
      topics: [
        {
          topic: 'Cell Biology',
          subtopics: [
            'Plant and animal cell structure',
            'Cell organelles and functions',
            'Mitosis and cell division',
            'Meiosis and sexual reproduction',
            'Osmosis diffusion and active transport',
          ],
        },
        {
          topic: 'Genetics',
          subtopics: [
            'Mendel\'s laws of inheritance',
            'Monohybrid crosses',
            'Dihybrid crosses',
            'Sex determination in humans',
            'Mutations and genetic disorders',
          ],
        },
        {
          topic: 'Ecology',
          subtopics: [
            'Food chains and food webs',
            'Energy flow in ecosystems',
            'Population ecology',
            'Biodiversity and conservation',
            'Ecological succession',
          ],
        },
        {
          topic: 'Plant Biology',
          subtopics: [
            'Photosynthesis process and factors',
            'Transpiration and water transport',
            'Germination conditions',
            'Pollination and fertilisation',
            'Phototropism and geotropism',
          ],
        },
        {
          topic: 'Animal Biology',
          subtopics: [
            'The digestive system in humans',
            'The circulatory system and blood',
            'The respiratory system',
            'The excretory system',
            'The nervous system',
            'The endocrine system and hormones',
          ],
        },
        {
          topic: 'Evolution',
          subtopics: [
            'Natural selection and Darwin',
            'Adaptation and survival',
            'Classification of living things',
            'Evidence for evolution',
          ],
        },
        {
          topic: 'Microbiology and Disease',
          subtopics: [
            'Bacteria and bacterial diseases',
            'Viruses and viral diseases',
            'Immunity and vaccination',
            'Sexually transmitted infections',
            'Malaria and its prevention',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // ECONOMICS (WASSCE only)
  // ════════════════════════════════════════════════════════════
  'Economics': {
    WASSCE: {
      topics: [
        {
          topic: 'Basic Economic Concepts',
          subtopics: [
            'Scarcity choice and opportunity cost',
            'Factors of production and rewards',
            'Economic systems: capitalism socialism mixed',
            'The production possibility curve',
          ],
        },
        {
          topic: 'Demand and Supply',
          subtopics: [
            'Law of demand and demand curves',
            'Law of supply and supply curves',
            'Market equilibrium',
            'Price elasticity of demand',
            'Market structures: perfect competition monopoly',
          ],
        },
        {
          topic: 'National Income',
          subtopics: [
            'Gross Domestic Product GDP',
            'Gross National Product GNP',
            'National income measurement methods',
            'Standard of living and HDI',
            'Economic growth vs development',
          ],
        },
        {
          topic: 'Money and Banking',
          subtopics: [
            'Functions and types of money',
            'Commercial banks and their functions',
            'The Bank of Ghana',
            'Monetary policy tools',
            'Inflation causes and effects',
          ],
        },
        {
          topic: 'Government Finance',
          subtopics: [
            'Types of taxation in Ghana',
            'Government expenditure',
            'The national budget',
            'Fiscal policy',
            'National debt and its effects',
          ],
        },
        {
          topic: 'International Trade',
          subtopics: [
            'Comparative advantage',
            'Balance of trade and payments',
            'Exchange rates',
            'Trade policies and tariffs',
            'Ghana\'s major trading partners',
          ],
        },
        {
          topic: 'Agriculture and Industry',
          subtopics: [
            'Types of farming in Ghana',
            'Land tenure systems',
            'Agricultural challenges in Ghana',
            'Industrial development in Ghana',
            'Food security issues',
          ],
        },
        {
          topic: 'Population Economics',
          subtopics: [
            'Population growth and Malthus',
            'Migration and urbanisation in Ghana',
            'Demographic transition model',
            'Unemployment types and causes',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // ELECTIVE MATHEMATICS (WASSCE only)
  // ════════════════════════════════════════════════════════════
  'Elective Mathematics': {
    WASSCE: {
      topics: [
        {
          topic: 'Algebra and Functions',
          subtopics: [
            'Polynomial functions and graphs',
            'Rational functions',
            'Exponential and logarithmic functions',
            'Partial fractions',
          ],
        },
        {
          topic: 'Calculus',
          subtopics: [
            'Limits and continuity',
            'Differentiation from first principles',
            'Rules of differentiation',
            'Applications of differentiation',
            'Integration and antiderivatives',
            'Definite integrals and area',
          ],
        },
        {
          topic: 'Trigonometry',
          subtopics: [
            'Trigonometric identities',
            'Compound angle formulae',
            'Double angle formulae',
            'Trigonometric equations',
            'Graphs of trigonometric functions',
          ],
        },
        {
          topic: 'Statistics and Probability',
          subtopics: [
            'Permutations and combinations',
            'Binomial theorem',
            'Probability distributions',
            'Normal distribution',
            'Linear regression',
          ],
        },
        {
          topic: 'Vectors and Matrices',
          subtopics: [
            'Vector operations in 3D',
            'Scalar and vector products',
            'Matrix operations',
            'Determinants and inverses',
            'Solving systems using matrices',
          ],
        },
        {
          topic: 'Coordinate Geometry',
          subtopics: [
            'Circle equations and properties',
            'Tangents to circles',
            'Parabolas and other conics',
            'Transformation geometry',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // FRENCH (BECE only)
  // ════════════════════════════════════════════════════════════
  'French': {
    BECE: {
      topics: [
        {
          topic: 'Listening and Reading',
          subtopics: [
            'Understanding spoken French',
            'Reading comprehension passages',
            'Identifying main ideas in French text',
          ],
        },
        {
          topic: 'Grammar',
          subtopics: [
            'French nouns and articles',
            'French verb conjugation present tense',
            'French verb conjugation past tense',
            'Adjectives and agreement',
            'Prepositions and conjunctions',
          ],
        },
        {
          topic: 'Vocabulary and Communication',
          subtopics: [
            'Greetings and introductions',
            'Family and relationships',
            'Food drink and shopping',
            'Directions and transport',
            'School and daily routine',
          ],
        },
        {
          topic: 'Writing in French',
          subtopics: [
            'Writing simple sentences in French',
            'Writing a short passage in French',
            'Letter writing in French',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // ICT (BECE only)
  // ════════════════════════════════════════════════════════════
  'ICT': {
    BECE: {
      topics: [
        {
          topic: 'Computer Fundamentals',
          subtopics: [
            'Types of computers and their uses',
            'Hardware components: input output storage',
            'Software: system and application software',
            'The CPU and memory',
          ],
        },
        {
          topic: 'Operating Systems',
          subtopics: [
            'Functions of an operating system',
            'The desktop environment and icons',
            'File and folder management',
            'Common operating systems: Windows',
          ],
        },
        {
          topic: 'Word Processing',
          subtopics: [
            'Creating and saving documents',
            'Formatting text: font size style',
            'Inserting tables and images',
            'Printing documents',
          ],
        },
        {
          topic: 'Spreadsheets',
          subtopics: [
            'Creating a spreadsheet',
            'Entering and editing data',
            'Simple formulas and functions',
            'Creating charts from data',
          ],
        },
        {
          topic: 'Internet and Communication',
          subtopics: [
            'The internet and World Wide Web',
            'Email: sending and receiving',
            'Safe use of the internet',
            'Social media and digital citizenship',
          ],
        },
        {
          topic: 'Information Systems',
          subtopics: [
            'Data information and knowledge',
            'Databases and their uses',
            'ICT in everyday life in Ghana',
            'Careers in ICT',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // RELIGIOUS AND MORAL EDUCATION (BECE only)
  // ════════════════════════════════════════════════════════════
  'Religious & Moral Education': {
    BECE: {
      topics: [
        {
          topic: 'Christianity in Ghana',
          subtopics: [
            'History of Christianity in Ghana',
            'Beliefs and practices of Christianity',
            'The Bible: Old and New Testament',
            'Christian festivals: Christmas Easter',
            'The role of the church in Ghana',
          ],
        },
        {
          topic: 'Islam in Ghana',
          subtopics: [
            'History of Islam in Ghana',
            'The Five Pillars of Islam',
            'The Quran and Islamic teachings',
            'Islamic festivals: Eid al-Fitr Eid al-Adha',
            'The role of the mosque in Ghana',
          ],
        },
        {
          topic: 'African Traditional Religion',
          subtopics: [
            'Belief in God in African tradition',
            'Ancestors and their role',
            'Shrines and sacred places',
            'Traditional festivals in Ghana',
            'Rituals and ceremonies',
          ],
        },
        {
          topic: 'Moral Values and Ethics',
          subtopics: [
            'Honesty and truthfulness',
            'Respect for authority and elders',
            'Responsibility and accountability',
            'Tolerance and peaceful coexistence',
            'Service to the community',
          ],
        },
        {
          topic: 'Social Issues and Religion',
          subtopics: [
            'Religion and family life',
            'Religious tolerance in Ghana',
            'Religion and education',
            'Religion and development in Ghana',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // CREATIVE ARTS (BECE only)
  // ════════════════════════════════════════════════════════════
  'Creative Arts': {
    BECE: {
      topics: [
        {
          topic: 'Visual Arts',
          subtopics: [
            'Elements of art: line shape colour texture',
            'Principles of design',
            'Drawing and painting techniques',
            'Ghanaian visual arts and crafts',
            'Pottery and ceramics in Ghana',
          ],
        },
        {
          topic: 'Music',
          subtopics: [
            'Elements of music: rhythm melody harmony',
            'Ghanaian traditional music',
            'Musical instruments of Ghana',
            'Reading basic musical notation',
            'Vocal music and choral singing',
          ],
        },
        {
          topic: 'Dance',
          subtopics: [
            'Traditional dances of Ghana',
            'Elements of dance: space time energy',
            'Dance and cultural identity',
            'Dance and storytelling in Ghana',
          ],
        },
        {
          topic: 'Drama and Theatre',
          subtopics: [
            'Elements of drama',
            'Storytelling and performance',
            'Theatre in Ghanaian culture',
            'Mime and movement',
          ],
        },
        {
          topic: 'Arts and Crafts',
          subtopics: [
            'Kente cloth and its significance',
            'Adinkra symbols and meanings',
            'Beadwork in Ghana',
            'Basketry and weaving',
            'Textiles and fashion design',
          ],
        },
      ],
    },
  },

  // ════════════════════════════════════════════════════════════
  // PRE-TECHNICAL SKILLS (BECE only)
  // ════════════════════════════════════════════════════════════
  'Pre-Technical Skills': {
    BECE: {
      topics: [
        {
          topic: 'Technical Drawing',
          subtopics: [
            'Drawing instruments and their uses',
            'Plane geometric constructions',
            'Orthographic projection',
            'Isometric drawing',
          ],
        },
        {
          topic: 'Woodwork',
          subtopics: [
            'Types of wood and their properties',
            'Woodworking tools and their uses',
            'Basic joints in woodwork',
            'Wood finishing and preservation',
          ],
        },
        {
          topic: 'Metalwork',
          subtopics: [
            'Types of metals and their properties',
            'Metalworking tools',
            'Basic metalwork processes',
            'Safety in the workshop',
          ],
        },
        {
          topic: 'Electronics',
          subtopics: [
            'Basic electronic components',
            'Simple circuits and connections',
            'Safety with electricity',
            'Everyday electronic devices',
          ],
        },
        {
          topic: 'Building and Construction',
          subtopics: [
            'Building materials: sand cement blocks',
            'Foundation and wall construction',
            'Roofing materials and types',
            'Simple plumbing concepts',
          ],
        },
        {
          topic: 'Agriculture Technology',
          subtopics: [
            'Farm tools and equipment',
            'Soil preparation and planting',
            'Crop production basics',
            'Animal rearing and care',
          ],
        },
      ],
    },
  },
}

// ── Year range ─────────────────────────────────────────────────
export const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]