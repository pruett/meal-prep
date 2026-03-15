import { createFileRoute } from '@tanstack/react-router'
import {
  Plus,
  ArrowRight,
  Heart,
  Trash,
  MagnifyingGlass,
  Gear,
  User,
  Image,
  FileText,
  Folder,
  Star,
  Bell,
  Package,
} from '@phosphor-icons/react'
import { Button } from '~/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '~/components/ui/empty'
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemSeparator,
} from '~/components/ui/item'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute('/design-system')({
  component: DesignSystem,
})

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function DesignSystem() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-16 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Design System</h1>
        <p className="text-muted-foreground">
          Component library for review and testing.
        </p>
      </header>

      <div className="flex flex-col gap-16">
        {/* ── Button ── */}
        <Section title="Button">
          <Subsection title="Variants">
            <div className="flex flex-wrap items-center gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </Subsection>

          <Subsection title="Sizes">
            <div className="flex flex-wrap items-end gap-2">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </Subsection>

          <Subsection title="With Icons">
            <div className="flex flex-wrap items-center gap-2">
              <Button>
                <Plus data-icon="inline-start" />
                Add Item
              </Button>
              <Button variant="secondary">
                Continue
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="outline">
                <Heart data-icon="inline-start" />
                Favorite
              </Button>
              <Button variant="destructive">
                <Trash data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </Subsection>

          <Subsection title="Icon Only">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon-xs" variant="ghost">
                <MagnifyingGlass />
              </Button>
              <Button size="icon-sm" variant="ghost">
                <Gear />
              </Button>
              <Button size="icon" variant="outline">
                <Bell />
              </Button>
              <Button size="icon-lg" variant="secondary">
                <User />
              </Button>
            </div>
          </Subsection>

          <Subsection title="Disabled">
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled>Default</Button>
              <Button variant="secondary" disabled>
                Secondary
              </Button>
              <Button variant="outline" disabled>
                Outline
              </Button>
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* ── Tabs ── */}
        <Section title="Tabs">
          <Subsection title="Default">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Overview content goes here.
                </p>
              </TabsContent>
              <TabsContent value="analytics" className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Analytics content goes here.
                </p>
              </TabsContent>
              <TabsContent value="reports" className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Reports content goes here.
                </p>
              </TabsContent>
            </Tabs>
          </Subsection>

          <Subsection title="Line Variant">
            <Tabs defaultValue="account">
              <TabsList variant="line">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Manage your account settings.
                </p>
              </TabsContent>
              <TabsContent value="password" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Change your password.
                </p>
              </TabsContent>
              <TabsContent value="notifications" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Configure notification preferences.
                </p>
              </TabsContent>
            </Tabs>
          </Subsection>

          <Subsection title="With Disabled Tab">
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="disabled" disabled>
                  Disabled
                </TabsTrigger>
                <TabsTrigger value="another">Another</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Active tab content.
                </p>
              </TabsContent>
              <TabsContent value="another" className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Another tab content.
                </p>
              </TabsContent>
            </Tabs>
          </Subsection>
        </Section>

        <Separator />

        {/* ── Empty ── */}
        <Section title="Empty">
          <Subsection title="With Icon">
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>No items yet</EmptyTitle>
                <EmptyDescription>
                  Get started by creating your first item. It only takes a
                  moment.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button>
                  <Plus data-icon="inline-start" />
                  Create Item
                </Button>
              </EmptyContent>
            </Empty>
          </Subsection>

          <Subsection title="Minimal">
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>Nothing to show</EmptyTitle>
                <EmptyDescription>
                  There are no results matching your search. Try adjusting your
                  filters.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Subsection>

          <Subsection title="With Custom Media">
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia>
                  <Image className="size-12 text-muted-foreground/50" />
                </EmptyMedia>
                <EmptyTitle>No images uploaded</EmptyTitle>
                <EmptyDescription>
                  Drag and drop images here, or click the button below to
                  browse.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button variant="outline">Browse Files</Button>
                </div>
              </EmptyContent>
            </Empty>
          </Subsection>
        </Section>

        <Separator />

        {/* ── Badge ── */}
        <Section title="Badge">
          <Subsection title="Variants">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </Subsection>

          <Subsection title="With Icons">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                <Star data-icon="inline-start" />
                Featured
              </Badge>
              <Badge variant="secondary">
                <Bell data-icon="inline-start" />
                3 New
              </Badge>
              <Badge variant="destructive">
                <Trash data-icon="inline-start" />
                Removed
              </Badge>
              <Badge variant="outline">
                <Gear data-icon="inline-start" />
                Settings
              </Badge>
            </div>
          </Subsection>

          <Subsection title="Use Cases">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">v2.0.0</Badge>
              <Badge variant="destructive">Breaking</Badge>
              <Badge variant="outline">Draft</Badge>
              <Badge>Published</Badge>
              <Badge variant="secondary">+3 more</Badge>
            </div>
          </Subsection>
        </Section>

        <Separator />

        {/* ── Item ── */}
        <Section title="Item">
          <Subsection title="Default Variant">
            <ItemGroup>
              <Item>
                <ItemMedia variant="icon">
                  <FileText />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Project Proposal</ItemTitle>
                  <ItemDescription>
                    Last edited 2 hours ago
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="icon-sm" variant="ghost">
                    <Star />
                  </Button>
                </ItemActions>
              </Item>
              <Item>
                <ItemMedia variant="icon">
                  <Folder />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Design Assets</ItemTitle>
                  <ItemDescription>12 files</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="icon-sm" variant="ghost">
                    <Star />
                  </Button>
                </ItemActions>
              </Item>
            </ItemGroup>
          </Subsection>

          <Subsection title="Outline Variant">
            <ItemGroup>
              <Item variant="outline">
                <ItemMedia variant="icon">
                  <User />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Kevin Pruett</ItemTitle>
                  <ItemDescription>kevin@example.com</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="xs" variant="outline">
                    Edit
                  </Button>
                </ItemActions>
              </Item>
              <Item variant="outline">
                <ItemMedia variant="icon">
                  <User />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Jane Doe</ItemTitle>
                  <ItemDescription>jane@example.com</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="xs" variant="outline">
                    Edit
                  </Button>
                </ItemActions>
              </Item>
            </ItemGroup>
          </Subsection>

          <Subsection title="Muted Variant — Small">
            <ItemGroup>
              <Item variant="muted" size="sm">
                <ItemMedia variant="icon">
                  <Bell />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>New comment on your post</ItemTitle>
                  <ItemDescription>5 minutes ago</ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="muted" size="sm">
                <ItemMedia variant="icon">
                  <Heart />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Someone liked your recipe</ItemTitle>
                  <ItemDescription>12 minutes ago</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </Subsection>

          <Subsection title="Extra Small with Separator">
            <ItemGroup>
              <Item size="xs">
                <ItemMedia variant="icon">
                  <Gear />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>General Settings</ItemTitle>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item size="xs">
                <ItemMedia variant="icon">
                  <Bell />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Notifications</ItemTitle>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item size="xs">
                <ItemMedia variant="icon">
                  <User />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Profile</ItemTitle>
                </ItemContent>
              </Item>
            </ItemGroup>
          </Subsection>
        </Section>
      </div>
    </main>
  )
}
