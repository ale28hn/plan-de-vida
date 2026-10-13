// Traditional prayer texts. Orthodox texts are quoted verbatim from the Orthodox sources cited in `src`
// (only obvious typos/accents corrected — see README). Catholic texts: standard Latin American liturgical Spanish.
const GT = { label: 'Libro de Oraciones — Sacro Arzobispado Ortodoxo en Guatemala (2015), PDF alojado en svots.edu', url: 'https://www.svots.edu/sites/default/files/spanish_prayer_book_for_printing_double_sided_-_libro_de_oraciones_para_imprimir_a_doble_cara.pdf' };
const FA = { label: 'Libro de horas (oraciones de la mañana) — Folletos misioneros ortodoxos, fatheralexander.org', url: 'https://www.fatheralexander.org/booklets/spanish/libro_horas_juliana.htm' };
const DX = { label: 'Doxologia.org (Patriarcado Ortodoxo Rumano), «La exaltación de la Virgen en el oficio de la Artoklasia»', url: 'https://doxologia.org/es/palabras-de-espiritualidad/la-exaltacion-de-la-virgen-en-el-oficio-de-la-artoklasia-o-particion-del' };
const SH = { label: 'Prayer Rule of St Seraphim — Orthodox Church Sheffield', url: 'https://www.orthodoxchurchsheffield.com/post/prayer-rule-of-st-seraphim-for-daily-use' };
const OCA_T = { label: 'Orthodox Church in America — Trisagion Prayers', url: 'https://www.oca.org/orthodoxy/prayers/trisagion' };
const OCA_C = { label: 'Orthodox Church in America — Symbol of Faith', url: 'https://www.oca.org/orthodoxy/prayers/symbol-of-faith' };
const MAX = { label: 'The Confessor\'s Tongue (St. Maximus Orthodox Church), Short Prayer Rule of St. Seraphim, from the Optina Prayerbook', url: 'https://stmaximus.org/files/ConfTong/231217CT28p.pdf' };

export const PRAYERS = {
  o_padrenuestro: {
    es: { t: 'Padre Nuestro', b: 'Padre Nuestro, que estás en los cielos, santificado sea tu nombre, venga tu reino, hágase tu voluntad así en la tierra como en el cielo. Danos hoy nuestro pan de cada día. Perdona nuestras deudas, así como nosotros perdonamos a nuestros deudores. No nos dejes caer en la tentación, y líbranos del mal.', src: GT },
    en: { t: 'Our Father', b: 'Our Father, Who art in Heaven, hallowed be Thy name. Thy Kingdom come; Thy will be done, on earth as it is in Heaven. Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil.', src: OCA_T },
  },
  o_theotokos: {
    es: { t: 'Madre de Dios, Virgen, regocíjate', b: '¡Madre de Dios, Virgen, regocíjate! Tú que eres llena de Gracia, María, el Señor está contigo. Bendita eres entre las mujeres, y bendito es el fruto de tu vientre, porque diste a luz al Salvador de nuestras almas.', src: DX },
    en: { t: 'Rejoice, O Virgin Theotokos', b: 'Rejoice O Virgin Theotokos, Mary full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, for thou hast borne the Savior of our souls.', src: MAX },
  },
  o_credo: {
    es: { t: 'Símbolo de la Fe', b: 'Creo en un solo Dios, Padre Omnipotente, Creador del cielo y de la tierra, de todo lo visible y lo invisible.\n\nY en un solo Señor, Jesús Cristo, Unigénito Hijo de Dios, nacido del Padre antes de todos los siglos; Luz de Luz, Dios Verdadero de Dios Verdadero, engendrado, no creado, de la misma esencia que el Padre, por quien todo fue hecho. Quien por nosotros los hombres y por nuestra Salvación descendió de los cielos, y se encarnó del Espíritu Santo y de María la Virgen, y se hizo hombre. Fue crucificado por nosotros bajo Poncio Pilato, padeció y fue sepultado. Y resucitó al tercer día, conforme a las Escrituras. Y ascendió a los cielos y está sentado a la diestra del Padre. Y de nuevo vendrá, con gloria, para juzgar a los vivos y a los muertos. Y su Reino no tendrá fin.\n\nY en el Espíritu Santo, Señor, Vivificador, que procede del Padre, que junto con el Padre y el Hijo es adorado y glorificado, que habló por medio de los profetas.\n\nY en la Iglesia Una, Santa, Católica y Apostólica. Confieso un solo Bautismo para la remisión de los pecados. Espero la resurrección de los muertos, y la vida en la era futura. Amén.', src: GT },
    en: { t: 'Symbol of Faith (Creed)', b: 'I believe in one God, the Father Almighty, Maker of Heaven and Earth and of all things visible and invisible.\n\nAnd in one Lord Jesus Christ, the Son of God, the only-begotten, begotten of the Father before all ages. Light of light; true God of true God; begotten, not made; of one essence with the Father; by Whom all things were made; Who for us men and for our salvation came down from Heaven, and was incarnate of the Holy Spirit and the Virgin Mary, and became man. And He was crucified for us under Pontius Pilate, and suffered, and was buried. And the third day He arose again, according to the Scriptures, and ascended into Heaven, and sits at the right hand of the Father; and He shall come again with glory to judge the living and the dead; Whose Kingdom shall have no end.\n\nAnd in the Holy Spirit, the Lord, the Giver of Life, Who proceeds from the Father; Who with the Father and the Son together is worshipped and glorified; Who spoke by the prophets.\n\nIn one Holy, Catholic, and Apostolic Church. I acknowledge one baptism for the remission of sins. I look for the resurrection of the dead and the life of the world to come. Amen.', src: OCA_C },
  },
  o_jesus: {
    es: { t: 'Oración de Jesús', b: 'Señor Jesucristo, Hijo de Dios, ten piedad de mí, pecador.', src: FA, alt: 'Si hay otras personas cerca mientras trabajas, repite en silencio: «Señor, ten piedad».' },
    en: { t: 'The Jesus Prayer', b: 'Lord Jesus Christ, Son of God, have mercy on me a sinner.', src: SH, alt: 'If others are nearby while you work, silently repeat: "Lord, have mercy."' },
  },
  o_kyrie: {
    es: { t: 'Señor, ten piedad', b: 'Señor, ten piedad.', src: GT },
    en: { t: 'Lord, have mercy', b: 'Lord, have mercy.', src: SH },
  },
  o_theotokos_salva: {
    es: { t: 'Santísima Madre de Dios, sálvame', b: 'Soberana mía, Santísima Virgen Deípara, sálvame a mí pecador.', src: FA, alt: 'Forma breve litúrgica: «Santísima Madre de Dios, sálvanos.» (Libro de Oraciones, Arzobispado Ortodoxo en Guatemala)' },
    en: { t: 'Most Holy Mother of God, save me', b: 'Most Holy Mother of God, save me a sinner.', src: SH },
  },
  ofrecimiento: {
    es: { t: 'Ofrecimiento de obras', b: '¡Serviam!\n\nOh Jesús, por medio del Corazón Inmaculado de María, te ofrezco las oraciones, obras, alegrías y sufrimientos de este día, en reparación de nuestras ofensas y por todas las intenciones por las que te inmolas continuamente sobre el altar.\n\nTe los ofrezco en particular por las intenciones del Santo Padre. Amén.', src: 'Fórmula tradicional del Apostolado de la Oración.' },
    en: { t: 'Morning Offering', b: 'Serviam!\n\nO Jesus, through the Immaculate Heart of Mary, I offer you my prayers, works, joys and sufferings of this day, in reparation for our offenses and for all the intentions for which you continually offer yourself on the altar.\n\nI offer them in particular for the intentions of the Holy Father. Amen.', src: 'Traditional formula of the Apostleship of Prayer.' },
  },
  angelus: {
    es: { t: 'Ángelus', b: 'V. El Ángel del Señor anunció a María.\nR. Y concibió por obra del Espíritu Santo.\nDios te salve, María…\n\nV. He aquí la esclava del Señor.\nR. Hágase en mí según tu palabra.\nDios te salve, María…\n\nV. Y el Verbo se hizo carne.\nR. Y habitó entre nosotros.\nDios te salve, María…\n\nV. Ruega por nosotros, Santa Madre de Dios.\nR. Para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo.\n\nOremos. Derrama, Señor, tu gracia en nuestros corazones, para que, habiendo conocido por el anuncio del Ángel la encarnación de tu Hijo Jesucristo, por su pasión y su cruz seamos llevados a la gloria de la resurrección. Por el mismo Jesucristo nuestro Señor. Amén.\n\nGloria al Padre… (tres veces)' },
    en: { t: 'Angelus', b: 'V. The Angel of the Lord declared unto Mary.\nR. And she conceived of the Holy Spirit.\nHail Mary…\n\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to thy word.\nHail Mary…\n\nV. And the Word was made flesh.\nR. And dwelt among us.\nHail Mary…\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray. Pour forth, we beseech thee, O Lord, thy grace into our hearts; that we, to whom the Incarnation of Christ thy Son was made known by the message of an angel, may by his Passion and Cross be brought to the glory of his Resurrection. Through the same Christ our Lord. Amen.\n\nGlory be… (three times)' },
  },
  reginacoeli: {
    es: { t: 'Regina Coeli', b: 'Reina del cielo, alégrate; aleluya.\nPorque el que mereciste llevar en tu seno; aleluya.\nHa resucitado, según predijo; aleluya.\nRuega por nosotros a Dios; aleluya.\n\nV. Gózate y alégrate, Virgen María; aleluya.\nR. Porque en verdad ha resucitado el Señor; aleluya.\n\nOremos. Oh Dios, que por la resurrección de tu Hijo, nuestro Señor Jesucristo, has llenado el mundo de alegría, concédenos, por intercesión de su Madre, la Virgen María, alcanzar los gozos de la vida eterna. Por el mismo Jesucristo nuestro Señor. Amén.' },
    en: { t: 'Regina Caeli', b: 'Queen of Heaven, rejoice, alleluia.\nFor he whom you did merit to bear, alleluia.\nHas risen, as he said, alleluia.\nPray for us to God, alleluia.\n\nV. Rejoice and be glad, O Virgin Mary, alleluia.\nR. For the Lord has truly risen, alleluia.\n\nLet us pray. O God, who gave joy to the world through the resurrection of thy Son, our Lord Jesus Christ, grant, we beseech thee, that through the intercession of the Virgin Mary, his Mother, we may obtain the joys of everlasting life. Through the same Christ our Lord. Amen.' },
  },
  avemaria: {
    es: { t: 'Avemaría', b: 'Dios te salve, María, llena eres de gracia, el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.\n\nSanta María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.' },
    en: { t: 'Hail Mary', b: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.\n\nHoly Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.' },
  },
  padrenuestro: {
    es: { t: 'Padrenuestro', b: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo.\n\nDanos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.' },
    en: { t: 'Our Father', b: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven.\n\nGive us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.' },
  },
  gloria: {
    es: { t: 'Gloria', b: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.' },
    en: { t: 'Glory Be', b: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.' },
  },
  acordaos: {
    es: { t: 'Acordaos', b: 'Acordaos, ¡oh piadosísima Virgen María!, que jamás se ha oído decir que ninguno de los que han acudido a vuestra protección, implorando vuestra asistencia y reclamando vuestro socorro, haya sido abandonado de vos.\n\nAnimado con esta confianza, a vos también acudo, oh Madre, Virgen de las vírgenes, y aunque gimiendo bajo el peso de mis pecados, me atrevo a comparecer ante vuestra presencia soberana.\n\nNo desechéis, oh Madre de Dios, mis humildes súplicas, antes bien, escuchadlas y acogedlas benignamente. Amén.' },
    en: { t: 'Memorare', b: 'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thine intercession was left unaided.\n\nInspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful.\n\nO Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.' },
  },
  examen: {
    es: { t: 'Examen de la noche — pasos', b: '1. Gracias. Ponte ante Dios y dale gracias por los dones del día.\n\n2. Luz. Pide luz para ver el día con verdad y sin miedo.\n\n3. Repaso. Recorre el día con sencillez: ¿cómo he tratado a Dios, a mi familia, a los demás, mi trabajo?\n\n4. Perdón. Pide perdón a Dios con confianza por lo que hiciste mal o dejaste de hacer.\n\n5. Propósito. Uno pequeño y concreto para mañana.\n\nPuedes hacerlo guiado desde «Hoy» → «Examen de la noche».' },
    en: { t: 'Evening examen — steps', b: '1. Thanks. Stand before God and thank Him for the gifts of the day.\n\n2. Light. Ask for light to see the day truly and without fear.\n\n3. Review. Walk through the day simply: how have I treated God, my family, others, my work?\n\n4. Forgiveness. Ask God\'s forgiveness with trust for what you did wrong or left undone.\n\n5. Resolution. One small, concrete one for tomorrow.\n\nYou can do it guided from "Today" → "Evening examen".' },
  },
};
export const PRAYER_ORDER_SERAFIN = ['o_padrenuestro', 'o_theotokos', 'o_credo', 'o_jesus', 'o_kyrie', 'o_theotokos_salva', 'examen'];
export const PRAYER_ORDER = ['ofrecimiento', 'angelus', 'reginacoeli', 'avemaria', 'padrenuestro', 'gloria', 'acordaos', 'examen'];
