export type Era = 'classic_1920s' | 'modern' | 'gaslight'

export type CreationMethod = 'dice' | 'point_buy' | 'direct'

export type CharacteristicKey = 'STR' | 'CON' | 'SIZ' | 'DEX' | 'APP' | 'INT' | 'POW' | 'EDU'

export const ERA_LABELS: Record<Era, string> = {
  classic_1920s: 'Klasyczna (lata 20.)',
  modern: 'Współczesna',
  gaslight: 'Gaslight (epoka wiktoriańska)',
}

export const METHOD_LABELS: Record<CreationMethod, string> = {
  dice: 'Rzut kośćmi',
  point_buy: 'Kupowanie punktów',
  direct: 'Swobodne wprowadzanie',
}
