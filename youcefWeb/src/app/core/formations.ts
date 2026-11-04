// Formations fictives de démonstration, à remplacer par les vraies.
export type Bilingue = [fr: string, en: string];

export interface Formation {
  slug: string;
  prix: number;
  modules: number;
  heures: number;
  niveau: Bilingue;
  titre: Bilingue;
  resume: Bilingue;
  description: Bilingue;
  objectifs: Bilingue[];
  programme: Bilingue[];
}

export const FORMATIONS: Formation[] = [
  {
    slug: 'critique-interieur',
    prix: 49,
    modules: 6,
    heures: 4,
    niveau: ['Débutant', 'Beginner'],
    titre: ['Apprivoiser son critique intérieur', 'Taming your inner critic'],
    resume: [
      'Identifier les pensées automatiques qui vous freinent et apprendre à leur répondre avec bienveillance.',
      'Identify the automatic thoughts holding you back and learn to answer them with kindness.',
    ],
    description: [
      'Cette formation vous aide à repérer la voix qui vous juge en permanence et à en reprendre le contrôle, étape par étape, grâce à des vidéos courtes et des exercices écrits.',
      'This course helps you spot the voice that constantly judges you and take back control, step by step, through short videos and written exercises.',
    ],
    objectifs: [
      ['Reconnaître vos pensées automatiques négatives', 'Recognise your negative automatic thoughts'],
      ['Désamorcer l’autocritique au quotidien', 'Defuse self-criticism in daily life'],
      ['Installer un dialogue intérieur plus juste', 'Build a fairer inner dialogue'],
    ],
    programme: [
      ['Qui est votre critique intérieur ?', 'Who is your inner critic?'],
      ['D’où viennent ces pensées', 'Where these thoughts come from'],
      ['Les repérer en situation', 'Spotting them in the moment'],
      ['Leur répondre avec bienveillance', 'Answering them with kindness'],
      ['Exercices de la semaine', 'Weekly exercises'],
      ['Faire durer le changement', 'Making the change last'],
    ],
  },
  {
    slug: 'confiance-en-soi',
    prix: 79,
    modules: 8,
    heures: 6,
    niveau: ['Tous niveaux', 'All levels'],
    titre: ['Confiance en soi : les fondations', 'Self-confidence: the foundations'],
    resume: [
      'Des exercices concrets pour bâtir une estime de vous stable, indépendante du regard des autres.',
      'Practical exercises to build steady self-esteem, independent of how others see you.',
    ],
    description: [
      'Une formation progressive pour poser des bases solides : comprendre le mécanisme de l’estime de soi, puis la nourrir par des pratiques simples et régulières.',
      'A step-by-step course to lay solid foundations: understand how self-esteem works, then nurture it through simple, regular practices.',
    ],
    objectifs: [
      ['Comprendre ce qui fonde votre estime de vous', 'Understand what underpins your self-esteem'],
      ['Vous attribuer le mérite de vos réussites', 'Take credit for your achievements'],
      ['Agir sans attendre l’approbation des autres', 'Act without waiting for others’ approval'],
    ],
    programme: [
      ['Estime de soi : de quoi parle-t-on ?', 'Self-esteem: what is it?'],
      ['Vos réussites, vos mérites', 'Your successes, your merits'],
      ['Le regard des autres', 'Other people’s gaze'],
      ['Les croyances limitantes', 'Limiting beliefs'],
      ['Oser se montrer', 'Daring to show up'],
      ['Gérer l’échec', 'Handling failure'],
      ['Rituels quotidiens', 'Daily rituals'],
      ['Bilan et plan d’action', 'Review and action plan'],
    ],
  },
  {
    slug: 'poser-ses-limites',
    prix: 59,
    modules: 5,
    heures: 3,
    niveau: ['Intermédiaire', 'Intermediate'],
    titre: ['Poser ses limites sans culpabiliser', 'Setting boundaries without guilt'],
    resume: [
      'Dire non, s’affirmer et se libérer de la pression sociale dans sa vie personnelle et professionnelle.',
      'Say no, assert yourself and free yourself from social pressure in your personal and professional life.',
    ],
    description: [
      'Apprenez à exprimer vos besoins clairement, à refuser sans vous justifier à outrance et à préserver vos relations tout en vous respectant.',
      'Learn to express your needs clearly, to refuse without over-explaining and to protect your relationships while respecting yourself.',
    ],
    objectifs: [
      ['Identifier vos limites réelles', 'Identify your real limits'],
      ['Dire non avec des phrases simples', 'Say no with simple phrases'],
      ['Gérer la culpabilité qui suit', 'Handle the guilt that follows'],
    ],
    programme: [
      ['Pourquoi est-ce si difficile ?', 'Why is it so hard?'],
      ['Connaître ses limites', 'Knowing your limits'],
      ['Les mots pour dire non', 'The words to say no'],
      ['Au travail et en famille', 'At work and with family'],
      ['Tenir sa position', 'Holding your ground'],
    ],
  },
  {
    slug: 'aligner-ses-valeurs',
    prix: 89,
    modules: 7,
    heures: 5,
    niveau: ['Avancé', 'Advanced'],
    titre: ['Aligner ses choix avec ses valeurs', 'Aligning your choices with your values'],
    resume: [
      'Clarifier vos valeurs profondes et prendre des décisions qui vous ressemblent vraiment.',
      'Clarify your deepest values and make decisions that truly reflect who you are.',
    ],
    description: [
      'Une formation pour faire le point sur ce qui compte vraiment pour vous et transformer cette clarté en décisions concrètes, personnelles comme professionnelles.',
      'A course to take stock of what truly matters to you and turn that clarity into concrete decisions, both personal and professional.',
    ],
    objectifs: [
      ['Nommer vos cinq valeurs essentielles', 'Name your five core values'],
      ['Repérer les écarts avec votre vie actuelle', 'Spot the gaps with your current life'],
      ['Décider avec cohérence', 'Decide with consistency'],
    ],
    programme: [
      ['Valeurs : le point de départ', 'Values: the starting point'],
      ['Exercice de clarification', 'Clarification exercise'],
      ['Valeurs choisies et valeurs héritées', 'Chosen vs inherited values'],
      ['Cartographier votre vie actuelle', 'Mapping your current life'],
      ['Prioriser', 'Prioritising'],
      ['Décider et agir', 'Deciding and acting'],
      ['Plan d’alignement sur 90 jours', '90-day alignment plan'],
    ],
  },
];

export const trouverFormation = (slug: string | null | undefined) => FORMATIONS.find((f) => f.slug === slug);
