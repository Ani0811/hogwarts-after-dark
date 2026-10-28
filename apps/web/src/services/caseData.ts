import { Case, Character, Clue, Location, LoreEntry, Spell } from '../types/game'

export const CASE_001: Case = {
  id: 'case_001',
  title: 'The Vanishing Hourglass',
  description: 'An enchanted timepiece has vanished from the Archivist\'s study under impossible circumstances.',
  introduction: `The Academy of Veiled Arts has stood for four centuries, its stones soaked in generations of magic. Tonight, something old and dangerous has gone missing.

The Archivist's Hourglass — an artifact said to slow time within a small radius — disappeared sometime between the evening bell and midnight. Three people were in or near the Archivist's study during that window. The Archivist himself was found unconscious at his desk, a faint smell of Dreamroot tea lingering in the air.

You are the Academy's Investigator. The Headmistress has given you one night.

Find the Hourglass. Find out who took it and why.`,
  suspect_ids: ['suspect_maris', 'suspect_corvin', 'suspect_faelind'],
  location_ids: ['loc_entrance_hall', 'loc_archivist_study', 'loc_east_corridor', 'loc_herbarium', 'loc_bell_tower'],
  clue_ids: ['clue_teacup', 'clue_broken_lock', 'clue_muddy_boots', 'clue_torn_page', 'clue_empty_vial', 'clue_hourglass_pedestal', 'clue_candle_residue'],
  spell_ids: ['spell_revelio', 'spell_lumos', 'spell_specialis', 'spell_legilimens_trace']
}

export const CHARACTERS: Record<string, Character> = {
  suspect_maris: {
    id: 'suspect_maris',
    name: 'Maris Thornwell',
    role: 'Academy Librarian',
    personality: 'Methodical, protective of the archive\'s integrity, prone to anxiety when routines are disrupted.',
    dialogue_style: 'Precise, measured sentences. Uses library terminology. Occasionally corrects the investigator\'s phrasing.',
    appearance: 'A tall woman in her fifties with silver-streaked black hair and ink-stained fingers.',
    location_id: 'loc_east_corridor',
    is_suspect: true,
    portrait_description: 'A careful, intelligent face, slightly drawn with worry tonight.',
    public_facts: [
      'She was in the East Corridor at approximately ten o\'clock, returning a trolley of books.',
      'She noticed the light was still on in the Archivist\'s study when she passed.',
      'She did not enter the study that evening.',
      'She knows the Hourglass is kept on a pedestal by the north window.'
    ],
    known_clue_ids: ['clue_muddy_boots', 'clue_broken_lock']
  },
  suspect_corvin: {
    id: 'suspect_corvin',
    name: 'Corvin Ashwick',
    role: 'Senior Apprentice (Year 4)',
    personality: 'Ambitious, articulate, visibly anxious tonight. Speaks quickly and becomes defensive about his thesis.',
    dialogue_style: 'Speaks quickly, tends to over-explain. Becomes defensive when his thesis is mentioned.',
    appearance: 'A young man of about twenty, dark circles under his eyes, robes slightly dishevelled.',
    location_id: 'loc_herbarium',
    is_suspect: true,
    portrait_description: 'Bright eyes that won\'t quite meet yours tonight.',
    public_facts: [
      'He was in the herbarium working on his thesis until late.',
      'He has been studying temporal displacement phenomena.',
      'His thesis is due at the end of the month.'
    ],
    known_clue_ids: ['clue_torn_page', 'clue_empty_vial']
  },
  suspect_faelind: {
    id: 'suspect_faelind',
    name: 'Faelind Grewe',
    role: 'Academy Healer\'s Assistant',
    personality: 'Warm, perceptive, genuinely concerned about the Archivist\'s wellbeing.',
    dialogue_style: 'Speaks thoughtfully, often pauses to consider. Uses healer\'s terminology.',
    appearance: 'A young woman with close-cropped red hair and healer\'s green robes.',
    location_id: 'loc_archivist_study',
    is_suspect: true,
    portrait_description: 'A healer\'s composure masking genuine distress.',
    public_facts: [
      'She was in the infirmary most of the evening tending to a student with a mild hexing injury.',
      'She went to check on the Archivist around eleven when he missed his nightly rounds and found him unconscious.',
      'She recognizes the smell of Dreamroot in the Archivist\'s study.'
    ],
    known_clue_ids: ['clue_teacup', 'clue_hourglass_pedestal']
  }
}

export const LOCATIONS: Record<string, Location> = {
  loc_entrance_hall: {
    id: 'loc_entrance_hall',
    name: 'Entrance Hall',
    description: 'The great vaulted entrance to the Academy of Veiled Arts. Stone flagstones worn smooth by centuries of footsteps. Portraits of former Headmasters watch from the walls.',
    atmosphere: 'Cold and echoing at this hour. A single torch burns near the main doors. Shadows pool in the archways.',
    state: 'accessible',
    connected_locations: ['loc_archivist_study', 'loc_east_corridor'],
    available_clue_ids: [],
    character_ids: []
  },
  loc_archivist_study: {
    id: 'loc_archivist_study',
    name: 'Archivist\'s Study',
    description: 'A room lined floor to ceiling with shelves of catalogued texts and specimens in jars. The Archivist lies unconscious in his chair, breathing steadily. A teacup sits on the desk. The north pedestal is empty.',
    atmosphere: 'The smell of old paper, candle wax, and a sweet herbal scent. The Archivist\'s breathing is slow and steady.',
    state: 'accessible',
    connected_locations: ['loc_entrance_hall', 'loc_east_corridor'],
    available_clue_ids: ['clue_teacup', 'clue_hourglass_pedestal', 'clue_candle_residue'],
    character_ids: ['suspect_faelind']
  },
  loc_east_corridor: {
    id: 'loc_east_corridor',
    name: 'East Corridor',
    description: 'A long corridor connecting the main hall to the eastern wings. Lined with display cases of student achievements. Moonlight falls through tall windows.',
    atmosphere: 'Quiet and chilly. Dust marks on the floor indicate a display cabinet was recently disturbed.',
    state: 'accessible',
    connected_locations: ['loc_entrance_hall', 'loc_archivist_study', 'loc_herbarium', 'loc_bell_tower'],
    available_clue_ids: ['clue_muddy_boots', 'clue_broken_lock'],
    character_ids: ['suspect_maris']
  },
  loc_herbarium: {
    id: 'loc_herbarium',
    name: 'The Herbarium',
    description: 'A glass-roofed room filled with magical plants at various stages of growth. Workbenches run down the center with distillation equipment. Corvin Ashwick\'s workspace is notably disordered.',
    atmosphere: 'Warm and humid even at night. The air smells of rich earth, damp leaves, and sharp medicinal residue.',
    state: 'accessible',
    connected_locations: ['loc_east_corridor'],
    available_clue_ids: ['clue_empty_vial', 'clue_torn_page'],
    character_ids: ['suspect_corvin']
  },
  loc_bell_tower: {
    id: 'loc_bell_tower',
    name: 'Bell Tower',
    description: 'The Academy\'s original bell tower, reached by a winding spiral stair. At the top, beside the great brass bell, sits an old observation box with its brass latch unfastened.',
    atmosphere: 'Windy and exposed to the night sky. Luminescent residue faintly gleams along the hinges of the observation box.',
    state: 'accessible',
    connected_locations: ['loc_east_corridor'],
    available_clue_ids: [],
    character_ids: []
  }
}

export const CLUES: Record<string, Clue> = {
  clue_teacup: {
    id: 'clue_teacup',
    title: 'The Archivist\'s Teacup',
    description: 'A fine porcelain teacup on the Archivist\'s desk, half-full of cold tea. The residue at the bottom is gritty and faintly luminescent under Specialis Revelio: powdered Dreamroot, a potent sleeping herb.',
    location_id: 'loc_archivist_study',
    requires_spell: 'spell_specialis',
    tags: ['dreamroot', 'poison', 'tea'],
    is_misleading: false
  },
  clue_hourglass_pedestal: {
    id: 'clue_hourglass_pedestal',
    title: 'The Empty Pedestal',
    description: 'An ornate stone pedestal by the north window. A clear circle in the settled dust reveals where the Hourglass sat for decades. The removal was calm and deliberate.',
    location_id: 'loc_archivist_study',
    requires_spell: null,
    tags: ['theft', 'hourglass'],
    is_misleading: false
  },
  clue_candle_residue: {
    id: 'clue_candle_residue',
    title: 'Unusual Candle Residue',
    description: 'A pattern of dark green wax melted on the flagstones near the pedestal. It is Steadfast Wax, used by scholars to secure fragile enchantments during transit.',
    location_id: 'loc_archivist_study',
    requires_spell: 'spell_lumos',
    tags: ['wax', 'magic', 'transport'],
    is_misleading: false
  },
  clue_broken_lock: {
    id: 'clue_broken_lock',
    title: 'Forced Cabinet Lock',
    description: 'A display cabinet in the East Corridor has a forced clasp. The Academy inventory lists that a volume on \'Temporal Properties of Enchanted Objects\' was kept here.',
    location_id: 'loc_east_corridor',
    requires_spell: null,
    tags: ['lock', 'theft', 'library'],
    is_misleading: false
  },
  clue_muddy_boots: {
    id: 'clue_muddy_boots',
    title: 'Muddy Boot Prints',
    description: 'A trail of moist soil prints leading from the Herbarium toward the Bell Tower stair. The Herbarium is the only room in the castle with wet earth tonight.',
    location_id: 'loc_east_corridor',
    requires_spell: null,
    tags: ['tracks', 'herbarium', 'bell_tower'],
    is_misleading: false
  },
  clue_empty_vial: {
    id: 'clue_empty_vial',
    title: 'Empty Apothecary Vial',
    description: 'A discarded glass vial in the bin beside Corvin\'s workbench. Embossed lettering in the glass reads: \'PATEL & SONS — DRIED DREAMROOT POWDER\'.',
    location_id: 'loc_herbarium',
    requires_spell: null,
    tags: ['dreamroot', 'corvin', 'vial'],
    is_misleading: false
  },
  clue_torn_page: {
    id: 'clue_torn_page',
    title: 'Torn Page on Temporal Reversal',
    description: 'A page from the missing restricted text tucked under Corvin\'s desk. It details rituals for rewinding botched alchemical transmutations using chronomantic focus items.',
    location_id: 'loc_herbarium',
    requires_spell: null,
    tags: ['temporal', 'corvin', 'research'],
    is_misleading: false
  }
}

export const SPELLS: Record<string, Spell> = {
  spell_revelio: {
    id: 'spell_revelio',
    name: 'Revelio',
    incantation: 'Revelio',
    description: 'Reveals concealed objects, secret compartments, and invisible traces in the area.',
    category: 'revelation',
    effect: 'Concealed traces and hidden objects become visible for a short time.',
    target_type: 'location',
    reveals_clues: true,
    cost: 2
  },
  spell_lumos: {
    id: 'spell_lumos',
    name: 'Lumos Maxima',
    incantation: 'Lumos Maxima',
    description: 'A brilliant burst of magical wandlight illuminating darkness and unseen stains.',
    category: 'illumination',
    effect: 'The area is flooded with pure golden light, exposing hidden residues.',
    target_type: 'location',
    reveals_clues: true,
    cost: 1
  },
  spell_specialis: {
    id: 'spell_specialis',
    name: 'Specialis Revelio',
    incantation: 'Specialis Revelio',
    description: 'Scrutinizes an item to identify magical components, enchantments, and chemical poisons.',
    category: 'examination',
    effect: 'Reveals the exact alchemical makeup and foreign residues on an object.',
    target_type: 'clue',
    reveals_clues: false,
    cost: 3
  },
  spell_legilimens_trace: {
    id: 'spell_legilimens_trace',
    name: 'Memoria Vestigium',
    incantation: 'Memoria Vestigium',
    description: 'Taps into residual psychic impressions left on recent physical touchpoints.',
    category: 'detection',
    effect: 'A vision of recent intent and emotional stress echoes in your mind.',
    target_type: 'clue',
    reveals_clues: false,
    cost: 5
  }
}

export const LORE: LoreEntry[] = [
  {
    id: 'lore_dreamroot',
    title: 'On the Properties of Dreamroot',
    content: 'Dreamroot (Radix Somnifera Arcana) is a pale root harvested in deep forest hollows. When dried and powdered, it causes immediate, heavy dreamless sleep. Leaves a faint almond scent and chalky luminescent trace only visible through Specialis Revelio.',
    category: 'Herbology & Potions',
    tags: ['dreamroot', 'poison', 'sleep'],
    case_relevant: true
  },
  {
    id: 'lore_temporal_hourglass',
    title: 'The Veiled Hourglass of Ouroboros',
    content: 'Crafted in the 17th century by Chronomancer Vane. Holds sand gathered from astral temporal rifts. Can temporarily rewind physical events within three paces if properly calibrated with rare Steadfast Wax.',
    category: 'Artifacts & Chronomancy',
    tags: ['hourglass', 'temporal', 'artifact'],
    case_relevant: true
  },
  {
    id: 'lore_steadfast_wax',
    title: 'Alchemical Sealants and Steadfast Wax',
    content: 'Steadfast Wax is a dark green alchemical resin. It insulates fragile enchantments against kinetic and astral disruption during relocation. Flouresces under focused illumination.',
    category: 'Alchemical Crafts',
    tags: ['wax', 'alchemy', 'transit'],
    case_relevant: true
  }
]

