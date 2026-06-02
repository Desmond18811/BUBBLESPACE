export type ChatListItem = {
  id: string
  name: string
  avatar?: string
  initials?: string
  initialsBg?: string
  time: string
  preview: string
  previewPrefix?: string
  unread?: number
  pinned?: boolean
  receipt?: 'sent' | 'read'
  previewMuted?: boolean
}

export const chats: ChatListItem[] = [
  {
    id: 'design',
    name: 'Design chat',
    initials: 'DC',
    initialsBg: '#1f2030',
    time: '4m',
    preview: 'Jessie Rollins sent...',
    unread: 1,
    pinned: true,
    previewMuted: true,
  },
  {
    id: 'osman',
    name: 'Osman Campos',
    avatar: '/avatars/osman.png',
    time: '20m',
    previewPrefix: 'You:',
    preview: 'Hey! We are read...',
    pinned: true,
  },
  {
    id: 'jayden',
    name: 'Jayden Church',
    avatar: '/avatars/jayden.png',
    time: '1h',
    preview: 'I prepared some varia...',
    pinned: true,
  },
  {
    id: 'jacob',
    name: 'Jacob Mcleod',
    avatar: '/avatars/jacob.png',
    time: '10m',
    preview: 'And send me the proto...',
    unread: 3,
  },
  {
    id: 'jasmin',
    name: 'Jasmin Lowery',
    avatar: '/avatars/jasmin.png',
    time: '20m',
    previewPrefix: 'You:',
    preview: "Ok! Let's discuss it on th...",
    receipt: 'read',
  },
  {
    id: 'zaid',
    name: 'Zaid Myers',
    avatar: '/avatars/zaid.png',
    time: '45m',
    previewPrefix: 'You:',
    preview: 'Hey! We are ready to in...',
    receipt: 'read',
  },
  {
    id: 'anthony',
    name: 'Anthony Cordanes',
    avatar: '/avatars/anthony.png',
    time: '1d',
    preview: 'What do you think?',
  },
  {
    id: 'conner',
    name: 'Conner Garcia',
    avatar: '/avatars/conner.png',
    time: '2d',
    previewPrefix: 'You:',
    preview: 'I think it would be perfe...',
    receipt: 'read',
  },
  {
    id: 'vanessa',
    name: 'Vanessa Cox',
    avatar: '/avatars/vanessa.png',
    time: '2d',
    preview: 'Voice message',
    previewMuted: true,
    receipt: 'read',
  },
]

export type Reaction = { emoji: string; count: number }

export type Message = {
  id: string
  side: 'in' | 'out'
  author?: string
  avatar?: string
  showAvatar?: boolean
  views: number
  time: string
} & (
    | { kind: 'text'; text: string; reactions?: Reaction[] }
    | { kind: 'image'; image: string }
    | { kind: 'voice'; duration: string }
  )

export type Member = {
  name: string
  avatar: string
  role?: string
}

export type FileCategory = {
  label: string
  icon: 'video' | 'files' | 'audio' | 'link' | 'voice'
}

export type ContactInfo = {
  status: string
  username: string
  bio: string
  organization?: string
  role?: string
  org_role?: string
}

export type Conversation = {
  id: string
  title: string
  subtitle: string
  type: 'group' | 'dm'
  avatar?: string
  initials?: string
  initialsBg?: string
  messages: Message[]
  members?: Member[]
  files?: FileCategory[]
  contact?: ContactInfo
}

export type Friend = {
  name: string
  avatar: string
  role: string
  status: 'online' | 'offline'
  mutual: number
}

export const friends: Friend[] = [
  { name: 'Osman Campos', avatar: '/avatars/osman.png', role: 'Product Designer', status: 'online', mutual: 12 },
  { name: 'Jasmin Lowery', avatar: '/avatars/jasmin.png', role: 'Design Systems Lead', status: 'online', mutual: 8 },
  { name: 'Jayden Church', avatar: '/avatars/jayden.png', role: 'Frontend Engineer', status: 'offline', mutual: 5 },
  { name: 'Jacob Mcleod', avatar: '/avatars/jacob.png', role: 'Motion Designer', status: 'online', mutual: 17 },
  { name: 'Zaid Myers', avatar: '/avatars/zaid.png', role: 'Mobile Engineer', status: 'offline', mutual: 3 },
  { name: 'Anthony Cordanes', avatar: '/avatars/anthony.png', role: 'Creative Director', status: 'offline', mutual: 21 },
  { name: 'Conner Garcia', avatar: '/avatars/conner.png', role: 'UX Researcher', status: 'online', mutual: 9 },
  { name: 'Vanessa Cox', avatar: '/avatars/vanessa.png', role: 'Content Strategist', status: 'offline', mutual: 6 },
  { name: 'Max Padilla', avatar: '/avatars/max.png', role: 'Backend Engineer', status: 'online', mutual: 14 },
]

export type NewsItem = {
  id: string
  author: string
  avatar: string
  time: string
  title: string
  body: string
  image?: string
  likes: number
  comments: number
}

export const news: NewsItem[] = [
  {
    id: 'n1',
    author: 'Alex Hunt',
    avatar: '/avatars/alex.png',
    time: '2h ago',
    title: 'New design system release',
    body: 'We just shipped v2 of our internal design system with refreshed tokens, new components and improved accessibility across the board.',
    image: '/file-desk.png',
    likes: 48,
    comments: 12,
  },
  {
    id: 'n2',
    author: 'Tanisha Combs',
    avatar: '/avatars/tanisha.png',
    time: '5h ago',
    title: 'Welcome our newest team member',
    body: 'Our intern Jayden has officially completed his probationary period and is now a full member of the design team. Congrats!',
    likes: 96,
    comments: 34,
  },
  {
    id: 'n3',
    author: 'Jasmin Lowery',
    avatar: '/avatars/jasmin.png',
    time: '1d ago',
    title: 'Q3 product roadmap',
    body: 'Sharing the high-level roadmap for next quarter. Lots of exciting work coming up around collaboration features.',
    image: '/file-building.png',
    likes: 61,
    comments: 19,
  },
]

export type ArchivedChat = {
  id: string
  name: string
  avatar: string
  preview: string
  archivedAt: string
}

export const archivedChats: ArchivedChat[] = [
  { id: 'ar1', name: 'Marketing Team', avatar: '/avatars/tanisha.png', preview: 'Campaign assets are final', archivedAt: '1w ago' },
  { id: 'ar2', name: 'Liam Foster', avatar: '/avatars/max.png', preview: 'Thanks for the help!', archivedAt: '2w ago' },
  { id: 'ar3', name: 'Old Project Chat', avatar: '/avatars/lukas.png', preview: 'Project wrapped up 🎉', archivedAt: '1mo ago' },
  { id: 'ar4', name: 'Conner Garcia', avatar: '/avatars/conner.png', preview: 'Sounds good, talk soon', archivedAt: '2mo ago' },
]

export type Profile = {
  name: string
  handle: string
  avatar: string
  role: string
  bio: string
  email: string
  phone?: string
  location: string
  stats: { label: string; value: string }[]
}

export const profile: Profile = {
  name: 'Tanisha Combs',
  handle: '@tanisha.combs',
  avatar: '/avatars/tanisha.png',
  role: 'Lead Product Designer',
  bio: 'Designing calm, human interfaces. Coffee, type, and clean grids.',
  email: 'tanisha.combs@studio.com',
  location: 'San Francisco, CA',
  stats: [
    { label: 'Chats', value: '128' },
    { label: 'Friends', value: '342' },
    { label: 'Files', value: '1.2k' },
  ],
}

export const members: Member[] = [
  { name: 'Tanisha Combs', avatar: '/avatars/tanisha.png', role: 'admin' },
  { name: 'Alex Hunt', avatar: '/avatars/alex.png' },
  { name: 'Jasmin Lowery', avatar: '/avatars/jasmin.png' },
  { name: 'Max Padilla', avatar: '/avatars/max.png' },
  { name: 'Jessie Rollins', avatar: '/avatars/jessie.png' },
  { name: 'Lukas Mcgowan', avatar: '/avatars/lukas.png' },
]

const groupFiles: FileCategory[] = [
  { label: '13 videos', icon: 'video' },
  { label: '378 files', icon: 'files' },
  { label: '21 audio files', icon: 'audio' },
  { label: '45 shared links', icon: 'link' },
  { label: '2 589 voice messages', icon: 'voice' },
]

const me = '/avatars/tanisha.png'

export const conversations: Record<string, Conversation> = {
  design: {
    id: 'design',
    title: 'Design chat',
    subtitle: '23 members, 10 online',
    type: 'group',
    members,
    files: groupFiles,
    messages: [
      {
        id: 'm1',
        side: 'in',
        kind: 'text',
        author: 'Jasmin Lowery',
        avatar: '/avatars/jasmin.png',
        showAvatar: true,
        text: 'I added new flows to our design system. Now you can use them for your projects!',
        reactions: [{ emoji: '👍', count: 4 }],
        views: 23,
        time: '09:20',
      },
      {
        id: 'm2',
        side: 'in',
        kind: 'text',
        author: 'Alex Hunt',
        showAvatar: false,
        text: 'Hey guys! Important news!',
        views: 16,
        time: '09:24',
      },
      {
        id: 'm3',
        side: 'in',
        kind: 'text',
        author: 'Alex Hunt',
        avatar: '/avatars/alex.png',
        showAvatar: true,
        text: 'Our intern @jchurch has successfully completed his probationary period and is now part of our team!',
        reactions: [
          { emoji: '🔥', count: 5 },
          { emoji: '⚡', count: 4 },
        ],
        views: 16,
        time: '09:24',
      },
      {
        id: 'm4',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'Jaden, my congratulations! I will be glad to work with you on a new project 😉',
        views: 10,
        time: '09:27',
      },
      {
        id: 'm5',
        side: 'in',
        kind: 'image',
        showAvatar: false,
        image: '/meeting-room.png',
        views: 10,
        time: '09:30',
      },
      {
        id: 'm6',
        side: 'in',
        kind: 'voice',
        author: 'Jessie Rollins',
        avatar: '/avatars/jessie.png',
        showAvatar: true,
        duration: '0:15',
        views: 10,
        time: '09:30',
      },
    ],
  },

  osman: {
    id: 'osman',
    title: 'Osman Campos',
    subtitle: 'online',
    type: 'dm',
    avatar: '/avatars/osman.png',
    contact: {
      status: 'online',
      username: '@osman.c',
      bio: 'Product designer. Coffee enthusiast. Always shipping.',
      organization: 'BUBBLESPACE',
      role: 'Staff Designer'
    },
    files: [
      { label: '4 videos', icon: 'video' },
      { label: '52 files', icon: 'files' },
      { label: '8 audio files', icon: 'audio' },
      { label: '12 shared links', icon: 'link' },
      { label: '96 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'o1',
        side: 'in',
        kind: 'text',
        author: 'Osman Campos',
        avatar: '/avatars/osman.png',
        showAvatar: true,
        text: 'Hey! Did you get a chance to look at the latest build?',
        views: 2,
        time: '08:40',
      },
      {
        id: 'o2',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'Hey! We are ready to start the review now 🙌',
        views: 2,
        time: '08:42',
      },
      {
        id: 'o3',
        side: 'in',
        kind: 'text',
        author: 'Osman Campos',
        avatar: '/avatars/osman.png',
        showAvatar: true,
        text: 'Perfect. I just pushed the new spacing tokens too.',
        views: 2,
        time: '08:43',
      },
      {
        id: 'o4',
        side: 'in',
        kind: 'voice',
        author: 'Osman Campos',
        avatar: '/avatars/osman.png',
        showAvatar: true,
        duration: '0:22',
        views: 1,
        time: '08:45',
      },
    ],
  },

  jayden: {
    id: 'jayden',
    title: 'Jayden Church',
    subtitle: 'last seen 1h ago',
    type: 'dm',
    avatar: '/avatars/jayden.png',
    contact: {
      status: 'last seen 1h ago',
      username: '@jchurch',
      bio: 'Frontend engineer. Building delightful interfaces.',
      organization: 'BUBBLESPACE',
      role: 'Frontend Engineer'
    },
    files: [
      { label: '2 videos', icon: 'video' },
      { label: '37 files', icon: 'files' },
      { label: '5 audio files', icon: 'audio' },
      { label: '20 shared links', icon: 'link' },
      { label: '143 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'jy1',
        side: 'in',
        kind: 'text',
        author: 'Jayden Church',
        avatar: '/avatars/jayden.png',
        showAvatar: true,
        text: 'I prepared some variations for the onboarding screens.',
        views: 1,
        time: '07:10',
      },
      {
        id: 'jy2',
        side: 'in',
        kind: 'image',
        avatar: '/avatars/jayden.png',
        showAvatar: true,
        image: '/file-desk.png',
        views: 1,
        time: '07:11',
      },
      {
        id: 'jy3',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'These look great! Let me share with the team.',
        views: 1,
        time: '07:30',
      },
    ],
  },

  jacob: {
    id: 'jacob',
    title: 'Jacob Mcleod',
    subtitle: 'online',
    type: 'dm',
    avatar: '/avatars/jacob.png',
    contact: {
      status: 'online',
      username: '@jacob.m',
      bio: 'Brand & motion designer.',
      organization: 'BUBBLESPACE',
      role: 'Motion Designer'
    },
    files: [
      { label: '6 videos', icon: 'video' },
      { label: '74 files', icon: 'files' },
      { label: '11 audio files', icon: 'audio' },
      { label: '9 shared links', icon: 'link' },
      { label: '210 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'jc1',
        side: 'in',
        kind: 'text',
        author: 'Jacob Mcleod',
        avatar: '/avatars/jacob.png',
        showAvatar: true,
        text: 'And send me the prototype when you get a sec.',
        views: 1,
        time: '10:02',
      },
      {
        id: 'jc2',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'On it. Sending the Figma link in a minute.',
        views: 1,
        time: '10:05',
      },
    ],
  },

  jasmin: {
    id: 'jasmin',
    title: 'Jasmin Lowery',
    subtitle: 'online',
    type: 'dm',
    avatar: '/avatars/jasmin.png',
    contact: {
      status: 'online',
      username: '@jasmin.l',
      bio: 'Design systems lead. Loves clean components.',
      organization: 'BUBBLESPACE',
      role: 'Design Systems Lead'
    },
    files: [
      { label: '9 videos', icon: 'video' },
      { label: '128 files', icon: 'files' },
      { label: '14 audio files', icon: 'audio' },
      { label: '33 shared links', icon: 'link' },
      { label: '402 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'js1',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: "Ok! Let's discuss it on the call tomorrow morning.",
        views: 1,
        time: '11:20',
      },
      {
        id: 'js2',
        side: 'in',
        kind: 'text',
        author: 'Jasmin Lowery',
        avatar: '/avatars/jasmin.png',
        showAvatar: true,
        text: 'Sounds good! I will prepare the slides.',
        reactions: [{ emoji: '👍', count: 1 }],
        views: 1,
        time: '11:22',
      },
    ],
  },

  zaid: {
    id: 'zaid',
    title: 'Zaid Myers',
    subtitle: 'last seen 45m ago',
    type: 'dm',
    avatar: '/avatars/zaid.png',
    contact: {
      status: 'last seen 45m ago',
      username: '@zaid.m',
      bio: 'Mobile engineer. iOS & Android.',
      organization: 'BUBBLESPACE',
      role: 'Mobile Engineer'
    },
    files: [
      { label: '3 videos', icon: 'video' },
      { label: '41 files', icon: 'files' },
      { label: '7 audio files', icon: 'audio' },
      { label: '18 shared links', icon: 'link' },
      { label: '88 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'z1',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'Hey! We are ready to integrate the new API.',
        views: 1,
        time: '06:15',
      },
      {
        id: 'z2',
        side: 'in',
        kind: 'text',
        author: 'Zaid Myers',
        avatar: '/avatars/zaid.png',
        showAvatar: true,
        text: 'Awesome, I will update the endpoints today.',
        views: 1,
        time: '06:30',
      },
    ],
  },

  anthony: {
    id: 'anthony',
    title: 'Anthony Cordanes',
    subtitle: 'last seen 1d ago',
    type: 'dm',
    avatar: '/avatars/anthony.png',
    contact: {
      status: 'last seen 1d ago',
      username: '@anthony.c',
      bio: 'Creative director.',
      organization: 'BUBBLESPACE',
      role: 'Creative Director'
    },
    files: [
      { label: '1 video', icon: 'video' },
      { label: '22 files', icon: 'files' },
      { label: '3 audio files', icon: 'audio' },
      { label: '6 shared links', icon: 'link' },
      { label: '54 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'a1',
        side: 'in',
        kind: 'text',
        author: 'Anthony Cordanes',
        avatar: '/avatars/anthony.png',
        showAvatar: true,
        text: 'I reworked the hero section. What do you think?',
        views: 1,
        time: 'Mon',
      },
    ],
  },

  conner: {
    id: 'conner',
    title: 'Conner Garcia',
    subtitle: 'last seen 2d ago',
    type: 'dm',
    avatar: '/avatars/conner.png',
    contact: {
      status: 'last seen 2d ago',
      username: '@conner.g',
      bio: 'UX researcher.',
      organization: 'BUBBLESPACE',
      role: 'UX Researcher'
    },
    files: [
      { label: '5 videos', icon: 'video' },
      { label: '63 files', icon: 'files' },
      { label: '9 audio files', icon: 'audio' },
      { label: '15 shared links', icon: 'link' },
      { label: '120 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'c1',
        side: 'in',
        kind: 'text',
        author: 'Conner Garcia',
        avatar: '/avatars/conner.png',
        showAvatar: true,
        text: 'Should we run another round of usability tests?',
        views: 1,
        time: 'Sun',
      },
      {
        id: 'c2',
        side: 'out',
        kind: 'text',
        avatar: me,
        showAvatar: true,
        text: 'I think it would be perfect to do it next week.',
        views: 1,
        time: 'Sun',
      },
    ],
  },

  vanessa: {
    id: 'vanessa',
    title: 'Vanessa Cox',
    subtitle: 'last seen 2d ago',
    type: 'dm',
    avatar: '/avatars/vanessa.png',
    contact: {
      status: 'last seen 2d ago',
      username: '@vanessa.c',
      bio: 'Content strategist.',
      organization: 'BUBBLESPACE',
      role: 'Content Strategist'
    },
    files: [
      { label: '2 videos', icon: 'video' },
      { label: '28 files', icon: 'files' },
      { label: '4 audio files', icon: 'audio' },
      { label: '7 shared links', icon: 'link' },
      { label: '61 voice messages', icon: 'voice' },
    ],
    messages: [
      {
        id: 'v1',
        side: 'in',
        kind: 'voice',
        author: 'Vanessa Cox',
        avatar: '/avatars/vanessa.png',
        showAvatar: true,
        duration: '0:34',
        views: 1,
        time: 'Sat',
      },
    ],
  },
}
