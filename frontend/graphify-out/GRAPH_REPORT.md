# Graph Report - frontend  (2026-06-10)

## Corpus Check
- 128 files · ~1,466,328 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 986 nodes · 1525 edges · 116 communities (69 shown, 47 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 275 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `afe1edcf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 242 edges
2. `handleResponse()` - 157 edges
3. `getAuthHeaders()` - 145 edges
4. `compilerOptions` - 22 edges
5. `useDashboard()` - 16 edges
6. `compilerOptions` - 16 edges
7. `useSocket()` - 7 edges
8. `tailwind` - 6 edges
9. `aliases` - 6 edges
10. `buttonVariants` - 6 edges

## Surprising Connections (you probably didn't know these)
- `LiveKitMeetingModal()` --calls--> `useSocket()`  [INFERRED]
  src/components/chat/LiveKitMeetingModal.tsx → src/contexts/AppContext.tsx
- `VoiceBubble()` --calls--> `cn()`  [INFERRED]
  src/components/chat/chat-window.tsx → src/lib/utils.ts
- `Dashboard()` --calls--> `cn()`  [INFERRED]
  src/components/chat/dashboard.tsx → src/lib/utils.ts
- `FileRow()` --calls--> `cn()`  [INFERRED]
  src/components/chat/group-info.tsx → src/lib/utils.ts
- `ContactCard()` --calls--> `cn()`  [INFERRED]
  src/components/chat/group-info.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (116 total, 47 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (103): accessOrCreateChat(), addContact(), addToGroup(), aidaExtractActionItems(), aidaFlagPayments(), aidaScheduleSuggestion(), aidaScheduleTask(), aidaSearchWorkspace() (+95 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (57): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, emoji-picker-react, @hookform/resolvers (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (55): addFeedComment(), addMeetingTranscriptChunk(), aidaSummarizeFeed(), blockUser(), chatWithAida(), clearActivityLog(), clearAllNotifications(), clearCallLogs() (+47 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (36): cn(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+28 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (19): AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay(), AlertDialogTitle() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, esModuleInterop, ignoreDeprecations, isolatedModules, jsx, lib, module (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): Route, DashboardAllRoute, DashboardArchiveRoute, DashboardCallsRoute, DashboardChatRoute, DashboardEditProfileRoute, DashboardFriendsRoute, DashboardIndexRoute (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (18): ArchivedChat, archivedChats, ChatListItem, chats, ContactInfo, Conversation, conversations, FileCategory (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (13): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (11): Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend(), FieldSeparator() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (6): AvatarProps, ChatAvatar(), ChatList(), ContextMenuState, CreateGroupModal(), CreateGroupModalProps

### Community 21 - "Community 21"
Cohesion: 0.27
Nodes (11): ChatWindow(), MembersCard(), ArchiveView(), CallsView(), FriendsView(), ProfileView(), ViewHeader(), WorkView() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (7): ContactCard(), countMedia(), FileRow(), FilesCard(), glass, iconMap, getSecureMediaUrl()

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (8): CalendarSection(), CalendarSectionProps, EditView(), FriendCard(), getCalendarCells(), INDUSTRIES, MeetingView(), OFFICE_ROLES

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (6): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (6): EMOJIS, LiquidGlassContactCard(), MessageOverlay(), MessageOverlayProps, Msg, getSocket()

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (8): Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut()

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.28
Nodes (4): INDUSTRIES, OFFICE_ROLES, SetupProfileView(), BubblespaceLogo()

### Community 35 - "Community 35"
Cohesion: 0.28
Nodes (6): NotFoundPage(), Route, Register, router, getRouter(), routeTree

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (4): ContextMenuPos, EMOJIS, VoiceBubble(), waveform

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (6): AppProviderProps, CallState, ChatContext, ChatContextValue, SocketContext, SocketContextValue

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (6): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (7): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle()

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (4): bottomItems, NavButton(), NavItem, navItems

### Community 44 - "Community 44"
Cohesion: 0.40
Nodes (4): ChatMessageEntry, LiveKitMeetingModal(), MeetingRoomLayout(), TranscriptEntry

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (3): CASES, container, item

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (3): AccordionContent(), AccordionItem(), AccordionTrigger()

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (4): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (3): InputOTP(), InputOTPGroup(), InputOTPSlot()

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (4): Tabs(), TabsContent(), TabsList(), TabsTrigger()

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (3): build, buildCommand, $schema

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (3): Avatar(), AvatarFallback(), AvatarImage()

## Knowledge Gaps
- **269 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+264 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 3` to `Community 4`, `Community 11`, `Community 12`, `Community 13`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 31`, `Community 32`, `Community 34`, `Community 36`, `Community 37`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 60`, `Community 62`, `Community 63`, `Community 64`, `Community 83`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 94`, `Community 101`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 107`, `Community 108`, `Community 109`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Why does `DashboardPage()` connect `Community 83` to `Community 3`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `useDashboard()` connect `Community 21` to `Community 70`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 20`, `Community 56`, `Community 29`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 241 inferred relationships involving `cn()` (e.g. with `ChatAvatar()` and `ChatList()`) actually correct?**
  _`cn()` has 241 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03772893772893773 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03508771929824561 - nodes in this community are weakly interconnected._