const namespaces = [
  'buttons',
  'collections',
  'date-and-time',
  'drag-and-drop',
  'forms',
  'navigation',
  'overlays',
  'pickers',
  'statuses',
  'surfaces',
  'media',
  'colors',
]

const components: any[] = [
  // ------------------------------------------------------------------------------------- //
  //  ✓ Primitives
  // ------------------------------------------------------------------------------------- //
  { name: 'primitive' },
  { name: 'dropdown' },
  { name: 'dialog' },
  { name: 'dynamic-overlay' },
  { name: 'field' },

  // ------------------------------------------------------------------------------------- //
  //  ✓ Utitlities
  // ------------------------------------------------------------------------------------- //
  { name: 'visually-hidden' },

  // ------------------------------------------------------------------------------------- //
  //  ✓ Only Namespaces and Children
  // ------------------------------------------------------------------------------------- //
  {
    name: 'forms',
    children: [
      { name: 'form' },
      { name: 'text-field' },
      { name: 'radio' },
      { name: 'checkbox' },
      { name: 'textarea' },
      { name: 'slider' },
      { name: 'switch' },
      { name: 'number-field' },
      { name: 'search-field' },
      { name: 'input-otp' },
    ],
  },
  {
    name: 'collections',
    children: [
      { name: 'menu' },
      { name: 'grid-list' },
      { name: 'list-box' },
      { name: 'tabs' },
      { name: 'tag-group' },
      { name: 'table' },
    ],
  },
  {
    name: 'date-and-time',
    children: [{ name: 'date-field' }, { name: 'date-picker' }, { name: 'popover' }],
  },
  {
    name: 'navigation',
    children: [
      { name: 'link' },
      { name: 'breadcrumbs' },
      { name: 'pagination' },
      { name: 'button' },
      { name: 'separator' },
      { name: 'field' },
    ],
  },
  {
    name: 'overlays',
    children: [{ name: 'sheet' }, { name: 'drawer' }, { name: 'popover' }, { name: 'tooltip' }],
  },
  {
    name: 'pickers',
    children: [{ name: 'combo-box' }, { name: 'select' }],
  },
  {
    name: 'statuses',
    children: [{ name: 'badge' }, { name: 'progress-bar' }, { name: 'meter' }, { name: 'note' }, { name: 'toaster' }],
  },
  { name: 'surfaces', children: [{ name: 'card' }, { name: 'grid' }] },
  { name: 'media', children: [{ name: 'avatar' }] },
  {
    name: 'colors',
    children: [{ name: 'color-picker' }],
  },
  { name: 'buttons', children: [{ name: 'file-trigger' }, { name: 'toggle-button' }] },
  { name: 'drag-and-drop', children: [{ name: 'drop-zone' }, { name: 'avatar' }] },

  // ------------------------------------------------------------------------------------- //
  // ✓ Children
  // ------------------------------------------------------------------------------------- //

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Buttons
  // ------------------------------------------------------------------------------------- //
  { name: 'button' },
  { name: 'file-trigger', children: [{ name: 'button' }] },
  { name: 'toggle-button', children: [{ name: 'button' }] },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Collections
  // ------------------------------------------------------------------------------------- //
  { name: 'menu', children: [{ name: 'dropdown' }] },
  { name: 'list-box', children: [{ name: 'dropdown' }] },
  { name: 'tabs' },
  { name: 'tag-group', children: [{ name: 'field' }, { name: 'badge' }] },
  { name: 'table', children: [{ name: 'checkbox' }] },
  { name: 'grid-list', children: [{ name: 'checkbox' }] },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Date and Time
  // ------------------------------------------------------------------------------------- //

  { name: 'calendar', children: [{ name: 'button' }] },
  { name: 'date-field' },
  {
    name: 'date-picker',
    children: [{ name: 'popover' }, { name: 'field' }, { name: 'calendar' }, { name: 'dynamic-overlay' }],
  },
  { name: 'time-field', children: [{ name: 'field' }, { name: 'date-field' }] },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Forms
  // ------------------------------------------------------------------------------------- //

  { name: 'form' },
  { name: 'text-field', children: [{ name: 'field' }] },
  { name: 'input-otp' },
  { name: 'radio', children: [{ name: 'field' }] },
  { name: 'checkbox', children: [{ name: 'field' }] },
  { name: 'textarea', children: [{ name: 'field' }] },
  { name: 'slider', children: [{ name: 'field' }] },
  { name: 'switch' },
  { name: 'number-field', children: [{ name: 'field' }] },
  { name: 'search-field', children: [{ name: 'field' }, { name: 'button' }] },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Navigation
  // ------------------------------------------------------------------------------------- //
  { name: 'link' },
  {
    name: 'pagination',
    children: [{ name: 'button' }, { name: 'separator' }, { name: 'field' }, { name: 'visually-hidden' }],
  },
  {
    name: 'breadcrumbs',
    children: [{ name: 'link' }],
  },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Surfaces
  // ------------------------------------------------------------------------------------- //
  { name: 'card' },
  { name: 'grid' },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Media
  // ------------------------------------------------------------------------------------- //

  { name: 'avatar' },
  { name: 'drop-zone' },

  {
    name: 'modal',
    children: [{ name: 'button' }, { name: 'dialog' }],
  },
  {
    name: 'sheet',
    children: [{ name: 'dialog' }, { name: 'modal' }],
  },
  {
    name: 'drawer',
    children: [{ name: 'modal' }],
  },
  {
    name: 'popover',
    children: [{ name: 'modal' }],
  },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Pickers
  // ------------------------------------------------------------------------------------- //

  {
    name: 'combo-box',
    children: [{ name: 'field' }, { name: 'list-box' }, { name: 'popover' }],
  },
  {
    name: 'select',
    children: [{ name: 'field' }, { name: 'list-box' }, { name: 'popover' }],
  },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Statuses
  // ------------------------------------------------------------------------------------- //

  { name: 'badge' },
  { name: 'progress-bar', children: [{ name: 'field' }] },
  { name: 'meter', children: [{ name: 'field' }] },
  { name: 'note' },
  { name: 'toaster', children: [{ name: 'button' }] },

  // ------------------------------------------------------------------------------------- //
  // ⌘ The children of Colors
  // ------------------------------------------------------------------------------------- //

  {
    name: 'color-picker',
    children: [{ name: 'color' }, { name: 'select' }, { name: 'dynamic-overlay' }],
  },
  { name: 'color', children: [{ name: 'field' }] },
]

export { components, namespaces }
