/**
 * Icone di cibo che lucide non ha, disegnate nello stesso stile (griglia
 * 24x24, tratto 2, angoli tondi) e create con createLucideIcon, così si usano
 * esattamente come le altre.
 */
import { createLucideIcon } from 'lucide-react'
import type { IconNode } from 'lucide-react'

function paths(...d: string[]): IconNode {
  return d.map((value, index) => ['path', { d: value, key: `p${index}` }])
}

export const Pear = createLucideIcon(
  'pear',
  paths(
    'M12 7c-1.5 3-5.5 4.5-5.5 9a5.5 5.5 0 0 0 11 0c0-4.5-4-6-5.5-9z',
    'M12 7c0-2 1-3 2.5-4',
    'M12 6c1.5-1 3-1 4 0',
  ),
)

export const Melon = createLucideIcon('melon', [
  ['circle', { cx: '12', cy: '13', r: '8', key: 'c' }],
  ...paths('M8 6.5c2.5 3.5 2.5 9.5 0 13', 'M16 6.5c-2.5 3.5-2.5 9.5 0 13', 'M12 5V3'),
])

export const Watermelon = createLucideIcon(
  'watermelon',
  paths(
    'M3 8a9 9 0 0 0 18 0',
    'M3 8h18',
    'M5.5 8a6.5 6.5 0 0 0 13 0',
    'M9 11.5h.01',
    'M12 13.5h.01',
    'M15 11.5h.01',
  ),
)

export const Peach = createLucideIcon('peach', [
  ['circle', { cx: '12', cy: '14', r: '7', key: 'c' }],
  ...paths('M12 7c-2 2-2 5 0 7', 'M12 7c0-2 1.5-3.5 4-3.5'),
])

export const Plum = createLucideIcon('plum', [
  ['circle', { cx: '12', cy: '14', r: '7', key: 'c' }],
  ...paths('M12 7V4', 'M12 5.5c1-1.5 3-2 4.5-1', 'M8.5 12a4 4 0 0 1 2.5-2.5'),
])

export const Persimmon = createLucideIcon('persimmon', [
  ['circle', { cx: '12', cy: '14', r: '7', key: 'c' }],
  ...paths('M12 7 8 5', 'M12 7l4-2', 'M12 7V3.5'),
])

export const Pomegranate = createLucideIcon(
  'pomegranate',
  paths(
    'M12 21a7 7 0 0 1-7-7c0-3 2-5 4-6h6c2 1 4 3 4 6a7 7 0 0 1-7 7z',
    'M9.5 8V5h5v3',
    'M10 13h.01',
    'M14 13h.01',
    'M12 16.5h.01',
  ),
)

export const Fig = createLucideIcon(
  'fig',
  paths(
    'M12 21a6.5 6.5 0 0 1-6.5-6.5c0-4 4-7 6.5-11 2.5 4 6.5 7 6.5 11A6.5 6.5 0 0 1 12 21z',
    'M12 3.5V2',
    'M12 11v6',
  ),
)

export const Pineapple = createLucideIcon(
  'pineapple',
  paths(
    'M12 9c-3 0-5 3-5 7s2 6 5 6 5-2 5-6-2-7-5-7z',
    'M9 12l6 7',
    'M15 12l-6 7',
    'M12 9V4',
    'M12 6l-3-2',
    'M12 6l3-2',
    'M10 9 8 6',
    'M14 9l2-3',
  ),
)

export const Kiwi = createLucideIcon('kiwi', [
  ['circle', { cx: '12', cy: '12', r: '8', key: 'c1' }],
  ['circle', { cx: '12', cy: '12', r: '3', key: 'c2' }],
  ...paths('M12 4v2.5', 'M12 17.5V20', 'M4 12h2.5', 'M17.5 12H20'),
])

export const Avocado = createLucideIcon('avocado', [
  ...paths('M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11z'),
  ['circle', { cx: '12', cy: '14', r: '3', key: 'c' }],
])

export const Tomato = createLucideIcon('tomato', [
  ['circle', { cx: '12', cy: '14', r: '7', key: 'c' }],
  ...paths('M12 7c-1-2-3-3-5-2', 'M12 7c1-2 3-3 5-2', 'M12 7V4'),
])

export const Pumpkin = createLucideIcon(
  'pumpkin',
  paths(
    'M12 6c-5 0-8 3-8 7.5S7 21 12 21s8-3 8-7.5S17 6 12 6z',
    'M12 6c-2 2.5-2 12.5 0 15',
    'M12 6c2 2.5 2 12.5 0 15',
    'M12 6c0-2 1-3 2.5-3',
  ),
)

export const Onion = createLucideIcon(
  'onion',
  paths(
    'M12 5c-3 4-7 6-7 11a7 7 0 0 0 14 0c0-5-4-7-7-11z',
    'M12 5V2',
    'M9.5 21c0-5 .5-9 2.5-13',
    'M14.5 21c0-5-.5-9-2.5-13',
  ),
)

export const Garlic = createLucideIcon(
  'garlic',
  paths(
    'M12 4c-2 3-7 5-7 11a7 7 0 0 0 14 0c0-6-5-8-7-11z',
    'M12 4V2',
    'M12 22V9',
    'M8.5 21c0-4 1.5-8 3.5-12',
    'M15.5 21c0-4-1.5-8-3.5-12',
  ),
)

export const Eggplant = createLucideIcon(
  'eggplant',
  paths(
    'M16 4a4 4 0 0 1 4 4c0 6-7 12-12 12a4 4 0 0 1-4-4c0-5 6-12 12-12z',
    'M16 4l3-2',
    'M14.5 5.5c-.5 1.5 0 3 1.5 4',
  ),
)

export const BellPepper = createLucideIcon(
  'bell-pepper',
  paths(
    'M12 6c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z',
    'M12 6V3',
    'M9 8c-1 3-1 7 0 11',
    'M15 8c1 3 1 7 0 11',
  ),
)

export const Cucumber = createLucideIcon(
  'cucumber',
  paths(
    // corpo in diagonale, più largo al centro, con il picciolo in alto a destra
    'M4.8 19.2c-1.6-1.6-1.2-4.4 1-6.6l6.8-6.8c2.2-2.2 5-2.6 6.6-1s1.2 4.4-1 6.6l-6.8 6.8c-2.2 2.2-5 2.6-6.6 1z',
    'M19.2 4.8 21 3',
    'M8.5 15.5h.01',
    'M11.5 12.5h.01',
    'M14.5 9.5h.01',
  ),
)

export const Mushroom = createLucideIcon(
  'mushroom',
  paths('M4 11c0-4 4-7 8-7s8 3 8 7H4z', 'M9 11v6a3 3 0 0 0 6 0v-6', 'M8 8h.01', 'M13 6.5h.01'),
)

export const Strawberry = createLucideIcon(
  'strawberry',
  paths(
    'M12 21c-4 0-7-4-7-8 0-3 3-5 7-5s7 2 7 5c0 4-3 8-7 8z',
    'M12 8V5',
    'M12 5c-2 1-4 0-4-2',
    'M12 5c2 1 4 0 4-2',
    'M10 13h.01',
    'M14 13h.01',
    'M12 17h.01',
  ),
)

export const Bread = createLucideIcon(
  'bread',
  paths(
    'M5 11a7 4 0 0 1 14 0v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z',
    'M9.5 8l-2 3',
    'M13.5 8l-2 3',
    'M17.5 8l-2 3',
  ),
)

export const Sausage = createLucideIcon(
  'sausage',
  paths(
    'M3 10a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 10v4a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 14z',
    'M8.5 7.5v9',
    'M15.5 7.5v9',
  ),
)

export const Jar = createLucideIcon(
  'jar',
  paths('M7 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z', 'M6 5h12v4H6z', 'M9.5 13h5', 'M9.5 16h5'),
)

export const SaltShaker = createLucideIcon(
  'salt-shaker',
  paths(
    'M9 3h6v4H9z',
    'M8 7h8l1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z',
    'M11 11h.01',
    'M13.5 13.5h.01',
    'M11 16h.01',
  ),
)

export const ChipsBag = createLucideIcon(
  'chips-bag',
  paths('M7 3h10l-1 2 2 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L8 5z', 'M9 9.5h6', 'M9 13.5h6'),
)

export const Potato = createLucideIcon(
  'potato',
  paths('M4 13c0-4 4-7 8-7s8 3 8 7-4 6-8 6-8-2-8-6z', 'M9 11h.01', 'M14 12h.01', 'M11 15h.01'),
)

export const Raspberry = createLucideIcon('raspberry', [
  // grappolo di drupe a triangolo rovesciato, con picciolo e foglioline
  ...[
    [7.2, 9.2],
    [12, 9.2],
    [16.8, 9.2],
    [9.6, 13.4],
    [14.4, 13.4],
    [12, 17.6],
  ].map(
    ([cx, cy], index) =>
      [
        'circle',
        { cx: String(cx), cy: String(cy), r: '2.4', key: `c${index}` },
      ] as IconNode[number],
  ),
  ...paths('M12 6.8V3.5', 'M8.5 4.8c1.6 0 2.9.6 3.5 1.6.6-1 1.9-1.6 3.5-1.6'),
])

export const Blueberry = createLucideIcon('blueberry', [
  ['circle', { cx: '9.5', cy: '14.5', r: '5.5', key: 'big' }],
  ['circle', { cx: '17', cy: '7.5', r: '3.5', key: 'small' }],
  // la "coroncina" tipica del mirtillo
  ...paths('M8.3 13.3l2.4 2.4', 'M10.7 13.3l-2.4 2.4', 'M17 7.5h.01'),
])

export const Mozzarella = createLucideIcon('mozzarella', [
  // la mozzarella sul piatto, con un riflesso: col solo cerchio sembrava un pomodoro
  ['ellipse', { cx: '12', cy: '12.5', rx: '7.5', ry: '6.5', key: 'ball' }],
  ...paths('M3 20.5h18', 'M8.5 11.5a4 4 0 0 1 3.5-2.5'),
])

export const Flatbread = createLucideIcon('flatbread', [
  ['ellipse', { cx: '12', cy: '12', rx: '9', ry: '6', key: 'disc' }],
  // segni della piastra
  ...paths('M7.5 11.5l1.5 1.5', 'M11 9.5l2 2', 'M11.5 13.5l1.5 1.5', 'M15 10.5l1.5 1.5'),
])

export const CUSTOM_ICONS = {
  Avocado,
  BellPepper,
  Blueberry,
  Bread,
  ChipsBag,
  Cucumber,
  Eggplant,
  Fig,
  Flatbread,
  Garlic,
  Jar,
  Kiwi,
  Melon,
  Mozzarella,
  Mushroom,
  Onion,
  Peach,
  Pear,
  Persimmon,
  Pineapple,
  Plum,
  Pomegranate,
  Potato,
  Pumpkin,
  Raspberry,
  SaltShaker,
  Sausage,
  Strawberry,
  Tomato,
  Watermelon,
}
